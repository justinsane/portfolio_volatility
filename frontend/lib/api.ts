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

    // Provide more helpful error messages based on common issues
    let errorMessage =
      errorData.error || `HTTP error! status: ${response.status}`;

    if (response.status === 400) {
      if (errorMessage.includes('CSV must contain columns')) {
        errorMessage =
          'Invalid CSV format. Please ensure your file has "Ticker" and "Weight" columns. Download our sample file for reference.';
      } else if (errorMessage.includes('File must be a CSV file')) {
        errorMessage =
          'Please upload a CSV file. Other file types are not supported.';
      } else if (errorMessage.includes('Error processing file')) {
        errorMessage =
          'Unable to process your CSV file. Please check the format and try again.';
      }
    } else if (response.status === 413) {
      errorMessage =
        'File too large. Please upload a smaller CSV file (max 10MB).';
    } else if (response.status === 500) {
      errorMessage =
        'Server error. Please try again later or contact support if the problem persists.';
    }

    throw new Error(errorMessage);
  }

  return response.json();
}

export function getSampleDownloadUrl(): string {
  return `${API_BASE_URL}/sample`;
}

export interface SymbolValidationResult {
  isValid: boolean;
  source: string;
  name: string | null;
  assetType: string;
  sector: string;
  industry: string;
}

export interface SymbolValidationResponse {
  validations: Record<string, SymbolValidationResult>;
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export async function validateSymbols(
  symbols: string[]
): Promise<SymbolValidationResponse> {
  const response = await fetch(`${API_BASE_URL}/api/validate-symbols`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols }),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
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

// Feedback API
export interface FeedbackRequest {
  name?: string;
  message: string;
}

export interface FeedbackResponse {
  message: string;
}

export async function submitFeedback(
  feedback: FeedbackRequest
): Promise<FeedbackResponse> {
  const response = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}

// Email Signup API
export interface EmailSignupRequest {
  name?: string;
  email: string;
}

export interface EmailSignupResponse {
  message: string;
}

export async function submitEmailSignup(
  signup: EmailSignupRequest
): Promise<EmailSignupResponse> {
  const response = await fetch(`${API_BASE_URL}/api/email-signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(signup),
  });

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(
      errorData.error || `HTTP error! status: ${response.status}`
    );
  }

  return response.json();
}
