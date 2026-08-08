import { Logger } from '../Logger.js';
import got from 'got';

export interface ProxyCandidate {
  ip: string;
  port: number;
  protocol: 'http' | 'https' | 'socks4' | 'socks5';
  source: 'proxyscrape' | 'geonode' | 'freeproxylist' | 'custom';
  country?: string;
  anonymity?: string;
  uptime?: number;
}

export class ProxyCollector {
  private static instance: ProxyCollector | null = null;

  private constructor() {}

  public static getInstance(): ProxyCollector {
    if (!ProxyCollector.instance) {
      ProxyCollector.instance = new ProxyCollector();
    }
    return ProxyCollector.instance;
  }

  /**
   * Collect proxies from all sources
   */
  public async collectFromAllSources(): Promise<ProxyCandidate[]> {
    Logger.info('[ProxyCollector] Starting proxy collection from all sources...');

    const [proxyscrape, geonode, freeproxylist] = await Promise.allSettled([
      this.fetchFromProxyScrape(),
      this.fetchFromGeoNode(),
      this.fetchFromFreeProxyList(),
    ]);

    const allProxies: ProxyCandidate[] = [];

    if (proxyscrape.status === 'fulfilled') {
      allProxies.push(...proxyscrape.value);
      Logger.info(`[ProxyCollector] Collected ${proxyscrape.value.length} proxies from ProxyScrape`);
    } else {
      Logger.warn(`[ProxyCollector] ProxyScrape failed: ${proxyscrape.reason}`);
    }

    if (geonode.status === 'fulfilled') {
      allProxies.push(...geonode.value);
      Logger.info(`[ProxyCollector] Collected ${geonode.value.length} proxies from GeoNode`);
    } else {
      Logger.warn(`[ProxyCollector] GeoNode failed: ${geonode.reason}`);
    }

    if (freeproxylist.status === 'fulfilled') {
      allProxies.push(...freeproxylist.value);
      Logger.info(`[ProxyCollector] Collected ${freeproxylist.value.length} proxies from Free-Proxy-List`);
    } else {
      Logger.warn(`[ProxyCollector] Free-Proxy-List failed: ${freeproxylist.reason}`);
    }

    // Remove duplicates
    const uniqueProxies = this.removeDuplicates(allProxies);
    Logger.info(`[ProxyCollector] Total unique proxies collected: ${uniqueProxies.length}`);

    return uniqueProxies;
  }

  /**
   * Fetch proxies from ProxyScrape
   */
  private async fetchFromProxyScrape(): Promise<ProxyCandidate[]> {
    try {
      const url = 'https://api.proxyscrape.com/v4/free-proxy-list/get?request=display_proxies&protocol=http&proxy_format=ipport&format=text';
      
      const response = await got(url, {
        timeout: { request: 30000 },
        responseType: 'text',
      });

      const proxies: ProxyCandidate[] = [];
      const lines = response.body.split('\n').filter(line => line.trim());

      for (const line of lines) {
        const parts = line.split(':');
        if (parts.length >= 2) {
          proxies.push({
            ip: parts[0],
            port: parseInt(parts[1], 10),
            protocol: 'http',
            source: 'proxyscrape',
          });
        }
      }

      return proxies;
    } catch (error: any) {
      Logger.error(`[ProxyCollector] ProxyScrape fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch proxies from GeoNode
   */
  private async fetchFromGeoNode(): Promise<ProxyCandidate[]> {
    try {
      const url = 'https://proxylist.geonode.com/api/proxy-list';
      
      const response = await got(url, {
        timeout: { request: 30000 },
        responseType: 'json',
      });

      const proxies: ProxyCandidate[] = [];
      const data = response.body as any;

      if (data && Array.isArray(data.data)) {
        for (const item of data.data) {
          try {
            const [ip, port] = (item.ip_address || '').split(':');
            if (ip && port) {
              proxies.push({
                ip: ip,
                port: parseInt(port, 10),
                protocol: 'http',
                source: 'geonode',
                country: item.country,
                anonymity: item.anonymity,
                uptime: item.uptime,
              });
            }
          } catch {
            // Skip invalid entries
          }
        }
      }

      return proxies;
    } catch (error: any) {
      Logger.error(`[ProxyCollector] GeoNode fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch proxies from Free-Proxy-List
   */
  private async fetchFromFreeProxyList(): Promise<ProxyCandidate[]> {
    try {
      const url = 'https://free-proxy-list.net/';
      
      const response = await got(url, {
        timeout: { request: 30000 },
        responseType: 'text',
      });

      const proxies: ProxyCandidate[] = [];
      // Parse HTML table
      const ipPortRegex = /(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d+)/g;
      let match;

      while ((match = ipPortRegex.exec(response.body)) !== null) {
        proxies.push({
          ip: match[1],
          port: parseInt(match[2], 10),
          protocol: 'http',
          source: 'freeproxylist',
        });
      }

      return proxies;
    } catch (error: any) {
      Logger.error(`[ProxyCollector] Free-Proxy-List fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Remove duplicate proxies
   */
  private removeDuplicates(proxies: ProxyCandidate[]): ProxyCandidate[] {
    const seen = new Set<string>();
    const unique: ProxyCandidate[] = [];

    for (const proxy of proxies) {
      const key = `${proxy.ip}:${proxy.port}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(proxy);
      }
    }

    return unique;
  }

  /**
   * Format proxy as URL string
   */
  public formatProxyUrl(proxy: ProxyCandidate): string {
    return `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
  }
}