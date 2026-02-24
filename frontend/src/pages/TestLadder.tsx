import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Trophy, ArrowRight, BrainCircuit, Activity, ChevronLeft, ChevronRight, Star, Loader2, ChevronDown, CheckCircle2 } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageWrapper } from '@/components/PageWrapper';
import { toast } from "sonner";
import api from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useSystemStore } from '@/store/useSystemStore';
import { processMathContent } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useSearchParams } from 'react-router-dom';

export const TestLadder: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { primaryColor } = useSystemStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [goals, setGoals] = useState({ review_goal: 0, new_questions: 0, at_risk_count: 0 });
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [qCount, setQCount] = useState("5");
  const [isCustomCount, setIsCustomCount] = useState(false);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingMessage, setGradingMessage] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [currentReportIdx, setCurrentReportIdx] = useState(0);
  const [examSummary, setExamSummary] = useState<any>(null);

  useEffect(() => {
    fetchLeaderboard();
    fetchGoals();
  }, []);

  useEffect(() => {
    // Check for report action
    const action = searchParams.get('action');
    const examId = searchParams.get('exam_id');
    
    if (action === 'view_report' && examId) {
      fetchExamReport(examId);
      // Clean URL
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchExamReport = async (examId: string) => {
    try {
      const res = await api.get(`/quizzes/exams/${examId}/`);
      setExamSummary({
        total_score: res.data.total_score,
        max_score: res.data.max_score,
        elo_change: res.data.elo_change,
        created_at: res.data.created_at_fmt
      });
      // Map ExamQuestionResult to the format expected by the dialog
      const mappedResults = res.data.results.map((r: any) => ({
        question: r.question_detail,
        user_answer: r.user_answer,
        score: r.score,
        max_score: r.max_score,
        feedback: r.feedback,
        analysis: r.analysis,
        is_correct: r.is_correct
      }));
      setResults(mappedResults);
      setCurrentReportIdx(0);
      setShowResultDialog(true);
    } catch (e) {
      toast.error("无法加载评估报告");
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await api.get('/quizzes/stats/');
      setGoals(res.data);
    } catch (e) { }
  };

  const toggleFavorite = async (qId: number) => {
    try {
      const res = await api.post('/quizzes/favorite/toggle/', { question_id: qId });
      setQuestions(questions.map(q => q.id === qId ? { ...q, is_favorite: res.data.is_favorite } : q));
      toast.success(res.data.is_favorite ? "已加入收藏" : "已取消收藏");
    } catch (e) { toast.error("操作失败"); }
  };

  const toggleMastered = async (qId: number) => {
    try {
      const res = await api.post('/quizzes/mastered/toggle/', { question_id: qId });
      const isNowMastered = res.data.is_mastered;
      setQuestions(questions.map(q => q.id === qId ? { ...q, is_mastered: isNowMastered } : q));
      
      if (isNowMastered) {
        const newAnswers = { ...answers };
        delete newAnswers[qId];
        setAnswers(newAnswers);
        toast.success("稳稳拿捏！", {
          description: "这道题已被永久封存，将不再出现在您的练习中。"
        });
      } else {
        toast.info("取消拿捏", { description: "题目已重新回到您的待选池。" });
      }
    } catch (e) { toast.error("操作失败"); }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/quizzes/leaderboard/');
      setLeaderboard(res.data);
    } catch (e) { }
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
    // 过滤掉标记为掌握的题目，只校验未掌握题目的完成情况
    const unmasteredQuestions = questions.filter(q => !q.is_mastered);
    const answeredCount = Object.keys(answers).length;
    
    if (unmasteredQuestions.length > 0 && answeredCount < unmasteredQuestions.length) {
      return toast.error(`请完成所有题目 (${answeredCount}/${unmasteredQuestions.length})`);
    }
    
    if (unmasteredQuestions.length === 0) {
      setIsTestOpen(false);
      return toast.info("所有题目均已标记掌握，本次练习无需提交评分。");
    }

    setIsSubmitting(true);

    try {
      // 构造批量提交数据，只提交未标记掌握的题目
      const payload = unmasteredQuestions.map(q => ({
        question_id: q.id,
        answer: answers[q.id]
      }));

      // 调用异步提交接口
      await api.post('/quizzes/submit-exam/', { answers: payload });

      toast.success("试卷已提交后台批改", {
        description: "AI 正在深入分析您的试卷，完成后将通过系统通知发送详细报告。"
      });
      
      setIsTestOpen(false);
      setAnswers({});
      // 可以在这里刷新一下排行榜或目标，虽然结果还没出来
      fetchGoals();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "提交失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQ = questions[currentIdx];

  return (
    <PageWrapper title="学术天梯" subtitle="基于 FSRS 记忆算法的智能评估，精准量化您的学术成长路径。">
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
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-[1.1]">开启 FSRS<br />智能评估系统</h2>
              <p className="text-base font-medium leading-relaxed text-slate-500 max-w-lg">
                FSRS 系统将根据您的历史记录自动定位知识盲区。通过深度学术训练，协助您在有限的时间内构建出色的专业素养与得分能力。
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">评估规模</span>
                  <div className="flex items-center gap-2">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-32 h-12 rounded-2xl bg-slate-50 border-slate-200/60 text-slate-900 font-bold text-sm hover:bg-slate-100 transition-all flex justify-between px-4">
                          {isCustomCount ? "自定义" : `${qCount} 道题`}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-32 rounded-2xl border-slate-200 bg-white shadow-2xl p-2" align="start">
                        {["3", "5", "10", "20"].map(v => (
                          <DropdownMenuItem 
                            key={v} 
                            onClick={() => {
                              setIsCustomCount(false);
                              setQCount(v);
                            }}
                            className="rounded-xl font-bold py-2.5 focus:bg-slate-50 focus:text-indigo-600 transition-colors cursor-pointer"
                          >
                            {v} 道题
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem 
                          onClick={() => setIsCustomCount(true)}
                          className="rounded-xl font-bold py-2.5 focus:bg-slate-50 focus:text-indigo-600 transition-colors text-indigo-600 cursor-pointer"
                        >
                          自定义
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {isCustomCount && (
                      <Input
                        type="number"
                        min="1"
                        value={qCount}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === "") {
                            setQCount("");
                            return;
                          }
                          const n = parseInt(val);
                          // 允许用户正在输入的过程中暂时小于1（比如清空后输入），但在确认或失焦时强制校验
                          setQCount(val);
                        }}
                        onBlur={() => {
                          const val = parseInt(qCount);
                          if (!qCount || isNaN(val) || val < 1) {
                            setQCount("1");
                            toast.info("测验数量至少为 1 道题");
                          }
                        }}
                        className="w-20 h-12 rounded-2xl bg-slate-50 border-slate-200/60 font-bold text-center"
                        placeholder="数量"
                      />
                    )}
                  </div>
                </div>
                <Button
                  onClick={startTest}
                  className="h-14 px-12 text-white hover:opacity-90 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-95 self-end"
                  style={{ backgroundColor: primaryColor }}
                >
                  开启训练 <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
              {/* 今日复习目标 */}
              <div className="p-7 bg-slate-50 border border-slate-100 rounded-[2.5rem] transition-all hover:bg-white hover:shadow-lg group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500"><BrainCircuit className="h-4 w-4" /></div>
                  <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest leading-none">今日复习</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-black text-slate-900 tabular-nums">{goals.review_goal}</p>
                  <span className="text-[12px] font-bold text-slate-400 uppercase">Due</span>
                </div>
              </div>
              
              {/* 待攻克 / 风险预警 */}
              <div className="p-7 bg-slate-50 border border-slate-100 rounded-[2.5rem] transition-all hover:bg-white hover:shadow-lg group flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-500"><Activity className="h-4 w-4" /></div>
                  <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest leading-none">记忆临界</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-black text-slate-900 tabular-nums">{goals.at_risk_count || 0}</p>
                  <span className="text-[12px] font-bold text-slate-400 uppercase">At Risk</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Dialog modal={false} open={isTestOpen} onOpenChange={(open) => { if (!open && !isSubmitting) setIsTestOpen(false); }}>
          <DialogContent
            onInteractOutside={(e) => e.preventDefault()}
            className="sm:max-w-[1200px] rounded-[3rem] border-none bg-white p-0 shadow-2xl overflow-hidden flex flex-col h-[800px] z-[100]"
          >
            {questions.length > 0 && (
              <>
                <DialogHeader className="p-10 pb-6 border-b border-slate-100 shrink-0 bg-white">
                  <div className="flex justify-between items-center">
                    <div className="space-y-1.5 text-left">
                      <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 uppercase">学术能力评估</DialogTitle>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-indigo-600 animate-pulse">Smart Evaluation Active</p>
                    </div>
                    <div className="px-6 py-2 bg-slate-900 rounded-2xl text-white font-mono font-bold text-sm tabular-nums shadow-xl">
                      {currentIdx + 1} / {questions.length}
                    </div>
                  </div>
                </DialogHeader>

                <div className="flex-1 flex overflow-hidden">
                  {/* Main Question Area */}
                  <div className="flex-1 overflow-y-auto p-8 pt-4 bg-white scrollbar-thin border-r border-slate-50">
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="space-y-4">
                        {/* Question Metadata Line */}
                        <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none">
                              {currentQ.q_type === 'objective' ? '客观选择' :
                                currentQ.subjective_type === 'calculate' ? '主观计算' :
                                  currentQ.subjective_type === 'noun' ? '名词解释' : '主观论述'}
                            </Badge>
                            <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-[9px] font-bold text-indigo-500 border-indigo-100 bg-indigo-50/30">
                              {currentQ.difficulty_level_display || '适当'} (ELO {currentQ.difficulty || 1200})
                            </Badge>
                            {currentQ.knowledge_point_detail && (
                              <div className="flex items-center gap-2 ml-2">
                                <div className="h-1 w-1 rounded-full bg-slate-300" />
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentQ.knowledge_point_detail.name}</span>
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
                              <span className="text-[10px] font-black uppercase tracking-widest">{currentQ.is_mastered ? "已拿捏" : "拿捏"}</span>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => toggleFavorite(currentQ.id)} className={cn("rounded-xl h-9 w-9 shrink-0 border border-slate-100 transition-all", currentQ.is_favorite ? "text-amber-500 fill-amber-500 bg-amber-50" : "text-slate-300 hover:text-slate-400 hover:bg-slate-50")}>
                              <Star className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Question Body */}
                        <div className="flex items-start gap-8 relative mt-2">
                          <span className="text-6xl font-black text-slate-100/80 tabular-nums select-none absolute -left-4 -top-4 -z-10 opacity-50">{(currentIdx + 1).toString().padStart(2, '0')}</span>
                          <div className="flex-1 pt-0 min-w-0">
                            <div className="text-xl font-bold text-slate-900 leading-relaxed">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {processMathContent(currentQ.text)}
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>

                        {/* Options / Input Area */}
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

                  {/* Side Navigation Grid */}
                  <div className="w-64 bg-slate-50/30 p-8 flex flex-col shrink-0">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">题号矩阵</h5>
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

                    <div className="mt-8 space-y-4 pt-6 border-t border-slate-100">
                      <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
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
                    {gradingMessage && <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-full"><Loader2 className="h-4 w-4 animate-spin text-indigo-500" /><span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{gradingMessage}</span></div>}
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

        {/* Result Report Dialog - Redesigned Matrix Mode */}
        <Dialog modal={false} open={showResultDialog} onOpenChange={setShowResultDialog}>
          <DialogContent
            onInteractOutside={(e) => e.preventDefault()}
            className="sm:max-w-[1200px] rounded-[3rem] border-none bg-white p-0 shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[920px] z-[100]"
          >
            <DialogHeader className="px-8 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex justify-between items-center">
                <div className="space-y-0.5 text-left">
                  <DialogTitle className="text-xl font-black tracking-tight text-slate-900 uppercase">评估分析报告</DialogTitle>
                  <p className="text-[8px] font-bold uppercase tracking-[0.3em] text-indigo-600">Academic Audit</p>
                </div>
                {examSummary && (
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">总分统计</p>
                      <p className="text-lg font-black text-slate-900 tabular-nums">{examSummary.total_score} / {examSummary.max_score}</p>
                    </div>
                    <div className="h-6 w-px bg-slate-100" />
                    <div className="text-right">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">ELO 变动</p>
                      <p className={cn("text-lg font-black tabular-nums", examSummary.elo_change >= 0 ? "text-emerald-500" : "text-rose-500")}>
                        {examSummary.elo_change >= 0 ? `+${examSummary.elo_change}` : examSummary.elo_change}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </DialogHeader>

            <div className="flex-1 flex overflow-hidden">
              {/* Left: Detailed Evaluation Area */}
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
                          <Badge className={cn("rounded-lg px-2.5 py-0.5 font-bold shadow-sm shrink-0 text-[9px]", results[currentReportIdx].is_correct ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>
                            {results[currentReportIdx].score} / {results[currentReportIdx].max_score} PTS
                          </Badge>
                        </div>

                        <div className="grid gap-4 pt-4 border-t border-slate-50">
                          <div className="space-y-1 text-left">
                            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400 ml-1">My Response</p>
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-[13px] font-medium text-slate-700 leading-relaxed whitespace-pre-wrap">
                              {results[currentReportIdx].user_answer || "(未作答)"}
                            </div>
                          </div>
                          
                          <div className="space-y-1 text-left">
                            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-500 ml-1">AI Feedback</p>
                            <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-100/50 text-[14px] font-bold text-emerald-900 leading-relaxed shadow-sm">
                              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                {processMathContent(results[currentReportIdx].feedback)}
                              </ReactMarkdown>
                            </div>
                          </div>

                          <div className="space-y-1 text-left">
                            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-indigo-500 ml-1">Academic Analysis</p>
                            <div className="p-6 bg-slate-900 rounded-[1.5rem] text-[14px] font-medium text-slate-200 leading-relaxed shadow-xl">
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

              {/* Right: Question Matrix Navigation */}
              <div className="w-64 bg-slate-50/50 p-6 flex flex-col shrink-0">
                <h5 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4 text-left">评估矩阵</h5>
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
                  <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-slate-400">
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
                  <p className="text-[8px] font-medium text-slate-400 leading-tight pt-1">
                    点击题号快速切换。绿色代表通过，红色代表挑战。
                  </p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Leaderboard */}
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between px-4">
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">全站学术排名</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">Global Meritocracy Ranking · Live</p>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-50 border border-slate-100"><div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Live Updates</span></div>
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
      </div>
    </PageWrapper>
  );
};
