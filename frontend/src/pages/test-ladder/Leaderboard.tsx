import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeaderboardProps {
  leaderboard: any[];
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ leaderboard }) => {
  return (
    <div className="space-y-6 pt-6">
      <div className="flex items-center justify-between px-4">
        <div className="space-y-1">
          <h3 className="text-2xl font-black text-slate-900 tracking-tight">全站学术排名</h3>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Global Meritocracy Ranking</p>
        </div>
      </div>
      <Card className="border border-slate-200/50 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-12 py-6 text-[13px] font-bold uppercase tracking-[0.2em] text-slate-400">位次</th>
                <th className="px-12 py-6 text-[13px] font-bold uppercase tracking-[0.2em] text-slate-400">用户信息</th>
                <th className="px-12 py-6 text-[13px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">ELO 评分</th>
                <th className="px-12 py-6 text-[13px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">活跃记录</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leaderboard.map((u, i) => (
                <tr key={u.id} className="group hover:bg-slate-50/50 transition-all duration-300 text-left">
                  <td className="px-12 py-8">
                    {i < 3 ? (
                      <div className={cn("h-9 w-9 rounded-2xl flex items-center justify-center font-black text-xs shadow-sm", i === 0 ? "bg-indigo-600 text-white shadow-indigo-200" : i === 1 ? "bg-slate-200 text-slate-600" : "bg-orange-100 text-orange-600")}>{i + 1}</div>
                    ) : <span className="px-3 text-sm font-black text-slate-200">{i + 1}</span>}
                  </td>
                  <td className="px-12 py-8">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <Avatar className="h-12 w-12 border border-slate-100 shadow-sm group-hover:ring-8 ring-indigo-500/5 transition-all duration-500"><AvatarImage src={u.avatar_url} /><AvatarFallback className="font-bold text-xs">{(u.nickname || u.username)[0]}</AvatarFallback></Avatar>
                        {i === 0 && <div className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-indigo-600 rounded-xl border-4 border-white flex items-center justify-center text-[11px] text-white shadow-sm">🏆</div>}
                      </div>
                      <div className="flex flex-col text-left"><span className="font-bold text-base text-slate-900 tracking-tight">{u.nickname || u.username}</span><span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</span></div>
                    </div>
                  </td>
                  <td className="px-12 py-8 text-center"><span className="inline-flex px-5 py-1.5 rounded-full bg-slate-100 text-sm font-black text-slate-900 tabular-nums">{u.elo_score}</span></td>
                  <td className="px-12 py-8 text-right"><Activity className="h-5 w-5 opacity-5 ml-auto group-hover:opacity-100 group-hover:text-indigo-500 transition-all duration-500" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
