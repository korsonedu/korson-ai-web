import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, Award, Zap, BrainCircuit, Calendar, ChevronRight } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';

export const WeeklyReportDialog: React.FC = () => {
  const { user } = useAuthStore();
  const [report, setReport] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user?.is_member) return;

    // 获取当前 ISO 周数 (用于标识本周)
    const getWeekNumber = (d: Date) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };

    const now = new Date();
    const currentWeekKey = `seen_report_${now.getFullYear()}_W${getWeekNumber(now)}`;
    const hasSeenThisWeek = localStorage.getItem(currentWeekKey);

    if (!hasSeenThisWeek) {
      fetchReport();
    }

    // 监听手动触发事件
    const handleManualOpen = () => fetchReport(true);
    window.addEventListener('open-weekly-report', handleManualOpen);
    return () => window.removeEventListener('open-weekly-report', handleManualOpen);
  }, [user]);

  const fetchReport = async (manual = false) => {
    try {
      const res = await api.get('/users/me/weekly-report/');
      if (manual || res.data.week_reviews > 0 || res.data.permanent_count > 0) {
        setReport(res.data);
        setIsOpen(true);
      }
    } catch (e) {}
  };

  const handleClose = () => {
    setIsOpen(false);
    const now = new Date();
    // 再次计算 key 确保准确
    const getWeekNumber = (d: Date) => {
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    };
    const currentWeekKey = `seen_report_${now.getFullYear()}_W${getWeekNumber(now)}`;
    localStorage.setItem(currentWeekKey, 'true');
  };

  if (!report) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-0 border-none bg-white shadow-2xl overflow-hidden">
        <div className="bg-slate-900 p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -mr-20 -mt-20" />
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-indigo-500 hover:bg-indigo-600 border-none text-[10px] font-black uppercase tracking-widest">Cognitive Assets</Badge>
              <div className="h-1 w-1 rounded-full bg-white/20" />
              <span className="text-[10px] font-bold opacity-40 uppercase tracking-widest">Last Week: {report.report_date}</span>
            </div>
            <h2 className="text-3xl font-black tracking-tight leading-tight">认知资产周报<br /><span className="text-indigo-400">{report.user_nickname}</span></h2>
          </div>
        </div>

        <div className="p-10 space-y-8 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white rounded-[2rem] border border-black/[0.03] shadow-sm space-y-3">
              <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><TrendingUp className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">资产转化率</p>
                <p className="text-2xl font-black text-slate-900">{report.conversion_rate}%</p>
              </div>
            </div>
            <div className="p-6 bg-white rounded-[2rem] border border-black/[0.03] shadow-sm space-y-3">
              <div className="h-8 w-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Award className="w-4 h-4" /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ELO 战胜率</p>
                <p className="text-2xl font-black text-slate-900">{report.elo_percentile}%</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Weekly Insight</h4>
              <BrainCircuit className="w-3.5 h-3.5 text-slate-200" />
            </div>
            <div className="p-8 bg-white rounded-[2.5rem] border border-black/[0.03] shadow-inner space-y-6">
              <div className="flex items-start gap-5">
                <div className="h-10 w-10 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200/20"><Zap className="w-5 h-5 text-indigo-400 fill-indigo-400" /></div>
                <p className="text-sm font-bold text-slate-700 leading-relaxed pt-1">
                  上周你将 <span className="text-indigo-600">{report.permanent_count}</span> 道题目从短期记忆转化为了“永久资产”，复习密度已超过系统内 <span className="text-emerald-600">{report.elo_percentile}%</span> 的学员。
                </p>
              </div>
              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Current ELO</span>
                  <span className="text-lg font-black text-slate-900 tabular-nums">{report.current_elo}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Reviews</span>
                  <span className="text-lg font-black text-slate-900 tabular-nums">{report.week_reviews}</span>
                </div>
              </div>
            </div>
          </div>

          <Button onClick={handleClose} className="w-full h-14 rounded-2xl bg-slate-900 text-white font-black shadow-xl hover:bg-slate-800 transition-all active:scale-95 uppercase tracking-widest text-xs">
            开启新一周征程 <ChevronRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
