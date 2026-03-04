import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowRight, BrainCircuit, Activity, ChevronDown, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageWrapper } from '@/components/PageWrapper';
import { toast } from "sonner";
import api from '@/lib/api';
import { useSystemStore } from '@/store/useSystemStore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  getLearningReminderSettings,
  updateLearningReminderSetting,
  type LearningReminderSettings,
} from '@/lib/learningReminders';

// Modularized Components
import { AssessmentDialog } from './test-ladder/AssessmentDialog';
import { ResultReportDialog } from './test-ladder/ResultReportDialog';
import { Leaderboard } from './test-ladder/Leaderboard';

export const TestLadder: React.FC = () => {
  const { primaryColor } = useSystemStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'practice' | 'leaderboard'>('practice');
  const [reminderSettings, setReminderSettings] = useState<LearningReminderSettings>(getLearningReminderSettings());
  
  // Data State
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [goals, setGoals] = useState({ review_goal: 0, new_questions: 0, at_risk_count: 0 });
  
  // Assessment UI State
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [qCount, setQCount] = useState("5");
  const [isCustomCount, setIsCustomCount] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingMessage, setGradingMessage] = useState("");

  // Report UI State
  const [results, setResults] = useState<any[]>([]);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [currentReportIdx, setCurrentReportIdx] = useState(0);
  const [examSummary, setExamSummary] = useState<any>(null);

  useEffect(() => {
    fetchGoals();
    fetchLeaderboard();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const action = searchParams.get('action');
    const examId = searchParams.get('exam_id');
    if (action === 'view_report' && examId) {
      fetchExamReport(examId);
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
    } catch (e) { toast.error("无法加载评估报告"); }
  };

  const fetchGoals = async () => {
    try {
      const res = await api.get('/quizzes/stats/');
      setGoals(res.data);
    } catch (e) { }
  };

  const fetchLeaderboard = async () => {
    try {
      const res = await api.get('/quizzes/leaderboard/');
      setLeaderboard(res.data);
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
        toast.success("稳稳拿捏！");
      }
    } catch (e) { toast.error("操作失败"); }
  };

  const startTest = async () => {
    const parsedCount = Number.parseInt(qCount, 10);
    const normalizedCount = Number.isFinite(parsedCount) ? Math.max(1, Math.min(parsedCount, 50)) : 5;
    if (`${normalizedCount}` !== qCount) setQCount(`${normalizedCount}`);

    if (isMobile) {
      navigate(`/tests/session?count=${normalizedCount}`);
      return;
    }

    try {
      const res = await api.get(`/quizzes/questions/?limit=${normalizedCount}`);
      if (res.data.length === 0) return toast.error("题库暂无可用题目");
      setQuestions(res.data);
      setIsTestOpen(true);
      setAnswers({});
      setCurrentIdx(0);
      setResults([]);
    } catch (e) { toast.error("题目加载失败"); }
  };

  const handleSubmit = async () => {
    const unmasteredQuestions = questions.filter(q => !q.is_mastered);
    const answeredCount = Object.keys(answers).length;
    if (unmasteredQuestions.length > 0 && answeredCount < unmasteredQuestions.length) {
      return toast.error(`请完成所有题目 (${answeredCount}/${unmasteredQuestions.length})`);
    }
    if (unmasteredQuestions.length === 0) {
      setIsTestOpen(false);
      return toast.info("练习已结束");
    }
    setIsSubmitting(true);
    try {
      const payload = unmasteredQuestions.map(q => ({ question_id: q.id, answer: answers[q.id] }));
      await api.post('/quizzes/submit-exam/', { answers: payload });
      toast.success("试卷已提交 AI 批改", { description: "完成后请在通知中心点击查看报告。" });
      setIsTestOpen(false);
      fetchGoals();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "提交失败");
    } finally { setIsSubmitting(false); }
  };

  return (
    <PageWrapper title="学术天梯" subtitle="基于 FSRS 记忆算法的智能评估，精准量化学术成长路径。">
      <div className="flex flex-col gap-8 md:gap-12 text-left animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
        {isMobile && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMobileTab('practice')}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-bold border transition-colors",
                  mobileTab === 'practice'
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                习题训练
              </button>
              <button
                onClick={() => setMobileTab('leaderboard')}
                className={cn(
                  "h-8 px-3 rounded-full text-xs font-bold border transition-colors",
                  mobileTab === 'leaderboard'
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-card text-muted-foreground border-border hover:text-foreground"
                )}
              >
                全站排名
              </button>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg border-border">
                  <Bell className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent side="bottom" align="end" className="w-64 rounded-2xl p-4 bg-card border-border">
                <div className="space-y-3 text-left">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">提醒设置</p>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold">题型提醒</Label>
                    <Switch
                      checked={reminderSettings.questionType}
                      onCheckedChange={(enabled) => {
                        setReminderSettings(updateLearningReminderSetting('questionType', enabled));
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold">做题结果提醒</Label>
                    <Switch
                      checked={reminderSettings.testResult}
                      onCheckedChange={(enabled) => {
                        setReminderSettings(updateLearningReminderSetting('testResult', enabled));
                      }}
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        )}

        {(!isMobile || mobileTab === 'practice') && (
          <Card className={cn(
            "bg-card overflow-hidden relative transition-all",
            isMobile ? "border-none shadow-none rounded-none p-0" : "border border-border rounded-[3rem] p-12 shadow-sm hover:shadow-md"
          )}>
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
            <div className={cn(
              "relative z-10",
              isMobile
                ? "flex flex-col items-start justify-between gap-4"
                : "flex flex-col lg:flex-row items-center justify-between gap-12"
            )}>
              <div className={cn("max-w-2xl text-left", isMobile ? "space-y-4" : "space-y-6")}>
                <h2 className={cn("font-black tracking-tighter text-foreground leading-[1.1]", isMobile ? "text-2xl" : "text-4xl md:text-5xl")}>
                  开启 FSRS
                  <br />
                  智能评估系统
                </h2>
                <p className={cn("font-medium leading-relaxed text-muted-foreground max-w-lg", isMobile ? "text-sm" : "text-base")}>
                  {isMobile
                    ? '基于你的学习轨迹快速定位薄弱点，直接进入专注训练。'
                    : 'FSRS 系统将根据您的历史记录自动定位知识盲区。通过深度学术训练，协助您在有限的时间内构建出色的专业素养与得分能力。'}
                </p>

                <div className={cn(isMobile ? "flex flex-col items-stretch gap-3 pt-1" : "flex flex-wrap items-center gap-6 pt-4")}>
                  {isMobile ? (
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] ml-1">抽题数量</span>
                      <Input
                        type="number"
                        min="1"
                        value={qCount}
                        onChange={(e) => setQCount(e.target.value)}
                        onBlur={() => { if (!qCount || parseInt(qCount) < 1) setQCount("1"); }}
                        className="w-full h-10 rounded-xl bg-muted border-border font-bold text-center"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <span className="text-[14px] font-bold text-muted-foreground uppercase tracking-[0.2em] ml-1">单次抽题量</span>
                      <div className="flex items-center gap-2">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-32 h-12 rounded-2xl bg-muted border-border text-foreground font-bold text-sm hover:bg-muted/80 transition-all flex justify-between px-4">
                              {isCustomCount ? "自定义" : `${qCount} 道题`}
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-32 rounded-2xl border-border bg-card shadow-2xl p-2" align="start">
                            {["3", "5", "10", "20"].map(v => (
                              <DropdownMenuItem key={v} onClick={() => { setIsCustomCount(false); setQCount(v); }} className="rounded-xl font-bold py-2.5 cursor-pointer">
                                {v} 道题
                              </DropdownMenuItem>
                            ))}
                            <DropdownMenuItem onClick={() => setIsCustomCount(true)} className="rounded-xl font-bold py-2.5 text-indigo-600 cursor-pointer">
                              自定义
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {isCustomCount && (
                          <Input type="number" min="1" value={qCount} onChange={(e) => setQCount(e.target.value)} onBlur={() => { if (!qCount || parseInt(qCount) < 1) setQCount("1"); }} className="w-20 h-12 rounded-2xl bg-muted border-border font-bold text-center" />
                        )}
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={startTest}
                    className={cn(
                      "text-white hover:opacity-90 rounded-2xl font-bold shadow-xl transition-all active:scale-95",
                      isMobile ? "h-11 w-full px-6 text-sm self-stretch" : "h-14 px-12 text-lg self-end"
                    )}
                    style={{ backgroundColor: primaryColor }}
                  >
                    开启训练 <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className={cn(
                isMobile
                  ? "grid grid-cols-2 gap-2 w-full shrink-0"
                  : "flex flex-col gap-4 w-full lg:w-72 shrink-0"
              )}>
                <div className={cn(
                  "bg-muted transition-all flex flex-col justify-center",
                  isMobile ? "p-3 rounded-xl border-none shadow-none" : "p-7 border border-border rounded-[2.5rem] hover:bg-card hover:shadow-lg"
                )}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn("bg-card shadow-sm flex items-center justify-center text-indigo-500", isMobile ? "h-8 w-8 rounded-xl" : "h-9 w-9 rounded-2xl")}><BrainCircuit className="h-4 w-4" /></div>
                    <p className={cn("font-bold text-muted-foreground uppercase tracking-widest leading-none", isMobile ? "text-[11px]" : "text-[14px]")}>今日复习</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className={cn("font-black text-foreground tabular-nums", isMobile ? "text-3xl" : "text-4xl")}>{goals.review_goal}</p>
                    <span className="text-[12px] font-bold text-muted-foreground uppercase">Due</span>
                  </div>
                </div>
                <div className={cn(
                  "bg-muted transition-all flex flex-col justify-center",
                  isMobile ? "p-3 rounded-xl border-none shadow-none" : "p-7 border border-border rounded-[2.5rem] hover:bg-card hover:shadow-lg"
                )}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn("bg-card shadow-sm flex items-center justify-center text-muted-foreground", isMobile ? "h-8 w-8 rounded-xl" : "h-9 w-9 rounded-2xl")}><Activity className="h-4 w-4" /></div>
                    <p className={cn("font-bold text-muted-foreground uppercase tracking-widest leading-none", isMobile ? "text-[11px]" : "text-[14px]")}>记忆临界</p>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <p className={cn("font-black text-foreground tabular-nums", isMobile ? "text-3xl" : "text-4xl")}>{goals.at_risk_count || 0}</p>
                    <span className="text-[12px] font-bold text-muted-foreground uppercase">At Risk</span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}

        {isMobile ? (
          mobileTab === 'leaderboard' && (
            <Card className="border border-border rounded-2xl bg-card overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border bg-muted/60">
                <h3 className="text-base font-black tracking-tight text-foreground">全站学术排名</h3>
              </div>
              <div className="max-h-[calc(100dvh-20rem)] overflow-y-auto divide-y divide-border">
                {leaderboard.map((u, i) => (
                  <div key={u.id} className="px-3 py-2.5 flex items-center gap-3">
                    <div className={cn(
                      "h-7 w-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0",
                      i === 0
                        ? "bg-indigo-600 text-white"
                        : i === 1
                          ? "bg-muted text-foreground"
                          : i === 2
                            ? "bg-orange-100 text-orange-700"
                            : "bg-muted text-muted-foreground"
                    )}>
                      {i + 1}
                    </div>
                    <Avatar className="h-8 w-8 border border-border shadow-sm shrink-0">
                      <AvatarImage src={u.avatar_url} />
                      <AvatarFallback className="text-[10px] font-bold">{(u.nickname || u.username)?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{u.nickname || u.username}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{u.role || 'student'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">ELO</p>
                      <p className="text-base font-black text-foreground tabular-nums">{u.elo_score}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )
        ) : (
          <Leaderboard leaderboard={leaderboard} />
        )}

        {/* Modularized Assessment Flow */}
        <AssessmentDialog 
          open={isTestOpen} 
          onOpenChange={setIsTestOpen} 
          questions={questions} 
          currentIdx={currentIdx} 
          setCurrentIdx={setCurrentIdx} 
          answers={answers} 
          handleSelect={(id, val) => setAnswers({ ...answers, [id]: val })} 
          toggleMastered={toggleMastered} 
          toggleFavorite={toggleFavorite} 
          handleSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
          gradingMessage={gradingMessage} 
        />

        <ResultReportDialog 
          open={showResultDialog} 
          onOpenChange={setShowResultDialog} 
          examSummary={examSummary} 
          results={results} 
          currentReportIdx={currentReportIdx} 
          setCurrentReportIdx={setCurrentReportIdx} 
        />
      </div>
    </PageWrapper>
  );
};
