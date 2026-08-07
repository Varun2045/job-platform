import { WebSocketServer, WebSocket } from 'ws';
import { Response } from 'express';
import { EventBus } from './EventBus.js';
import { Logger } from './Logger.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/config.js';
import crypto from 'crypto';

export interface ScraperEvent {
  id: string;
  timestamp: string;
  type: string;
  source: string;
  level: 'info' | 'success' | 'warning' | 'error';
  payload: any;
}

export class BroadcastManager {
  private static wss: WebSocketServer | null = null;
  private static wsClients: Set<WebSocket> = new Set();
  private static sseClients: Set<Response> = new Set();
  private static supabaseClient: SupabaseClient | null = null;
  private static isSubscribedToSupabase = false;
  private static isSystemSourcedChange = false;

  // Ring buffer for the last 100 events
  private static eventHistory: ScraperEvent[] = [];
  private static heartbeatInterval: NodeJS.Timeout | null = null;

  public static initialize(server?: any): void {
    // 1. Initialize Supabase Realtime if not local and credentials exist
    if (!config.isLocal && config.supabaseUrl && config.supabaseServiceKey && !this.supabaseClient) {
      this.supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceKey, {
        auth: PersistSessionFalseGuard(),
      });
      this.subscribeToSupabaseRealtime();
    }

    // Helper closure to avoid ts-lint issues
    function PersistSessionFalseGuard() {
      return { persistSession: false, autoRefreshToken: false };
    }

    // 2. Initialize WebSocket Server if HTTP server is provided
    if (server && !this.wss) {
      this.wss = new WebSocketServer({ noServer: true });

      server.on('upgrade', (request: any, socket: any, head: any) => {
        const urlObj = new URL(request.url || '', `http://${request.headers.host || 'localhost'}`);
        if (urlObj.pathname === '/api/monitoring/ws') {
          this.wss?.handleUpgrade(request, socket, head, (ws) => {
            this.wss?.emit('connection', ws, request);
          });
        }
      });

      this.wss.on('connection', (ws: WebSocket) => {
        Logger.info('[WS] Realtime monitoring client connected');
        this.wsClients.add(ws);

        // Immediately replay event history to this client
        for (const historyEvent of this.eventHistory) {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(historyEvent));
          }
        }

        ws.on('close', () => {
          Logger.info('[WS] Realtime monitoring client disconnected');
          this.wsClients.delete(ws);
        });

        ws.on('error', (err) => {
          Logger.error('[WS] Realtime connection error', err);
          this.wsClients.delete(ws);
        });
      });
    }

    // 3. Listen to local EventBus and fan out events (only once)
    if (EventBus.listenerCount('scraper_event') === 0) {
      EventBus.on('scraper_event', (event: ScraperEvent) => {
        this.fanOut(event);
      });
    }

    // 4. Setup heartbeat timer (every 25 seconds) to prevent proxy timeouts
    if (!this.heartbeatInterval) {
      this.heartbeatInterval = setInterval(() => {
        this.sendHeartbeat();
      }, 25000);
    }
  }

  /**
   * Registers a client for Server-Sent Events (SSE) streaming
   */
  public static addSseClient(res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    Logger.info('[SSE] Realtime monitoring client connected');
    this.sseClients.add(res);

    // Write initial connection success
    res.write(`data: ${JSON.stringify({ id: crypto.randomUUID(), timestamp: new Date().toISOString(), type: 'connected', source: 'scraper_engine', level: 'info', payload: {} })}\n\n`);

    // Immediately replay event history to this client
    for (const historyEvent of this.eventHistory) {
      res.write(`data: ${JSON.stringify(historyEvent)}\n\n`);
    }

    res.on('close', () => {
      Logger.info('[SSE] Realtime monitoring client disconnected');
      this.sseClients.delete(res);
    });
  }

  /**
   * Publishes an event to the transport-agnostic EventBus
   */
  public static publish(type: string, payload: any, level: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const event: ScraperEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      source: 'scraper_engine',
      level,
      payload,
    };
    EventBus.emit('scraper_event', event);
  }

  /**
   * Periodically broadcasts keep-alive heartbeat signals to all connected transports
   */
  private static sendHeartbeat(): void {
    const heartbeatEvent: ScraperEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type: 'heartbeat',
      source: 'scraper_engine',
      level: 'info',
      payload: {},
    };
    
    const serialized = JSON.stringify(heartbeatEvent);

    // Send heartbeat to WS
    for (const ws of this.wsClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(serialized);
      }
    }

    // Send heartbeat to SSE
    for (const res of this.sseClients) {
      res.write(`data: ${serialized}\n\n`);
    }
  }

  /**
   * Fans out a ScraperEvent to all registered transports
   */
  private static fanOut(event: ScraperEvent): void {
    // Add to local ring buffer history (keep last 100)
    this.eventHistory.push(event);
    if (this.eventHistory.length > 100) {
      this.eventHistory.shift();
    }

    const serialized = JSON.stringify(event);

    // A. Broadcast to WebSockets
    for (const ws of this.wsClients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(serialized);
      }
    }

    // B. Broadcast to SSE streams
    for (const res of this.sseClients) {
      res.write(`data: ${serialized}\n\n`);
    }

    // C. Broadcast to Supabase Realtime channel (if cross-process coordination is needed)
    if (this.supabaseClient && !this.isSystemSourcedChange) {
      this.broadcastToSupabase(event);
    }
  }

  /**
   * Broadcasts the event payload to the Supabase Realtime channel
   */
  private static async broadcastToSupabase(event: ScraperEvent): Promise<void> {
    try {
      const channel = this.supabaseClient!.channel('scraper-monitoring');
      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.send({
            type: 'broadcast',
            event: 'scraper_event',
            payload: event,
          });
          await channel.unsubscribe();
        }
      });
    } catch (e: any) {
      Logger.error('Failed to broadcast event to Supabase Realtime', e);
    }
  }

  /**
   * Subscribes to the Supabase Realtime channel for cross-process synchronization
   */
  private static subscribeToSupabaseRealtime(): void {
    if (this.isSubscribedToSupabase || !this.supabaseClient) return;

    const channel = this.supabaseClient.channel('scraper-monitoring');
    channel
      .on('broadcast', { event: 'scraper_event' }, ({ payload }) => {
        // Guard against duplicate broadcasts / loopback loops
        this.isSystemSourcedChange = true;
        EventBus.emit('scraper_event', payload);
        this.isSystemSourcedChange = false;
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isSubscribedToSupabase = true;
          Logger.info('Cross-process Supabase Realtime coordination channel active');
        }
      });
  }
}
