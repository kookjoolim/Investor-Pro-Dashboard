
import React from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: string;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children, height = "h-[300px]" }) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 shadow-lg backdrop-blur-sm hover:border-indigo-500/50 transition-colors h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-100">{title}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className={`${height} w-full flex-grow`}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
