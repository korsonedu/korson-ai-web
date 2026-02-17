import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles, User, Bot as BotIcon, Loader2, Eraser, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Bot {
  id: number;
  name: string;
  avatar: string;
  system_prompt: string;
}

export const AIAssistant: React.FC = () => {
  const { user } = useAuthStore();
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isComposing, setIsComposition] = useState(false); // IME state
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load Bots & History
  useEffect(() => {
    const init = async () => {
      try {
        const bRes = await api.get('/ai/bots/');
        setBots(bRes.data);
        const defaultBot = bRes.data[0] || null;
        setSelectedBot(defaultBot);
        
        const hRes = await api.get('/ai/history/', { params: { bot_id: defaultBot?.id } });
        if (hRes.data.length > 0) {
          setMessages(hRes.data);
        } else {
          setMessages([{ role: 'assistant', content: '你好！我是您的 AI 助教。请问有什么学术问题需要我解答吗？' }]);
        }
      } catch (e: any) {
        const errorMsg = e.response?.data?.error || '连接失败，请检查网络或 API 配置。';
        setMessages([{ role: 'assistant', content: `连接失败: ${errorMsg}` }]);
      } finally {
        setIsInitialLoading(false);
      }
    };
    init();
  }, []);

  // Update history when bot changes
  useEffect(() => {
    if (selectedBot && !isInitialLoading) {
      api.get('/ai/history/', { params: { bot_id: selectedBot.id } }).then(res => {
        if (res.data.length > 0) setMessages(res.data);
        else setMessages([{ role: 'assistant', content: `你好！我是${selectedBot.name}。开始我们的学术交流吧！` }]);
      }).catch(e => {
        toast.error("加载历史失败");
      });
    }
  }, [selectedBot]);

  useEffect(() => {
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await api.post('/ai/chat/', { 
        message: input, 
        bot_id: selectedBot?.id 
      });
      let aiContent = response.data.content;
      
      // 前端兜底处理：确保所有类型的公式分隔符都被标准化
      aiContent = aiContent.replace(/\\\[/g, '$$$$').replace(/\\\]/g, '$$$$');
      aiContent = aiContent.replace(/\\\(/g, '$$').replace(/\\\)/g, '$$');
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || "AI 响应失败";
      toast.error(errorMsg);
      setMessages(prev => [...prev, { role: 'assistant', content: `抱歉，我现在遇到了一点技术问题: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.post('/ai/reset/', { bot_id: selectedBot?.id });
      setMessages([{ role: 'assistant', content: '会话历史已清空。' }]);
      toast.success("会话已重置");
    } catch (e) { toast.error("重置失败"); }
  };

  if (isInitialLoading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4 opacity-20">
      <Loader2 className="h-8 w-8 animate-spin" />
      <p className="text-[10px] font-bold uppercase tracking-widest leading-none">Initializing AI Laboratory...</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col animate-in fade-in duration-300 max-w-5xl mx-auto text-left relative">
      <Card className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-black/[0.03] overflow-hidden relative">
        <header className="px-8 py-3 border-b border-black/[0.03] flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="h-9 w-9 rounded-xl bg-black flex items-center justify-center shadow-lg overflow-hidden border border-white/10 group-hover:scale-105 transition-transform">
                    {selectedBot?.avatar ? <img src={selectedBot.avatar} className="w-full h-full object-cover" /> : <BotIcon className="h-5 w-5 text-emerald-400" />}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm font-bold tracking-tight text-[#1D1D1F]">{selectedBot?.name || '选择助教'}</h2>
                      <ChevronDown className="w-3 h-3 opacity-30" />
                    </div>
                    {selectedBot && (
                      <div className="flex items-center gap-2">
                        <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">由 DeepSeek-reasoner 驱动</p>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" className="h-4 px-1.5 text-[8px] font-bold text-[#86868B] hover:text-black uppercase tracking-tighter"> 查看指令集 </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-[2rem] border-none shadow-2xl p-10 max-w-2xl text-left">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold">{selectedBot.name} 的核心逻辑</DialogTitle>
                              <DialogDescription className="text-xs font-medium text-[#86868B]">这是当前助教遵循的系统级提示词 (System Prompt)。</DialogDescription>
                            </DialogHeader>
                            <div className="mt-6 p-6 bg-[#F5F5F7] rounded-2xl">
                              <pre className="text-xs leading-relaxed font-medium whitespace-pre-wrap text-[#1D1D1F]">{selectedBot.system_prompt}</pre>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 rounded-2xl p-2 bg-white/95 backdrop-blur-xl border-black/5 shadow-2xl" align="start">
                 {bots.map(b => (
                   <DropdownMenuItem key={b.id} onClick={() => setSelectedBot(b)} className="rounded-xl py-3 px-4 flex items-center gap-3 cursor-pointer">
                      <Avatar className="h-8 w-8 border border-black/5"><AvatarImage src={b.avatar}/><AvatarFallback>{b.name[0]}</AvatarFallback></Avatar>
                      <span className="font-bold text-sm">{b.name}</span>
                   </DropdownMenuItem>
                 ))}
                 {bots.length === 0 && <div className="p-4 text-xs font-bold opacity-30 text-center uppercase">暂无自定义机器人</div>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button variant="ghost" size="sm" onClick={handleReset} className="rounded-xl text-[#86868B] hover:text-black gap-2 px-3 h-8">
            <Eraser className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase">重置历史</span>
          </Button>
        </header>

        <ScrollArea className="flex-1" ref={scrollRef}>
          <div className="p-8 space-y-8 max-w-4xl mx-auto">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-4 group", msg.role === 'user' ? "flex-row-reverse" : "flex-row")}>
                <div className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-black/[0.05]",
                  msg.role === 'user' ? "bg-white" : "bg-black"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5 text-black" /> : <img src={selectedBot?.avatar} className="w-full h-full rounded-full object-cover" />}
                </div>
                <div className={cn("flex flex-col gap-1.5 max-w-[85%]", msg.role === 'user' ? "items-end" : "items-start")}>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#86868B] px-1">
                    {msg.role === 'user' ? user?.username : selectedBot?.name}
                  </span>
                  <div className={cn(
                    "p-3 px-4 rounded-2xl text-[13px] leading-relaxed shadow-sm transition-all border border-black/[0.01]",
                    msg.role === 'user' 
                      ? "bg-black text-white rounded-tr-none font-medium" 
                      : "bg-[#F5F5F7] text-[#1D1D1F] rounded-tl-none font-medium"
                  )}>
                    <div className={cn("prose prose-xs max-w-none text-left", msg.role === 'user' ? "prose-invert" : "prose-slate")}>
                      <ReactMarkdown 
                        remarkPlugins={[remarkMath]} 
                        rehypePlugins={[rehypeKatex]}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-black flex justify-center items-center shadow-lg overflow-hidden shrink-0"><img src={selectedBot?.avatar} className="w-full h-full object-cover"/></div>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#86868B] px-1">AI 正在深度推理 (Reasoning)...</span>
                  <div className="p-3 px-4 rounded-2xl rounded-tl-none bg-[#F5F5F7] w-16 flex justify-center"><Loader2 className="h-3.5 w-3.5 animate-spin opacity-20" /></div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <footer className="p-4 bg-white/80 backdrop-blur-md border-t border-black/[0.03] z-20">
          <div className="max-w-4xl mx-auto flex gap-3 bg-[#F5F5F7] rounded-2xl p-1.5 pr-2 focus-within:bg-white focus-within:ring-1 focus-within:ring-black/5 transition-all shadow-inner border border-black/[0.01]">
            <Input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onCompositionStart={() => setIsComposition(true)}
              onCompositionEnd={() => setIsComposition(false)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !isComposing) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="发送学术咨询..." 
              className="bg-transparent border-none shadow-none focus-visible:ring-0 text-sm h-9 px-4" 
              disabled={loading}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim()} size="icon" className="rounded-xl h-9 w-9 bg-black text-white shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0"><Send className="h-3.5 w-3.5 text-emerald-400 fill-emerald-400" /></Button>
          </div>
        </footer>
      </Card>
    </div>
  );
};
