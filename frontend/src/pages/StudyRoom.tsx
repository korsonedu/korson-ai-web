import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, Users, MessageSquare, Play, Pause, 
  RotateCcw, CheckCircle2, MoreHorizontal, 
  Plus, Zap, Timer, XCircle, ListTodo, Circle,
  Trophy, Clock, Radio, Eye, Smile, Image as ImageIcon,
  FileVideo, ArrowDown, Loader2, Calendar, Trash2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { useSystemStore } from '@/store/useSystemStore';
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
import { Badge } from '@/components/ui/badge';
import { processMathContent } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

interface Message {
  id: number;
  user_detail: { username: string; nickname: string; avatar_url: string; role: string; };
  content: string;
  timestamp: string;
  related_plan?: number;
}

interface Plan { id: number; content: string; is_completed: boolean; }

export const StudyRoom: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const { setPageHeader } = useSystemStore();
  const [timeLeft, setTimeLeft] = useState(25 * 60);

  useEffect(() => {
    setPageHeader("自习室", "保持专注，学术进化");
  }, [setPageHeader]);

  const [isActive, setIsActive] = useState(false);
  const [activePlanId, setActivePlanId] = useState<number | null>(null);
  const [duration, setDuration] = useState(25);
  const [taskName, setTaskName] = useState('深度专注学习');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [newPlan, setNewPlan] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showStopAlert, setShowStopAlert] = useState(false);
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [giphySearch, setGiphySearch] = useState('');
  const [giphyResults, setGiphyResults] = useState<any[]>([]);
  const [isGiphyLoading, setIsGiphyLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  
  const [allowBroadcast, setAllowBroadcast] = useState(user?.allow_broadcast ?? true);
  const [showOthersBroadcast, setShowOthersBroadcast] = useState(user?.show_others_broadcast ?? true);

  const updateSettings = async (field: string, val: boolean) => {
    try {
      await api.patch('/users/me/update/', { [field]: val });
      if (field === 'allow_broadcast') setAllowBroadcast(val);
      if (field === 'show_others_broadcast') setShowOthersBroadcast(val);
      updateUser({ ...user, [field]: val } as any);
      toast.success("偏好已更新");
    } catch (e) { toast.error("更新失败"); }
  };

  const fetchOnline = async () => { try { const res = await api.get('/users/online/'); setOnlineUsers(res.data); } catch (e) {} };
  const fetchMessages = async () => { try { const res = await api.get('/study/messages/'); setMessages(res.data); } catch (e) {} };
  const fetchPlans = async () => { try { const res = await api.get('/users/plans/'); setPlans(res.data); } catch (e) {} };

  useEffect(() => {
    fetchOnline(); fetchMessages(); fetchPlans();
    const interval = setInterval(() => { fetchOnline(); fetchMessages(); }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 150;
    setIsAtBottom(isBottom);
  };

  const scrollToBottom = (force = false) => {
    if (scrollContainerRef.current && (isAtBottom || force)) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (messages.length === 0) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.id !== lastMessageIdRef.current) {
      const isMe = lastMsg?.user_detail?.username === user?.username;
      if (isMe || isAtBottom) {
        setTimeout(() => scrollToBottom(true), 50);
      }
      lastMessageIdRef.current = lastMsg.id;
    }
  }, [messages, user?.username, isAtBottom]);

  const fetchGiphy = async (query: string, append = false) => {
    if (isGiphyLoading) return;
    const q = query || 'study';
    const offset = append ? giphyResults.length : 0;
    setIsGiphyLoading(true);
    try {
      const url = q === 'study' && !query
        ? `https://api.giphy.com/v1/gifs/trending?api_key=9pr9qW2ISY8cIz1AGhgyB7SE7xLuDafc&limit=20&offset=${offset}&rating=g`
        : `https://api.giphy.com/v1/gifs/search?api_key=9pr9qW2ISY8cIz1AGhgyB7SE7xLuDafc&q=${encodeURIComponent(q)}&limit=20&offset=${offset}&rating=g`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (data.data) {
        setGiphyResults(prev => append ? [...prev, ...data.data] : data.data);
      }
    } catch (e) { console.error("Giphy error", e); }
    finally { setIsGiphyLoading(false); }
  };

  const sendGif = async (url: string) => {
    try {
      await api.post('/study/messages/', { content: `![gif](${url})` });
      fetchMessages();
      setIsAtBottom(true);
      setTimeout(() => scrollToBottom(true), 100);
    } catch (e) {
      toast.error("发送 GIF 失败");
    }
  };

  const handleGiphyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop - clientHeight < 50) {
      fetchGiphy(giphySearch, true);
    }
  };

  const uploadImage = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const tid = toast.loading("正在处理图片...");
    try {
      const res = await api.post('/study/upload-image/', formData);
      setChatInput(prev => (prev ? prev + '\n' : '') + `![image](${res.data.url})`);
      toast.success("图片已就绪，点击发送即可", { id: tid });
    } catch (e) {
      toast.error("图片处理失败", { id: tid });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImage(file);
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) return uploadImage(file);
    const imageUrl = e.dataTransfer.getData('text/html').match(/src="([^"]+)"/)?.[1] || e.dataTransfer.getData('text/plain');
    if (imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('data:image'))) {
      setChatInput(prev => (prev ? prev + '\n' : '') + `![image](${imageUrl})`);
    }
  };

  const sendMessage = async () => {
    if (!chatInput.trim()) return;
    const content = chatInput;
    setChatInput('');
    try {
      await api.post('/study/messages/', { content });
      fetchMessages();
      setIsAtBottom(true);
      setTimeout(() => scrollToBottom(true), 100);
    } catch (e) {
      setChatInput(content);
      toast.error("发送失败");
    }
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
    
    if (isManual) {
      if (allowBroadcast) {
        try {
          await api.post('/study/messages/', { content: `❌ 中止了“${taskName}”任务 (专注 ${focusedMins} 分钟)` });
          fetchMessages();
        } catch (e) {}
      }
    } else {
      // Completed successfully
      if (activePlanId) {
        // It was a plan task
        try {
          await api.patch(`/users/plans/${activePlanId}/`, { is_completed: true });
          fetchPlans();
          if (allowBroadcast) {
            await api.post('/study/messages/', { 
              content: `✅ 完成了计划：${taskName}`,
              related_plan_id: activePlanId
            });
            fetchMessages();
          }
        } catch (e) {}
        setActivePlanId(null); // Reset
      } else {
        // Normal task
        if (allowBroadcast) {
          try {
            await api.post('/study/messages/', {
              content: `✅ 完成了“${taskName}”任务 (专注 ${duration} 分钟)`
            });
            fetchMessages();
          } catch (e) {}
        }
      }
      toast.success("专注已达成！");
    }
  };

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      handleCompleteTask(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Calculate the last system message ID for the current user to restrict Undo
  const mySystemMessages = messages.filter(m => 
    m.user_detail.username === user?.username && 
    (m.content.includes('💪') || m.content.includes('✅') || m.content.includes('❌') || m.content.includes('开始了“') || m.content.includes('📅') || m.content.includes('制定'))
  );
  const lastSystemMsgId = mySystemMessages.length > 0 ? mySystemMessages[mySystemMessages.length - 1].id : null;

  return (
    <div className="h-[calc(100vh-6.5rem)] flex gap-6 animate-in fade-in duration-300 text-left text-foreground">
      <div 
        className={cn("flex-1 flex flex-col bg-card rounded-3xl shadow-sm border border-border overflow-hidden relative transition-all duration-300", isDragging && "ring-4 ring-primary/20 bg-primary/5 border-primary border-dashed z-50")}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        onDrop={onDrop}
      >
        <header className="px-8 py-3 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg text-primary-foreground"><MessageSquare className="h-4 w-4" /></div>
            <h2 className="text-sm font-bold tracking-tight">学习咖啡厅</h2>
          </div>
          <div className="flex items-center gap-2">
            <Popover open={isTimerOpen} onOpenChange={setIsTimerOpen}>
              <PopoverTrigger asChild><Button className={cn("rounded-2xl h-10 px-5 gap-3 transition-all duration-500 shadow-xl border border-black/5", isActive ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:opacity-90")}><Timer className="h-4 w-4" /><span className="font-mono font-bold text-sm tracking-tight tabular-nums">{formatTime(timeLeft)}</span></Button></PopoverTrigger>
              <PopoverContent className="w-80 rounded-[2.5rem] p-8 border-none shadow-2xl bg-card/95 backdrop-blur-xl z-[100]" side="bottom" align="end">
                 <div className="space-y-5 text-center">
                    <div className="text-5xl font-mono font-bold tracking-tighter text-foreground tabular-nums">{formatTime(timeLeft)}</div>
                    <div className="space-y-4 text-left">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-30 text-foreground">时长设定</label>
                        <div className="flex items-center gap-1"><Input type="number" disabled={isActive} value={duration} onChange={e => handleDurationChange(parseInt(e.target.value) || 0)} className="w-12 h-6 p-0 text-center border-none bg-muted rounded-md text-[10px] font-bold text-foreground" /><span className="text-[10px] font-bold opacity-30 uppercase text-foreground">Min</span></div></div>
                        <Slider disabled={isActive} value={[duration]} onValueChange={v => handleDurationChange(v[0])} max={120} min={1} step={1}/>
                      </div>
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest opacity-30 ml-1 text-foreground">任务目标</label><Input value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="你想完成什么？" className="bg-muted border-none h-11 rounded-xl text-center font-bold text-sm text-foreground" /></div>
                    </div>
                    <div className="flex justify-center gap-2.5 pt-1">
                      <Button size="lg" onClick={isActive ? () => setIsActive(false) : handleStartTask} className={cn("rounded-2xl flex-1 font-bold h-12 shadow-lg", isActive ? "bg-muted text-foreground" : "bg-primary text-primary-foreground shadow-primary/10")}>{isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{isActive ? '暂停' : '开始学习'}</Button>
                      {isActive && <Button variant="destructive" onClick={() => setShowStopAlert(true)} className="rounded-2xl h-12 w-12 shadow-xl shadow-red-500/20"><XCircle className="h-5 w-5" /></Button>}
                    </div>
                 </div>
              </PopoverContent>
            </Popover>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><MoreHorizontal className="h-4 w-4"/></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-2xl p-4 space-y-4 bg-card border-border shadow-2xl">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">隐私与模式</h4>
                  <p className="text-[10px] text-muted-foreground/50">控制任务状态在共学区的可见性</p>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold">广播我的任务</Label>
                    <Switch checked={allowBroadcast} onCheckedChange={(v) => updateSettings('allow_broadcast', v)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold">接收他人广播</Label>
                    <Switch checked={showOthersBroadcast} onCheckedChange={(v) => updateSettings('show_others_broadcast', v)} />
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-8 space-y-4 scrollbar-thin scrollbar-thumb-primary/10 relative">
          <div className="max-w-4xl mx-auto space-y-4 pb-4">
            {messages.map((msg) => {
              const isMe = msg.user_detail.username === user?.username;
              const isTask = msg.content.includes('💪') || msg.content.includes('✅') || msg.content.includes('❌') || msg.content.includes('开始了“') || msg.content.includes('📅') || msg.content.includes('制定');
              if (isTask && !showOthersBroadcast && !isMe) return null;
              if (isTask) return (
                <div key={msg.id} className="flex flex-col items-center py-0.5 animate-in fade-in zoom-in-95 duration-300">
                  <div className={cn("px-6 py-1.5 rounded-2xl border flex items-center gap-3 shadow-sm relative group/task", 
                    msg.content.includes('💪') || msg.content.includes('开始') ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : 
                    msg.content.includes('✅') ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : 
                    (msg.content.includes('📅') || msg.content.includes('制定')) ? "bg-orange-500/10 text-orange-600 border-orange-500/20" :
                    "bg-red-500/10 text-red-600 border-red-500/20"
                  )}>
                     {msg.content.includes('💪') || msg.content.includes('开始') ? <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500" /> : 
                      msg.content.includes('✅') ? <CheckCircle2 className="h-3 w-3 text-blue-500" /> : 
                      (msg.content.includes('📅') || msg.content.includes('制定')) ? <Calendar className="h-3 w-3 text-orange-500" /> :
                      <XCircle className="h-3 w-3 text-red-500" />
                     }
                     <span className="text-[11px] font-bold tracking-tight text-foreground"><span className="opacity-70">{msg.user_detail.nickname || msg.user_detail.username}</span> {msg.content.split(msg.user_detail.username)[1] || msg.content}</span>
                     
                     {/* Undo Button - Restricted to Last Message Only */}
                     {isMe && msg.related_plan && msg.id === lastSystemMsgId && (
                        <button 
                          onClick={async () => {
                            try {
                              await api.post(`/study/messages/${msg.id}/undo/`);
                              toast.success("已撤销");
                              fetchMessages();
                              fetchPlans();
                            } catch (e) { toast.error("撤销失败"); }
                          }}
                          className="ml-3 text-[9px] font-bold text-muted-foreground/50 hover:text-red-500 underline decoration-dotted underline-offset-2 transition-colors cursor-pointer"
                        >
                          撤销
                        </button>
                     )}
                  </div>
                </div>
              );
              const isMediaOnly = msg.content.trim().startsWith('![') && msg.content.trim().endsWith(')');
              
              return (
                <div key={msg.id} className={cn("flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300", isMe ? "flex-row-reverse text-right" : "flex-row text-left")}>
                  <Avatar className="h-9 w-9 border border-border shadow-sm shrink-0 group-hover:scale-105 transition-transform"><AvatarImage src={msg.user_detail.avatar_url} /><AvatarFallback className="text-[10px] font-bold bg-muted">{(msg.user_detail.nickname || msg.user_detail.username)[0]}</AvatarFallback></Avatar>
                  <div className={cn("flex flex-col gap-1 max-w-[70%] w-fit", isMe ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 px-1 text-muted-foreground"><span className="text-[9px] font-bold uppercase tracking-widest">{msg.user_detail.nickname || msg.user_detail.username}</span></div>
                    <div 
                      className={cn(
                        "text-[13px] leading-relaxed break-words overflow-hidden text-left w-fit h-fit", 
                        !isMediaOnly && (isMe ? "p-2 px-3 bg-slate-900 text-white rounded-2xl rounded-tr-none shadow-sm font-medium" : "p-2 px-3 rounded-2xl rounded-tl-none shadow-sm font-medium")
                      )}
                      style={!isMediaOnly && !isMe ? { backgroundColor: '#ffb0b3', color: '#0f172a' } : {}}
                    >
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]} 
                        components={{ 
                          img: ({node, ...props}) => <img {...props} className="max-w-[130px] md:max-w-[200px] rounded-lg my-0.5 cursor-zoom-in hover:opacity-90 transition-opacity" onClick={() => window.open(props.src || '', '_blank')}/>, 
                          p: ({node, ...props}) => <p {...props} className="m-0 leading-normal w-fit" />,
                          div: ({node, ...props}) => <div {...props} className="w-fit" />
                        }}
                      >
                        {processMathContent(msg.content)}
                      </ReactMarkdown>
                    </div>
                    {/* User Message Timestamp - Outside */}
                    <span className="text-[9px] text-muted-foreground/40 mt-0.3 block px-1 font-medium">
                      {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {!isAtBottom && (
          <Button onClick={() => scrollToBottom(true)} size="icon" className="absolute bottom-24 right-8 rounded-full h-10 w-10 shadow-2xl bg-primary text-primary-foreground z-50 hover:scale-110 transition-transform opacity-80 hover:opacity-100 border border-white/10"><ArrowDown className="h-5 w-5"/></Button>
        )}

        <footer className="p-4 bg-card/80 backdrop-blur-md border-t border-border z-20">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex gap-2 px-1">
              <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><Smile className="h-4 w-4"/></Button></PopoverTrigger>
                <PopoverContent side="top" className="w-64 p-2 rounded-2xl border-border shadow-2xl bg-card"><div className="grid grid-cols-8 gap-1">{['😊','😂','🤣','😍','😒','🤔','😭','👍','🙌','🔥','✨','💯','📚','🎓','💪','🎯','❤️','✔️','❌','⚠️','🚀','💡','🌟','🎉'].map(e => (<button key={e} onClick={() => setChatInput(prev => prev + e)} className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded-lg text-lg transition-colors">{e}</button>))}</div></PopoverContent>
              </Popover>
              <Popover onOpenChange={(open) => open && giphyResults.length === 0 && fetchGiphy('')}>
                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><FileVideo className="h-4 w-4"/></Button></PopoverTrigger>
                <PopoverContent side="top" className="w-80 p-3 rounded-2xl border-border shadow-2xl space-y-3 bg-card z-[100]">
                  <Input placeholder="搜索 GIPHY..." value={giphySearch} onChange={e => { setGiphySearch(e.target.value); fetchGiphy(e.target.value); }} className="h-9 text-xs rounded-xl bg-muted border-none text-foreground placeholder:opacity-50 focus-visible:ring-1 focus-visible:ring-primary/20" />
                  <div onScroll={handleGiphyScroll} className="grid grid-cols-4 gap-2 h-72 overflow-y-auto pr-1 scrollbar-thin">
                    {giphyResults.map(g => (
                      <div key={g.id} className="relative group/gif">
                        <button 
                          type="button"
                          onClick={() => sendGif(g.images.original.url)}
                          className="w-full aspect-square rounded-lg overflow-hidden bg-muted transition-all hover:ring-2 ring-primary"
                        >
                          <img src={g.images.fixed_height_small.url} className="w-full h-full object-cover" />
                        </button>
                        <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 scale-0 group-hover/gif:scale-100 transition-all z-[110] pointer-events-none origin-bottom">
                          <div className="w-32 aspect-square rounded-xl overflow-hidden shadow-2xl border-2 border-primary bg-card">
                            <img src={g.images.fixed_height_small.url} className="w-full h-full object-cover" />
                          </div>
                        </div>
                      </div>
                    ))}
                    {isGiphyLoading && (
                      <div className="col-span-4 py-2 flex justify-center">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground opacity-30" />
                      </div>
                    )}
                  </div>
                  <p className="text-[8px] text-center text-muted-foreground font-bold opacity-50 uppercase tracking-tighter">Powered by GIPHY · 无限下滑</p>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"><ImageIcon className="h-4 w-4"/></Button>
              <input type="file" ref={fileInputRef} onChange={(e) => handleFileUpload(e)} className="hidden" accept="image/*" />
            </div>
                                    <div className="flex gap-3 bg-muted rounded-2xl p-1 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/5 transition-all shadow-inner border border-border">
                                      <Input value={chatInput} onChange={e => setChatInput(e.target.value)} onCompositionStart={() => setIsComposing(true)} onCompositionEnd={() => setIsComposing(false)} onKeyDown={e => { if (e.key === 'Enter' && !isComposing) { e.preventDefault(); sendMessage(); } }} placeholder="发送消息 (支持拖入图片)..." className="bg-transparent border-none shadow-none focus-visible:ring-0 text-[13px] h-10 px-4 text-foreground placeholder:text-muted-foreground/50" />
                                      <Button onClick={sendMessage} size="icon" className="rounded-xl h-10 w-10 bg-primary text-primary-foreground shadow-xl shrink-0 hover:opacity-90 active:scale-95 transition-transform"><Send className="h-4 w-4" /></Button>
                                    </div>
                                  </div>
                                </footer>
                              </div>
                        
                              <div className="w-72 flex flex-col gap-6 shrink-0 text-foreground">
                                <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden p-6 flex-1 min-h-0 flex flex-col border border-border">
                                  <header className="mb-4 flex items-center justify-between"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">实时共学</CardTitle><Users className="h-4 w-4 text-muted-foreground opacity-20" /></header>
                                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
                                    {onlineUsers.map((u, i) => (<HoverCard key={i}><HoverCardTrigger asChild><div className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted transition-all cursor-pointer border border-transparent hover:border-border group"><div className="relative shrink-0"><Avatar className="h-9 w-9 border border-border shadow-sm group-hover:ring-2 ring-emerald-500/20 transition-all"><AvatarImage src={u.avatar_url}/></Avatar><span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm"/></div><div className="flex-1 min-w-0"><p className="text-xs font-bold text-foreground truncate">{u.nickname || u.username} {u.username === user?.username && "(你)"}</p><p className="text-[9px] text-emerald-600 font-bold truncate mt-0.5 uppercase tracking-tight">{u.current_task || '在线中'}</p></div></div></HoverCardTrigger><HoverCardContent side="left" className="w-80 rounded-[2rem] p-6 border-none shadow-2xl bg-card/95 backdrop-blur-xl z-50 text-left text-foreground"><div className="flex space-x-4"><Avatar className="h-12 w-12 border border-border shadow-sm"><AvatarImage src={u.avatar_url}/></Avatar><div className="space-y-3 flex-1 text-left"><div className="flex justify-between items-center"><h4 className="text-sm font-bold">{u.nickname || u.username}</h4><Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-600 rounded-full">ELO {u.elo_score}</Badge></div><div className="space-y-2 pt-2 border-t border-border"><div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">今日专注: {u.today_focused_minutes} min</span></div><div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">今日已完成: {u.today_completed_tasks?.length || 0} tasks</span></div></div></div></div></HoverCardContent></HoverCard>))}</div>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden p-6 flex-1 min-h-0 flex flex-col border border-border">
          <header className="mb-4 flex items-center justify-between border-b border-border pb-4"><CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">计划清单</CardTitle><ListTodo className="h-4 w-4 text-muted-foreground opacity-20" /></header>
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-2 scrollbar-none">
            {plans.map(p => (
              <div key={p.id} className={cn("group flex items-center gap-3 p-2 rounded-2xl transition-all border border-transparent", p.is_completed ? "bg-muted/30 opacity-60" : "hover:bg-muted hover:border-border")}>
                <button 
                  disabled={p.is_completed}
                  className={cn("transition-colors", p.is_completed ? "cursor-not-allowed" : "cursor-pointer")}
                  onClick={async () => { 
                    if (p.is_completed) return;
                    try {
                      await api.patch(`/users/plans/${p.id}/`, { is_completed: true });
                      fetchPlans();
                      if (allowBroadcast) {
                        await api.post('/study/messages/', { 
                          content: `✅ 完成了计划：${p.content}`,
                          related_plan_id: p.id
                        });
                        fetchMessages();
                      }
                    } catch (e) {}
                  }}
                >
                  {p.is_completed ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Circle className="h-4 w-4 text-muted-foreground/20 group-hover:text-emerald-500" />}
                </button>
                <span onClick={() => { if(!p.is_completed) { setTaskName(p.content); setActivePlanId(p.id); setIsTimerOpen(true); } }} className={cn("text-xs font-bold truncate flex-1", p.is_completed ? "line-through text-muted-foreground cursor-default" : "text-foreground cursor-pointer")}>{p.content}</span>
                
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await api.delete(`/users/plans/${p.id}/`);
                      fetchPlans();
                      toast.success("计划已删除");
                    } catch (e) { toast.error("删除失败"); }
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-100 rounded-lg text-muted-foreground/50 hover:text-red-500 cursor-pointer"
                  title="删除计划"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Input 
              value={newPlan} 
              onChange={e => setNewPlan(e.target.value)} 
              onKeyDown={async (e) => { 
                if (e.key === 'Enter' && !(e.nativeEvent as any).isComposing) {
                  if (!newPlan.trim()) return;
                  const res = await api.post('/users/plans/', { content: newPlan });
                  if (allowBroadcast) {
                    await api.post('/study/messages/', { 
                      content: `📅 制定了计划：${newPlan}`,
                      related_plan_id: res.data.id
                    });
                    fetchMessages();
                  }
                  fetchPlans();
                  setNewPlan('');
                }
              }} 
              placeholder="ADD TARGET..." 
              className="bg-muted border-none h-8 rounded-lg text-[9px] font-bold px-3 text-foreground focus-visible:ring-1 focus-visible:ring-primary/20" 
            />
            <Button 
              onClick={async () => { 
                if (!newPlan.trim()) return; 
                const res = await api.post('/users/plans/', { content: newPlan }); 
                if (allowBroadcast) {
                  await api.post('/study/messages/', { 
                    content: `📅 制定了计划：${newPlan}`,
                    related_plan_id: res.data.id
                  });
                  fetchMessages();
                }
                fetchPlans(); 
                setNewPlan(''); 
              }} 
              size="icon" 
              className="h-8 w-8 bg-primary text-primary-foreground rounded-lg shrink-0 hover:opacity-90 active:scale-95 transition-all"
            >
              <Plus className="h-3.5 w-3.5"/>
            </Button>
          </div>
        </Card>
      </div>

      <AlertDialog open={showStopAlert} onOpenChange={setShowStopAlert}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl bg-card">
          <AlertDialogHeader><AlertDialogTitle className="text-foreground">确定要中止任务吗？</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">离开当前页面将视为一次未完成的任务，并向讨论区广播。确定离开吗？</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setShowStopAlert(false)} className="rounded-xl border-border text-foreground hover:bg-muted">继续专注</AlertDialogCancel><AlertDialogAction onClick={async () => { 
            setIsActive(false); setShowStopAlert(false);
            const focusedMins = Math.floor((duration * 60 - timeLeft) / 60);
            if (allowBroadcast) {
              await api.post('/study/messages/', { content: `❌ 中止了“${taskName}”任务 (专注 ${focusedMins} 分钟)` });
              fetchMessages();
            }
          }} className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold">中止并离开</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
