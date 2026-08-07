import { WebSocketServer, WebSocket } from 'ws';
import { Response } from 'express';
import { EventBus } from './EventBus.js';
import { Logger } from './Logger.js';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config/config.js';

export interface ScraperEvent {
  type: string;
  timestamp: string;
  data: any;
}

export class BroadcastManager {
  private static wss: WebSocketServer | null = null;
  private static wsClients: Set<WebSocket> = new Set();
  private static sseClients: Set<Response> = new Set();
  private static supabaseClient: SupabaseClient | null = null;
  private static isSubscribedToSupabase = false;
  private static isSystemSourcedChange = false;

  public static initialize(server?: any): void {
    // 1. Initialize Supabase Realtime if not local and credentials exist
    if (!config.isLocal && config.supabaseUrl && config.supabaseServiceKey) {
      this.supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      this.subscribeToSupabaseRealtime();
    }

    // 2. Initialize WebSocket Server if HTTP server is provided
    if (server) {
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

        // Keep-alive heartbeat ping every 30s
        const heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
          }
        }, 30000);

        ws.on('close', () => {
          Logger.info('[WS] Realtime monitoring client disconnected');
          this.wsClients.delete(ws);
          clearInterval(heartbeat);
        });

        ws.on('error', (err) => {
          Logger.error('[WS] Realtime connection error', err);
          this.wsClients.delete(ws);
          clearInterval(heartbeat);
        });
      });
    }

    // 3. Listen to local EventBus and fan out events (only once)
    if (!this.isSubscribedToSupabase && EventBus.listenerCount('scraper_event') === 0) {
      EventBus.on('scraper_event', (event: ScraperEvent) => {
        this.fanOut(event);
      });
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

    // Initial handshake package
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

    res.on('close', () => {
      Logger.info('[SSE] Realtime monitoring client disconnected');
      this.sseClients.delete(res);
    });
  }

  /**
   * Publishes an event to the transport-agnostic EventBus
   */
  public static publish(type: string, data: any): void {
    const event: ScraperEvent = {
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    EventBus.emit('scraper_event', event);
  }

  /**
   * Fans out a ScraperEvent to all registered transports
   */
  private static fanOut(event: ScraperEvent): void {
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
