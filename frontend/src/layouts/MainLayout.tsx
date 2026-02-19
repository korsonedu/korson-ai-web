import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Trophy, 
  Clock, 
  User as UserIcon,
  LogOut,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Settings as SettingsIcon,
  Sparkles,
  Settings2,
  Bell,
  BrainCircuit,
  Home,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useSystemStore } from '@/store/useSystemStore';
import api from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

const SidebarItem = ({ to, icon: Icon, label, active, collapsed }: any) => {
  const content = (
    <Link to={to} className="block px-1">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-3 h-10 px-3 transition-all duration-200 rounded-lg",
          active 
            ? "bg-card text-foreground shadow-sm border border-border" 
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
          collapsed && "justify-center px-0"
        )}
      >
        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-foreground" : "text-muted-foreground")} />
        {!collapsed && <span className="font-bold text-[13px] tracking-tight">{label}</span>}
      </Button>
    </Link>
  );

  return collapsed ? (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right" className="font-bold border-none shadow-xl">{label}</TooltipContent>
    </Tooltip>
  ) : content;
};

export const MainLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { primaryColor } = useSystemStore();
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [schoolConfig, setSchoolConfig] = useState({ name: '科晟智慧', desc: 'KORSON ACADEMY', logo: '' });

  const proverbs = [
    "“教育不是灌输，而是点燃火焰。” — 苏格拉底",
    "“博学之，审问之，慎思之，明辨之，笃行之。” — 《礼记》",
    "“如果说我比别人看得更远些，那是因为我站在巨人的肩膀上。” — 牛顿",
    "“卓越不是一种行为，而是一种习惯。” — 亚里士多德",
    "“虚怀若谷，求知若渴。” — 斯蒂夫·乔布斯",
    "“我思故我在。” — 笛卡尔",
    "“知之者不如好之者，好之者不如乐之者。” — 孔子",
    "“知识的价值不在于占有，而在于使用。” — 培根",
    "“胜人者有力，自胜者强。” — 老子",
    "“纸上得来终觉浅，绝知此事要躬行。” — 陆游"
  ];

  const getProverb = () => {
    // Specific proverbs for specific routes to avoid duplication
    if (location.pathname === '/tests') return "“胜人者有力，自胜者强。” — 老子";
    if (location.pathname === '/knowledge-map') return "“纸上得来终觉浅，绝知此事要躬行。” — 陆游";
    
    const hash = location.pathname.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return proverbs[hash % proverbs.length];
  };

  const isFullPage = ['/intro', '/course-details'].includes(location.pathname);
  const isNoProverb = ['/admin', '/intro', '/course-details'].includes(location.pathname);

  useEffect(() => {
    // Apply primary color from store
    document.documentElement.style.setProperty('--primary-override', primaryColor);
    
    api.get('/users/config/').then(res => {
      setSchoolConfig({ 
        name: res.data.school_name, 
        desc: res.data.school_description,
        logo: res.data.school_logo_url
      });
    }).catch(() => {});
  }, [primaryColor]);

  const navItems = [
    { to: '/', icon: BookOpen, label: '课程中心' },
    { to: '/articles', icon: FileText, label: '文章中心' },
    { to: '/tests', icon: Trophy, label: '天梯排行' },
    { to: '/knowledge-map', icon: BrainCircuit, label: '知识地图' },
    { to: '/study', icon: Clock, label: '自习室' },
    { to: '/ai', icon: Sparkles, label: 'AI 助教' },
  ];

  if (user?.role === 'admin') navItems.push({ to: '/admin', icon: ShieldCheck, label: '维护中心' });

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen bg-background text-foreground overflow-hidden font-sans selection:bg-primary selection:text-primary-foreground">
        <aside className={cn(
          "relative border-r border-border flex flex-col p-2 bg-card/70 backdrop-blur-2xl transition-all duration-500 ease-in-out z-30",
          collapsed ? "w-16" : "w-52"
        )}>
          {/* Logo Section */}
          <div className={cn("mb-6 mt-2 flex items-center gap-3 transition-all", collapsed ? "justify-center" : "px-3")}>
            <div className="h-9 w-9 rounded-xl bg-black flex items-center justify-center shrink-0 shadow-xl overflow-hidden text-white font-bold text-lg italic" style={{backgroundColor: primaryColor}}>
              {schoolConfig.logo ? (
                <img src={schoolConfig.logo} className="w-full h-full object-cover" />
              ) : (
                <span>{schoolConfig.name[0]}</span>
              )}
            </div>
            {!collapsed && (
              <div className="flex flex-col animate-in fade-in duration-500 min-w-0">
                <h1 className="text-[14px] font-bold tracking-tight truncate w-32">{schoolConfig.name}</h1>
                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest truncate w-32">{schoolConfig.desc}</p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-0.5">
            {navItems.map(item => <SidebarItem key={item.to} {...item} active={location.pathname === item.to} collapsed={collapsed} />)}
            
            {!collapsed && (
              <div className="my-3 px-2.5">
                <div className="h-px bg-border w-full opacity-50" />
              </div>
            )}

            <SidebarItem to="/intro" icon={Home} label="主页" active={location.pathname === '/intro'} collapsed={collapsed} />
            <SidebarItem to="/course-details" icon={Info} label="课程介绍" active={location.pathname === '/course-details'} collapsed={collapsed} />
          </nav>

          <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-16 h-6 w-6 bg-card border border-border rounded-full flex items-center justify-center shadow-sm hover:shadow-md transition-all z-40 group">
            {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
          </button>

          <div className="mt-auto">
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <div className={cn("group flex items-center gap-2.5 p-2 rounded-xl cursor-pointer transition-all duration-300 hover:bg-muted border border-transparent hover:border-border", collapsed && "justify-center")}>
                  <Avatar className="h-8 w-8 border border-border shadow-sm group-hover:scale-105 transition-transform">
                    <AvatarImage src={user?.avatar_url} />
                    <AvatarFallback className="bg-muted text-[10px] font-bold">{user?.username?.[0]}</AvatarFallback>
                  </Avatar>
                  {!collapsed && (
                    <div className="flex-1 min-w-0 animate-in fade-in">
                      <p className="text-[11px] font-bold truncate">{user?.nickname || user?.username}</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tighter">Scholarly Profile</p>
                    </div>
                  )}
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side={collapsed ? "right" : "top"} className="w-52 rounded-2xl p-2 bg-card/95 backdrop-blur-xl border-border shadow-2xl">
                <DropdownMenuLabel className="px-3 py-2 text-[9px] font-bold text-muted-foreground uppercase tracking-wider">账户与偏好</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl px-3 py-2 gap-3 cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors">
                  <UserIcon className="h-3.5 w-3.5" />
                  <span className="font-bold text-xs">个人设置</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/system-settings')} className="rounded-xl px-3 py-2 gap-3 cursor-pointer focus:bg-primary focus:text-primary-foreground transition-colors">
                  <Settings2 className="h-3.5 w-3.5" />
                  <span className="font-bold text-xs">外观与系统</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-2 bg-border" />
                <DropdownMenuItem onClick={() => setShowLogoutAlert(true)} className="rounded-xl px-3 py-2 gap-3 cursor-pointer text-destructive focus:bg-destructive focus:text-destructive-foreground transition-colors">
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="font-bold text-xs">退出登录</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </aside>

        <main className="flex-1 h-screen overflow-y-auto relative z-10 flex flex-col bg-background">
          {!isFullPage && (
            <header className="sticky top-0 h-14 shrink-0 border-b border-border bg-background/80 backdrop-blur-xl z-20 px-10 flex items-center justify-between">
               <div className="flex items-center gap-2">
                  {!isNoProverb ? (
                    <span className="text-[11px] font-bold text-muted-foreground/60 italic tracking-tight">{getProverb()}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">System Operational</span>
                    </div>
                  )}
               </div>
               <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-card rounded-full shadow-sm border border-border">
                     <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                     <span className="text-xs font-bold text-foreground">ELO: {user?.elo_score}</span>
                  </div>
                  <div className="h-6 w-px bg-border mx-2" />
                  <Avatar className="h-8 w-8 border border-border shadow-sm">
                     <AvatarImage src={user?.avatar_url} />
                     <AvatarFallback className="text-xs font-bold">{user?.username?.[0]}</AvatarFallback>
                  </Avatar>
               </div>
            </header>
          )}
          <div className={cn("flex-1 w-full relative", !isFullPage && "px-10 py-10")}>
            <Outlet />
          </div>
        </main>

        <AlertDialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
                  <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl bg-card">
                    <AlertDialogHeader><AlertDialogTitle className="text-xl font-bold text-foreground">确认退出登录？</AlertDialogTitle><AlertDialogDescription className="font-medium text-muted-foreground">退出后你将需要重新验证身份以访问网校资源。</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-xl font-bold border-border text-foreground hover:bg-muted">返回</AlertDialogCancel>
                      <AlertDialogAction onClick={() => { logout(); navigate('/login'); }} className="rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90">确认退出</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
          
        </AlertDialog>
      </div>
    </TooltipProvider>
  );
};
