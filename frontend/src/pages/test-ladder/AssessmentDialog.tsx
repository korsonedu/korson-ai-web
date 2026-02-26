import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronLeft, ChevronRight, CheckCircle2, Star, Loader2 } from 'lucide-react';
import { cn, processMathContent } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface AssessmentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questions: any[];
  currentIdx: number;
  setCurrentIdx: (idx: number) => void;
  answers: any;
  handleSelect: (id: number, val: any) => void;
  toggleMastered: (id: number) => void;
  toggleFavorite: (id: number) => void;
  handleSubmit: () => void;
  isSubmitting: boolean;
  gradingMessage: string;
}

export const AssessmentDialog: React.FC<AssessmentProps> = ({
  open,
  onOpenChange,
  questions,
  currentIdx,
  setCurrentIdx,
  answers,
  handleSelect,
  toggleMastered,
  toggleFavorite,
  handleSubmit,
  isSubmitting,
  gradingMessage
}) => {
  const currentQ = questions[currentIdx];

  return (
    <Dialog modal={false} open={open} onOpenChange={(open) => { if (!open && !isSubmitting) onOpenChange(false); }}>
      <DialogContent
        onInteractOutside={(e) => e.preventDefault()}
        className="sm:max-w-[1200px] rounded-[3rem] border-none bg-white p-0 shadow-2xl overflow-hidden flex flex-col h-[800px] z-[100]"
      >
        {questions.length > 0 && currentQ && (
          <>
            <DialogHeader className="p-10 pb-6 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex justify-between items-center">
                <div className="space-y-1.5 text-left">
                  <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 uppercase">学术能力评估</DialogTitle>
                  <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-indigo-600 animate-pulse">Smart Evaluation Active</p>
                </div>
                <div className="px-6 py-2 bg-slate-900 rounded-2xl text-white font-mono font-bold text-sm tabular-nums shadow-xl">
                  {currentIdx + 1} / {questions.length}
                </div>
              </div>
            </DialogHeader>

            <div className="flex-1 flex overflow-hidden">
              <div className="flex-1 overflow-y-auto p-8 pt-1 bg-white scrollbar-thin border-r border-slate-50">
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[11px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none">
                          {currentQ.q_type === 'objective' ? '客观选择' :
                            currentQ.subjective_type === 'calculate' ? '主观计算' :
                              currentQ.subjective_type === 'noun' ? '名词解释' : '主观论述'}
                        </Badge>
                        <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[11px] font-bold text-indigo-500 border-indigo-100 bg-indigo-50/30">
                          {currentQ.difficulty_level_display || '适当'} (ELO {currentQ.difficulty || 1200})
                        </Badge>
                        {currentQ.knowledge_point_detail && (
                          <div className="flex items-center gap-2 ml-2">
                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{currentQ.knowledge_point_detail.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => toggleMastered(currentQ.id)} 
                          className={cn(
                            "rounded-xl h-9 px-3 gap-2 border transition-all", 
                            currentQ.is_mastered 
                              ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
                              : "text-slate-400 border-slate-100 hover:text-emerald-500 hover:bg-emerald-50/50"
                          )}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span className="text-[11px] font-black uppercase tracking-widest">{currentQ.is_mastered ? "已拿捏" : "拿捏"}</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => toggleFavorite(currentQ.id)} className={cn("rounded-xl h-9 w-9 shrink-0 border border-slate-100 transition-all", currentQ.is_favorite ? "text-amber-500 fill-amber-500 bg-amber-50" : "text-slate-300 hover:text-slate-400 hover:bg-slate-50")}>
                          <Star className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-8 relative mt-2 text-left">
                      <span className="text-6xl font-black text-slate-100/80 tabular-nums select-none absolute -left-4 -top-4 -z-10 opacity-50">{(currentIdx + 1).toString().padStart(2, '0')}</span>
                      <div className="flex-1 pt-0 min-w-0">
                        <div className="text-xl font-bold text-slate-900 leading-relaxed text-left">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {processMathContent(currentQ.text)}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    <div className={cn("mt-4 transition-opacity", currentQ.is_mastered && "opacity-40")}>
                      {currentQ.q_type === 'objective' ? (
                        <div className="grid grid-cols-1 gap-3 max-w-3xl">
                          {currentQ.options?.map((opt: string, i: number) => (
                            <button
                              key={i}
                              disabled={currentQ.is_mastered}
                              onClick={() => handleSelect(currentQ.id, opt)}
                              className={cn(
                                "w-full p-4 rounded-2xl border text-left font-bold transition-all flex items-center gap-5 group/opt",
                                answers[currentQ.id] === opt ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.01]" : "bg-white border-slate-200/60 hover:border-indigo-400 hover:bg-slate-50",
                                currentQ.is_mastered && "cursor-not-allowed"
                              )}
                            >
                              <div className={cn("h-7 w-7 rounded-xl border-2 flex items-center justify-center transition-all", answers[currentQ.id] === opt ? "border-white/20 bg-indigo-600" : "border-slate-100 bg-slate-50 group-hover/opt:border-indigo-200")}>
                                <span className={cn("text-[11px] font-black", answers[currentQ.id] === opt ? "text-white" : "text-slate-400")}>{String.fromCharCode(65 + i)}</span>
                              </div>
                              <span className="text-sm tracking-tight">{opt}</span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="max-w-4xl space-y-6 text-left">
                          <textarea
                            value={answers[currentQ.id] || ''}
                            disabled={currentQ.is_mastered}
                            onChange={(e) => handleSelect(currentQ.id, e.target.value)}
                            className={cn(
                              "w-full bg-slate-50 border border-slate-100/60 rounded-[2rem] p-8 min-h-[250px] font-bold text-base focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300 resize-none shadow-inner",
                              currentQ.is_mastered && "cursor-not-allowed"
                            )}
                            placeholder={currentQ.is_mastered ? "该题已标记掌握，无需填写答案..." : "在此输入您的分析或计算过程..."}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-64 bg-slate-50/30 p-8 flex flex-col shrink-0">
                <h5 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-6 text-left">题号矩阵</h5>
                <ScrollArea className="flex-1 pr-2">
                  <div className="grid grid-cols-4 gap-2">
                    {questions.map((q, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentIdx(i)}
                        className={cn(
                          "h-10 w-10 rounded-xl font-bold text-xs transition-all border flex items-center justify-center",
                          i === currentIdx
                            ? "bg-slate-900 text-white border-slate-900 shadow-lg scale-110 z-10"
                            : answers[q.id]
                              ? "bg-indigo-50 text-indigo-600 border-indigo-100"
                              : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                        )}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                <div className="mt-8 space-y-4 pt-6 border-t border-slate-100 text-left">
                  <div className="flex justify-between items-center text-[13px] font-bold uppercase tracking-widest text-slate-400">
                    <span>已答</span>
                    <span className="text-slate-900">{Object.keys(answers).length} / {questions.length}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 transition-all duration-500"
                      style={{ width: `${(Object.keys(answers).length / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-6">
                <Button variant="ghost" disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="rounded-xl font-bold gap-2 text-slate-400 h-12 px-6 hover:text-slate-900 transition-colors">
                  <ChevronLeft className="h-5 w-5" /> 上一题
                </Button>
                {gradingMessage && <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full"><Loader2 className="h-4 w-4 animate-spin text-indigo-500" /><span className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">{gradingMessage}</span></div>}
              </div>
              {currentIdx === questions.length - 1 ? (
                <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-2xl px-12 bg-indigo-600 text-white hover:bg-indigo-700 font-black h-14 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                  {isSubmitting ? "评分中..." : "提交评分"}
                </Button>
              ) : (
                <Button onClick={() => setCurrentIdx(prev => prev + 1)} className="rounded-2xl px-12 bg-slate-900 text-white hover:bg-slate-800 font-black h-14 shadow-lg transition-all active:scale-95">
                  下一题 <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
