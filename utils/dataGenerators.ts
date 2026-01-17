
import { DataPoint, MacroDataPoint, StockDetail } from '../types';
import { format, subDays, subMonths } from 'date-fns';

export const calculateSMAs = (data: DataPoint[]): DataPoint[] => {
  const periods = [20, 60, 120];
  let processed = [...data];

  periods.forEach(period => {
    processed = processed.map((item, index) => {
      if (index < period - 1) return { ...item, [`sma${period}`]: null };
      const slice = processed.slice(index - period + 1, index + 1);
      const sum = slice.reduce((acc, curr) => acc + curr.value, 0);
      return { ...item, [`sma${period}`]: sum / period };
    });
  });

  return processed;
};

export const generateStockData = (baseValue: number, volatility: number, days: number = 250): DataPoint[] => {
  let current = baseValue;
  const data: DataPoint[] = [];
  
  for (let i = days + 120; i >= 0; i--) {
    const change = (Math.random() - 0.5) * volatility;
    current += change;
    data.push({
      date: format(subDays(new Date(), i), 'yyyy-MM-dd'),
      value: parseFloat(current.toFixed(2)),
    });
  }

  return calculateSMAs(data).slice(120); 
};

export const generateTreasuryData = (): MacroDataPoint[] => {
  const data: MacroDataPoint[] = [];
  let current = 4.231; 
  for (let i = 120; i >= 0; i--) {
    data.push({ 
      date: format(subMonths(new Date(), i), 'yyyy-MM-dd'), 
      value: parseFloat((current + (Math.random() - 0.5) * 0.5).toFixed(2)) 
    });
  }
  return data;
};

export const generateM2Data = (): MacroDataPoint[] => {
  const data: MacroDataPoint[] = [];
  // Simulate monthly changes in billions (usually positive, sometimes negative)
  for (let i = 120; i >= 0; i--) {
    const monthlyChange = (Math.random() * 80) - 20; // Range: -20B to +60B
    data.push({ 
      date: format(subMonths(new Date(), i), 'yyyy-MM-dd'), 
      value: parseFloat(monthlyChange.toFixed(2)) 
    });
  }
  return data;
};

export const generateStockDetail = (symbol: string): StockDetail => {
  const isTech = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'GOOGL'].includes(symbol.toUpperCase());
  const priceMap: Record<string, number> = {
    'AAPL': 230, 'NVDA': 145, 'TSLA': 350, 'MSFT': 420, 'GOOGL': 180
  };
  const basePrice = priceMap[symbol.toUpperCase()] || (isTech ? Math.random() * 500 + 100 : Math.random() * 150 + 30);
  
  const history: { date: string; value: number }[] = [];
  let current = basePrice * 0.95;
  
  for (let i = 30; i >= 0; i--) {
    current += (Math.random() - 0.5) * (basePrice * 0.02);
    if (i === 0) current = basePrice;
    history.push({
      date: format(subDays(new Date(), i), 'MM-dd'),
      value: parseFloat(current.toFixed(2))
    });
  }

  const latestPrice = history[history.length - 1].value;
  const prevPrice = history[0].value;
  const change = latestPrice - prevPrice;

  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase() + " Corp",
    price: latestPrice,
    change: parseFloat(change.toFixed(2)),
    changePercent: parseFloat(((change / prevPrice) * 100).toFixed(2)),
    per: isTech ? parseFloat((Math.random() * 30 + 30).toFixed(2)) : parseFloat((Math.random() * 15 + 10).toFixed(2)),
    pbr: isTech ? parseFloat((Math.random() * 15 + 10).toFixed(2)) : parseFloat((Math.random() * 3 + 1).toFixed(2)),
    dividendYield: isTech ? parseFloat((Math.random() * 1.0).toFixed(2)) : parseFloat((Math.random() * 4 + 1).toFixed(2)),
    history
  };
};
