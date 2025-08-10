import { resolveTickersBatch } from './api';
import { tickerDirectory, TickerMetadata } from './tickerDirectory';

function coerceAssetClass(input?: string): TickerMetadata['assetClass'] {
  switch ((input || 'unknown').toLowerCase()) {
    case 'equity':
      return 'equity';
    case 'etf':
      return 'etf';
    case 'mutual_fund':
    case 'mutual-fund':
    case 'mutualfund':
      return 'mutual_fund';
    case 'bond':
      return 'bond';
    case 'crypto':
      return 'crypto';
    case 'index':
      return 'index';
    default:
      return 'unknown';
  }
}

export async function ensureTickersResolved(tickers: string[]): Promise<void> {
  const normalized = Array.from(
    new Set(tickers.map(t => t.trim().toUpperCase()).filter(Boolean))
  );
  const missing = normalized.filter(t => !tickerDirectory.has(t));
  if (missing.length === 0) return;

  const resolved = await resolveTickersBatch(missing);
  Object.values(resolved).forEach(meta => {
    const upsert: TickerMetadata = {
      ticker: meta.ticker.toUpperCase(),
      name: meta.name,
      assetClass: coerceAssetClass(meta.assetClass),
      category: meta.category,
      currency: meta.currency,
      exchange: meta.exchange,
    };
    tickerDirectory.upsert(upsert);
  });
}

export function warmFromEnhancementDetails(
  details: Array<{
    ticker: string;
    name?: string;
    asset_type?: string;
    assetType?: string;
  }> = []
): void {
  details.forEach(d => {
    tickerDirectory.upsert({
      ticker: d.ticker,
      name: d.name,
      assetClass: coerceAssetClass((d as any).assetType || d.asset_type),
    });
  });
}
