export interface CSVValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  parsedData?: ParsedPortfolioData;
}

export interface ValidationError {
  type: 'file_type' | 'headers' | 'data_format' | 'weights' | 'symbols';
  message: string;
  details?: string;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'weights_not_100' | 'unknown_symbols' | 'large_portfolio';
  message: string;
  details?: string;
  suggestion?: string;
}

export interface ParsedPortfolioData {
  assets: Array<{
    ticker: string;
    weight: number;
    originalWeight?: string;
  }>;
  totalWeight: number;
  unknownSymbols: string[];
  knownSymbols: string[];
}

export interface CSVValidationOptions {
  allowWeightsNot100?: boolean;
  maxAssets?: number;
  minWeight?: number;
  maxWeight?: number;
}

const DEFAULT_OPTIONS: CSVValidationOptions = {
  allowWeightsNot100: true,
  maxAssets: 100,
  minWeight: 0,
  maxWeight: 100,
};

export async function validateCSVFile(
  file: File,
  options: CSVValidationOptions = {}
): Promise<CSVValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 1. Check file type
  if (!file.name.toLowerCase().endsWith('.csv')) {
    errors.push({
      type: 'file_type',
      message: 'Invalid file type',
      details: 'Please upload a CSV file',
      suggestion: 'Download our sample CSV template to see the correct format',
    });
    return { isValid: false, errors, warnings };
  }

  // 2. Read and parse CSV
  let csvText: string;
  try {
    csvText = await file.text();
  } catch (error) {
    errors.push({
      type: 'file_type',
      message: 'Unable to read file',
      details: 'The file may be corrupted or in an unsupported format',
      suggestion: 'Try downloading our sample CSV and using it as a template',
    });
    return { isValid: false, errors, warnings };
  }

  // 3. Parse CSV content
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    errors.push({
      type: 'headers',
      message: 'Invalid CSV format',
      details: 'File must contain at least a header row and one data row',
      suggestion: 'Download our sample CSV to see the correct format',
    });
    return { isValid: false, errors, warnings };
  }

  // 4. Validate headers
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const requiredHeaders = ['Ticker', 'Weight'];
  const missingHeaders = requiredHeaders.filter(
    h => !headers.some(header => header.toLowerCase() === h.toLowerCase())
  );

  if (missingHeaders.length > 0) {
    errors.push({
      type: 'headers',
      message: 'Missing required columns',
      details: `Required columns: ${requiredHeaders.join(
        ', '
      )}. Found: ${headers.join(', ')}`,
      suggestion: `Your CSV should have these exact column names: ${requiredHeaders.join(
        ', '
      )}`,
    });
    return { isValid: false, errors, warnings };
  }

  // 5. Parse data rows
  const dataRows = lines.slice(1);
  const assets: Array<{
    ticker: string;
    weight: number;
    originalWeight?: string;
  }> = [];
  const unknownSymbols: string[] = [];
  const knownSymbols: string[] = [];

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    if (!row.trim()) continue; // Skip empty rows

    const values = parseCSVLine(row);
    if (values.length < 2) {
      errors.push({
        type: 'data_format',
        message: `Invalid data in row ${i + 2}`,
        details: 'Each row must have at least 2 values (Ticker and Weight)',
        suggestion: 'Make sure each row follows the format: Ticker,Weight',
      });
      continue;
    }

    const ticker = values[0]?.trim().toUpperCase();
    const weightStr = values[1]?.trim();

    if (!ticker) {
      errors.push({
        type: 'data_format',
        message: `Missing ticker in row ${i + 2}`,
        details: 'Ticker column cannot be empty',
        suggestion: 'Enter a valid stock symbol (e.g., AAPL, SPY, VTI)',
      });
      continue;
    }

    // Validate weight
    const weight = parseFloat(weightStr);
    if (isNaN(weight)) {
      errors.push({
        type: 'data_format',
        message: `Invalid weight in row ${i + 2}`,
        details: `"${weightStr}" is not a valid number`,
        suggestion: 'Weights should be numbers (e.g., 25.5 for 25.5%)',
      });
      continue;
    }

    if (weight < (opts.minWeight ?? 0) || weight > (opts.maxWeight ?? 100)) {
      errors.push({
        type: 'weights',
        message: `Weight out of range in row ${i + 2}`,
        details: `Weight ${weight}% is outside the allowed range (${
          opts.minWeight ?? 0
        }-${opts.maxWeight ?? 100}%)`,
        suggestion: 'Weights should be between 0% and 100%',
      });
      continue;
    }

    // Check if symbol is known (basic validation)
    if (isKnownSymbol(ticker)) {
      knownSymbols.push(ticker);
    } else {
      unknownSymbols.push(ticker);
    }

    assets.push({
      ticker,
      weight,
      originalWeight: weightStr,
    });
  }

  // 6. Check for duplicate tickers
  const tickerCounts = new Map<string, number>();
  assets.forEach(asset => {
    tickerCounts.set(asset.ticker, (tickerCounts.get(asset.ticker) || 0) + 1);
  });

  const duplicates = Array.from(tickerCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([ticker, _]) => ticker);

  if (duplicates.length > 0) {
    errors.push({
      type: 'data_format',
      message: 'Duplicate tickers found',
      details: `Duplicate symbols: ${duplicates.join(', ')}`,
      suggestion: 'Each ticker should appear only once in your portfolio',
    });
  }

  // 7. Calculate total weight
  const totalWeight = assets.reduce((sum, asset) => sum + asset.weight, 0);

  // 8. Check weight total
  if (Math.abs(totalWeight - 100) > 0.01) {
    // Allow for small rounding errors
    if (!opts.allowWeightsNot100) {
      errors.push({
        type: 'weights',
        message: 'Portfolio weights do not add up to 100%',
        details: `Total weight: ${totalWeight.toFixed(2)}%`,
        suggestion: 'All weights should add up to exactly 100%',
      });
    } else {
      warnings.push({
        type: 'weights_not_100',
        message: 'Portfolio weights do not add up to 100%',
        details: `Total weight: ${totalWeight.toFixed(2)}%`,
        suggestion:
          totalWeight < 100
            ? 'Consider adding more assets to reach 100%'
            : 'Consider reducing some weights to reach 100%',
      });
    }
  }

  // 9. Check portfolio size
  if (assets.length > (opts.maxAssets ?? 100)) {
    warnings.push({
      type: 'large_portfolio',
      message: 'Large portfolio detected',
      details: `${assets.length} assets (max recommended: ${
        opts.maxAssets ?? 100
      })`,
      suggestion: 'Large portfolios may take longer to analyze',
    });
  }

  // 10. Check for unknown symbols
  if (unknownSymbols.length > 0) {
    warnings.push({
      type: 'unknown_symbols',
      message: 'Some symbols may not be recognized',
      details: `Unknown symbols: ${unknownSymbols.join(', ')}`,
      suggestion:
        "We'll attempt to analyze these symbols, but results may be limited",
    });
  }

  const parsedData: ParsedPortfolioData = {
    assets,
    totalWeight,
    unknownSymbols,
    knownSymbols,
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    parsedData,
  };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function isKnownSymbol(ticker: string): boolean {
  // Basic validation - check if it looks like a valid ticker
  if (!ticker || ticker.length < 1 || ticker.length > 10) {
    return false;
  }

  // Check if it contains only letters, numbers, and dots
  if (!/^[A-Z0-9.]+$/.test(ticker)) {
    return false;
  }

  // Common known symbols (extend this list)
  const knownSymbols = new Set([
    'SPY',
    'QQQ',
    'VTI',
    'VOO',
    'IWM',
    'EFA',
    'EEM',
    'BND',
    'AGG',
    'GLD',
    'VNQ',
    'AAPL',
    'MSFT',
    'GOOGL',
    'AMZN',
    'TSLA',
    'META',
    'NVDA',
    'NFLX',
    'ADBE',
    'CRM',
    'PYPL',
    'INTC',
    'AMD',
    'ORCL',
    'CSCO',
    'IBM',
    'QCOM',
    'TXN',
    'AVGO',
    'V',
    'MA',
    'JPM',
    'BAC',
    'WFC',
    'GS',
    'MS',
    'C',
    'JNJ',
    'PG',
    'UNH',
    'HD',
    'DIS',
    'VZ',
    'CMCSA',
    'PFE',
    'ABT',
    'KO',
    'PEP',
    'TMO',
    'COST',
    'ABBV',
    'MRK',
    'ACN',
    'DHR',
    'NEE',
    'LLY',
    'TXN',
    'HON',
    'UNP',
    'RTX',
    'LOW',
    'BMY',
    'SPGI',
    'AMGN',
    'T',
    'QCOM',
    'INTU',
    'GILD',
    'ISRG',
    'VRTX',
    'ADI',
    'REGN',
    'MDLZ',
    'ADP',
    'BKNG',
    'KLAC',
    'MU',
    'PANW',
    'SNPS',
    'CDNS',
    'MELI',
    'CHTR',
    'MAR',
    'ORLY',
    'MNST',
    'CPRT',
    'PAYX',
    'ROST',
    'BIIB',
    'ALGN',
    'IDXX',
    'DXCM',
    'VRSK',
    'FAST',
    'CTAS',
    'WDAY',
    'ODFL',
    'PCAR',
    'EXC',
    'AEP',
    'SO',
    'XOM',
    'CVX',
    'COP',
    'EOG',
    'SLB',
    'PSX',
    'VLO',
    'MPC',
    'HAL',
    'BKR',
    'BTC',
    'ETH',
    'USDT',
    'USDC',
    'BNB',
    'ADA',
    'SOL',
    'DOT',
    'AVAX',
    'MATIC',
  ]);

  return knownSymbols.has(ticker);
}

export function getValidationSummary(result: CSVValidationResult): {
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error';
} {
  if (!result.isValid) {
    return {
      title: 'Validation Failed',
      message: `Found ${result.errors.length} error${
        result.errors.length !== 1 ? 's' : ''
      }`,
      type: 'error',
    };
  }

  if (result.warnings.length > 0) {
    return {
      title: 'Validation Passed with Warnings',
      message: `Found ${result.warnings.length} warning${
        result.warnings.length !== 1 ? 's' : ''
      }`,
      type: 'warning',
    };
  }

  return {
    title: 'Validation Passed',
    message: 'Your CSV file is ready for analysis',
    type: 'success',
  };
}
