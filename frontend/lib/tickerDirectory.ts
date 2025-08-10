type AssetClass =
  | 'equity'
  | 'etf'
  | 'mutual_fund'
  | 'bond'
  | 'crypto'
  | 'index'
  | 'unknown';

export interface TickerMetadata {
  ticker: string;
  name?: string;
  assetClass: AssetClass;
  category?: string; // e.g., Large Cap, Tech, Bond, etc.
  currency?: string; // default USD
  exchange?: string; // e.g., NASDAQ, NYSE, CRYPTO
}

export interface TickerDirectoryInitOptions {
  preload?: Array<TickerMetadata>;
  maxEntries?: number;
}

// Simple in-memory LRU cache for ticker metadata
class LruCache<K, V> {
  private map: Map<K, V>;
  private max: number;

  constructor(max: number) {
    this.map = new Map();
    this.max = Math.max(50, max);
  }

  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value !== undefined) {
      this.map.delete(key);
      this.map.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.max) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest as K);
    }
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  values(): V[] {
    return Array.from(this.map.values());
  }
}

export class TickerDirectory {
  private cache: LruCache<string, TickerMetadata>;

  constructor(options?: TickerDirectoryInitOptions) {
    const maxEntries = options?.maxEntries ?? 500;
    this.cache = new LruCache<string, TickerMetadata>(maxEntries);
    options?.preload?.forEach(meta =>
      this.cache.set(meta.ticker.toUpperCase(), meta)
    );
  }

  normalize(ticker: string): string {
    return ticker.trim().toUpperCase();
  }

  get(ticker: string): TickerMetadata | undefined {
    return this.cache.get(this.normalize(ticker));
  }

  set(meta: TickerMetadata): void {
    this.cache.set(this.normalize(meta.ticker), meta);
  }

  has(ticker: string): boolean {
    return this.cache.has(this.normalize(ticker));
  }

  upsert(meta: Partial<TickerMetadata> & { ticker: string }): TickerMetadata {
    const key = this.normalize(meta.ticker);
    const existing = this.cache.get(key);
    const { ticker: _existingTicker, ...existingSansTicker } = existing ?? {};
    const { ticker: _metaTicker, ...metaSansTicker } = meta;
    const merged: TickerMetadata = {
      assetClass: existing?.assetClass ?? 'unknown',
      ...existingSansTicker,
      ...metaSansTicker,
      ticker: key,
    } as TickerMetadata;
    this.cache.set(key, merged);
    return merged;
  }

  list(): TickerMetadata[] {
    return this.cache.values();
  }
}

// Singleton instance for app-wide use
import { ETFS } from './etf-mapping';

const preload: TickerMetadata[] = Object.entries(ETFS).map(
  ([ticker, info]) => ({
    ticker,
    name: info.name,
    assetClass: 'etf',
    category: info.category,
    currency: 'USD',
  })
);

export const tickerDirectory = new TickerDirectory({
  preload,
  maxEntries: 2000,
});

// Helper lookups
export function getDisplayName(ticker: string): string | undefined {
  return tickerDirectory.get(ticker)?.name;
}

export function getCategory(ticker: string): string | undefined {
  return tickerDirectory.get(ticker)?.category;
}

export function getAssetClass(ticker: string): AssetClass {
  return tickerDirectory.get(ticker)?.assetClass ?? 'unknown';
}
