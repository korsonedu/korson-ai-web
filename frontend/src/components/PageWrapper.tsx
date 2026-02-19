import React from 'react';
import { Sparkles } from 'lucide-react';

export const PageWrapper = ({ children, title, subtitle, action }: any) => (
  <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-8">
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-muted-foreground font-bold uppercase tracking-[0.2em] text-[10px] opacity-40">
          <Sparkles className="h-3 w-3" /> System Catalog
        </div>
        <h2 className="text-4xl font-black tracking-tighter text-foreground">{title}</h2>
        <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
    <div className="pt-2">
      {children}
    </div>
  </div>
);
