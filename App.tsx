
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { TrendingUp, Activity, Landmark, DollarSign, BrainCircuit, RefreshCw, Search, Plus, Info } from 'lucide-react';
import { subYears, isAfter, parseISO, isValid } from 'date-fns';
import { MarketState, TimeRange } from './types';
import { generateStockData, generateTreasuryData, generateM2Data, generateStockDetail } from './utils/dataGenerators';
import { getMarketAnalysis } from './services/geminiService';
import { fetchFredSp500, fetchFredNasdaq, fetchFredTreasury10Y, fetchFredM2 } from './services/fredService';
import ChartCard from './components/ChartCard';
import StockDetailCard from './components/StockDetailCard';

const App: React.FC = () => {
  const [market, setMarket] = useState<MarketState>({
    sp500: [],
    nasdaq: [],
    treasury10Y: [],
    m2Supply: [],
    watchlist: [],
    loading: true,
  });

  const [ranges, setRanges] = useState<Record<string, TimeRange>>({
    sp500: '1Y',
    nasdaq: '1Y',
    treasury: '5Y',
    m2: '10Y'
  });

  const [searchSymbol, setSearchSymbol] = useState('');
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dataSources, setDataSources] = useState({ sp500: false, nasdaq: false, treasury10Y: false, m2Supply: false });

  const refreshData = async () => {
    setIsAnalyzing(false);
    
    const [realSp500, realNasdaq, realTreasury, realM2] = await Promise.all([
      fetchFredSp500(),
      fetchFredNasdaq(),
      fetchFredTreasury10Y(),
      fetchFredM2()
    ]);
    
    setMarket(prev => ({
      ...prev,
      sp500: realSp500 || generateStockData(5920, 45, 2600),
      nasdaq: realNasdaq || generateStockData(19150, 180, 2600),
      treasury10Y: realTreasury || generateTreasuryData(),
      m2Supply: realM2 || generateM2Data(),
      watchlist: prev.watchlist.length > 0 ? prev.watchlist.map(s => generateStockDetail(s.symbol)) : [
        generateStockDetail('AAPL'),
        generateStockDetail('NVDA'),
        generateStockDetail('TSLA')
      ],
      loading: false,
    }));

    setDataSources({
      sp500: !!realSp500,
      nasdaq: !!realNasdaq,
      treasury10Y: !!realTreasury,
      m2Supply: !!realM2
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const filterByRange = <T extends { date: string }>(data: T[], range: TimeRange): T[] => {
    if (!data.length) return [];
    const now = new Date();
    const yearsToSub = range === '1Y' ? 1 : range === '5Y' ? 5 : 10;
    const startDate = subYears(now, yearsToSub);
    
    return data.filter(item => {
      const date = parseISO(item.date);
      if (!isValid(date)) return true;
      return isAfter(date, startDate);
    });
  };

  const filteredData = useMemo(() => ({
    sp500: filterByRange(market.sp500, ranges.sp500),
    nasdaq: filterByRange(market.nasdaq, ranges.nasdaq),
    treasury: filterByRange(market.treasury10Y, ranges.treasury),
    m2: filterByRange(market.m2Supply, ranges.m2)
  }), [market, ranges]);

  const RangeSelector = ({ current, onSelect }: { current: TimeRange, onSelect: (r: TimeRange) => void }) => (
    <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-inner">
      {(['1Y', '5Y', '10Y'] as TimeRange[]).map((r) => (
        <button
          key={r}
          onClick={() => onSelect(r)}
          className={`px-3 py-1 rounded-lg text-[10px] font-black transition-all duration-200 ${
            current === r 
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchSymbol.trim()) return;
    const symbol = searchSymbol.toUpperCase();
    if (market.watchlist.some(s => s.symbol === symbol)) {
      setSearchSymbol('');
      return;
    }
    const newStock = generateStockDetail(symbol);
    setMarket(prev => ({
      ...prev,
      watchlist: [newStock, ...prev.watchlist]
    }));
    setSearchSymbol('');
  };

  const handleRemoveStock = (symbol: string) => {
    setMarket(prev => ({
      ...prev,
      watchlist: prev.watchlist.filter(s => s.symbol !== symbol)
    }));
  };

  const runAnalysis = async () => {
    if (market.loading) return;
    setIsAnalyzing(true);
    const watchlistContext = market.watchlist.map(s => `${s.symbol} ($${s.price})`).join(', ');
    const spVal = market.sp500[market.sp500.length - 1]?.value;
    const nsVal = market.nasdaq[market.nasdaq.length - 1]?.value;
    const trVal = market.treasury10Y[market.treasury10Y.length - 1]?.value;
    const m2Val = market.m2Supply[market.m2Supply.length - 1]?.value;
    const macroContext = `S&P500:${spVal}, NASDAQ:${nsVal}, 10Y Yield: ${trVal}%, M2 Change: $${m2Val}B.`;
    const fullContext = `${macroContext} Watchlist: ${watchlistContext}.`;
    const analysis = await getMarketAnalysis(fullContext);
    setAiAnalysis(analysis || "분석 결과를 가져올 수 없습니다.");
    setIsAnalyzing(false);
  };

  const formatXAxis = (tickItem: string, range: TimeRange) => {
    if (!tickItem) return '';
    if (range === '1Y') {
      const parts = tickItem.split('-');
      return parts.length >= 2 ? `${parts[1]}/${parts[2] || ''}` : tickItem;
    }
    return tickItem.split('-')[0];
  };

  if (market.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="flex flex-col items-center">
          <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-300 font-medium tracking-tight">FRED Real-time Market Data Loading...</p>
        </div>
      </div>
    );
  }

  const allReal = dataSources.sp500 && dataSources.nasdaq && dataSources.treasury10Y && dataSources.m2Supply;

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`flex h-2 w-2 rounded-full ${allReal ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${allReal ? 'text-emerald-500' : 'text-amber-500'}`}>
              {allReal ? 'Full FRED Live Data Active' : 'Partial Live / Simulation Active'}
            </span>
          </div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-white via-indigo-200 to-indigo-400 leading-tight">
            Investor Pro Dashboard
          </h1>
          <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
            <span className="p-1 bg-indigo-500/20 rounded-md">
              <Info size={14} className="text-indigo-400" />
            </span>
            <p>FRED(연준) 공식 실시간 데이터를 기반으로 거시 경제 추세 분석</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
          <form onSubmit={handleAddStock} className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input 
              type="text"
              placeholder="Ticker 추가 (예: NVDA)"
              value={searchSymbol}
              onChange={(e) => setSearchSymbol(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all w-full md:w-64 backdrop-blur-sm"
            />
          </form>
          <button 
            onClick={refreshData}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <RefreshCw className="w-4 h-4" />
            데이터 동기화
          </button>
        </div>
      </header>

      {/* Watchlist */}
      <section className="space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold text-slate-100">관심 종목 실시간 시황</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {market.watchlist.map(stock => (
            <StockDetailCard key={stock.symbol} stock={stock} onRemove={handleRemoveStock} />
          ))}
        </div>
      </section>

      {/* Macro Indicators */}
      <div className="grid grid-cols-1 gap-8 pt-4">
        {/* S&P 500 */}
        <div className="relative group">
          <div className="absolute top-6 right-6 z-20">
            <RangeSelector current={ranges.sp500} onSelect={(r) => setRanges(p => ({...p, sp500: r}))} />
          </div>
          <ChartCard 
            title={`S&P 500 Index (${ranges.sp500})`} 
            subtitle="이동평균선: 20일(분홍), 60일(노랑), 120일(보라)"
            height="h-[450px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData.sp500} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  minTickGap={100}
                  dy={10}
                  tickFormatter={(val) => formatXAxis(val, ranges.sp500)}
                />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                   itemStyle={{ fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} name="현재가" />
                <Line type="monotone" dataKey="sma20" stroke="#f472b6" strokeWidth={1} dot={false} name="20일 이평" />
                <Line type="monotone" dataKey="sma60" stroke="#fcd34d" strokeWidth={1} dot={false} name="60일 이평" />
                <Line type="monotone" dataKey="sma120" stroke="#a78bfa" strokeWidth={1} dot={false} name="120일 이평" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* NASDAQ */}
        <div className="relative group">
          <div className="absolute top-6 right-6 z-20">
            <RangeSelector current={ranges.nasdaq} onSelect={(r) => setRanges(p => ({...p, nasdaq: r}))} />
          </div>
          <ChartCard 
            title={`NASDAQ Composite (${ranges.nasdaq})`} 
            subtitle="이동평균선: 20일(분홍), 60일(노랑), 120일(보라)"
            height="h-[450px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={filteredData.nasdaq} margin={{ bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  minTickGap={100}
                  dy={10}
                  tickFormatter={(val) => formatXAxis(val, ranges.nasdaq)}
                />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={11} axisLine={false} tickLine={false} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                   itemStyle={{ fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="value" stroke="#2dd4bf" strokeWidth={2} dot={false} name="현재가" />
                <Line type="monotone" dataKey="sma20" stroke="#f472b6" strokeWidth={1} dot={false} name="20일 이평" />
                <Line type="monotone" dataKey="sma60" stroke="#fcd34d" strokeWidth={1} dot={false} name="60일 이평" />
                <Line type="monotone" dataKey="sma120" stroke="#a78bfa" strokeWidth={1} dot={false} name="120일 이평" />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Treasury Yield */}
        <div className="relative group">
          <div className="absolute top-6 right-6 z-20">
            <RangeSelector current={ranges.treasury} onSelect={(r) => setRanges(p => ({...p, treasury: r}))} />
          </div>
          <ChartCard 
            title={`US 10-Year Treasury Yield (${ranges.treasury})`} 
            subtitle="거시 경제의 벤치마크: 장기 국채 수익률 추이 (%)"
            height="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData.treasury} margin={{ bottom: 20 }}>
                <defs>
                  <linearGradient id="colorYield" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  minTickGap={100}
                  dy={10}
                  tickFormatter={(val) => formatXAxis(val, ranges.treasury)}
                />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={10} unit="%" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="value" stroke="#f43f5e" fillOpacity={1} fill="url(#colorYield)" name="10Y Yield" strokeWidth={3} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* M2 Money Supply Change */}
        <div className="relative group">
          <div className="absolute top-6 right-6 z-20">
            <RangeSelector current={ranges.m2} onSelect={(r) => setRanges(p => ({...p, m2: r}))} />
          </div>
          <ChartCard 
            title={`M2 Money Supply (Monthly Change, ${ranges.m2})`} 
            subtitle="시장 유동성의 변동량: M2 통화 공급량 월간 증감액 ($Billions)"
            height="h-[400px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredData.m2} margin={{ bottom: 20 }}>
                <defs>
                  <linearGradient id="colorM2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  minTickGap={100}
                  dy={10}
                  tickFormatter={(val) => formatXAxis(val, ranges.m2)}
                />
                <YAxis domain={['auto', 'auto']} stroke="#64748b" fontSize={10} unit="B" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                  formatter={(value) => [`$${value}B`, "Change"]}
                />
                <Area type="monotone" dataKey="value" stroke="#f59e0b" fillOpacity={1} fill="url(#colorM2)" name="M2 Change" strokeWidth={3} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>

      {/* Gemini AI Intelligence Hub */}
      <section className="bg-slate-800/30 border border-slate-700/50 rounded-3xl p-8 relative overflow-hidden backdrop-blur-xl">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">AI 시장 지능 (Gemini)</h2>
              <p className="text-slate-400 text-sm font-medium">FRED 거시 지표 기반 포트폴리오 정밀 분석</p>
            </div>
          </div>
          
          <div className="min-h-[160px] flex flex-col justify-between">
            {!aiAnalysis && !isAnalyzing ? (
              <div className="flex flex-col items-center py-8 text-center">
                <p className="text-slate-400 mb-6 max-w-md">FRED 공식 데이터와 사용자 관심 종목을 결합하여 최적의 투자 전략을 분석합니다.</p>
                <button 
                  onClick={runAnalysis}
                  className="px-10 py-3.5 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl active:scale-95"
                >
                  AI 리포트 생성
                </button>
              </div>
            ) : isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-12">
                <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
                <span className="text-indigo-300 font-bold animate-pulse text-lg tracking-tight">시장 지표 종합 분석 중...</span>
              </div>
            ) : (
              <div className="bg-slate-900/60 rounded-2xl p-6 border border-white/5 backdrop-blur-sm">
                <div className="prose prose-invert max-w-none whitespace-pre-line text-slate-200 text-lg leading-relaxed font-medium">
                  {aiAnalysis}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default App;
