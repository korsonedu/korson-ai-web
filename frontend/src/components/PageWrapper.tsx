import React from 'react';
import { Sparkles } from 'lucide-react';

export const PageWrapper = ({ children, title, subtitle, action }: any) => (
  <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-black/[0.03] pb-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-black/30 font-bold uppercase tracking-[0.2em] text-[10px]">
          <Sparkles className="h-3 w-3" /> Digital Academy
        </div>
        <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">{title}</h2>
        <p className="text-[#86868B] text-sm font-medium leading-relaxed">
          {subtitle}
        </p>
      </div>
      {action && <div>{action}</div>}
    </header>
    <div className="pt-2">
      {children}
    </div>
  </div>
);
