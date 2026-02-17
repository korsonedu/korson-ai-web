import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, ArrowRight, BrainCircuit, Activity, ChevronLeft, ChevronRight, CheckCircle2, Star, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { PageWrapper } from '@/components/PageWrapper';
import { toast } from "sonner";
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { ScrollArea } from '@/components/ui/scroll-area';

export const TestLadder: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [goals, setGoals] = useState({ review_goal: 0, new_questions: 0 });
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [qCount, setQCount] = useState("5"); // 默认抽5题
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingMessage, setGradingMessage] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showResultDialog, setShowResultDialog] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await api.get('/quizzes/stats/');
      setGoals(res.data);
    } catch (e) {}
  };

  const toggleFavorite = async (qId: number) => {
    try {
      const res = await api.post('/quizzes/favorite/toggle/', { question_id: qId });
      // 更新当前题目列表中的状态
      setQuestions(questions.map(q => q.id === qId ? { ...q, is_favorite: res.data.is_favorite } : q));
      toast.success(res.data.is_favorite ? "已加入收藏" : "已取消收藏");
    } catch (e) { toast.error("操作失败"); }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/quizzes/leaderboard/');
      setLeaderboard(res.data);
    } catch (e) {}
  };

  const startTest = async () => {
    try {
      const res = await api.get(`/quizzes/questions/?limit=${qCount}`);
      if (res.data.length === 0) return toast.error("题库暂无可用题目");
      setQuestions(res.data);
      setIsTestOpen(true);
      setAnswers({});
      setCurrentIdx(0);
      setResults([]);
      setGradingMessage("");
    } catch (e) {
      toast.error("题目加载失败");
    }
  };

  const handleSelect = (qId: number, val: any) => {
    setAnswers({ ...answers, [qId]: val });
  };

  const handleSubmit = async () => {
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      return toast.error(`请完成所有题目 (${answeredCount}/${questions.length})`);
    }
    setIsSubmitting(true);
    
    const newResults: any[] = [];
    let totalScore = 0;
    let maxPossibleScore = 0;

    try {
      for (const [idx, q] of questions.entries()) {
        setGradingMessage(`AI 正在评阅第 ${idx + 1}/${questions.length} 题，请勿退出...`);
        if (q.q_type === 'objective') {
          const isCorrect = answers[q.id] === q.correct_answer;
          const score = isCorrect ? 10 : 0;
          newResults.push({
            question: q,
            user_answer: answers[q.id],
            score,
            max_score: 10,
            feedback: isCorrect ? "回答正确" : `回答错误，正确答案是：${q.correct_answer}`,
            analysis: q.ai_answer || "客观题直接判分"
          });
          totalScore += score;
          maxPossibleScore += 10;
        } else {
          // 调用 AI 评分接口
          try {
            const gradeRes = await api.post('/quizzes/grade-subjective/', {
              question_id: q.id,
              answer: answers[q.id]
            });
            newResults.push({
              question: q,
              user_answer: answers[q.id],
              ...gradeRes.data
            });
            totalScore += gradeRes.data.score;
            maxPossibleScore += gradeRes.data.max_score;
          } catch (gradeErr: any) {
            console.error("Grading error for question", q.id, gradeErr);
            const errMsg = gradeErr.response?.data?.error || `第 ${idx+1} 题评分失败`;
            throw new Error(errMsg);
          }
        }
      }

      setResults(newResults);
      setIsTestOpen(false);
      setShowResultDialog(true);
      
      const objScore = totalScore / maxPossibleScore;
      await api.post('/quizzes/submit/', { score: objScore });
      
      toast.success("测试已完成，AI 评分已生成");
      const me = await api.get('/users/me/');
      updateUser(me.data);
      fetchLeaderboard();
    } catch (e: any) {
      console.error("Test submission error:", e);
      toast.error(e.message || "提交或评分过程中出现错误");
    } finally {
      setIsSubmitting(false);
      setGradingMessage("");
    }
  };

  const currentQ = questions[currentIdx];

  return (
    <PageWrapper title="学术天梯" subtitle="基于艾宾浩斯记忆曲线的智能抽题，量化你的每一次进步。">
      <div className="flex flex-col gap-8 text-left animate-in fade-in duration-700">
        
        {/* Main Entry Card */}
        <Card className="border-none shadow-xl rounded-[2rem] bg-white border border-black/[0.03] p-10 overflow-hidden relative group">
           <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="space-y-4 max-w-xl text-left">
                 <div className="h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center backdrop-blur-xl mb-2">
                    <Activity className="h-6 w-6 text-black" />
                 </div>
                 <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">开启艾宾浩斯智能测试</h2>
                 <p className="text-base font-medium leading-relaxed text-[#86868B]">
                   系统将根据你的历史答题记录，优先抽取处于遗忘节点的题目。你可以自由选择单次抽题数量。
                 </p>
                 
                 <div className="flex items-center gap-4 pt-2">
                    <div className="flex flex-col gap-1.5">
                       <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest ml-1">单次抽题数量</span>
                       <Select value={qCount} onValueChange={setQCount}>
                          <SelectTrigger className="w-32 h-11 rounded-xl bg-[#F5F5F7] border-none font-bold">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                             {["3", "5", "10", "15", "20"].map(v => (
                               <SelectItem key={v} value={v} className="rounded-lg font-bold">{v} 道题</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>
                    <Button onClick={startTest} className="h-14 px-10 bg-black text-white hover:bg-black/90 rounded-2xl font-bold text-lg shadow-xl self-end">
                      立即开始挑战 <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                 </div>
              </div>
              
              <div className="hidden lg:flex flex-col gap-4 w-64 text-left">
                 <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100/50">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">今日复习目标</p>
                    <p className="text-xl font-bold text-emerald-900">{goals.review_goal} 道</p>
                 </div>
                 <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100/50">
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">待攻克新题</p>
                    <p className="text-xl font-bold text-blue-900">{goals.new_questions} 道</p>
                 </div>
              </div>
           </div>
           <div className="absolute top-0 right-0 w-96 h-96 bg-black/[0.01] rounded-full blur-[100px] -mr-32 -mt-32" />
        </Card>

        {/* Dialog for test session */}
        <Dialog open={isTestOpen} onOpenChange={(open) => { if (!open && !isSubmitting) setIsTestOpen(false); }}>
          <DialogContent 
            onInteractOutside={(e) => e.preventDefault()} 
            className="sm:max-w-[700px] rounded-[2.5rem] border-none bg-white p-0 shadow-2xl overflow-hidden flex flex-col h-[650px] z-[100]"
          >
            {questions.length > 0 && (
              <>
                <DialogHeader className="p-8 pb-4 border-b border-black/[0.03] shrink-0">
                  <div className="flex justify-between items-end">
                     <div>
                        <DialogTitle className="text-xl font-bold">天梯测试 ({currentIdx + 1}/{questions.length})</DialogTitle>
                        <DialogDescription className="text-xs">
                          {currentQ.q_type === 'objective' ? '客观选择题 · 实时评估' : '主观论述题 · 深度沉淀'}
                        </DialogDescription>
                     </div>
                     <div className="flex gap-1.5 pb-1">
                        {questions.map((_, i) => (
                          <div 
                            key={i} 
                            onClick={() => setCurrentIdx(i)}
                            className={cn(
                              "h-1.5 w-4 rounded-full transition-all cursor-pointer", 
                              i === currentIdx ? "bg-black w-8" : answers[questions[i].id] ? "bg-emerald-400" : "bg-black/5 hover:bg-black/10"
                            )} 
                          />
                        ))}
                     </div>
                  </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-10">
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-400">
                     <div className="space-y-6">
                        <div className="flex items-start justify-between gap-4">
                           <div className="flex items-start gap-4">
                              <span className="h-8 w-8 rounded-lg bg-black text-white flex items-center justify-center font-bold shrink-0">{currentIdx + 1}</span>
                              <h3 className="text-xl font-bold text-[#1D1D1F] leading-tight pt-0.5">{currentQ.text}</h3>
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => toggleFavorite(currentQ.id)} className={cn("rounded-xl h-10 w-10 shrink-0", currentQ.is_favorite ? "text-amber-500 fill-amber-500" : "text-black/10 hover:text-black/20")}>
                              <Star className="h-5 w-5" />
                           </Button>
                        </div>
                        
                        {currentQ.knowledge_point_detail && (
                          <div className="ml-12 p-4 bg-slate-50 rounded-2xl border border-black/[0.02]">
                             <p className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1">相关考点结构化数据</p>
                             <div className="text-xs font-bold text-[#1D1D1F]">{currentQ.knowledge_point_detail.description}</div>
                             {currentQ.knowledge_point_detail.structural_data && Object.keys(currentQ.knowledge_point_detail.structural_data).length > 0 && (
                               <div className="mt-2 flex gap-2 flex-wrap">
                                  {Object.entries(currentQ.knowledge_point_detail.structural_data).map(([k, v]: [string, any]) => (
                                    <Badge key={k} variant="secondary" className="text-[9px] rounded-lg">{k}: {v}</Badge>
                                  ))}
                               </div>
                             )}
                          </div>
                        )}
                        {currentQ.q_type === 'objective' ? (
                          <div className="grid grid-cols-1 gap-3 ml-12">
                            {currentQ.options?.map((opt: string, i: number) => (
                              <button 
                                key={i}
                                onClick={() => handleSelect(currentQ.id, opt)}
                                className={cn(
                                  "w-full p-4 rounded-2xl border text-left font-bold transition-all flex items-center gap-4",
                                  answers[currentQ.id] === opt ? "bg-black text-white border-black shadow-lg" : "bg-white border-black/[0.05] hover:border-black/20"
                                )}
                              >
                                <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", answers[currentQ.id] === opt ? "border-white" : "border-slate-200")}>
                                   {answers[currentQ.id] === opt && <div className="h-2 w-2 rounded-full bg-white" />}
                                </div>
                                <span className="text-sm">{opt}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="ml-12 space-y-4">
                            <textarea 
                              value={answers[currentQ.id] || ''}
                              onChange={(e) => handleSelect(currentQ.id, e.target.value)}
                              className="w-full bg-[#F5F5F7] border-none rounded-2xl p-6 min-h-[220px] font-bold text-sm focus:ring-1 focus:ring-black/5 transition-all"
                              placeholder="在这里输入你的论述..."
                            />
                            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 flex gap-3">
                               <Star className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                               <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">Subjective Evaluation will be reviewed by AI (DeepSeek-Chat) in the next version.</p>
                            </div>
                          </div>
                        )}
                     </div>
                  </div>
                </div>

                <div className="p-8 border-t border-black/[0.03] flex justify-between items-center bg-white shrink-0">
                  <div className="flex flex-col">
                    <Button variant="ghost" disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="rounded-xl font-bold gap-2">
                      <ChevronLeft className="h-4 w-4" /> 上一题
                    </Button>
                    {gradingMessage && <p className="text-[10px] font-bold text-emerald-600 animate-pulse mt-2">{gradingMessage}</p>}
                  </div>
                  {currentIdx === questions.length - 1 ? (
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-xl px-10 bg-black text-white font-bold h-12 shadow-xl">
                      {isSubmitting ? "AI 评分中..." : "结束并提交测试"}
                    </Button>
                  ) : (
                    <Button onClick={() => setCurrentIdx(prev => prev + 1)} className="rounded-xl px-10 bg-black text-white font-bold h-12">
                      下一题 <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>


        
        <div className="space-y-4">
           <div className="flex items-center justify-between px-2">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#86868B]">全站实时学术排名</h3>
              <div className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/><span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Global Live</span></div>
           </div>
           <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden border border-black/[0.02]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-black/[0.03] bg-slate-50/50">
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-black/40">位次</th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-black/40">用户</th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-black/40">ELO 积分</th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-black/40">活跃度</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.02]">
                    {leaderboard.map((u, i) => (
                      <tr key={u.id} className="group hover:bg-[#F5F5F7]/50 transition-all duration-300 text-left">
                        <td className="px-8 py-5 text-left">
                          {i < 3 ? (
                            <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-sm", i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-200 text-slate-700" : "bg-orange-100 text-orange-700")}>{i + 1}</div>
                          ) : <span className="px-2 text-xs font-bold text-[#86868B]">{i + 1}</span>}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <Avatar className="h-10 w-10 border border-black/5 shadow-sm group-hover:ring-2 ring-emerald-500/10 transition-all"><AvatarImage src={u.avatar_url} /><AvatarFallback className="font-bold text-xs">{u.username[0]}</AvatarFallback></Avatar>
                            <div className="flex flex-col text-left"><span className="font-bold text-sm text-[#1D1D1F]">{u.username}</span><span className="text-[9px] font-bold text-[#86868B] uppercase tracking-tighter">{u.role}</span></div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm font-bold text-[#1D1D1F] tabular-nums">{u.elo_score}</td>
                        <td className="px-8 py-5"><Activity className="h-4 w-4 opacity-10 group-hover:opacity-100 group-hover:text-emerald-500 transition-all" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </Card>
        </div>
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent 
            onInteractOutside={(e) => e.preventDefault()}
            className="sm:max-w-[800px] rounded-[2.5rem] border-none bg-white p-0 shadow-2xl overflow-hidden flex flex-col h-[750px] z-[100]"
          >
             <DialogHeader className="p-8 pb-4 border-b border-black/[0.03] shrink-0">
                <DialogTitle className="text-2xl font-bold">测试结果报告 (AI 深度分析)</DialogTitle>
                <DialogDescription className="text-sm font-medium">依据得分点为您进行精准判分与能力评估。</DialogDescription>
             </DialogHeader>
             <ScrollArea className="flex-1 p-8">
                <div className="space-y-8">
                   {results.map((res, i) => (
                     <Card key={i} className="border-none bg-[#F5F5F7]/50 rounded-3xl overflow-hidden text-left">
                        <div className="p-6 space-y-4">
                           <div className="flex justify-between items-start">
                              <div className="flex gap-3 items-start flex-1">
                                 <span className="h-6 w-6 rounded-md bg-black text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-1">{i+1}</span>
                                 <h4 className="font-bold text-[#1D1D1F] leading-snug">{res.question.text}</h4>
                              </div>
                              <Badge className={cn("rounded-lg px-3 py-1 ml-4", res.score / res.max_score >= 0.6 ? "bg-emerald-500 text-white" : "bg-red-500 text-white")}>
                                 {res.score} / {res.max_score} 分
                              </Badge>
                           </div>
                           
                           <div className="grid gap-4 pt-2">
                              <div className="space-y-1.5">
                                 <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">你的回答</p>
                                 <div className="p-4 bg-white rounded-xl border border-black/[0.02] text-sm font-medium text-[#1D1D1F]">{res.user_answer}</div>
                              </div>
                              <div className="space-y-1.5">
                                 <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">AI 评分反馈</p>
                                 <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100/30 text-xs font-bold text-emerald-900 leading-relaxed">{res.feedback}</div>
                              </div>
                              <div className="space-y-1.5">
                                 <p className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">AI 标准解析 & 答案</p>
                                 <div className="p-6 bg-white rounded-xl border border-black/[0.02] prose prose-sm max-w-none text-left shadow-inner">
                                    <pre className="whitespace-pre-wrap text-xs font-medium text-[#1D1D1F] leading-relaxed">{res.analysis || res.ai_answer}</pre>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </Card>
                   ))}
                </div>
             </ScrollArea>
             <div className="p-8 border-t border-black/[0.03] flex justify-end bg-white">
                <Button onClick={() => setShowResultDialog(false)} className="rounded-xl px-12 bg-black text-white font-bold h-12 shadow-xl">确认并返回天梯</Button>
             </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
};
