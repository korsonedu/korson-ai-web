import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Send, Users, MessageSquare, Play, Pause, 
  RotateCcw, CheckCircle2, MoreHorizontal, 
  Plus, Zap, Timer, XCircle, ListTodo, Circle,
  Trophy, Clock, Radio, Eye, Smile, Image as ImageIcon,
  FileVideo, ArrowDown
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
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [isComposing, setIsComposing] = useState(false);
  const [giphySearch, setGiphySearch] = useState('');
  const [giphyResults, setGiphyResults] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [allowBroadcast, setAllowBroadcast] = useState(user?.allow_broadcast ?? true);
  const [showOthersBroadcast, setShowOthersBroadcast] = useState(user?.show_others_broadcast ?? true);

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
    const isBottom = scrollHeight - scrollTop - clientHeight < 100;
    setIsAtBottom(isBottom);
  };

  const scrollToBottom = (force = false) => {
    if (scrollContainerRef.current && (isAtBottom || force)) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const isMe = lastMsg?.user_detail?.username === user?.username;
    scrollToBottom(isMe);
  }, [messages]);

  const fetchGiphy = async (query: string) => {
    const q = query || 'study';
    try {
      // 使用更可靠的公共 Beta Key
      const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&q=${encodeURIComponent(q)}&limit=12&rating=g`);
      const data = await res.json();
      if (data.data) setGiphyResults(data.data);
    } catch (e) {
      console.error("Giphy error", e);
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
      toast.error("上传失败", { id: tid });
    }
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadImage(file);
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

  return (
    <div className="h-[calc(100vh-8.5rem)] flex gap-6 animate-in fade-in duration-300 text-left">
      
      {/* Main Discussion Area */}
      <div 
        className={cn(
          "flex-1 flex flex-col bg-card rounded-3xl shadow-sm border border-border overflow-hidden relative transition-all duration-300",
          isDragging && "ring-4 ring-primary/20 bg-primary/5 border-primary border-dashed"
        )}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
        onDrop={onDrop}
      >
        <header className="px-8 py-3 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg"><MessageSquare className="h-4 w-4 text-primary-foreground" /></div>
            <h2 className="text-sm font-bold tracking-tight text-foreground">讨论区</h2>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => { fetchOnline(); fetchMessages(); }} className="rounded-xl h-9 w-9 text-muted-foreground hover:text-foreground"><RotateCcw className="h-4 w-4"/></Button>
            <Popover open={isTimerOpen} onOpenChange={setIsTimerOpen}>
              <PopoverTrigger asChild>
                <Button className={cn("rounded-2xl h-10 px-5 gap-3 transition-all duration-500 shadow-xl border border-black/5", isActive ? "bg-emerald-500 text-white" : "bg-primary text-primary-foreground hover:opacity-90")}>
                  <Timer className="h-4 w-4" /><span className="font-mono font-bold text-sm tracking-tight tabular-nums">{formatTime(timeLeft)}</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 rounded-[2.5rem] p-8 border-none shadow-2xl bg-card/95 backdrop-blur-xl z-[100]" side="bottom" align="end">
                 <div className="space-y-5 text-center">
                    <div className="text-5xl font-mono font-bold tracking-tighter text-foreground tabular-nums">{formatTime(timeLeft)}</div>
                    <div className="space-y-4 text-left">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center mb-1"><label className="text-[10px] font-bold uppercase tracking-widest opacity-30">时长设定</label>
                        <div className="flex items-center gap-1"><Input type="number" disabled={isActive} value={duration} onChange={e => handleDurationChange(parseInt(e.target.value) || 0)} className="w-12 h-6 p-0 text-center border-none bg-muted rounded-md text-[10px] font-bold" /><span className="text-[10px] font-bold opacity-30 uppercase">Min</span></div></div>
                        <Slider disabled={isActive} value={[duration]} onValueChange={v => handleDurationChange(v[0])} max={120} min={1} step={1}/>
                      </div>
                      <div className="space-y-2"><label className="text-[10px] font-bold uppercase tracking-widest opacity-30 ml-1">任务目标</label><Input value={taskName} onChange={e => setTaskName(e.target.value)} placeholder="你想完成什么？" className="bg-muted border-none h-11 rounded-xl text-center font-bold text-sm" /></div>
                    </div>
                    <div className="flex justify-center gap-2.5 pt-1">
                      <Button size="lg" onClick={isActive ? () => setIsActive(false) : () => setIsActive(true)} className={cn("rounded-2xl flex-1 font-bold h-12 shadow-lg", isActive ? "bg-muted text-foreground" : "bg-primary text-primary-foreground shadow-primary/10")}>{isActive ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}{isActive ? '暂停' : '开始学习'}</Button>
                      {isActive && <Button variant="destructive" onClick={() => setShowStopAlert(true)} className="rounded-2xl h-12 w-12 shadow-xl shadow-red-500/20"><XCircle className="h-5 w-5" /></Button>}
                    </div>
                 </div>
              </PopoverContent>
            </Popover>
          </div>
        </header>

        {/* Custom Scrollable Area */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-primary/10"
        >
          <div className="max-w-4xl mx-auto space-y-8">
            {messages.map((msg) => {
              const isMe = msg.user_detail.username === user?.username;
              const isTask = msg.content.includes('💪') || msg.content.includes('✅') || msg.content.includes('❌') || msg.content.includes('开始了“');
              if (isTask && !showOthersBroadcast && !isMe) return null;
              if (isTask) return (
                <div key={msg.id} className="flex justify-center py-2 animate-in fade-in zoom-in-95 duration-300">
                  <div className={cn("px-6 py-2 rounded-2xl border flex items-center gap-3 shadow-sm", msg.content.includes('💪') || msg.content.includes('开始') ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : msg.content.includes('✅') ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-red-500/10 text-red-600 border-red-500/20")}>
                     {msg.content.includes('💪') || msg.content.includes('开始') ? <Zap className="h-3 w-3 fill-emerald-500 text-emerald-500" /> : msg.content.includes('✅') ? <CheckCircle2 className="h-3 w-3 text-blue-500" /> : <XCircle className="h-3 w-3 text-red-500" />}
                     <span className="text-[11px] font-bold tracking-tight"><span className="opacity-70">{msg.user_detail.username}</span> {msg.content.split(msg.user_detail.username)[1] || msg.content}</span>
                  </div>
                </div>
              );
              return (
                <div key={msg.id} className={cn("flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300", isMe ? "flex-row-reverse text-right" : "flex-row text-left")}>
                  <Avatar className="h-9 w-9 border border-border shadow-sm shrink-0 group-hover:scale-105 transition-transform"><AvatarImage src={msg.user_detail.avatar_url} /><AvatarFallback className="text-[10px] font-bold bg-muted">{msg.user_detail.username[0]}</AvatarFallback></Avatar>
                  <div className={cn("flex flex-col gap-1 max-w-[75%]", isMe ? "items-end" : "items-start")}>
                    <div className="flex items-center gap-2 px-1"><span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{msg.user_detail.username}</span></div>
                    <div className={cn(
                      "p-3 px-4 text-[13px] leading-relaxed shadow-sm rounded-2xl break-words overflow-hidden", 
                      isMe ? "bg-primary text-primary-foreground rounded-tr-none font-medium" : "bg-rose-50 text-rose-900 rounded-tl-none border border-rose-100 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-900/50"
                    )}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                        components={{
                          img: ({node, ...props}) => <img {...props} className="max-w-full rounded-lg my-2 cursor-zoom-in hover:opacity-90 transition-opacity" onClick={() => window.open(props.src || '', '_blank')}/>,
                          p: ({node, ...props}) => <p {...props} className="m-0" />
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll to Bottom Button */}
        {!isAtBottom && (
          <Button 
            onClick={() => scrollToBottom(true)} 
            size="icon" 
            className="absolute bottom-32 left-1/2 -translate-x-1/2 rounded-full h-10 w-10 shadow-2xl bg-primary text-primary-foreground animate-bounce z-50 hover:scale-110 transition-transform"
          >
            <ArrowDown className="h-5 w-5"/>
          </Button>
        )}

        <footer className="p-4 bg-card/80 backdrop-blur-md border-t border-border z-20">
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex gap-2 px-1">
              <Popover>
                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><Smile className="h-4 w-4"/></Button></PopoverTrigger>
                <PopoverContent side="top" className="w-64 p-2 rounded-2xl border-border shadow-2xl bg-card">
                  <div className="grid grid-cols-8 gap-1">
                    {['😊','😂','🤣','😍','😒','🤔','😭','👍','🙌','🔥','✨','💯','📚','🎓','💪','🎯','❤️','✔️','❌','⚠️','🚀','💡','🌟','🎉'].map(e => (
                      <button key={e} onClick={() => setChatInput(prev => prev + e)} className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded-lg text-lg transition-colors">{e}</button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <Popover onOpenChange={(open) => open && giphyResults.length === 0 && fetchGiphy('study')}>
                <PopoverTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><FileVideo className="h-4 w-4"/></Button></PopoverTrigger>
                <PopoverContent side="top" className="w-72 p-3 rounded-2xl border-border shadow-2xl space-y-3 bg-card">
                  <Input 
                    placeholder="搜索 GIPHY..." 
                    value={giphySearch} 
                    onChange={e => { setGiphySearch(e.target.value); fetchGiphy(e.target.value); }} 
                    className="h-9 text-xs rounded-xl bg-muted border-none text-foreground placeholder:opacity-50" 
                  />
                  <div className="grid grid-cols-2 gap-2 h-48 overflow-y-auto pr-1 scrollbar-thin">
                    {giphyResults.map(g => (
                      <img key={g.id} src={g.images.fixed_height_small.url} onClick={() => { sendGif(g.images.original.url); }} className="rounded-lg cursor-pointer hover:scale-95 transition-transform aspect-square object-cover bg-muted" />
                    ))}
                  </div>
                  <p className="text-[8px] text-center text-muted-foreground font-bold opacity-50 uppercase tracking-tighter">Powered by GIPHY</p>
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"><ImageIcon className="h-4 w-4"/></Button>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
            </div>
            <div className="flex gap-3 bg-muted rounded-2xl p-1 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/5 transition-all shadow-inner border border-border">
              <Input 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)} 
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                onKeyDown={e => { if (e.key === 'Enter' && !isComposing) { e.preventDefault(); sendMessage(); } }}
                placeholder="发送消息 (支持拖入图片)..." 
                className="bg-transparent border-none shadow-none focus-visible:ring-0 text-[13px] h-10 px-4 text-foreground placeholder:text-muted-foreground/50" 
              />
              <Button onClick={sendMessage} size="icon" className="rounded-xl h-10 w-10 bg-primary text-primary-foreground shadow-xl shrink-0 hover:opacity-90 active:scale-95 transition-transform"><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </footer>
      </div>

      {/* Right Sidebar */}
      <div className="w-72 flex flex-col gap-6 shrink-0">
        <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden p-6 flex-1 flex flex-col border border-border">
          <header className="mb-4 flex items-center justify-between">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">实时共学</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground opacity-20" />
          </header>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
              {onlineUsers.map((u, i) => (
                <HoverCard key={i}>
                  <HoverCardTrigger asChild>
                    <div className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-muted transition-all cursor-pointer border border-transparent hover:border-border group">
                      <div className="relative shrink-0">
                        <Avatar className="h-9 w-9 border border-border shadow-sm group-hover:ring-2 ring-emerald-500/20 transition-all"><AvatarImage src={u.avatar_url}/></Avatar>
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background shadow-sm"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{u.username} {u.username === user?.username && "(你)"}</p>
                        <p className="text-[9px] text-emerald-600 font-bold truncate mt-0.5 uppercase tracking-tight">{u.current_task || '在线中'}</p>
                      </div>
                    </div>
                  </HoverCardTrigger>
                  <HoverCardContent side="left" className="w-80 rounded-[2rem] p-6 border-none shadow-2xl bg-card/95 backdrop-blur-xl z-50 text-left">
                    <div className="flex space-x-4">
                      <Avatar className="h-12 w-12 border border-border shadow-sm"><AvatarImage src={u.avatar_url}/></Avatar>
                      <div className="space-y-3 flex-1 text-left">
                        <div className="flex justify-between items-center"><h4 className="text-sm font-bold text-foreground">{u.username}</h4><Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-600 rounded-full">ELO {u.elo_score}</Badge></div>
                        <div className="space-y-2 pt-2 border-t border-border">
                           <div className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">今日专注: {u.today_focused_minutes} min</span></div>
                           <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="h-3.5 w-3.5"/><span className="text-[10px] font-bold uppercase tracking-widest">今日已完成: {u.today_completed_tasks?.length || 0} tasks</span></div>
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
          </div>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-card overflow-hidden p-6 flex-1 flex flex-col border border-border">
          <header className="mb-4 flex items-center justify-between border-b border-border pb-4">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">当日计划</CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground opacity-20" />
          </header>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
              {plans.map(p => (
                <div key={p.id} className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-muted transition-all border border-transparent hover:border-border">
                  <button onClick={() => {
                    api.patch(`/users/plans/${p.id}/`, { is_completed: !p.is_completed }).then(() => fetchPlans());
                  }}>{p.is_completed ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Circle className="h-5 w-5 text-muted-foreground/20" />}</button>
                  <span onClick={() => { setTaskName(p.content); setIsTimerOpen(true); }} className={cn("text-xs font-bold truncate flex-1 cursor-pointer", p.is_completed ? "line-through opacity-30" : "text-foreground")}>{p.content}</span>
                </div>
              ))}
          </div>
          <div className="mt-4 flex gap-2"><Input value={newPlan} onChange={e => setNewPlan(e.target.value)} onKeyDown={e => e.key === 'Enter' && (async () => { if (!newPlan.trim()) return; await api.post('/users/plans/', { content: newPlan }); fetchPlans(); setNewPlan(''); })()} placeholder="ADD TARGET..." className="bg-muted border-none h-10 rounded-xl text-[10px] font-bold px-4 text-foreground" /><Button onClick={async () => { if (!newPlan.trim()) return; await api.post('/users/plans/', { content: newPlan }); fetchPlans(); setNewPlan(''); }} size="icon" className="h-10 w-10 bg-primary text-primary-foreground rounded-xl shrink-0"><Plus className="h-4 w-4"/></Button></div>
        </Card>
      </div>

      <AlertDialog open={showStopAlert} onOpenChange={setShowStopAlert}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl bg-card">
          <AlertDialogHeader><AlertDialogTitle className="text-foreground">确定要中止任务吗？</AlertDialogTitle><AlertDialogDescription className="text-muted-foreground">离开当前页面将视为一次未完成的任务，并向讨论区广播。确定离开吗？</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setShowStopAlert(false)} className="rounded-xl border-border">继续专注</AlertDialogCancel><AlertDialogAction onClick={async () => { 
            setIsActive(false); setShowStopAlert(false);
            const focusedMins = Math.floor((duration * 60 - timeLeft) / 60);
            await api.post('/study/messages/', { content: `❌ 中止了“${taskName}”任务 (专注 ${focusedMins} 分钟)` });
            fetchMessages();
          }} className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold">中止并离开</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
