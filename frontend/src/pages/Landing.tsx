import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, ArrowRight, Zap, HelpCircle, 
  BookOpen, BrainCircuit, Monitor, Cpu, Target, 
  Mountain, Globe, Layers, ChevronRight,
  ShieldCheck, Activity, Boxes, Sparkles,
  GraduationCap, Library, BookText, Lightbulb,
  Award, BarChart3, Users, Clock, ShieldAlert,
  Briefcase, Hexagon, PieChart, TrendingUp, Play, FileText, ClipboardList, LifeBuoy,
  Network, Trophy, Swords, BarChart, Database, Timer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage } from '@/components/ui/avatar';

const Glow = ({ className }: { className?: string }) => (
  <div className={cn("absolute -z-10 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/5 to-purple-600/5 blur-[120px] rounded-full pointer-events-none", className)} />
);

const SectionHeader = ({ title, subtitle, centered = false, label = "Academic Program" }: any) => (
  <div className={cn("mb-10 relative z-10", centered ? "text-center" : "text-left")}>
    <div className={cn("flex items-center gap-2 mb-3", centered && "justify-center")}>
      <div className="h-[1px] w-4 bg-slate-200 dark:bg-slate-800" />
      <span className="text-[9px] font-bold text-pink-500 uppercase tracking-[0.3em]">{label}</span>
    </div>
    <h2 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">{title}</h2>
    {subtitle && <p className="mt-2 text-xs md:text-sm text-slate-500 dark:text-slate-400 max-w-2xl font-medium leading-relaxed">{subtitle}</p>}
  </div>
);

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white dark:bg-[#0F1115] font-sans selection:bg-pink-500 selection:text-white text-left overflow-x-hidden antialiased">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 dark:bg-[#0F1115]/80 backdrop-blur-md border-b border-slate-100/50 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-7 w-7 rounded bg-slate-900 dark:bg-white flex items-center justify-center shadow-lg transition-all group-hover:rotate-6 group-hover:scale-110">
              <span className="text-white dark:text-slate-900 font-black italic text-xs">K</span>
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white group-hover:text-pink-500 transition-colors">科晟智慧</span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6">
              {['优势', 'K2 战略', 'UniMind', '定价'].map((item, i) => (
                <a key={item} href={`#section-${i}`} className="text-[10px] font-bold text-slate-500 hover:text-pink-500 transition-colors uppercase tracking-widest">{item}</a>
              ))}
            </div>
            <div className="flex items-center gap-3 pl-4 border-l border-slate-100 dark:border-white/10">
              <button className="text-[10px] font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors" onClick={() => navigate('/login')}>LOGIN</button>
              <Button className="rounded px-4 h-7 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-[10px] shadow-sm hover:opacity-90" onClick={() => navigate('/register')}>开始学习</Button>
            </div>
          </div>
        </div>
      </nav>

      {/* 1. Hero Section */}
      <section className="pt-14 pb-8 px-6 relative border-b border-slate-50 dark:border-slate-900">
        <Glow className="-top-20 -left-20" />
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-10">
          <div className="lg:col-span-7 space-y-10">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest leading-none">Est. 2019 · 金融硕士 (MF) 431 应试辅导专家</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tighter text-slate-900 dark:text-white leading-[1.15]">
                用更短的时间<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600">重构金融 431 逻辑</span>
              </h1>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-md font-medium leading-relaxed">
                2025 科晟 K2 模块化战略：致力于用最短的时间实现学员对专业课的深度掌握，从而预留更多时间应对公共课。
              </p>
            </div>
            
            <div className="flex flex-wrap gap-4 items-center">
              <Button size="lg" className="rounded-xl px-8 h-11 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs shadow-lg hover:opacity-90 transition-all" onClick={() => navigate('/register')}>
                了解全程班计划
              </Button>
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.02]">
                 <Avatar className="h-6 w-6 border border-slate-200 dark:border-slate-700 shadow-sm"><AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=TeacherZu" /></Avatar>
                 <div className="text-left leading-none">
                   <p className="text-[10px] font-bold text-slate-900 dark:text-white">主讲: 祖哥</p>
                   <p className="text-[8px] font-medium text-slate-400 mt-0.5 uppercase tracking-tighter">Strategic Lead / 6Y Exp</p>
                 </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative hidden lg:flex items-center justify-center">
             <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-indigo-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative px-10 py-12 bg-white dark:bg-[#0F1115] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-xl flex flex-col items-center text-center space-y-4">
                   <div className="h-0.5 w-8 bg-pink-500 rounded-full mb-1" />
                   <h2 className="text-2xl md:text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">
                     DISCIPLINE<br />
                     <span className="text-pink-500">EQUALS FREEDOM</span>
                   </h2>
                   <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-[0.3em]">
                     自律使你自由
                   </p>
                   <div className="pt-4 flex flex-col items-center gap-2 opacity-20">
                      <div className="h-[24px] w-[1px] bg-slate-300 dark:bg-slate-700" />
                      <Activity className="h-3.5 w-3.5" />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* 2. Stats Strip */}
      <section className="py-4 bg-slate-50 dark:bg-[#0A0A0B] border-b border-slate-100 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { l: '学员总数', v: '200+', d: '全周期深度信赖' },
              { l: '高分神迹', v: '20+', d: '400分以上突破' },
              { l: '专业课记录', v: '30+', d: '120分以上实绩' },
              { l: '提分期望', v: '+50', d: 'K2 战略核心成果' }
            ].map((item, i) => (
              <div key={i} className="text-center space-y-1">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.l}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{item.v}</p>
                <p className="text-[9px] font-medium text-slate-500 leading-none">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Why Choose Us */}
      <section id="section-1" className="py-12 bg-white dark:bg-[#0F1115] border-b border-slate-50 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader title="为什么选择科晟智慧？" subtitle="实战派视野与全流程技术赋能，构筑无法复制的应试护城河。" label="Core Advantages" centered />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { t: '核心视频课程', d: '模块化战略落地，采用 MES 高效教学法。放弃线性平庸讲授，将书本降解为原子化知识群。', icon: Play, c: 'bg-blue-500' },
              { t: '专业课本讲义', d: '涵盖黄达、Mishkin等内容。针对性增补 Dornbusch 宏观及 Walsh 政策理论等学术补丁。', icon: BookOpen, c: 'bg-pink-500' },
              { t: '全域习题系统', d: '从《核心算力》升级。含真题及独家翻译国外教材顶级 Test Bank，高质量全考点覆盖。', icon: ClipboardList, c: 'bg-indigo-500' },
              { t: '全周期服务', d: '始创六年零纠纷记录。执行公允退款。提供复试指南及终身有效的就业联盟/智库实操席位。', icon: LifeBuoy, c: 'bg-emerald-500' }
            ].map(item => (
              <Card key={item.t} className="p-8 border border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0A0A0B] rounded-[2rem] space-y-4 hover:border-pink-500/20 transition-all group">
                 <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-lg", item.c)}>
                    <item.icon className="h-5 w-5" />
                 </div>
                 <h4 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-tight">{item.t}</h4>
                 <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">{item.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Curriculum Tree */}
      <section id="section-0" className="py-12 bg-slate-50 dark:bg-[#0A0A0B] border-b border-slate-100 dark:border-white/5 relative text-center">
        <div className="max-w-6xl mx-auto px-6 flex flex-col items-center">
          <SectionHeader title="核心课程体系" subtitle="基于 K2 战略顶层设计，向下驱动三大核心教学体系。" label="System Architecture" centered />
          <div className="w-full max-w-2xl mb-12 relative">
             <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/10 to-indigo-500/10 opacity-50" />
                <div className="relative flex flex-col md:flex-row gap-8 items-center text-left">
                   <div className="h-16 w-16 rounded-2xl bg-pink-500 flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform"><Mountain className="h-8 w-8 text-white" /></div>
                   <div className="space-y-2">
                      <h3 className="text-2xl font-black uppercase tracking-tight leading-none">K2 模块化战略总述</h3>
                      <p className="text-slate-400 text-xs leading-relaxed max-w-md">科晟历史上最重大革新。引入“关注点分离”原则，将全书内容原子化，实现知识群、模块、考点的高效重组。</p>
                   </div>
                </div>
             </div>
             <div className="hidden lg:block absolute left-1/2 -bottom-12 w-[1px] h-12 bg-gradient-to-b from-slate-300 to-transparent dark:from-slate-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full relative">
             <div className="hidden lg:block absolute -top-12 left-1/2 -translate-x-1/2 w-[66%] h-[1px] bg-slate-200 dark:bg-slate-800" />
             {[
               { id: 'Module.A', t: '货币经济学', d: '核心占 60% 时长。全书目复盖，深度补丁国际金融分析框架。', icon: Library, c: 'text-indigo-500' },
               { id: 'Module.B', t: '金融理论整合', d: '整合三大教材体系。聚焦核心算力，攻克新股、租赁、权证等考点。', icon: GraduationCap, c: 'text-pink-500' },
               { id: 'Module.C', t: '全域习题训练', d: '高质量覆盖。含历年真题及独家翻译国外顶级 Test Bank 系统。', icon: BookText, c: 'text-emerald-500' }
             ].map(item => (
               <div key={item.t} className="bg-white dark:bg-[#0F1115] p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 hover:shadow-lg transition-all relative text-left">
                  <div className="hidden lg:block absolute -top-6 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-slate-200 dark:bg-slate-800" />
                  <item.icon className={cn("h-6 w-6", item.c)} />
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{item.id}</p>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white uppercase">{item.t}</h4>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">{item.d}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* 5. ELO Ladder */}
      <section className="py-12 bg-white dark:bg-[#0F1115] relative overflow-hidden text-center">
        <Glow className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader title="ELO 学术天梯：游戏化学习体验" subtitle="引入竞技级算法，将学术成长数字化、竞技化。" label="The Ladder System" centered />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center text-left">
             <div className="lg:col-span-7 space-y-6">
                {[
                  { t: '学力数字化', d: '引入竞技级 ELO 积分系统，精准量化每一个考点的掌握度。你的每一次测试，都在刷新你的学术段位。', icon: Trophy, c: 'text-amber-500' },
                  { t: '实时动态天梯', d: '全站实时学术排名展示。与全国顶尖同侪在线对弈，在竞争中激发最高效率的学习心流。', icon: Swords, c: 'text-pink-500' },
                  { t: '多巴胺反馈机制', d: '告别负反馈学习。每一次正确回答、每一张卡片通关，都会带来即时的积分回馈与排位提升。', icon: Activity, c: 'text-indigo-500' }
                ].map(item => (
                  <div key={item.t} className="flex gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 hover:border-pink-500/30 transition-colors group">
                     <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center bg-white dark:bg-black shadow-sm shrink-0", item.c)}><item.icon className="h-6 w-6" /></div>
                     <div className="space-y-1">
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white uppercase">{item.t}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">{item.d}</p>
                     </div>
                  </div>
                ))}
             </div>
             <div className="lg:col-span-5">
                <Card className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-6 opacity-10"><BarChart className="h-24 w-24 text-pink-500" /></div>
                   <div className="relative space-y-6">
                      <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Academic Rank</span><div className="px-2 py-0.5 rounded bg-emerald-500 text-[8px] font-bold text-white uppercase animate-pulse">Live</div></div>
                      <div className="space-y-4">
                         {[1, 2, 3].map(i => (
                           <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                              <span className="text-xs font-mono font-bold text-slate-500">#0{i}</span>
                              <div className="h-6 w-6 rounded-full bg-slate-700" />
                              <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className={cn("h-full rounded-full bg-gradient-to-r from-pink-500 to-indigo-500", i === 1 ? "w-full" : i === 2 ? "w-4/5" : "w-2/3")} /></div>
                              <span className="text-[10px] font-mono font-bold text-white">{2400 - i * 120}</span>
                           </div>
                         ))}
                      </div>
                   </div>
                </Card>
             </div>
          </div>
        </div>
      </section>

      {/* 6. UniMind Engine */}
      <section id="section-2" className="py-12 bg-slate-50 dark:bg-[#0A0A0B] border-y border-slate-100 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader title="宇艺 (UniMind) 数字化学习引擎" subtitle="目前唯一将自研 AI 深度集成到全流学习工作中的金融辅导机构。" label="Digital Infrastructure" centered />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-slate-100 dark:bg-white/10 border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm">
            {[
              { t: 'AI 高效驱动学习', d: '全流程大模型渗透，深度集成 DeepSeek-R1，由 AI 辅助实现效率与逻辑推理能力的指数级增长。', icon: Cpu, c: 'text-purple-500' },
              { t: '专属 AI 助理教师', d: '具备“上帝视角”的 SciRise 导师，深度钩稽学术数据库，感知你的掌握度并实现错题透视。', icon: BrainCircuit, c: 'text-pink-500' },
              { t: '艾宾浩斯习题与评分', d: '基于记忆曲线的智能抽题策略，配合 AI 主观题精准判分，动态量化你的能力成长。', icon: Target, c: 'text-indigo-500' },
              { t: '自建资源管理系统', d: '一站式学术资产中心，集成自研视频流、文章、电子资源，支持全类型资源的工业级挂载。', icon: Database, c: 'text-blue-500' },
              { t: '学术知识拓扑地图', d: '可视化溯源知识节点与资源挂载，构建网状金融知识体系而非孤岛，实现知识快速检索与定位。', icon: Network, c: 'text-emerald-500' },
              { t: '毫秒级响应自习室', d: '高并发即时通讯与可视化番茄钟计时，建立全站广播同步，打造极致沉浸的学术共学共同体。', icon: Users, c: 'text-orange-500' }
            ].map(item => (
              <div key={item.t} className="bg-white dark:bg-[#0F1115] p-10 space-y-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all group text-left">
                 <item.icon className={cn("h-7 w-7 group-hover:scale-110 transition-transform", item.c)} />
                 <h4 className="font-bold text-slate-900 dark:text-white text-base tracking-tight uppercase">{item.t}</h4>
                 <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed font-medium">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Pricing */}
      <section id="section-3" className="py-12 bg-white dark:bg-[#0F1115]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <SectionHeader title="课程项目与计划加入" centered label="Investment Plans" />
          <div className="grid grid-cols-1 gap-8">
            <div className="bg-slate-900 text-white rounded-[2.5rem] p-10 md:p-16 flex flex-col md:flex-row gap-16 items-center relative overflow-hidden shadow-2xl border border-slate-800 text-left">
               <div className="relative z-10 flex-1 space-y-8">
                 <div className="space-y-3">
                   <div className="inline-flex px-3 py-1 rounded-full bg-pink-500 text-[10px] font-bold uppercase tracking-widest leading-none">Recommended Enrollment</div>
                   <h3 className="text-4xl md:text-5xl font-black tracking-tight uppercase leading-none">K2 全程班计划</h3>
                 </div>
                 <p className="text-slate-400 text-sm max-w-lg leading-relaxed font-medium">包含全部模块课程、讲义、赛博助教永久席位及全周期服务。支持打卡返费挑战。</p>
                 <div className="flex flex-wrap gap-8 pt-4 border-t border-white/5 font-bold">
                    <div className="flex items-center gap-2 text-xs text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 学习打卡返还学费活动</div>
                    <div className="flex items-center gap-2 text-xs text-slate-300"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 就业联盟/智库训练名额</div>
                 </div>
               </div>
               <div className="relative z-10 w-full md:w-80 bg-white/5 border border-white/10 rounded-[2.5rem] p-10 space-y-8 backdrop-blur-xl">
                  <div className="space-y-2 text-center">
                    <div className="flex items-baseline justify-center gap-1 text-white">
                       <span className="text-5xl font-black tracking-tighter">¥4500</span>
                       <span className="text-[10px] font-bold text-slate-500 uppercase">/ TOTAL</span>
                    </div>
                  </div>
                  <div className="space-y-2 text-center border-t border-white/5 pt-6">
                    <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">Early Bird (-20%)</p>
                    <p className="text-3xl font-black tracking-tight text-white">¥3600 <span className="text-sm opacity-30 font-normal line-through ml-2 text-white">¥4500</span></p>
                    <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">早早早鸟 8 折优惠</p>
                  </div>
                  <Button className="w-full bg-white text-slate-900 font-bold text-xs h-12 rounded-2xl hover:bg-slate-100 shadow-xl" onClick={() => navigate('/register')}>开始学习</Button>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
               {[ { t: '货币经济学单科', p: '2600', d: 'Module.A' }, { t: '金融理论单科', p: '2400', d: 'Module.B' } ].map(m => (
                 <div key={m.t} className="bg-white dark:bg-[#0A0A0B] border border-slate-100 dark:border-white/5 p-8 rounded-3xl flex items-center justify-between group hover:border-pink-500/30 transition-all shadow-sm">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg tracking-tight uppercase leading-none">{m.t}</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">Modular Specialized Access</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-black text-2xl text-slate-900 dark:text-white tracking-tighter">¥{m.p}</span>
                      <button className="h-10 w-10 rounded-full border border-slate-200 dark:border-white/5 flex items-center justify-center hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all shadow-sm" onClick={() => navigate('/register')}><ChevronRight className="h-5 w-5" /></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ */}
      <section id="section-4" className="py-12 bg-slate-50 dark:bg-[#0A0A0B] border-t border-slate-100 dark:border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader title="常见问题解答" subtitle="教育应当温暖且确定。我们坚持公允、透明的学术服务规则。" label="FAQ" centered />
          <div className="space-y-4">
            {[
              { q: '课程服务有效期如何定义？', a: '视频与课件有效期 24 个月。课程服务在本年度初试后截止，二战考生申请可 Resume 延长服务。复试及就业服务终身有效。' },
              { q: '是否有保过承诺？对我有何实质帮助？', a: '不承诺保过。系统提供最高效的知识重构工具，但不能代替你的思考。从统计学上我们的服务显著可靠。' },
              { q: '是否提供定向/定校辅导服务？', a: '不提供。基于 K2 模块化架构，核心知识模块已能实现跨校高效覆盖，减少信息冗余，让学习重心回归知识本质。' },
              { q: '觉得不适合我，有无退款退出机制？', a: '自 19 年起零纠纷记录。支持按进度公允退款。即使你最后选择了其他机构，我们依然提供力所能及的帮助。教育应当温暖。' },
              { q: '课程以外还提供什么增值成长服务？', a: '复试辅导、长期成长计划、就业联盟对接以及科晟智库的实操训练，助你打破实习市场信息不对称。' }
            ].map((faq, i) => (
              <div key={i} className="p-8 rounded-[2rem] bg-white dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 group hover:border-pink-500/20 transition-all space-y-4 text-left shadow-sm">
                <div className="flex items-center gap-4">
                   <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-xs shrink-0">Q</div>
                   <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{faq.q}</h4>
                </div>
                <div className="flex items-start gap-4 pl-12 border-t border-slate-50 dark:border-white/5 pt-4">
                   <div className="h-6 w-6 rounded-full bg-pink-500 text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">A</div>
                   <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="py-8 bg-white dark:bg-[#0F1115] border-t border-slate-100 dark:border-slate-800 text-left">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 text-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold italic text-xl shadow-lg">K</div>
            <div className="text-left leading-tight">
              <p className="font-bold text-lg text-slate-900 dark:text-white tracking-tighter uppercase">Korson Academy</p>
              <p className="text-xs font-medium text-slate-400 tracking-wide mt-1">© 2019-2026 北京融知高科 · 金融硕士辅导专家</p>
            </div>
          </div>
          <div className="flex gap-10 font-bold text-slate-500">
            {['微信公众号', 'SciRise', 'Terms', 'Privacy'].map(item => (<a key={item} href="#" className="hover:text-pink-500 transition-colors uppercase tracking-widest text-[9px]">{item}</a>))}
          </div>
        </div>
      </footer>
    </div>
  );
};
