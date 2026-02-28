import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle2, Loader2, Sparkles, Send, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { cn, processMathContent } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

interface KnowledgeTrainingDialogProps {
  question: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export const KnowledgeTrainingDialog: React.FC<KnowledgeTrainingDialogProps> = ({
  question,
  onClose,
  onSuccess
}) => {
  const [answer, setAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState<any>(null);

  const handleSubmit = async () => {
    if (!answer.trim()) return toast.error("请输入或选择答案");
    
    setIsSubmitting(true);
    try {
      // 统一复用评估提交接口以触发 FSRS
      const payload = [{ question_id: question.id, answer: answer }];
      const res = await api.post('/quizzes/submit-exam/', { answers: payload });
      
      // 为了即时反馈，我们直接获取最新的报告
      const reportRes = await api.get(`/quizzes/exams/${res.data.exam_id}/`);
      setResultData(reportRes.data.results[0]);
      setShowResult(true);
      if (onSuccess) onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "提交失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswer('');
    setShowResult(false);
    setResultData(null);
  };

  if (!question) return null;

  return (
    <Dialog open={!!question} onOpenChange={open => !open && onClose()}>
      <DialogContent className="sm:max-w-[800px] rounded-[3rem] p-10 border-none shadow-2xl text-left overflow-hidden max-h-[90vh] flex flex-col bg-white">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <Badge className="bg-indigo-600 text-white border-none uppercase text-[11px] font-bold">学术特训</Badge>
            <Badge variant="outline" className="text-[11px] font-bold text-black/30">ELO {question.difficulty}</Badge>
          </div>
          <DialogTitle className="text-xl font-bold leading-relaxed text-slate-900 text-left">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {processMathContent(question.text)}
            </ReactMarkdown>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 mt-6 pr-4">
          {!showResult ? (
            <div className="space-y-6 py-4">
              {question.q_type === 'objective' && question.options ? (
                <div className="grid gap-3">
                  {Object.entries(question.options).map(([key, val]: [string, any]) => (
                    <div
                      key={key}
                      onClick={() => setAnswer(key)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer flex items-center gap-4",
                        answer === key ? "bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200" : "bg-slate-50 border-black/[0.03] hover:bg-slate-100"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full border flex items-center justify-center font-black text-xs shrink-0",
                        answer === key ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-black/10 text-black/30"
                      )}>
                        {key}
                      </div>
                      <span className="text-[13px] font-bold text-slate-700">{val}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <textarea
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="在此输入您的学术见解..."
                  className="w-full h-48 bg-slate-50 border border-black/[0.03] rounded-[2rem] p-6 text-sm font-medium focus:ring-0 resize-none"
                />
              )}
            </div>
          ) : (
            <div className="space-y-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className={cn(
                "p-6 rounded-[2rem] border flex items-center gap-6",
                resultData?.is_correct ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-red-50 border-red-100 text-red-700"
              )}>
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
                  resultData?.is_correct ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                )}>
                  {resultData?.is_correct ? <CheckCircle2 className="w-6 h-6" /> : <RotateCcw className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest opacity-60">评估结果</p>
                  <h4 className="text-xl font-black">{resultData?.is_correct ? '通过评估' : '需加强记忆'}</h4>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[11px] font-bold uppercase tracking-widest opacity-60">得分</p>
                  <p className="text-2xl font-black">{resultData?.score} / {resultData?.max_score}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[11px] font-bold uppercase tracking-widest text-black/30 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5" /> AI 学术反馈</h5>
                <div className="p-8 bg-slate-900 text-slate-200 rounded-[2.5rem] text-sm leading-relaxed shadow-xl">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {processMathContent(resultData?.feedback || "")}
                  </ReactMarkdown>
                </div>
              </div>

              <div className="space-y-4">
                <h5 className="text-[11px] font-bold uppercase tracking-widest text-black/30 flex items-center gap-2">深度解析与标准答案</h5>
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-black/[0.03] text-sm font-medium leading-relaxed text-slate-600">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {processMathContent(resultData?.analysis || "")}
                  </ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="mt-8 pt-6 border-t border-black/5">
          {!showResult ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !answer.trim()}
              className="h-12 px-10 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xl shadow-indigo-100 transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              提交评估
            </Button>
          ) : (
            <div className="flex gap-3">
               <Button variant="outline" onClick={handleReset} className="h-12 px-8 rounded-2xl font-bold border-black/10">再次练习</Button>
               <Button onClick={onClose} className="h-12 px-10 rounded-2xl bg-black text-white font-bold">完成特训</Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
