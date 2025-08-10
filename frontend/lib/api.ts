const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PredictionResult {
  forecast_days: number;
  predicted_volatility: number[];
  risk_level: string;
  annual_volatility: string;
  // ML-adjusted single volatility (preferred numeric value if present)
  final_volatility?: number;
  // Methodology identifier and human-readable labels from backend
  method?: string;
  labels?: {
    window?: string; // e.g., '1y realized'
    ml_adjustment?: string; // e.g., '1.05x'
  };
  description: string;
  portfolio_assets: Array<{ Ticker: string; Weight: number }>;
  model_type: string;
  enhancement_data?: {
    coverage_analysis: {
      total_assets: number;
      covered_assets: number;
      coverage_by_count: number;
    };
    overall_confidence: string;
    asset_details?: Array<{
      ticker: string;
      volatility: number;
      confidence: string;
      asset_type: string;
      name?: string;
    }>;
  };
  risk_analysis?: {
    success: boolean;
    risk_metrics: {
      correlation_analysis: {
        success: boolean;
        most_correlated_pair: {
          asset1: string;
          asset2: string;
          correlation: number;
          correlation_level: string;
          risk_color: string;
          risk_description: string;
        };
        average_correlation: number;
        concentration_metrics: {
          hhi: number;
          concentration_level: string;
          risk_color: string;
          largest_holding: {
            ticker: string;
            weight: number;
            percentage: number;
          };
        };
        single_asset_portfolio?: boolean;
        error_message?: string;
      };
      risk_summary: {
        overall_risk_level: string;
        risk_score: number;
        risk_color: string;
        key_concerns: string[];
        diversification_score: {
          score: number;
          color: string;
          explanation?: string;
        };
      };
      recommendations?: Array<{
        title: string;
        description: string;
        action: string;
        priority: string;
      }>;
    };
  };
}

export interface ApiError {
  error: string;
}

export async function predictVolatility(file: File): Promise<PredictionResult> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/predict`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

export function getSampleDownloadUrl(): string {
  return `${API_BASE_URL}/sample`;
}

// Batch resolve tickers to metadata (name, assetClass, category, etc.)
export interface ResolvedTickerMeta {
  ticker: string;
  name?: string;
  assetClass?: string;
  category?: string;
  currency?: string;
  exchange?: string;
}

export async function resolveTickersBatch(
  tickers: string[]
): Promise<Record<string, ResolvedTickerMeta>> {
  if (tickers.length === 0) return {};
  const response = await fetch(`${API_BASE_URL}/api/tickers/resolve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tickers }),
  });

  if (!response.ok) {
    // On failure, degrade gracefully by returning an empty map
    return {};
  }
  return response.json();
}
