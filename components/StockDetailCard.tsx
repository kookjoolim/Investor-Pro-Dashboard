
import React, { useState, useEffect, useRef } from 'react';
import { AreaChart, Area, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, X, Activity } from 'lucide-react';
import { StockDetail } from '../types';

interface StockDetailCardProps {
  stock: StockDetail;
  onRemove: (symbol: string) => void;
}

const StockDetailCard: React.FC<StockDetailCardProps> = ({ stock, onRemove }) => {
  const isPositive = stock.change >= 0;
  const prevPriceRef = useRef(stock.price);
  const [highlight, setHighlight] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (stock.price > prevPriceRef.current) {
      setHighlight('up');
      const timer = setTimeout(() => setHighlight(null), 1000);
      prevPriceRef.current = stock.price;
      return () => clearTimeout(timer);
    } else if (stock.price < prevPriceRef.current) {
      setHighlight('down');
      const timer = setTimeout(() => setHighlight(null), 1000);
      prevPriceRef.current = stock.price;
      return () => clearTimeout(timer);
    }
  }, [stock.price]);

  return (
    <div className={`relative overflow-hidden bg-slate-800/40 border ${highlight === 'up' ? 'border-emerald-500/50' : highlight === 'down' ? 'border-rose-500/50' : 'border-slate-700/60'} rounded-2xl p-5 group hover:bg-slate-800/60 transition-all duration-500 backdrop-blur-sm`}>
      {/* Background Pulse for price change */}
      <div className={`absolute inset-0 transition-opacity duration-1000 pointer-events-none ${highlight === 'up' ? 'bg-emerald-500/5 opacity-100' : highlight === 'down' ? 'bg-rose-500/5 opacity-100' : 'opacity-0'}`}></div>

      <button 
        onClick={() => onRemove(stock.symbol)}
        className="absolute top-3 right-3 p-1.5 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/50 rounded-lg hover:bg-rose-500/10"
      >
        <X size={14} />
      </button>

      <div className="flex justify-between items-start mb-5 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-xl font-black text-white tracking-tighter">{stock.symbol}</h4>
            {highlight && (
               <span className={`w-1.5 h-1.5 rounded-full ${highlight === 'up' ? 'bg-emerald-500' : 'bg-rose-500'} animate-ping`}></span>
            )}
          </div>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate max-w-[100px]">{stock.name}</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black tracking-tighter transition-colors duration-300 ${highlight === 'up' ? 'text-emerald-400' : highlight === 'down' ? 'text-rose-400' : 'text-white'}`}>
            ${stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className={`text-xs font-black flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isPositive ? <TrendingUp size={12} strokeWidth={3} /> : <TrendingDown size={12} strokeWidth={3} />}
            {stock.change > 0 ? '+' : ''}{stock.change} ({stock.changePercent}%)
          </div>
        </div>
      </div>

      <div className="h-20 w-full mb-5 relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stock.history}>
            <defs>
              <linearGradient id={`gradient-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.2}/>
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis hide domain={['auto', 'auto']} />
            <Tooltip hide />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isPositive ? '#10b981' : '#f43f5e'} 
              fillOpacity={1} 
              fill={`url(#gradient-${stock.symbol})`} 
              strokeWidth={3}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-slate-700/50 pt-4 relative z-10">
        <div className="text-center group/metric">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-1 font-black group-hover/metric:text-indigo-400 transition-colors">PER</p>
          <p className="text-xs font-black text-slate-200">{stock.per}x</p>
        </div>
        <div className="text-center group/metric">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-1 font-black group-hover/metric:text-indigo-400 transition-colors">PBR</p>
          <p className="text-xs font-black text-slate-200">{stock.pbr}x</p>
        </div>
        <div className="text-center group/metric">
          <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500 mb-1 font-black group-hover/metric:text-indigo-400 transition-colors">DY</p>
          <p className="text-xs font-black text-slate-200">{stock.dividendYield}%</p>
        </div>
      </div>
    </div>
  );
};

export default StockDetailCard;
