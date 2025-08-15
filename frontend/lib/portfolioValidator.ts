import {
  validateCSVFile,
  CSVValidationResult,
  ValidationError,
  ValidationWarning,
  ParsedPortfolioData,
} from './csvValidator';
import { validateSymbols, SymbolValidationResponse } from './api';

export interface PortfolioAsset {
  ticker: string;
  weight: number;
  originalWeight?: string;
}

export interface ManualPortfolioValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  parsedData?: ParsedPortfolioData;
}

export interface PortfolioValidationOptions {
  allowWeightsNot100?: boolean;
  maxAssets?: number;
  minWeight?: number;
  maxWeight?: number;
  allowUnknownSymbols?: boolean;
}

const DEFAULT_OPTIONS: PortfolioValidationOptions = {
  allowWeightsNot100: true,
  maxAssets: 100,
  minWeight: 0,
  maxWeight: 100,
  allowUnknownSymbols: true,
};

// Re-export CSV validation for convenience
export { validateCSVFile };
export type { CSVValidationResult };

export async function validateManualPortfolioWithAPI(
  assets: PortfolioAsset[],
  options: PortfolioValidationOptions = {}
): Promise<ManualPortfolioValidationResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Filter out empty assets
  const validAssets = assets.filter(
    asset => asset.ticker.trim() && asset.weight > 0
  );

  // 1. Check for empty portfolio
  if (validAssets.length === 0) {
    errors.push({
      type: 'data_format',
      message: 'No valid assets found',
      details: 'Please add at least one asset with a ticker and weight',
      suggestion: 'Enter a stock symbol (e.g., AAPL) and its weight percentage',
    });
    return { isValid: false, errors, warnings };
  }

  // 2. Check for duplicate tickers
  const tickers = validAssets.map(asset => asset.ticker.trim().toUpperCase());
  const duplicates = tickers.filter(
    (ticker, index) => tickers.indexOf(ticker) !== index
  );
  if (duplicates.length > 0) {
    errors.push({
      type: 'data_format',
      message: 'Duplicate tickers found',
      details: `The following tickers appear multiple times: ${[
        ...new Set(duplicates),
      ].join(', ')}`,
      suggestion: 'Each ticker should appear only once in your portfolio',
    });
  }

  // 3. Check for invalid weights
  const invalidWeights = validAssets.filter(
    asset =>
      asset.weight < (opts.minWeight ?? 0) ||
      asset.weight > (opts.maxWeight ?? 100)
  );
  if (invalidWeights.length > 0) {
    errors.push({
      type: 'weights',
      message: 'Invalid weights found',
      details: `Weights must be between ${opts.minWeight ?? 0}% and ${
        opts.maxWeight ?? 100
      }%`,
      suggestion: 'Adjust weights to be within the valid range',
    });
  }

  // 4. Check portfolio size
  if (validAssets.length > (opts.maxAssets ?? 100)) {
    errors.push({
      type: 'data_format',
      message: 'Portfolio too large',
      details: `Maximum ${opts.maxAssets ?? 100} assets allowed, found ${
        validAssets.length
      }`,
      suggestion:
        'Consider consolidating similar assets or removing smaller positions',
    });
  }

  // 5. Check total weight
  const totalWeight = validAssets.reduce((sum, asset) => sum + asset.weight, 0);
  if (!opts.allowWeightsNot100 && Math.abs(totalWeight - 100) > 0.01) {
    errors.push({
      type: 'weights',
      message: 'Total weight must equal 100%',
      details: `Current total: ${totalWeight.toFixed(2)}%`,
      suggestion:
        'Use the "Normalize to 100%" button to automatically adjust weights',
    });
  } else if (opts.allowWeightsNot100 && Math.abs(totalWeight - 100) > 1) {
    warnings.push({
      type: 'weights_not_100',
      message: 'Weights do not add up to 100%',
      details: `Current total: ${totalWeight.toFixed(2)}%`,
      suggestion:
        'Consider normalizing weights to 100% for more accurate analysis',
    });
  }

  // 6. Validate symbols using API
  try {
    const symbolValidation = await validateSymbols(tickers);
    const unknownSymbols: string[] = [];
    const knownSymbols: string[] = [];

    for (const [ticker, validation] of Object.entries(
      symbolValidation.validations
    )) {
      if (validation.isValid) {
        knownSymbols.push(ticker);
      } else {
        unknownSymbols.push(ticker);
      }
    }

    // Check for unknown symbols (if not allowed)
    if (!opts.allowUnknownSymbols && unknownSymbols.length > 0) {
      errors.push({
        type: 'symbols',
        message: 'Unknown symbols found',
        details: `Unable to recognize: ${unknownSymbols.join(', ')}`,
        suggestion: 'Check spelling or use our symbol lookup tool',
      });
    } else if (opts.allowUnknownSymbols && unknownSymbols.length > 0) {
      // Check for unknown symbols as warnings
      warnings.push({
        type: 'unknown_symbols',
        message: 'Unknown symbols detected',
        details: `Unable to recognize: ${unknownSymbols.join(', ')}`,
        suggestion:
          'These symbols will be excluded from analysis. Check spelling if this is unexpected.',
      });
    }

    // 7. Check for very small weights
    const smallWeights = validAssets.filter(asset => asset.weight < 1);
    if (smallWeights.length > 0) {
      warnings.push({
        type: 'weights_not_100',
        message: 'Very small weights detected',
        details: `${smallWeights.length} asset(s) have weights less than 1%`,
        suggestion:
          'Consider consolidating very small positions for better portfolio management',
      });
    }

    // Create parsed data
    const parsedData: ParsedPortfolioData = {
      assets: validAssets.map(asset => ({
        ticker: asset.ticker.trim().toUpperCase(),
        weight: asset.weight,
        originalWeight: asset.originalWeight,
      })),
      totalWeight,
      knownSymbols,
      unknownSymbols,
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      parsedData,
    };
  } catch (error) {
    // If API validation fails, fall back to basic validation
    console.warn(
      'API validation failed, falling back to basic validation:',
      error
    );

    // Use basic pattern recognition as fallback
    const unknownSymbols = validAssets
      .map(asset => asset.ticker.trim().toUpperCase())
      .filter(ticker => !isKnownSymbol(ticker));

    const knownSymbols = validAssets
      .map(asset => asset.ticker.trim().toUpperCase())
      .filter(ticker => isKnownSymbol(ticker));

    if (!opts.allowUnknownSymbols && unknownSymbols.length > 0) {
      errors.push({
        type: 'symbols',
        message: 'Unknown symbols found',
        details: `Unable to recognize: ${unknownSymbols.join(', ')}`,
        suggestion: 'Check spelling or use our symbol lookup tool',
      });
    } else if (opts.allowUnknownSymbols && unknownSymbols.length > 0) {
      warnings.push({
        type: 'unknown_symbols',
        message: 'Unknown symbols detected',
        details: `Unable to recognize: ${unknownSymbols.join(', ')}`,
        suggestion:
          'These symbols will be excluded from analysis. Check spelling if this is unexpected.',
      });
    }

    // 7. Check for very small weights
    const smallWeights = validAssets.filter(asset => asset.weight < 1);
    if (smallWeights.length > 0) {
      warnings.push({
        type: 'weights_not_100',
        message: 'Very small weights detected',
        details: `${smallWeights.length} asset(s) have weights less than 1%`,
        suggestion:
          'Consider consolidating very small positions for better portfolio management',
      });
    }

    // Create parsed data
    const parsedData: ParsedPortfolioData = {
      assets: validAssets.map(asset => ({
        ticker: asset.ticker.trim().toUpperCase(),
        weight: asset.weight,
        originalWeight: asset.originalWeight,
      })),
      totalWeight,
      knownSymbols,
      unknownSymbols,
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      parsedData,
    };
  }
}

export function validateManualPortfolio(
  assets: PortfolioAsset[],
  options: PortfolioValidationOptions = {}
): ManualPortfolioValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Filter out empty assets
  const validAssets = assets.filter(
    asset => asset.ticker.trim() && asset.weight > 0
  );

  // 1. Check for empty portfolio
  if (validAssets.length === 0) {
    errors.push({
      type: 'data_format',
      message: 'No valid assets found',
      details: 'Please add at least one asset with a ticker and weight',
      suggestion: 'Enter a stock symbol (e.g., AAPL) and its weight percentage',
    });
    return { isValid: false, errors, warnings };
  }

  // 2. Check for duplicate tickers
  const tickers = validAssets.map(asset => asset.ticker.trim().toUpperCase());
  const duplicates = tickers.filter(
    (ticker, index) => tickers.indexOf(ticker) !== index
  );
  if (duplicates.length > 0) {
    errors.push({
      type: 'data_format',
      message: 'Duplicate tickers found',
      details: `The following tickers appear multiple times: ${[
        ...new Set(duplicates),
      ].join(', ')}`,
      suggestion: 'Each ticker should appear only once in your portfolio',
    });
  }

  // 3. Check for invalid weights
  const invalidWeights = validAssets.filter(
    asset =>
      asset.weight < (opts.minWeight ?? 0) ||
      asset.weight > (opts.maxWeight ?? 100)
  );
  if (invalidWeights.length > 0) {
    errors.push({
      type: 'weights',
      message: 'Invalid weights found',
      details: `Weights must be between ${opts.minWeight ?? 0}% and ${
        opts.maxWeight ?? 100
      }%`,
      suggestion: 'Adjust weights to be within the valid range',
    });
  }

  // 4. Check portfolio size
  if (validAssets.length > (opts.maxAssets ?? 100)) {
    errors.push({
      type: 'data_format',
      message: 'Portfolio too large',
      details: `Maximum ${opts.maxAssets ?? 100} assets allowed, found ${
        validAssets.length
      }`,
      suggestion:
        'Consider consolidating similar assets or removing smaller positions',
    });
  }

  // 5. Check total weight
  const totalWeight = validAssets.reduce((sum, asset) => sum + asset.weight, 0);
  if (!opts.allowWeightsNot100 && Math.abs(totalWeight - 100) > 0.01) {
    errors.push({
      type: 'weights',
      message: 'Total weight must equal 100%',
      details: `Current total: ${totalWeight.toFixed(2)}%`,
      suggestion:
        'Use the "Normalize to 100%" button to automatically adjust weights',
    });
  } else if (opts.allowWeightsNot100 && Math.abs(totalWeight - 100) > 1) {
    warnings.push({
      type: 'weights_not_100',
      message: 'Weights do not add up to 100%',
      details: `Current total: ${totalWeight.toFixed(2)}%`,
      suggestion:
        'Consider normalizing weights to 100% for more accurate analysis',
    });
  }

  // 6. Check for unknown symbols (if not allowed)
  if (!opts.allowUnknownSymbols) {
    const unknownSymbols = validAssets
      .map(asset => asset.ticker.trim().toUpperCase())
      .filter(ticker => !isKnownSymbol(ticker));

    if (unknownSymbols.length > 0) {
      errors.push({
        type: 'symbols',
        message: 'Unknown symbols found',
        details: `Unable to recognize: ${unknownSymbols.join(', ')}`,
        suggestion: 'Check spelling or use our symbol lookup tool',
      });
    }
  } else {
    // Check for unknown symbols as warnings
    const unknownSymbols = validAssets
      .map(asset => asset.ticker.trim().toUpperCase())
      .filter(ticker => !isKnownSymbol(ticker));

    if (unknownSymbols.length > 0) {
      warnings.push({
        type: 'unknown_symbols',
        message: 'Unknown symbols detected',
        details: `Unable to recognize: ${unknownSymbols.join(', ')}`,
        suggestion:
          'These symbols will be excluded from analysis. Check spelling if this is unexpected.',
      });
    }
  }

  // 7. Check for very small weights
  const smallWeights = validAssets.filter(asset => asset.weight < 1);
  if (smallWeights.length > 0) {
    warnings.push({
      type: 'weights_not_100',
      message: 'Very small weights detected',
      details: `${smallWeights.length} asset(s) have weights less than 1%`,
      suggestion:
        'Consider consolidating very small positions for better portfolio management',
    });
  }

  // Create parsed data
  const knownSymbols = validAssets
    .map(asset => asset.ticker.trim().toUpperCase())
    .filter(ticker => isKnownSymbol(ticker));

  const unknownSymbols = validAssets
    .map(asset => asset.ticker.trim().toUpperCase())
    .filter(ticker => !isKnownSymbol(ticker));

  const parsedData: ParsedPortfolioData = {
    assets: validAssets.map(asset => ({
      ticker: asset.ticker.trim().toUpperCase(),
      weight: asset.weight,
      originalWeight: asset.originalWeight,
    })),
    totalWeight,
    knownSymbols,
    unknownSymbols,
  };

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    parsedData,
  };
}

// Helper function to check if a symbol is known
// This will be replaced with API calls in the actual validation function
function isKnownSymbol(ticker: string): boolean {
  // Fallback to basic pattern recognition for immediate validation
  // The actual validation will use the API in validateManualPortfolio
  const basicPatterns = [
    // Common patterns
    /^[A-Z]{1,5}$/, // Basic stock ticker pattern
    /^[A-Z]{3,5}X$/, // Mutual fund pattern (ends with X)
    /^[A-Z]{2,4}$/, // Short tickers
  ];

  return basicPatterns.some(pattern => pattern.test(ticker.toUpperCase()));
}

export function getPortfolioValidationSummary(
  result: ManualPortfolioValidationResult | CSVValidationResult
): {
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
    message: 'Your portfolio is ready for analysis',
    type: 'success',
  };
}
