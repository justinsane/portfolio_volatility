// Compact ETF info
export interface BasicETFInfo {
  name: string;
  category: string;
}

// Minimal curated set. Expand over time or generate at build-time.
const ETF_MAP: Record<string, BasicETFInfo> = {
  SPY: { name: 'SPDR S&P 500 ETF Trust', category: 'Large Cap' },
  VOO: { name: 'Vanguard S&P 500 ETF', category: 'Large Cap' },
  VTI: { name: 'Vanguard Total Stock Market ETF', category: 'Large Cap' },
  QQQ: { name: 'Invesco QQQ Trust', category: 'Technology' },
  IWM: { name: 'iShares Russell 2000 ETF', category: 'Small Cap' },
  EFA: { name: 'iShares MSCI EAFE ETF', category: 'International' },
  EEM: {
    name: 'iShares MSCI Emerging Markets ETF',
    category: 'Emerging Markets',
  },
  BND: { name: 'Vanguard Total Bond Market ETF', category: 'Bond' },
  AGG: { name: 'iShares Core U.S. Aggregate Bond ETF', category: 'Bond' },
  GLD: { name: 'SPDR Gold Shares', category: 'Commodity' },
  VNQ: { name: 'Vanguard Real Estate ETF', category: 'Real Estate' },
  VEA: {
    name: 'Vanguard FTSE Developed Markets ETF',
    category: 'International',
  },
  VWO: {
    name: 'Vanguard FTSE Emerging Markets ETF',
    category: 'Emerging Markets',
  },
  VXUS: {
    name: 'Vanguard Total International Stock ETF',
    category: 'International',
  },
  IVV: { name: 'iShares Core S&P 500 ETF', category: 'Large Cap' },
  TLT: { name: 'iShares 20+ Year Treasury Bond ETF', category: 'Bond' },
  ARKK: { name: 'ARK Innovation ETF', category: 'Technology' },
  SOXX: { name: 'iShares PHLX Semiconductor ETF', category: 'Technology' },
  LQD: {
    name: 'iShares iBoxx $ Investment Grade Corporate Bond ETF',
    category: 'Bond',
  },
  HYG: {
    name: 'iShares iBoxx $ High Yield Corporate Bond ETF',
    category: 'Bond',
  },
  MUB: { name: 'iShares National Muni Bond ETF', category: 'Bond' },
  USO: { name: 'United States Oil Fund LP', category: 'Commodity' },
  UNG: { name: 'United States Natural Gas Fund LP', category: 'Commodity' },
  XLE: { name: 'Energy Select Sector SPDR Fund', category: 'Sector' },
  XLF: { name: 'Financial Select Sector SPDR Fund', category: 'Sector' },
  XLV: { name: 'Health Care Select Sector SPDR Fund', category: 'Sector' },
  XLK: { name: 'Technology Select Sector SPDR Fund', category: 'Sector' },
  XLY: {
    name: 'Consumer Discretionary Select Sector SPDR Fund',
    category: 'Sector',
  },
  XLP: { name: 'Consumer Staples Select Sector SPDR Fund', category: 'Sector' },
  XLI: { name: 'Industrial Select Sector SPDR Fund', category: 'Sector' },
  XLB: { name: 'Materials Select Sector SPDR Fund', category: 'Sector' },
  XLU: { name: 'Utilities Select Sector SPDR Fund', category: 'Sector' },
  XLRE: { name: 'Real Estate Select Sector SPDR Fund', category: 'Sector' },
};

export function getETFInfo(ticker: string): BasicETFInfo | undefined {
  return ETF_MAP[ticker.toUpperCase()];
}

export function getETFName(ticker: string): string | undefined {
  return getETFInfo(ticker)?.name;
}

export function getETFCategory(ticker: string): string | undefined {
  return getETFInfo(ticker)?.category;
}

export function hasETF(ticker: string): boolean {
  return Boolean(getETFInfo(ticker));
}

export const ETFS = Object.freeze({ ...ETF_MAP });

// Expanded mapping with descriptions for richer contexts (optional use)
export interface RichETFInfo {
  ticker: string;
  name: string;
  category: string;
  description: string;
}

export const ETF_MAPPING: Record<string, RichETFInfo> = {
  // Vanguard ETFs
  VOO: {
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    category: 'Large Cap',
    description: 'Tracks the S&P 500 Index',
  },
  VO: {
    ticker: 'VO',
    name: 'Vanguard Mid-Cap ETF',
    category: 'Mid Cap',
    description: 'Tracks the CRSP US Mid Cap Index',
  },
  VB: {
    ticker: 'VB',
    name: 'Vanguard Small-Cap ETF',
    category: 'Small Cap',
    description: 'Tracks the CRSP US Small Cap Index',
  },
  VBR: {
    ticker: 'VBR',
    name: 'Vanguard Small-Cap Value ETF',
    category: 'Small Cap Value',
    description: 'Tracks the CRSP US Small Cap Value Index',
  },
  VNQ: {
    ticker: 'VNQ',
    name: 'Vanguard Real Estate ETF',
    category: 'Real Estate',
    description: 'Tracks the MSCI US REIT Index',
  },
  VEA: {
    ticker: 'VEA',
    name: 'Vanguard FTSE Developed Markets ETF',
    category: 'International',
    description: 'Tracks the FTSE Developed All Cap ex US Index',
  },
  VWO: {
    ticker: 'VWO',
    name: 'Vanguard FTSE Emerging Markets ETF',
    category: 'Emerging Markets',
    description: 'Tracks the FTSE Emerging Markets All Cap China A Index',
  },
  VSS: {
    ticker: 'VSS',
    name: 'Vanguard FTSE All-World ex-US Small-Cap ETF',
    category: 'International Small Cap',
    description: 'Tracks the FTSE Global Small Cap ex US Index',
  },
  VNQI: {
    ticker: 'VNQI',
    name: 'Vanguard Global ex-US Real Estate ETF',
    category: 'International Real Estate',
    description: 'Tracks the S&P Global ex-US Property Index',
  },
  VTI: {
    ticker: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    category: 'Total Market',
    description: 'Tracks the CRSP US Total Market Index',
  },
  VXUS: {
    ticker: 'VXUS',
    name: 'Vanguard Total International Stock ETF',
    category: 'International',
    description: 'Tracks the FTSE Global All Cap ex US Index',
  },
  BND: {
    ticker: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    category: 'Bond',
    description: 'Tracks the Bloomberg US Aggregate Float Adjusted Index',
  },
  VGK: {
    ticker: 'VGK',
    name: 'Vanguard FTSE Europe ETF',
    category: 'International',
    description: 'Tracks the FTSE Developed Europe Index',
  },
  VPL: {
    ticker: 'VPL',
    name: 'Vanguard FTSE Pacific ETF',
    category: 'International',
    description: 'Tracks the FTSE Developed Asia Pacific Index',
  },

  // iShares ETFs
  IVV: {
    ticker: 'IVV',
    name: 'iShares Core S&P 500 ETF',
    category: 'Large Cap',
    description: 'Tracks the S&P 500 Index',
  },
  IJR: {
    ticker: 'IJR',
    name: 'iShares Core S&P Small-Cap ETF',
    category: 'Small Cap',
    description: 'Tracks the S&P SmallCap 600 Index',
  },
  IEFA: {
    ticker: 'IEFA',
    name: 'iShares Core MSCI EAFE ETF',
    category: 'International',
    description: 'Tracks the MSCI EAFE Index',
  },
  IEMG: {
    ticker: 'IEMG',
    name: 'iShares Core MSCI Emerging Markets ETF',
    category: 'Emerging Markets',
    description: 'Tracks the MSCI Emerging Markets Investable Market Index',
  },
  AGG: {
    ticker: 'AGG',
    name: 'iShares Core U.S. Aggregate Bond ETF',
    category: 'Bond',
    description: 'Tracks the Bloomberg U.S. Aggregate Bond Index',
  },
  TLT: {
    ticker: 'TLT',
    name: 'iShares 20+ Year Treasury Bond ETF',
    category: 'Bond',
    description: 'Tracks the ICE U.S. Treasury 20+ Year Bond Index',
  },
  IWM: {
    ticker: 'IWM',
    name: 'iShares Russell 2000 ETF',
    category: 'Small Cap',
    description: 'Tracks the Russell 2000 Index',
  },
  EFA: {
    ticker: 'EFA',
    name: 'iShares MSCI EAFE ETF',
    category: 'International',
    description: 'Tracks the MSCI EAFE Index',
  },
  EEM: {
    ticker: 'EEM',
    name: 'iShares MSCI Emerging Markets ETF',
    category: 'Emerging Markets',
    description: 'Tracks the MSCI Emerging Markets Index',
  },

  // SPDR ETFs
  SPY: {
    ticker: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    category: 'Large Cap',
    description: 'Tracks the S&P 500 Index',
  },
  QQQ: {
    ticker: 'QQQ',
    name: 'Invesco QQQ Trust',
    category: 'Technology',
    description: 'Tracks the NASDAQ-100 Index',
  },
  GLD: {
    ticker: 'GLD',
    name: 'SPDR Gold Shares',
    category: 'Commodity',
    description: 'Tracks the price of gold bullion',
  },
  SLV: {
    ticker: 'SLV',
    name: 'iShares Silver Trust',
    category: 'Commodity',
    description: 'Tracks the price of silver',
  },
  XLE: {
    ticker: 'XLE',
    name: 'Energy Select Sector SPDR Fund',
    category: 'Sector',
    description: 'Tracks the Energy Select Sector Index',
  },
  XLF: {
    ticker: 'XLF',
    name: 'Financial Select Sector SPDR Fund',
    category: 'Sector',
    description: 'Tracks the Financial Select Sector Index',
  },
  XLV: {
    ticker: 'XLV',
    name: 'Health Care Select Sector SPDR Fund',
    category: 'Sector',
    description: 'Tracks the Health Care Select Sector Index',
  },
  XLK: {
    ticker: 'XLK',
    name: 'Technology Select Sector SPDR Fund',
    category: 'Sector',
    description: 'Tracks the Technology Select Sector Index',
  },

  // Schwab ETFs
  SCHB: {
    ticker: 'SCHB',
    name: 'Schwab U.S. Broad Market ETF',
    category: 'Total Market',
    description: 'Tracks the Dow Jones U.S. Broad Stock Market Index',
  },
  SCHF: {
    ticker: 'SCHF',
    name: 'Schwab International Equity ETF',
    category: 'International',
    description: 'Tracks the FTSE Developed ex US Index',
  },
  SCHE: {
    ticker: 'SCHE',
    name: 'Schwab Emerging Markets Equity ETF',
    category: 'Emerging Markets',
    description: 'Tracks the FTSE Emerging Index',
  },
  SCHZ: {
    ticker: 'SCHZ',
    name: 'Schwab U.S. Aggregate Bond ETF',
    category: 'Bond',
    description: 'Tracks the Bloomberg U.S. Aggregate Bond Index',
  },

  // Popular Tech ETFs
  ARKK: {
    ticker: 'ARKK',
    name: 'ARK Innovation ETF',
    category: 'Technology',
    description: 'Actively managed fund focused on disruptive innovation',
  },
  SOXX: {
    ticker: 'SOXX',
    name: 'iShares PHLX Semiconductor ETF',
    category: 'Technology',
    description: 'Tracks the PHLX Semiconductor Sector Index',
  },

  // Popular Bond ETFs
  LQD: {
    ticker: 'LQD',
    name: 'iShares iBoxx $ Investment Grade Corporate Bond ETF',
    category: 'Bond',
    description: 'Tracks the Markit iBoxx USD Liquid Investment Grade Index',
  },
  HYG: {
    ticker: 'HYG',
    name: 'iShares iBoxx $ High Yield Corporate Bond ETF',
    category: 'Bond',
    description: 'Tracks the Markit iBoxx USD Liquid High Yield Index',
  },
  MUB: {
    ticker: 'MUB',
    name: 'iShares National Muni Bond ETF',
    category: 'Bond',
    description: 'Tracks the S&P National AMT-Free Municipal Bond Index',
  },

  // Popular International ETFs
  FNDE: {
    ticker: 'FNDE',
    name: 'Schwab Fundamental Emerging Markets Large Company Index ETF',
    category: 'Emerging Markets',
    description:
      'Tracks the Russell Fundamental Emerging Markets Large Company Index',
  },
  FNDF: {
    ticker: 'FNDF',
    name: 'Schwab Fundamental International Large Company Index ETF',
    category: 'International',
    description:
      'Tracks the Russell Fundamental Developed ex US Large Company Index',
  },

  // Popular Commodity ETFs
  USO: {
    ticker: 'USO',
    name: 'United States Oil Fund LP',
    category: 'Commodity',
    description:
      'Tracks the price of West Texas Intermediate light sweet crude oil',
  },
  UNG: {
    ticker: 'UNG',
    name: 'United States Natural Gas Fund LP',
    category: 'Commodity',
    description: 'Tracks the price of natural gas',
  },

  // Popular Sector ETFs
  XLY: {
    ticker: 'XLY',
    name: 'Consumer Discretionary Select Sector SPDR Fund',
    category: 'Sector',
    description: 'Tracks the Consumer Discretionary Select Sector Index',
  },
  XLP: {
    ticker: 'XLP',
    name: 'Consumer Staples Select Sector SPDR Fund',
    category: 'Sector',
    description: 'Tracks the Consumer Staples Select Sector Index',
  },
  XLI: {
    ticker: 'XLI',
    name: 'Industrial Select Sector SPDR Fund',
    category: 'Sector',
    description: 'Tracks the Industrial Select Sector Index',
  },
  XLB: {
    ticker: 'XLB',
    name: 'Materials Select Sector SPDR Fund',
    category: 'Sector',
    description: 'Tracks the Materials Select Sector Index',
  },
  XLU: {
    ticker: 'XLU',
    name: 'Utilities Select Sector SPDR Fund',
    category: 'Sector',
    description: 'Tracks the Utilities Select Sector Index',
  },
  XLRE: {
    ticker: 'XLRE',
    name: 'Real Estate Select Sector SPDR Fund',
    category: 'Sector',
    description: 'Tracks the Real Estate Select Sector Index',
  },
};

export function getRichETFInfo(ticker: string): RichETFInfo | null {
  const upperTicker = ticker.toUpperCase();
  return ETF_MAPPING[upperTicker] || null;
}
