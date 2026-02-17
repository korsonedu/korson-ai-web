import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Send, Users, MessageSquare, Play, Pause, 
  RotateCcw, CheckCircle2, MoreHorizontal, 
  Plus, Zap, Timer, XCircle, ListTodo, Circle,
  Trophy, Clock, Radio, Eye
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useBlocker } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Message {
  id: number;
  user_detail: { username: string; avatar_url: string; role: string; };
  content: string;
  timestamp: string;
}

interface Plan { id: number; content: string; is_completed: boolean; }

export const StudyRoom: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [duration, setDuration] = useState(25);
  const [taskName, setTaskName] = useState('深度专注学习');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [newPlan, setNewPlan] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showStopAlert, setShowStopAlert] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  
  const [allowBroadcast, setAllowBroadcast] = useState(user?.allow_broadcast ?? true);
  const [showOthersBroadcast, setShowOthersBroadcast] = useState(user?.show_others_broadcast ?? true);

  // 同步隐私设置到后端
  const handleToggleBroadcast = async (val: boolean) => {
    setAllowBroadcast(val);
    try {
      await api.patch('/users/me/update/', { allow_broadcast: val });
      updateUser({ allow_broadcast: val });
    } catch (e) {
      toast.error("设置保存失败");
    }
  };

  const handleToggleOthersBroadcast = async (val: boolean) => {
    setShowOthersBroadcast(val);
    try {
      await api.patch('/users/me/update/', { show_others_broadcast: val });
      updateUser({ show_others_broadcast: val });
    } catch (e) {
      toast.error("设置保存失败");
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isActive && currentLocation.pathname !== nextLocation.pathname
  );

  const fetchOnline = async () => { try { const res = await api.get('/users/online/'); setOnlineUsers(res.data); } catch (e) {} };
  const fetchMessages = async () => { try { const res = await api.get('/study/messages/'); setMessages(res.data); } catch (e) {} };
  const fetchPlans = async () => { try { const res = await api.get('/users/plans/'); setPlans(res.data); } catch (e) {} };

  useEffect(() => {
    fetchOnline(); fetchMessages(); fetchPlans();
    const interval = setInterval(() => { fetchOnline(); fetchMessages(); }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (blocker.state === "blocked") setShowStopAlert(true);
  }, [blocker.state]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      handleCompleteTask(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleStartTask = async () => {
    if (!taskName.trim()) return toast.error("请输入任务名称");
    setIsActive(true);
    setIsTimerOpen(false);
    if (allowBroadcast) {
      try {
        await api.post('/study/messages/', { content: `💪 开始了“${taskName}”任务 (计划 ${duration} 分钟)` });
        fetchMessages();
      } catch (e) {}
    }
  };

  const handleCompleteTask = async (isManual: boolean) => {
    setIsActive(false);
    const focusedMins = Math.floor((duration * 60 - timeLeft) / 60);
    if (allowBroadcast) {
      try {
        await api.post('/study/messages/', {
          content: isManual ? `❌ 中止了“${taskName}”任务 (专注 ${focusedMins} 分钟)` : `✅ 完成了“${taskName}”任务 (专注 ${duration} 分钟)`
        });
        fetchMessages();
      } catch (e) {}
    }
    toast.success(isManual ? "任务已终止" : "专注已达成！");
    if (blocker.state === "blocked") blocker.proceed();
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    try {
      await api.post('/study/messages/', { content: chatInput });
      setChatInput('');
      fetchMessages();
    } catch (e) {}
  };

  const addPlan = async () => {
    if (!newPlan.trim()) return;
    try {
      const res = await api.post('/users/plans/', { content: newPlan });
      setPlans([...plans, res.data]);
      setNewPlan('');
    } catch (e) {}
  };

  const togglePlan = async (p: Plan) => {
    try {
      await api.patch(`/users/plans/${p.id}/`, { is_completed: !p.is_completed });
      fetchPlans();
    } catch (e) {}
  };

  const handlePlanClick = (p: Plan) => {
    if (p.is_completed) return;
    setTaskName(p.content);
    setIsTimerOpen(true);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleDurationChange = (val: number) => {
    const v = Math.min(120, Math.max(1, val));
    setDuration(v);
    if (!isActive) setTimeLeft(v * 60);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex gap-6 animate-in fade-in duration-300 text-left">
      
      {/* Main Discussion Area */}
      <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-black/[0.03] overflow-hidden">
        <header className="px-8 py-3 border-b border-black/[0.03] flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-xl bg-black flex items-center justify-center shadow-lg"><MessageSquare className="h-4 w-4 text-white" /></div>
            <div><h2 className="text-sm font-bold tracking-tight text-[#1D1D1F]">讨论区</h2></div>
          </div>
          
          <div className="flex items-center gap-2">
            <Popover open={isTimerOpen} onOpenChange={setIsTimerOpen}>
              <PopoverTrigger asChild>
                <Button className={cn("rounded-2xl h-10 px-5 gap-3 transition-all duration-500 shadow-xl border border-black/5", isActive ? "bg-emerald-500 text-white shadow-emerald-500/20" : "bg-black text-white hover:bg-black/90")}>
                  <Timer className="h-4 w-4" /><span className="font-mono font-bold text-sm tracking-tight tabular-nums">{formatTime(timeLeft)}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-[2.5rem] p-8 border-none shadow-2xl bg-white/95 backdrop-blur-xl z-[100]" side="bottom" align="end">
                 <div className="space-y-5 text-center">
                    <div className="text-5xl font-mono font-bold tracking-tighter text-[#1D1D1F] tabular-nums">{formatTime(timeLeft)}</div>
                    <div className="space-y-4 text-left">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-30">时长设定</label>
                        <div className="flex items-center gap-1"><Input type="number" disabled={isActive} value={duration} onChange={e => handleDurationChange(parseInt(e.target.value) || 0)} className="w-12 h-6 p-0 text-center border-none bg-slate-100 rounded-md text-[10px] font-bold" /><span className="text-[10px] font-bold opacity-30 uppercase">Min</span></div></div>
                        <Slider disabled={isActive} value={[duration]} onValueChange={v => handleDurationChange(v[0])} max={120} min={1} step={1}/>
                      </div>
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest opacity-30 ml-1">任务目标</label><Input value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="你想完成什么？" className="bg-slate-50 border-none h-11 rounded-xl text-center font-bold text-sm" /></div>
                    </div>
                    <div className="flex justify-center gap-2.5 pt-1">
                      <Button size="lg" onClick={isActive ? () => setIsActive(false) : handleStartTask} className={cn("rounded-2xl flex-1 font-bold h-12 shadow-lg", isActive ? "bg-slate-100 text-black shadow-none" : "bg-black text-white shadow-black/10")}>{isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{isActive ? '暂停' : '开始学习'}</Button>
                      {isActive ? <Button variant="destructive" onClick={() => setShowStopAlert(true)} className="rounded-2xl h-12 w-12 shadow-xl shadow-red-500/20"><XCircle className="h-5 w-5" /></Button> : <Button variant="ghost" onClick={() => { setTimeLeft(duration * 60); setIsActive(false); }} className="rounded-2xl h-12 w-12 hover:bg-slate-50"><RotateCcw className="h-4 w-4" /></Button>}
                    </div>
                 </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-[#86868B] hover:text-black border border-transparent hover:border-black/5"><MoreHorizontal className="h-5 w-5" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 bg-white/95 backdrop-blur-xl border-black/5 shadow-2xl">
                 <div className="space-y-3 p-2">
                    <div className="flex items-center justify-between"><Label className="text-[10px] font-bold opacity-40 uppercase">广播我的状态</Label><Switch checked={allowBroadcast} onCheckedChange={handleToggleBroadcast} className="scale-75 origin-right"/></div>
                    <div className="flex items-center justify-between"><Label className="text-[10px] font-bold opacity-40 uppercase">查看他人状态</Label><Switch checked={showOthersBroadcast} onCheckedChange={handleToggleOthersBroadcast} className="scale-75 origin-right"/></div>
                 </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-8 space-y-8 max-w-4xl mx-auto">
            {messages.map((msg) => {
              const isMe = msg.user_detail.username === user?.username;
              const isTask = msg.content.includes('💪') || msg.content.includes('✅') || msg.content.includes('❌');
              if (isTask && !showOthersBroadcast && !isMe) return null;
              if (isTask) return (
                <div key={msg.id} className="flex justify-center py-2">
                  <div className={cn("px-6 py-2 rounded-2xl border flex items-center gap-3 shadow-sm", msg.content.includes('💪') ? "bg-emerald-50 text-emerald-700 border-emerald-100/50" : msg.content.includes('✅') ? "bg-blue-50 text-blue-700 border-blue-100/50" : "bg-red-50 text-red-700 border-red-100/50")}>
                     {msg.content.includes('💪') ? <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500" /> : msg.content.includes('✅') ? <CheckCircle2 className="h-3 w-3 text-blue-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                     <span className="text-[11px] font-bold tracking-tight"><span className="opacity-70">{msg.user_detail.username}</span> {msg.content.split(msg.user_detail.username)[1] || msg.content}</span>
                  </div>
                </div>
              );
              return (
                <div key={msg.id} className={cn("flex gap-4", isMe ? "flex-row-reverse text-right" : "flex-row text-left")}>
                  <Avatar className="h-9 w-9 border border-black/[0.05] shadow-sm shrink-0 group-hover:scale-105 transition-transform"><AvatarImage src={msg.user_detail.avatar_url} /><AvatarFallback className="text-[10px] font-bold bg-slate-50">{msg.user_detail.username[0]}</AvatarFallback></Avatar>
                  <div className={cn("flex flex-col gap-1 max-w-[70%]", isMe ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 px-1"><span className="text-[9px] font-bold uppercase tracking-widest text-[#86868B]">{msg.user_detail.username}</span></div>
                    <div className={cn("p-3 px-4 text-[13px] leading-relaxed shadow-sm rounded-2xl", isMe ? "bg-black text-white rounded-tr-none font-medium" : "bg-[#F5F5F7] text-[#1D1D1F] rounded-tl-none border border-black/[0.01]")}>{msg.content}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <footer className="p-4 bg-white/80 backdrop-blur-md border-t border-black/[0.03] z-20">
          <div className="max-w-4xl mx-auto flex gap-3 bg-[#F5F5F7] rounded-[1.25rem] p-1 focus-within:bg-white focus-within:ring-1 focus-within:ring-black/5 transition-all shadow-inner border border-black/[0.01]">
            <Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="发送消息..." className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-9 px-4" />
            <Button onClick={sendMessage} size="icon" className="rounded-xl h-9 w-9 bg-black text-white shadow-xl shrink-0"><Send className="h-3.5 w-3.5" /></Button>
          </div>
        </footer>
      </div>

      <div className="w-72 flex flex-col gap-6 shrink-0">
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden p-6 flex-1 flex flex-col border border-black/[0.03]">
          <header className="mb-4 flex items-center justify-between">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">实时共学</CardTitle>
            <Users className="h-4 w-4 text-black/20" />
          </header>
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-3 text-left">
              {onlineUsers.map((u, i) => (
                <HoverCard key={i}>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer border border-transparent hover:border-black/[0.02]">
                      <div className="relative shrink-0">
                        <Avatar className="h-9 w-9 border border-black/5 shadow-sm group-hover:ring-2 ring-emerald-500/20 transition-all"><AvatarImage src={u.avatar_url}/></Avatar>
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white shadow-sm"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1D1D1F] truncate">{u.username} {u.username === user?.username && "(你)"}</p>
                        <p className="text-[9px] text-emerald-600 font-bold truncate mt-0.5 uppercase tracking-tight">{u.current_task || '在线中'}</p>
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="left" className="w-80 rounded-[2rem] p-6 border-none shadow-2xl bg-white/95 backdrop-blur-xl z-50 text-left">
                    <div className="flex space-x-4">
                      <Avatar className="h-12 w-12 border border-black/5 shadow-sm"><AvatarImage src={u.avatar_url}/></Avatar>
                      <div className="space-y-3 flex-1 text-left">
                        <div className="flex justify-between items-center"><h4 className="text-sm font-bold">{u.username}</h4><Badge variant="outline" className="text-[10px] border-emerald-100 text-emerald-600 rounded-full">ELO {u.elo_score}</Badge></div>
                        <div className="space-y-2 pt-2 border-t border-black/[0.03]">
                           <div className="flex items-center gap-2 text-[#86868B]"><Clock className="h-3.5 w-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">今日专注: {u.today_focused_minutes} min</span></div>
                           <div className="flex items-center gap-2 text-[#86868B]"><CheckCircle2 className="h-3.5 w-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">今日已完成: {u.today_completed_tasks?.length || 0} tasks</span></div>
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden p-6 flex-1 flex flex-col border border-black/[0.03]">
          <header className="mb-4 flex items-center justify-between border-b border-black/[0.03] pb-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-[#86868B]">当日计划</CardTitle>
            <ListTodo className="h-4 w-4 text-black/20" />
          </header>
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-3 text-left">
              {plans.map(p => (
                <div key={p.id} className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-black/[0.02]">
                  <button onClick={() => togglePlan(p)}>{p.is_completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-black/10" />}</button>
                  <span onClick={() => handlePlanClick(p)} className={cn("text-xs font-bold truncate flex-1 cursor-pointer", p.is_completed ? "line-through text-black/20" : "text-[#1D1D1F]")}>{p.content}</span>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="mt-4 flex gap-2"><Input value={newPlan} onChange={e => setNewPlan(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPlan()} placeholder="ADD TARGET..." className="bg-[#F5F5F7] border-none h-10 rounded-xl text-[10px] font-bold px-4" /><Button onClick={addPlan} size="icon" className="h-10 w-10 bg-black text-white rounded-xl shrink-0"><Plus className="h-4 w-4"/></Button></div>
        </Card>
      </div>

      <AlertDialog open={showStopAlert} onOpenChange={setShowStopAlert}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
          <AlertDialogHeader><AlertDialogTitle>确定要中止任务吗？</AlertDialogTitle><AlertDialogDescription>离开当前页面将视为一次未完成的任务，并向讨论区广播。确定离开吗？</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => { setShowStopAlert(false); if (blocker.state === "blocked") blocker.reset(); }} className="rounded-xl">继续专注</AlertDialogCancel><AlertDialogAction onClick={() => { setShowStopAlert(false); handleCompleteTask(true); }} className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold">中止并离开</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
