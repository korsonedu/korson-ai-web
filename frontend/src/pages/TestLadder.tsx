import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, ArrowRight, BrainCircuit, Activity, ChevronLeft, ChevronRight, Star, Loader2 } from 'lucide-react';
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
import { useSystemStore } from '@/store/useSystemStore';
import { ScrollArea } from '@/components/ui/scroll-area';

export const TestLadder: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { primaryColor } = useSystemStore();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [goals, setGoals] = useState({ review_goal: 0, new_questions: 0 });
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [qCount, setQCount] = useState("5"); 
  
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
        setGradingMessage(`评阅进度 ${idx + 1}/${questions.length}...`);
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
      
      toast.success("评估已完成");
      const me = await api.get('/users/me/');
      updateUser(me.data);
      fetchLeaderboard();
    } catch (e: any) {
      toast.error(e.message || "提交或评分过程中出现错误");
    } finally {
      setIsSubmitting(false);
      setGradingMessage("");
    }
  };

  const currentQ = questions[currentIdx];

  return (
    <PageWrapper title="学术天梯" subtitle="基于艾宾浩斯记忆曲线的智能评估，精准量化您的学术成长路径。">
      <div className="flex flex-col gap-12 text-left animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
        
        {/* Main Entry Card - Apple Aesthetic */}
        <Card className="border border-slate-200/60 bg-white rounded-[3rem] p-12 overflow-hidden relative shadow-sm hover:shadow-md transition-all">
           <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
           <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
              <div className="space-y-6 max-w-2xl text-left">
                 <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] leading-none">Smart Academic Assessment</span>
                 </div>
                 <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-[1.1]">开启艾宾浩斯<br />智能评估系统</h2>
                 <p className="text-base font-medium leading-relaxed text-slate-500 max-w-lg">
                   系统将根据您的历史记录自动定位知识盲区。通过这种深度学术评估，协助您在有限的时间内构建出色的专业素养。
                 </p>
                 
                 <div className="flex flex-wrap items-center gap-6 pt-4">
                    <div className="flex flex-col gap-2">
                       <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">单次评估规模</span>
                       <Select value={qCount} onValueChange={setQCount}>
                          <SelectTrigger className="w-40 h-12 rounded-2xl bg-slate-50 border-slate-200/60 text-slate-900 font-bold text-sm focus:ring-indigo-500/10 transition-all">
                             <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-slate-200 bg-white shadow-2xl">
                             {["3", "5", "10", "15", "20"].map(v => (
                               <SelectItem key={v} value={v} className="rounded-xl font-bold py-2.5 focus:bg-slate-50 focus:text-indigo-600 transition-colors">{v} 道题</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>
                    <Button 
                      onClick={startTest} 
                      className="h-14 px-12 text-white hover:opacity-90 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-95 self-end"
                      style={{ backgroundColor: primaryColor }}
                    >
                      立即开始评估 <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 w-full lg:w-72 shrink-0">
                 <div className="p-7 bg-slate-50 border border-slate-100 rounded-[2.5rem] transition-all hover:bg-white hover:shadow-lg group">
                    <div className="flex items-center gap-3 mb-3">
                       <div className="h-9 w-9 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500"><Activity className="h-4 w-4"/></div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">今日复习目标</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-black text-slate-900 tabular-nums">{goals.review_goal}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Items</span>
                    </div>
                 </div>
                 <div className="p-7 bg-slate-50 border border-slate-100 rounded-[2.5rem] transition-all hover:bg-white hover:shadow-lg group">
                    <div className="flex items-center gap-3 mb-3">
                       <div className="h-9 w-9 rounded-2xl bg-white shadow-sm flex items-center justify-center text-emerald-500"><BrainCircuit className="h-4 w-4"/></div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">待攻克新题</p>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <p className="text-3xl font-black text-slate-900 tabular-nums">{goals.new_questions}</p>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Items</span>
                    </div>
                 </div>
              </div>
           </div>
        </Card>

        {/* Test Dialog */}
        <Dialog open={isTestOpen} onOpenChange={(open) => { if (!open && !isSubmitting) setIsTestOpen(false); }}>
          <DialogContent 
            onInteractOutside={(e) => e.preventDefault()} 
            className="sm:max-w-[1100px] rounded-[3rem] border-none bg-white p-0 shadow-2xl overflow-hidden flex flex-col h-[750px] z-[100]"
          >
            {questions.length > 0 && (
              <>
                <DialogHeader className="p-10 pb-4 border-b border-slate-100 shrink-0 bg-white">
                  <div className="flex justify-between items-end">
                     <div className="space-y-1.5 text-left">
                        <DialogTitle className="text-xl font-black tracking-tight text-slate-900">学术评估</DialogTitle>
                        <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                          {currentQ.q_type === 'objective' ? 'Objective Analysis' : 'Subjective Synthesis'} · Progress {currentIdx + 1} / {questions.length}
                        </DialogDescription>
                     </div>
                     <div className="flex gap-2 pb-1">
                        {questions.map((_, i) => (
                          <div 
                            key={i} 
                            onClick={() => !isSubmitting && setCurrentIdx(i)}
                            className={cn(
                              "h-1.5 rounded-full transition-all cursor-pointer", 
                              i === currentIdx ? "bg-indigo-600 w-12" : answers[questions[i].id] ? "bg-emerald-400 w-4" : "bg-slate-100 w-4 hover:bg-slate-200"
                            )} 
                          />
                        ))}
                     </div>
                  </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto p-12 pt-6 bg-white scrollbar-thin">
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                     <div className="space-y-8">
                        <div className="flex items-start justify-between gap-8">
                           <div className="flex items-start gap-8">
                              <span className="text-5xl font-black text-slate-100 tabular-nums select-none pt-1">{(currentIdx + 1).toString().padStart(2, '0')}</span>
                              <div className="space-y-1 pt-2">
                                 {currentQ.knowledge_point_detail && (
                                   <div className="flex items-center gap-1.5 opacity-40">
                                      <div className="h-1 w-1 rounded-full bg-indigo-500" />
                                      <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{currentQ.knowledge_point_detail.description}</span>
                                   </div>
                                 )}
                                 <h3 className="text-lg font-bold text-slate-900 leading-[1.4]">{currentQ.text}</h3>
                              </div>
                           </div>
                           <Button variant="ghost" size="icon" onClick={() => toggleFavorite(currentQ.id)} className={cn("rounded-2xl h-10 w-10 shrink-0 border border-slate-100 transition-all", currentQ.is_favorite ? "text-amber-500 fill-amber-500 bg-amber-50" : "text-slate-300 hover:text-slate-400 hover:bg-slate-50")}>
                              <Star className="h-5 w-5" />
                           </Button>
                        </div>
                        
                        {currentQ.q_type === 'objective' ? (
                          <div className="grid grid-cols-1 gap-3 ml-16">
                            {currentQ.options?.map((opt: string, i: number) => (
                              <button 
                                key={i}
                                onClick={() => handleSelect(currentQ.id, opt)}
                                className={cn(
                                  "w-full p-4 rounded-2xl border text-left font-bold transition-all flex items-center gap-5 group/opt",
                                  answers[currentQ.id] === opt ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-[1.01]" : "bg-white border-slate-200/60 hover:border-indigo-400 hover:bg-slate-50"
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
                          <div className="ml-16 space-y-6 text-left">
                            <textarea 
                              value={answers[currentQ.id] || ''}
                              onChange={(e) => handleSelect(currentQ.id, e.target.value)}
                              className="w-full bg-slate-50 border border-slate-100/60 rounded-[2rem] p-6 min-h-[200px] font-bold text-sm focus:ring-4 focus:ring-indigo-500/5 transition-all placeholder:text-slate-300 resize-none"
                              placeholder="在此输入您的论述..."
                            />
                          </div>
                        )}
                     </div>
                  </div>
                </div>

                <div className="p-10 border-t border-slate-100 flex justify-between items-center bg-white shrink-0">
                  <div className="flex items-center gap-6">
                    <Button variant="ghost" disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="rounded-xl font-bold gap-2 text-slate-400 h-12 px-6 hover:text-slate-900 transition-colors">
                      <ChevronLeft className="h-5 w-5" /> 上一题
                    </Button>
                    {gradingMessage && <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full"><Loader2 className="h-4 w-4 animate-spin text-indigo-500" /><span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{gradingMessage}</span></div>}
                  </div>
                  {currentIdx === questions.length - 1 ? (
                    <Button onClick={handleSubmit} disabled={isSubmitting} className="rounded-2xl px-12 bg-indigo-600 text-white hover:bg-indigo-700 font-black h-14 shadow-xl shadow-indigo-100 transition-all active:scale-95">
                      {isSubmitting ? "评分中..." : "结束评估"}
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

        {/* Leaderboard */}
        <div className="space-y-6 pt-6">
           <div className="flex items-center justify-between px-4">
              <div className="space-y-1">
                 <h3 className="text-2xl font-black text-slate-900 tracking-tight">全站学术排名</h3>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Global Meritocracy Ranking · Live</p>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-100"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"/><span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Live Updates</span></div>
           </div>
           <Card className="border border-slate-200/50 shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30">
                      <th className="px-12 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">位次</th>
                      <th className="px-12 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">用户信息</th>
                      <th className="px-12 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-center">ELO 评分</th>
                      <th className="px-12 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">活跃记录</th>
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
                               {i === 0 && <div className="absolute -top-1.5 -right-1.5 h-6 w-6 bg-indigo-600 rounded-xl border-4 border-white flex items-center justify-center text-[10px] text-white shadow-sm">🏆</div>}
                            </div>
                            <div className="flex flex-col text-left"><span className="font-bold text-base text-slate-900 tracking-tight">{u.nickname || u.username}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{u.role}</span></div>
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

        {/* Result Report Dialog */}
        <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent 
            onInteractOutside={(e) => e.preventDefault()}
            className="sm:max-w-[900px] rounded-[3rem] border-none bg-white p-0 shadow-2xl overflow-hidden flex flex-col h-[800px] z-[100]"
          >
             <DialogHeader className="p-10 pb-6 border-b border-slate-100 shrink-0 bg-white">
                <DialogTitle className="text-3xl font-black tracking-tight text-slate-900">评估分析报告</DialogTitle>
                <DialogDescription className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">依据得分点与 AI 深度分析，量化您的学术能力边界</DialogDescription>
             </DialogHeader>
             <ScrollArea className="flex-1 p-10 bg-slate-50/30">
                <div className="space-y-10">
                   {results.map((res, i) => (
                     <Card key={i} className="border border-slate-100 bg-white rounded-[2.5rem] overflow-hidden shadow-sm">
                        <div className="p-8 space-y-6">
                           <div className="flex justify-between items-start">
                              <div className="flex gap-4 items-start flex-1">
                                 <span className="text-3xl font-black text-slate-100 tabular-nums pt-1">{(i+1).toString().padStart(2, '0')}</span>
                                 <h4 className="font-bold text-lg text-slate-900 leading-[1.4] pt-2">{res.question.text}</h4>
                              </div>
                              <Badge className={cn("rounded-xl px-4 py-1.5 ml-6 font-bold shadow-sm", res.score / res.max_score >= 0.6 ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                                 {res.score} / {res.max_score} PTS
                              </Badge>
                           </div>
                           
                           <div className="grid gap-6 pt-4 border-t border-slate-50">
                              <div className="space-y-2">
                                 <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">My Response</p>
                                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-[13px] font-medium text-slate-700 leading-relaxed">{res.user_answer}</div>
                              </div>
                              <div className="space-y-2">
                                 <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-emerald-500 ml-1">AI Feedback</p>
                                 <div className="p-6 bg-emerald-50/50 rounded-2xl border border-emerald-100/50 text-[13px] font-bold text-emerald-900 leading-relaxed">{res.feedback}</div>
                              </div>
                              <div className="space-y-2">
                                 <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-500 ml-1">Academic Analysis</p>
                                 <div className="p-8 bg-slate-900 rounded-[2rem] text-[13px] font-medium text-slate-200 leading-relaxed shadow-xl">
                                    <pre className="whitespace-pre-wrap font-sans leading-relaxed">{res.analysis || res.ai_answer}</pre>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </Card>
                   ))}
                </div>
             </ScrollArea>
             <div className="p-10 border-t border-slate-100 flex justify-end bg-white">
                <Button onClick={() => setShowResultDialog(false)} className="rounded-2xl px-14 bg-slate-900 text-white hover:bg-slate-800 font-black h-14 shadow-xl transition-all active:scale-95">返回天梯</Button>
             </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
};
