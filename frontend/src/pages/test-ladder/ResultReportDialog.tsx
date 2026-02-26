import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, processMathContent } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface ResultReportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examSummary: any;
  results: any[];
  currentReportIdx: number;
  setCurrentReportIdx: (idx: number) => void;
}

export const ResultReportDialog: React.FC<ResultReportProps> = ({
  open,
  onOpenChange,
  examSummary,
  results,
  currentReportIdx,
  setCurrentReportIdx
}) => {
  return (
    <Dialog modal={false} open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[1200px] rounded-[3rem] border-none bg-white p-0 shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[920px] z-[100]"
      >
        <DialogHeader className="px-8 py-4 border-b border-slate-100 shrink-0 bg-white">
          <div className="flex justify-between items-center">
            <div className="space-y-0.5 text-left">
              <DialogTitle className="text-xl font-black tracking-tight text-slate-900 uppercase">评估分析报告</DialogTitle>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-indigo-600">Academic Audit</p>
            </div>
            {examSummary && (
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">总分统计</p>
                  <p className="text-lg font-black text-slate-900 tabular-nums">{examSummary.total_score} / {examSummary.max_score}</p>
                </div>
                <div className="h-6 w-px bg-slate-100" />
                <div className="text-right">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ELO 变动</p>
                  <p className={cn("text-lg font-black tabular-nums", examSummary.elo_change >= 0 ? "text-emerald-500" : "text-rose-500")}>
                    {examSummary.elo_change >= 0 ? `+${examSummary.elo_change}` : examSummary.elo_change}
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 pt-2 bg-slate-50/30 scrollbar-thin border-r border-slate-50">
            {results.length > 0 && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                <Card className="border border-slate-100 bg-white rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex gap-3 items-start flex-1 text-left">
                        <span className="text-2xl font-black text-slate-100 tabular-nums leading-none">{(currentReportIdx + 1).toString().padStart(2, '0')}</span>
                        <div className="font-bold text-base text-slate-900 leading-snug">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {processMathContent(results[currentReportIdx].question?.text || "")}
                          </ReactMarkdown>
                        </div>
                      </div>
                      <Badge className={cn("rounded-lg px-2.5 py-0.5 font-bold shadow-sm shrink-0 text-[11px]", results[currentReportIdx].is_correct ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                        {results[currentReportIdx].score} / {results[currentReportIdx].max_score} PTS
                      </Badge>
                    </div>

                    <div className="grid gap-4 pt-4 border-t border-slate-50">
                      <div className="space-y-1 text-left">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">My Response</p>
                        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[13px] font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {results[currentReportIdx].user_answer || "(未作答)"}
                        </div>
                      </div>
                      
                      <div className="space-y-1 text-left">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500 ml-1">AI Feedback</p>
                        <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 text-[14px] font-bold text-emerald-900 leading-relaxed shadow-sm text-left">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {processMathContent(results[currentReportIdx].feedback)}
                          </ReactMarkdown>
                        </div>
                      </div>

                      <div className="space-y-1 text-left">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-500 ml-1">Academic Analysis</p>
                        <div className="p-6 bg-slate-900 rounded-[1.5rem] text-[14px] font-medium text-slate-200 leading-relaxed shadow-xl text-left">
                          <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                              {processMathContent(results[currentReportIdx].analysis || results[currentReportIdx].ai_answer || "")}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>

          <div className="w-64 bg-slate-50/50 p-6 flex flex-col shrink-0">
            <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-left">评估矩阵</h5>
            <ScrollArea className="flex-1 pr-2">
              <div className="grid grid-cols-4 gap-2">
                {results.map((res, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentReportIdx(i)}
                    className={cn(
                      "h-10 w-10 rounded-xl font-bold text-xs transition-all border flex items-center justify-center relative",
                      i === currentReportIdx
                        ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-110 z-10"
                        : res.is_correct
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100"
                    )}
                  >
                    {i + 1}
                    {i === currentReportIdx && <div className="absolute -bottom-1 w-1 h-1 bg-white rounded-full" />}
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="mt-6 space-y-3 pt-4 border-t border-slate-100 text-left">
              <div className="flex justify-between items-center text-[11px] font-bold uppercase tracking-widest text-slate-400">
                <span>得分率</span>
                <span className="text-slate-900">
                  {examSummary ? Math.round((examSummary.total_score / examSummary.max_score) * 100) : 0}%
                </span>
              </div>
              <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${examSummary ? (examSummary.total_score / examSummary.max_score) * 100 : 0}%` }}
                />
              </div>
              <p className="text-[11px] font-medium text-slate-400 leading-tight pt-1">
                点击题号快速切换。绿色代表通过，红色代表挑战。
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
