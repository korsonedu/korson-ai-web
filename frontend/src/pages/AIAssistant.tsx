import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Sparkles, User, Bot as BotIcon, Loader2, Eraser, ChevronDown } from 'lucide-react';
import api from '@/lib/api';
import { processMathContent } from '@/lib/utils';
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
import { PageWrapper } from '@/components/PageWrapper';

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
  const [isComposing, setIsComposition] = useState(false); 
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load Bots
  useEffect(() => {
    const init = async () => {
      try {
        const bRes = await api.get('/ai/bots/');
        setBots(bRes.data);
        
        // Try to restore from session storage
        const savedBotId = sessionStorage.getItem('last_selected_bot_id');
        if (savedBotId) {
          const savedBot = bRes.data.find((b: Bot) => b.id.toString() === savedBotId);
          if (savedBot) setSelectedBot(savedBot);
        }
      } catch (e: any) {
        toast.error("加载助教列表失败");
      } finally {
        setIsInitialLoading(false);
      }
    };
    init();
  }, []);

  // Update history when bot changes
  useEffect(() => {
    if (selectedBot) {
      sessionStorage.setItem('last_selected_bot_id', selectedBot.id.toString());
      api.get('/ai/history/', { params: { bot_id: selectedBot.id } }).then(res => {
        if (res.data.length > 0) {
          // Preprocess history
          const processedHistory = res.data.map((m: any) => ({
            ...m,
            content: processMathContent(m.content)
          }));
          setMessages(processedHistory);
        }
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

  // Poll for updates if last message is from user or is thinking
  useEffect(() => {
    if (!selectedBot) return;
    
    const lastMsg = messages[messages.length - 1];
    const needsPolling = lastMsg && (lastMsg.role === 'user' || lastMsg.content === '[Thinking...]');
    
    if (needsPolling) {
      const timer = setInterval(() => {
        api.get('/ai/history/', { params: { bot_id: selectedBot.id } }).then(res => {
          if (res.data.length > 0) {
            const processedHistory = res.data.map((m: any) => ({
              ...m,
              content: processMathContent(m.content)
            }));
            
            // Check if the last message has changed from thinking to content
            const newLastMsg = processedHistory[processedHistory.length - 1];
            if (newLastMsg.content !== '[Thinking...]') {
               setMessages(processedHistory);
               setLoading(false);
            } else {
               // Update anyway to show thinking placeholder if not already there
               if (messages.length !== processedHistory.length) {
                 setMessages(processedHistory);
               }
            }
          }
        });
      }, 2000);
      return () => clearInterval(timer);
    }
  }, [messages, selectedBot]);

  const handleSend = async () => {
    if (!selectedBot) return toast.error("请先在上方选择一位 AI 助教");
    if (!input.trim() || loading) return;
    
    // Strategy: Send request -> Clear input -> Let the poller fetch the new state.
    const messageContent = input;
    setInput('');
    setLoading(true);
    
    try {
      await api.post('/ai/chat/', { 
        message: messageContent, 
        bot_id: selectedBot.id 
      });
      // Force an immediate fetch to show the user message and thinking state ASAP
      // The useEffect poller will then take over for the answer
      const res = await api.get('/ai/history/', { params: { bot_id: selectedBot.id } });
      if (res.data.length > 0) {
        setMessages(res.data.map((m: any) => ({
          ...m,
          content: processMathContent(m.content)
        })));
        // Turn off loading skeleton immediately if we have the messages
        setLoading(false);
      }
    } catch (error: any) {
      toast.error("发送失败");
      setLoading(false);
      setInput(messageContent); // Restore input on failure
    }
  };

  const handleReset = async () => {
    if (!selectedBot) return;
    try {
      await api.post('/ai/reset/', { bot_id: selectedBot.id });
      setMessages([{ role: 'assistant', content: '会话历史已清空。' }]);
      toast.success("会话已重置");
    } catch (e) { toast.error("重置失败"); }
  };

  if (isInitialLoading) return (
    <PageWrapper title="AI 实验室" subtitle="与您的专属数字导师进行深度学术对话。">
      <div className="h-[calc(100vh-6.5rem)] flex flex-col items-center justify-center gap-4 opacity-20">
        <Loader2 className="h-8 w-8 animate-spin text-foreground" />
        <p className="text-[10px] font-bold uppercase tracking-widest leading-none text-foreground">Initializing AI Laboratory...</p>
      </div>
    </PageWrapper>
  );

  return (
    <PageWrapper title="AI 实验室" subtitle="与您的专属数字导师进行深度学术对话。">
      <div className="h-[calc(100vh-6.5rem)] flex flex-col animate-in fade-in duration-300 max-w-5xl mx-auto text-left relative text-foreground px-4">
        <Card className="flex-1 flex flex-col bg-card rounded-3xl shadow-sm border border-border overflow-hidden relative">
        <header className="px-8 py-3 border-b border-border flex items-center justify-between bg-card/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-lg overflow-hidden border border-white/10 group-hover:scale-105 transition-transform">
                    {selectedBot?.avatar ? <img src={selectedBot.avatar} className="w-full h-full object-cover" /> : <BotIcon className="h-5 w-5 text-primary-foreground" />}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <h2 className="text-sm font-bold tracking-tight text-foreground">{selectedBot?.name || '选择助教'}</h2>
                      <ChevronDown className="w-3 h-3 opacity-30" />
                    </div>
                    {selectedBot && (
                      <div className="flex items-center gap-2">
                        <p className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest">Powered by DeepSeek-V3.2</p>
                        <Dialog>
                          <DialogContent className="rounded-[2rem] border-none shadow-2xl p-10 max-w-2xl text-left bg-card">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold text-foreground">{selectedBot.name} Core Logic</DialogTitle>
                              <DialogDescription className="text-xs font-medium text-muted-foreground">The system-level prompt guiding this assistant's behavior.</DialogDescription>
                            </DialogHeader>
                            <div className="mt-6 p-6 bg-muted rounded-2xl">
                              <pre className="text-xs leading-relaxed font-medium whitespace-pre-wrap text-foreground">{selectedBot.system_prompt}</pre>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )}
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 rounded-2xl p-2 bg-card/95 backdrop-blur-xl border-border shadow-2xl" align="start">
                 {bots.map(b => (
                   <DropdownMenuItem key={b.id} onClick={() => setSelectedBot(b)} className="rounded-xl py-3 px-4 flex items-center gap-3 cursor-pointer">
                      <Avatar className="h-8 w-8 border border-border"><AvatarImage src={b.avatar}/><AvatarFallback>{b.name[0]}</AvatarFallback></Avatar>
                      <span className="font-bold text-sm text-foreground">{b.name}</span>
                   </DropdownMenuItem>
                 ))}
                 {bots.length === 0 && <div className="p-4 text-xs font-bold opacity-30 text-center uppercase text-foreground">No Custom Bots Available</div>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {selectedBot && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="rounded-xl text-muted-foreground hover:text-foreground gap-2 px-3 h-8">
              <Eraser className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase">Clear History</span>
            </Button>
          )}
        </header>

        <ScrollArea className="flex-1" ref={scrollRef}>
          {!selectedBot ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
              <div className="h-20 w-20 rounded-3xl bg-muted flex items-center justify-center animate-bounce">
                <Sparkles className="h-10 w-10 text-primary opacity-20" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-foreground">Welcome to AI Laboratory</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">Please select an AI assistant to begin your scholarly dialogue.</p>
              </div>
            </div>
          ) : (
            <div className="p-8 space-y-8 max-w-4xl mx-auto w-full">
              {messages.filter(msg => msg.content !== '[Thinking...]').map((msg, i) => (
                <div key={i} className={cn("flex gap-4 group w-full", msg.role === 'user' ? "flex-row-reverse text-right" : "flex-row text-left animate-in fade-in slide-in-from-bottom-2")}>
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shrink-0 shadow-sm border border-border",
                    msg.role === 'user' ? "bg-card" : "bg-primary"
                  )}>
                    {msg.role === 'user' ? <User className="w-5 h-5 text-foreground" /> : (selectedBot.avatar ? <img src={selectedBot.avatar} className="w-full h-full rounded-full object-cover" /> : <BotIcon className="w-5 h-5 text-primary-foreground" />)}
                  </div>
                  <div className={cn("flex flex-col gap-1.5 max-w-[70%]", msg.role === 'user' ? "items-end" : "items-start")}>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                      {msg.role === 'user' ? (user?.nickname || user?.username) : selectedBot.name}
                    </span>
                    <div className={cn(
                      "p-3 px-4 rounded-2xl text-[13px] shadow-sm transition-all border border-border w-fit",
                      msg.role === 'user' 
                        ? "bg-primary text-primary-foreground rounded-tr-none font-medium" 
                        : "bg-slate-100/80 dark:bg-slate-800/80 text-foreground rounded-tl-none font-medium"
                    )}>
                        <div className={cn("prose prose-slate dark:prose-invert prose-sm max-w-none text-left prose-headings:font-black prose-headings:tracking-tight prose-p:leading-relaxed prose-p:text-slate-600 dark:prose-p:text-slate-300")}>
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
              {/* Separate Thinking Indicator - Only show if the latest message is [Thinking...] */}
              {messages.length > 0 && messages[messages.length - 1].content === '[Thinking...]' && (
                <div className="flex gap-4 group w-full flex-row text-left animate-in fade-in slide-in-from-bottom-2">
                  <div className="h-10 w-10 rounded-full bg-primary flex justify-center items-center shadow-lg overflow-hidden shrink-0 border border-white/10">
                    {selectedBot.avatar ? <img src={selectedBot.avatar} className="w-full h-full object-cover"/> : <BotIcon className="w-5 h-5 text-primary-foreground" />}
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">{selectedBot.name}</span>
                    <div className="p-3 px-4 rounded-2xl rounded-tl-none bg-slate-100/80 dark:bg-slate-800/80 w-fit flex items-center justify-center text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <footer className="p-4 bg-card/80 backdrop-blur-md border-t border-border z-20">
          <div className={cn(
            "max-w-4xl mx-auto flex gap-3 bg-muted rounded-2xl p-1.5 pr-2 transition-all shadow-inner border border-border",
            !selectedBot && "opacity-50 grayscale pointer-events-none"
          )}>
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
              placeholder={selectedBot ? "Ask a question..." : "Select an assistant first"} 
              className="bg-transparent border-none shadow-none focus-visible:ring-0 text-[13px] h-9 px-4 text-foreground placeholder:text-muted-foreground/50" 
              disabled={loading || !selectedBot}
            />
            <Button onClick={handleSend} disabled={loading || !input.trim() || !selectedBot} size="icon" className="rounded-xl h-9 w-9 bg-primary text-primary-foreground shadow-xl hover:opacity-90 active:scale-95 transition-all shrink-0"><Send className="h-3.5 w-3.5" /></Button>
          </div>
        </footer>
      </Card>
    </div>
    </PageWrapper>
  );
};
