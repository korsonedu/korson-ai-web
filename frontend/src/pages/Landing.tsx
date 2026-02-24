import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  BookOpen, BrainCircuit, Target, 
  ShieldCheck, Sparkles,
  Trophy, Users, Play, ClipboardList, LifeBuoy,
  Network
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '../store/useAuthStore';
import { APP_VERSION, COPYRIGHT_YEAR, COPYRIGHT_ENTITY, BRAND_DESC } from '@/constants/version';

const Glow = ({ className }: { className?: string }) => (
  <div className={cn("absolute -z-10 w-[500px] h-[500px] bg-gradient-to-tr from-pink-500/5 to-purple-600/5 blur-[120px] rounded-full pointer-events-none", className)} />
);

const SectionHeader = ({ title, subtitle, centered = false, label = "Academic Program" }: any) => (
  <div className={cn("mb-16 relative z-10", centered ? "text-center" : "text-left")}>
    <div className={cn("flex items-center gap-2 mb-4", centered && "justify-center")}>
      <div className="h-[1px] w-6 bg-slate-200 dark:bg-slate-800" />
      <span className="text-[10px] font-bold text-pink-500 uppercase tracking-[0.4em]">{label}</span>
    </div>
    <h2 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">{title}</h2>
    {subtitle && <p className="mt-6 text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">{subtitle}</p>}
  </div>
);

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();

  return (
    <div className="w-full bg-white dark:bg-[#0F1115] font-sans selection:bg-pink-500 selection:text-white text-left overflow-x-hidden antialiased">
      
      {/* Top Action Bar */}
      {!token && (
        <div className="fixed top-0 right-0 p-6 z-[100]">
          <Button 
            variant="ghost" 
            className="rounded-full px-6 h-10 font-bold text-xs uppercase tracking-widest bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all text-slate-900 dark:text-white"
            onClick={() => navigate('/login')}
          >
            Login
          </Button>
        </div>
      )}

      {/* 1. Hero Section + Stats */}
      <section className="min-h-[90vh] flex flex-col items-center justify-center pt-20 pb-12 px-6 relative overflow-hidden">
        <Glow className="-top-40 -left-40 opacity-20" />
        <div className="max-w-6xl mx-auto w-full relative z-10 text-center space-y-12 mb-16">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-slate-100/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em] leading-none">Est. 2019 · 金融硕士 (MF) 431 应试辅导专家</span>
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-[72px] font-black tracking-tight text-slate-900 dark:text-white leading-[1.1]">
              重构金融 431 学习逻辑<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-pink-500 via-purple-500 to-indigo-600">极具效率的金融硕士考研培训</span>
            </h1>
            <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 max-w-4xl mx-auto font-medium leading-relaxed">
              过去几年里，我们致力于用最短的时间实现学员对专业课的深度掌握，从而预留更多时间应对公共课。通过六年应试数据的深度沉淀，我们将冗余的教材内容降解为结构化的考点矩阵，确保每一分钟的投入都能夯实知识地基，并转化为实打实的卷面分数，让辅导卓有成效。
            </p>
          </div>
        </div>

        {/* Stats Strip Integrated into Hero */}
        <div className="max-w-5xl mx-auto px-6 w-full mt-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10 border-t border-slate-100 dark:border-white/5">
            {[
              { l: '学员总数', v: '200+', d: '全周期深度信赖' },
              { l: '高分突破', v: '20+', d: '400分以上总分' },
              { l: '专业课实绩', v: '30+', d: '120分以上记录' },
              { l: '二战提分', v: '+50', d: 'K2 战略核心成果' }
            ].map((item, i) => (
              <div key={i} className="text-center space-y-1">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] leading-none">{item.l}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{item.v}</p>
                <p className="text-[10px] font-medium text-slate-500 leading-none">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Why Choose Us */}
      <section id="section-1" className="py-24 bg-white dark:bg-[#0F1115] border-b border-slate-50 dark:border-slate-900">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader 
            title="为什么选择科晟智慧？" 
            subtitle="极具深度的知识内容、数据沉淀与全流程技术赋能，构筑无法复制的应试护城河。通过 AI 驱动的学习引擎与模块化教学战略，我们确保每一位学员都能建立起完整的金融学术框架，实现从零基础到前 10% 的跨越式增长。" 
            label="Core Advantages" 
            centered 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { t: '核心视频课程', d: 'K2 模块化战略落地，放弃线性讲授，将书本降解为原子化知识群，模块化构建知识网络。', icon: Play, c: 'bg-blue-500' },
              { t: '专业课本讲义', d: '涵盖黄达、米什金、姜波克、奚君羊、克鲁格曼、罗斯、博迪等内容。针对性增补 Dornbusch 宏观及 Walsh 政策理论等学术补丁。', icon: BookOpen, c: 'bg-pink-500' },
              { t: '全域习题系统', d: '从自有教材《核心算力》升级，含真题、自编模拟题及独家翻译国外顶级院校 Test Bank，高质量全考点覆盖。', icon: ClipboardList, c: 'bg-indigo-500' },
              { t: '全周期服务', d: '提供24小时响应答疑、复试指南及终身有效的宇艺智能系统 (UniMind AI OS) 席位。始创七年零经济纠纷，公允定价与退款政策。', icon: LifeBuoy, c: 'bg-emerald-500' }
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

      {/* 5. UniMind (Integrating ELO) */}
      <section id="section-2" className="py-24 bg-slate-50 dark:bg-[#0A0A0B] border-y border-slate-100 dark:border-white/5 relative">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader 
            title="宇艺（UniMind）智能学习系统" 
            subtitle="竞技级 ELO 算法与 AI 深度集成，目前唯一实现全流程 AI 的金融辅导机构。通过 ELO 积分系统量化学力，结合 AI 精准判分，我们为每一位学员提供个性化的学术反馈，让备考不再是盲目刷题，而是精准的能力进化。" 
            label="Digital Infrastructure" 
            centered 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { t: 'ELO 系统学力数字化', d: '引入竞技级积分系统，做题更有效率。精准量化掌握度，实时刷新全站天梯排行。', icon: Trophy, c: 'text-amber-500' },
              { t: 'AI 驱动的题目打分', d: '基于 DeepSeek-V3.2 模型驱动的智能打分系统，实现答题精准判分，实时定位答案逻辑漏洞。', icon: Sparkles, c: 'text-purple-500' },
              { t: '专属 AI 助理教师', d: '实时接入用户学习数据，构造具备“上帝视角”的 AI 机器人，深度钩稽并透视薄弱点，打造你一个人的智能助教。', icon: BrainCircuit, c: 'text-pink-500' },
              { t: 'FSRS 智能记忆算法', d: '基于 FSRS 算法智能抽题，打造基础，时常强化，确保核心知识点抵达长时记忆。', icon: Target, c: 'text-indigo-500' },
              { t: '学术知识拓扑地图', d: '可视化溯源知识节点，实现学术资产的秒级检索定位，构建知识网络不再困难。', icon: Network, c: 'text-emerald-500' },
              { t: '毫秒级响应自习室', d: '高并发即时通讯与可视化番茄钟，广播任务进展与专注时间，打造沉浸学习共同体。', icon: Users, c: 'text-orange-500' }
            ].map(item => (
              <Card key={item.t} className="bg-white dark:bg-[#0F1115] p-6 border-slate-100 dark:border-white/5 rounded-[2rem] space-y-3 hover:shadow-xl hover:-translate-y-1 transition-all group text-left shadow-sm">
                 <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-white/5 shadow-inner", item.c)}>
                    <item.icon className="h-5 w-5" />
                 </div>
                 <h4 className="font-bold text-slate-900 dark:text-white text-md tracking-tight uppercase">{item.t}</h4>
                 <p className="text-slate-500 dark:text-slate-400 text-[13px] leading-relaxed font-medium">{item.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Pricing & Course Projects */}
      <section id="section-3" className="py-24 bg-white dark:bg-[#0F1115]">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <SectionHeader 
            title="2026 课程项目计划" 
            subtitle="针对不同基础与目标的学员，我们提供全方位的课程选择。从覆盖全周期的 K2 全程班，到精准突破的单科模块，每一份计划都经过精心雕琢。在这里，你将体验到前所未有的应试效率与专业深度。" 
            centered 
            label="Investment Plans" 
          />
          <div className="flex flex-col gap-10">
            
            {/* Full Course - Main Highlight */}
            <Card className="w-full bg-slate-900 text-white p-8 md:p-12 rounded-[3rem] border-slate-800 shadow-2xl relative overflow-hidden text-left group flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform pointer-events-none"><Sparkles className="h-60 w-60 text-pink-500" /></div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-4">
                  <div className="inline-flex px-3 py-1 rounded-full bg-pink-500 text-[9px] font-bold uppercase tracking-widest">Recommended Enrollment</div>
                  <h3 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">K2 全程班计划</h3>
                  <p className="text-slate-400 text-sm font-medium max-w-md mt-4 leading-relaxed">一站式全周期深度辅导，重构金融 431 应试效率极限。包含 AMR 核心课程体系的所有模块与增值服务。</p>
                </div>
                <div className="text-left md:text-right space-y-1">
                  <span className="text-4xl text-slate-500 font-bold line-through opacity-80">¥9,799</span>
                  <div className="flex items-baseline justify-start md:justify-end gap-1">
                    <span className="text-6xl font-black tracking-tighter text-white">¥8,150</span>
                  </div>
                  <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mt-2">全程班限时优惠</p>
                </div>
              </div>

              <div className="relative z-10 border-t border-white/10 mt-10 pt-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { id: 'Module.A', t: '货币经济学模块', d: '含货币银行学与国际金融两门课程，覆盖黄达、Mishkin、姜波克、克鲁格曼等全书目，增补Walsh、Dornbusch等进阶理论。' },
                    { id: 'Module.B', t: '金融理论单科', d: '整合公司理财、投资及衍生品定价，180道核心习题以练促讲，深度聚焦计算与框架，力争取得满分。' },
                    { id: 'Module.C', t: '习题训练专项', d: '自建核心题库，含历年高校真题、模拟题与国外顶级高校Text Bank，配合 8 次阶段/模拟考试，随时追踪掌握水平，掌握考试节奏。' }
                  ].map(stat => (
                    <div key={stat.id} className="space-y-2">
                      <p className="text-[9px] font-bold text-pink-500 uppercase tracking-widest">{stat.id}</p>
                      <p className="text-base font-bold text-white leading-none">{stat.t}</p>
                      <p className="text-[16px] text-slate-400 font-medium leading-relaxed">{stat.d}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 flex flex-wrap gap-4 mt-12">
                <Button className="bg-transparent border border-white/20 text-white hover:bg-white/10 font-bold text-xs h-12 px-10 rounded-xl transition-colors" onClick={() => navigate('/course-details')}>课程详情</Button>
              </div>
            </Card>

            {/* Single Modules as Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { t: '货币经济学单科', p: '3500', id: 'Module.A' },
                { t: '金融理论单科', p: '3200', id: 'Module.B' },
                { t: '习题训练专项', p: '2800', id: 'Module.C' }
              ].map(item => (
                <Card key={item.t} className="bg-slate-50 dark:bg-[#0A0A0B] border border-slate-100 dark:border-white/5 p-8 rounded-[2.5rem] flex flex-col items-start text-left space-y-5 group hover:border-pink-500/30 transition-all justify-between">
                  <div className="space-y-3">
                    <p className="text-[9px] font-bold text-pink-500 uppercase tracking-widest leading-none">{item.id}</p>
                    <h4 className="font-black text-xl text-slate-900 dark:text-white uppercase leading-tight">{item.t}</h4>
                  </div>
                  <div className="w-full pt-5 border-t border-slate-200 dark:border-white/10 flex items-center justify-between mt-4">
                    <span className="font-black text-2xl text-slate-900 dark:text-white tracking-tighter">¥{item.p}</span>
                    <Button variant="ghost" className="h-10 w-10 rounded-full p-0 hover:bg-pink-500 hover:text-white transition-colors" onClick={() => navigate('/register')}>
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="py-16 bg-white dark:bg-[#0F1115] border-t border-slate-100 dark:border-slate-800 text-left">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-12 text-sm">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold italic text-xl shadow-lg">K</div>
            <div className="text-left leading-tight">
              <p className="font-bold text-lg text-slate-900 dark:text-white tracking-tighter uppercase">UniMind.ai</p>
              <div className="flex flex-col gap-1 mt-1">
                <p className="text-[10px] font-medium text-slate-400 tracking-wide">© {COPYRIGHT_YEAR} {COPYRIGHT_ENTITY}</p>
                <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em]">{APP_VERSION} · {BRAND_DESC}</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
