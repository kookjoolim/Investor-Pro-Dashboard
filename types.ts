
export interface DataPoint {
  date: string;
  value: number;
  sma20?: number | null;
  sma60?: number | null;
  sma120?: number | null;
}

export interface MacroDataPoint {
  date: string;
  value: number;
}

export interface StockDetail {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  per: number;
  pbr: number;
  dividendYield: number;
  history: { date: string; value: number }[];
}

export type TimeRange = '1Y' | '5Y' | '10Y';

export interface MarketState {
  sp500: DataPoint[];
  nasdaq: DataPoint[];
  treasury10Y: MacroDataPoint[];
  m2Supply: MacroDataPoint[];
  watchlist: StockDetail[];
  loading: boolean;
}
