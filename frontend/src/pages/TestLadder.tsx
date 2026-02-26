import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowRight, BrainCircuit, Activity, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import { useSystemStore } from '@/store/useSystemStore';
import { useSearchParams } from 'react-router-dom';

// Modularized Components
import { AssessmentDialog } from './test-ladder/AssessmentDialog';
import { ResultReportDialog } from './test-ladder/ResultReportDialog';
import { Leaderboard } from './test-ladder/Leaderboard';

export const TestLadder: React.FC = () => {
  const { primaryColor } = useSystemStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
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
    fetchLeaderboard();
    fetchGoals();
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
    try {
      const res = await api.get(`/quizzes/questions/?limit=${qCount}`);
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
      toast.success("试卷已提交 AI 批改", { description: "完成后将通过系统通知发送报告。" });
      setIsTestOpen(false);
      fetchGoals();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "提交失败");
    } finally { setIsSubmitting(false); }
  };

  return (
    <PageWrapper title="学术天梯" subtitle="基于 FSRS 记忆算法的智能评估，精准量化学术成长路径。">
      <div className="flex flex-col gap-12 text-left animate-in fade-in duration-700 pb-20 max-w-6xl mx-auto">
        
        {/* Main Entry Card */}
        <Card className="border border-slate-200/60 bg-white rounded-[3rem] p-12 overflow-hidden relative shadow-sm hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none" />
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10">
            <div className="space-y-6 max-w-2xl text-left">
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900 leading-[1.1]">开启 FSRS<br />智能评估系统</h2>
              <p className="text-base font-medium leading-relaxed text-slate-500 max-w-lg">
                FSRS 系统将根据您的历史记录自动定位知识盲区。通过深度学术训练，协助您在有限的时间内构建出色的专业素养与得分能力。
              </p>

              <div className="flex flex-wrap items-center gap-6 pt-4">
                <div className="flex flex-col gap-2">
                  <span className="text-[14px] font-bold text-slate-400 uppercase tracking-[0.2em] ml-1">单次抽题量</span>
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
                      <Input type="number" min="1" value={qCount} onChange={(e) => setQCount(e.target.value)} onBlur={() => { if (!qCount || parseInt(qCount) < 1) setQCount("1"); }} className="w-20 h-12 rounded-2xl bg-slate-50 border-slate-200/60 font-bold text-center" />
                    )}
                  </div>
                </div>
                <Button onClick={startTest} className="h-14 px-12 text-white hover:opacity-90 rounded-2xl font-bold text-lg shadow-xl transition-all active:scale-95 self-end" style={{ backgroundColor: primaryColor }}>
                  开启训练 <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-4 w-full lg:w-72 shrink-0">
              <div className="p-7 bg-slate-50 border border-slate-100 rounded-[2.5rem] transition-all hover:bg-white hover:shadow-lg flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-9 w-9 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-500"><BrainCircuit className="h-4 w-4" /></div>
                  <p className="text-[14px] font-bold text-slate-400 uppercase tracking-widest leading-none">今日复习</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="text-4xl font-black text-slate-900 tabular-nums">{goals.review_goal}</p>
                  <span className="text-[12px] font-bold text-slate-400 uppercase">Due</span>
                </div>
              </div>
              <div className="p-7 bg-slate-50 border border-slate-100 rounded-[2.5rem] transition-all hover:bg-white hover:shadow-lg flex flex-col justify-center">
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

        <Leaderboard leaderboard={leaderboard} />
      </div>
    </PageWrapper>
  );
};
