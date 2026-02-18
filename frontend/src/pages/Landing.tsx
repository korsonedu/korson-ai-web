import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Trophy, BookOpen, User, CheckCircle2, 
  ArrowRight, ShieldCheck, Zap, Sparkles, 
  HelpCircle, GraduationCap, Briefcase, Globe,
  PieChart, BrainCircuit, Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const FeatureCard = ({ icon: Icon, title, content }: any) => (
  <Card className="border-none shadow-sm bg-white dark:bg-card hover:shadow-md transition-all rounded-3xl p-8 border border-black/[0.03] dark:border-white/5">
    <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center mb-6">
      <Icon className="h-6 w-6 text-primary" />
    </div>
    <h3 className="text-xl font-bold mb-3 text-foreground">{title}</h3>
    <p className="text-muted-foreground leading-relaxed text-sm">{content}</p>
  </Card>
);

const SectionTitle = ({ title, subtitle, light }: any) => (
  <div className="text-center space-y-4 mb-16">
    <h2 className={cn("text-3xl md:text-4xl font-bold tracking-tight", light ? "text-white" : "text-foreground")}>{title}</h2>
    <div className="h-1 w-20 bg-primary mx-auto rounded-full" />
    <p className={cn("text-lg max-w-2xl mx-auto", light ? "text-white/60" : "text-muted-foreground")}>{subtitle}</p>
  </div>
);

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-black font-sans selection:bg-primary selection:text-primary-foreground text-left">
      
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-black/[0.03] dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold italic">K</div>
            <span className="font-bold text-lg tracking-tight text-foreground">科晟智慧</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="rounded-full text-sm font-bold" onClick={() => navigate('/login')}>登录</Button>
            <Button className="rounded-full px-6 bg-black dark:bg-white text-white dark:text-black font-bold text-sm shadow-xl" onClick={() => navigate('/register')}>开启学习</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-24 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-widest">始创于 2019 · 专业 431 培训</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground leading-[1.1]">
                用最短的时间<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">掌握金融 431</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-xl font-medium leading-relaxed">
                我们的 K2 战略致力于极速突破专业课壁垒，为你争取公共课复习的黄金时间。
              </p>
              <div className="flex flex-wrap gap-4 pt-4">
                <Button size="lg" className="rounded-2xl px-10 h-14 bg-black dark:bg-white text-white dark:text-black font-bold text-lg shadow-2xl hover:scale-[1.02] transition-transform" onClick={() => navigate('/register')}>
                  立即报名全程班 <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <div className="flex items-center gap-4 px-6 py-3 rounded-2xl bg-white dark:bg-card border border-black/[0.03] dark:border-white/5">
                  <div className="flex -space-x-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-white dark:border-black bg-slate-200 overflow-hidden shadow-sm">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i}study`} className="w-full h-full" />
                      </div>
                    ))}
                  </div>
                  <span className="text-sm font-bold text-foreground">200+ 考生信赖之选</span>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full max-w-xl">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/20 to-purple-600/20 blur-3xl rounded-full" />
                <Card className="relative border-none shadow-2xl rounded-[3rem] bg-white/80 dark:bg-card/80 backdrop-blur-2xl p-10 border border-white/20">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <p className="text-4xl font-bold text-foreground">400+</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">20余位学员突破</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-4xl font-bold text-foreground">120+</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">30余位专业课高分</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-4xl font-bold text-foreground">+50分</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">二战平均提升</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-4xl font-bold text-primary italic font-serif">K2</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-none">核心应试战略</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-b from-purple-500/5 to-transparent rounded-full -mr-96 -mt-96 blur-3xl pointer-events-none" />
      </section>

      {/* Instructor Section */}
      <section className="py-24 bg-white dark:bg-card/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="w-full md:w-1/3">
              <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-[3rem] opacity-20 blur-xl group-hover:opacity-30 transition-opacity" />
                <div className="relative h-[450px] rounded-[2.5rem] bg-slate-100 overflow-hidden shadow-2xl border-4 border-white dark:border-black">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                    <User className="h-24 w-24 text-black/10" />
                  </div>
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=TeacherZu" className="w-full h-full object-cover" alt="祖哥" />
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-8">
              <header className="space-y-2 text-left">
                <h2 className="text-4xl font-bold tracking-tight text-foreground">主理人 · 祖哥</h2>
                <p className="text-primary font-bold uppercase tracking-widest text-sm">Z-BRO · MASTER LECTURER</p>
              </header>
              <div className="space-y-6 text-muted-foreground text-lg font-medium leading-relaxed max-w-3xl">
                <p>深耕金融 431 授课 <span className="text-foreground font-bold underline decoration-primary decoration-2 underline-offset-4">6 年</span>，金融硕士背景，法律职业资格证持证，中级职称。</p>
                <p>现任某央企投资平台战略投资主管，主导收并购、非公开发行、增资引战、投资项目退出等多个大型资本运作项目。</p>
                <p className="p-6 bg-[#F5F5F7] dark:bg-black/40 rounded-2xl border-l-4 border-primary italic">
                  "我将丰富的学术积累与真实的资本市场实操经验相结合，不仅教你如何应对考试，更教你理解金融的底层逻辑。"
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {['战略投资主管', '法考持证', '中级职称', '实战派导师'].map(tag => (
                  <span key={tag} className="px-4 py-1.5 rounded-xl bg-primary/5 text-primary text-xs font-bold border border-primary/10 uppercase tracking-wider">{tag}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Courses Section */}
      <section className="py-24 bg-[#F5F5F7] dark:bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <SectionTitle 
            title="课程体系：两门四科全覆盖" 
            subtitle="覆盖黄达、Mishkin、Ross、Bodie、Hull等经典教材，并引入高级进阶内容。"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Monetary Economics */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-card overflow-hidden group">
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Core Module 01</span>
                    <h3 className="text-3xl font-bold text-foreground">货币经济学</h3>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-lg">60%</div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-bold flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> 核心覆盖教材</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      黄达、Mishkin、易纲、蒋先玲、胡庆康等 431 必备参考书目。
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /> 高级进阶 (Academic+)</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      选入 Dornbusch《宏观经济学》、Romer《高级宏观经济学》等进阶内容，助你应对难题。
                    </p>
                  </div>
                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F5F5F7] dark:bg-black/40 rounded-2xl">
                      <p className="text-[10px] font-bold opacity-40 uppercase mb-1">国际金融</p>
                      <p className="text-xs font-bold">聚焦真实世界经济分析框架</p>
                    </div>
                    <div className="p-4 bg-[#F5F5F7] dark:bg-black/40 rounded-2xl">
                      <p className="text-[10px] font-bold opacity-40 uppercase mb-1">货币银行</p>
                      <p className="text-xs font-bold">教材内容全覆盖与深度深挖</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Financial Theory */}
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-card overflow-hidden group">
              <div className="p-10 space-y-8">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">Core Module 02</span>
                    <h3 className="text-3xl font-bold text-foreground">金融理论整合</h3>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-black text-white flex items-center justify-center font-bold text-xl shadow-lg dark:bg-white dark:text-black">K2</div>
                </div>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="font-bold flex items-center gap-2"><PieChart className="h-4 w-4 text-primary" /> 公司理财与投资学</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Ross、Bodie、Hull 三大体系合而为一，兼顾原理讲解与答题框架梳理。
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-bold flex items-center gap-2"><Zap className="h-4 w-4 text-emerald-500" /> K2 战略：核心算力</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      聚焦现代金融理论计算，重点训练新股发行、租赁购买、股权回购等升级考点。
                    </p>
                  </div>
                  <div className="pt-4 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-[#F5F5F7] dark:bg-black/40 rounded-2xl">
                      <p className="text-[10px] font-bold opacity-40 uppercase mb-1">习题训练</p>
                      <p className="text-xs font-bold">独家翻译国外顶级 Test Bank</p>
                    </div>
                    <div className="p-4 bg-[#F5F5F7] dark:bg-black/40 rounded-2xl">
                      <p className="text-[10px] font-bold opacity-40 uppercase mb-1">衍生产品</p>
                      <p className="text-xs font-bold">重点突破计算题核心框架</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="py-24 relative bg-black overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <SectionTitle 
            light
            title="技术赋能：首家引入 AI 工作流" 
            subtitle="善用赛博助教与 RAG 模拟题，让技术成为你的学术生产力。"
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] p-8 space-y-6">
              <div className="h-12 w-12 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <BrainCircuit className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white">赛博助教办公室</h4>
              <p className="text-white/60 text-sm leading-relaxed font-medium">
                Langchain + Websocket 驱动，驻扎在 SciRise 社群，随时解答框架性疑问。
              </p>
            </Card>
            <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] p-8 space-y-6">
              <div className="h-12 w-12 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white">DeepSeek-R1 + RAG</h4>
              <p className="text-white/60 text-sm leading-relaxed font-medium">
                自有服务器部署 32b 模型，基于检索增强生成更具价值与时效性的模拟题目。
              </p>
            </Card>
            <Card className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[2rem] p-8 space-y-6">
              <div className="h-12 w-12 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Activity className="h-6 w-6 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white">模型微调与原创题</h4>
              <p className="text-white/60 text-sm leading-relaxed font-medium">
                目前已开始针对金融硕士考研语料进行模型微调，提供市面上唯一的原创高质题。
              </p>
            </Card>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/10 via-transparent to-purple-600/10" />
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-white dark:bg-card/30">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-12">
          <header className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight text-foreground">定价与早鸟优惠</h2>
            <p className="text-lg text-muted-foreground font-medium">我们筹划学习打卡活动，满足条件可返还部分学费。</p>
          </header>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            <Card className="border-2 border-black/[0.03] dark:border-white/5 rounded-[2.5rem] p-10 bg-[#F5F5F7] dark:bg-black/40">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Standard Price</p>
              <h4 className="text-xl font-bold text-foreground">全程班全价</h4>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">¥4500</span>
                <span className="text-sm font-bold text-muted-foreground uppercase">/ Course</span>
              </div>
              <ul className="mt-8 space-y-4">
                {['全部课程内容', '全套讲义 PDF', '赛博助教支持', '视频两年有效'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-sm font-bold opacity-60">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {item}
                  </li>
                ))}
              </ul>
            </Card>
            <Card className="border-none shadow-2xl rounded-[2.5rem] p-10 bg-black text-white relative overflow-hidden group">
              <div className="relative z-10">
                <div className="inline-flex px-3 py-1 rounded-full bg-primary/20 text-primary-foreground text-[10px] font-bold uppercase tracking-widest mb-4">限额 20 位 · 先到先得</div>
                <h4 className="text-xl font-bold">早早早鸟价 (8折)</h4>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-white">¥3600</span>
                  <span className="text-sm font-bold text-white/40 uppercase">/ Limited</span>
                </div>
                <Button className="w-full h-14 rounded-2xl bg-white text-black font-bold text-lg mt-10 hover:bg-white/90 shadow-xl" onClick={() => navigate('/register')}>立即锁定名额</Button>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-pink-500/20 to-purple-600/20 blur-[80px] -mr-32 -mt-32 group-hover:from-pink-500/30 transition-all duration-1000" />
            </Card>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 bg-[#F5F5F7] dark:bg-black">
        <div className="max-w-7xl mx-auto px-6">
          <SectionTitle 
            title="课程之外：长期成长计划" 
            subtitle="打破实习市场信息不对称，培养金融实操分析能力。"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <div className="h-14 w-14 rounded-[1.5rem] bg-black text-white flex items-center justify-center shadow-xl dark:bg-white dark:text-black">
                <Briefcase className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">科晟就业联盟</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                利用已有资源作为第三方，对接实习岗位的需求与供给。我们会对双方进行明确的尽职调查，消除信息不对称，助你敲开职业生涯的大门。
              </p>
            </div>
            <div className="space-y-6">
              <div className="h-14 w-14 rounded-[1.5rem] bg-gradient-to-br from-pink-500 to-purple-600 text-white flex items-center justify-center shadow-xl shadow-purple-500/20">
                <Globe className="h-7 w-7" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">科晟智库 (Think Tank)</h3>
              <p className="text-muted-foreground leading-relaxed font-medium">
                依托具有优秀能力的学生，面向产业单位制作分析报告或可行性研究报告。通过真实项目充分训练实操能力，让学术研究服务于产业实践。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-white dark:bg-card/30">
        <div className="max-w-4xl mx-auto px-6">
          <SectionTitle title="常见问题解答" subtitle="关于课程效期、定向服务及退款制度的说明。" />
          <div className="space-y-6">
            {[
              { q: '课程有效期是多久？', a: '视频与课件有效期最长两年。课程服务在初试结束后截止，二战考生申请可延长一年。复试及就业服务终身有效。' },
              { q: '是否有保过班？你们的课程对我有什么帮助？', a: '不承诺保过，不开设 VIP 班。我们不能代替你的学习，但能最大化你的掌握程度与复习效率。统计学上我们的服务显著可靠。' },
              { q: '能提供定校/定向服务吗？', a: '不提供。绝大多数院校 431 考查内容类似，统一课程可减少冗余且已能实现有效覆盖各院校风格。' },
              { q: '觉得课程不适合我怎么办？', a: '我们有严格的退课制度，根据进度公允退款。自 19 年起零经济纠纷。教育应当温暖，即使不适应也会提供力所能及的帮助。' },
              { q: '课程以外还有什么服务？', a: '除了优质初试课程，还提供复试辅导、长期成长计划、就业联盟对接以及参与智库研究报告编写的机会。' }
            ].map((faq, i) => (
              <div key={i} className="p-8 rounded-3xl bg-[#F5F5F7] dark:bg-black/40 border border-black/[0.02] dark:border-white/5 space-y-3 group hover:border-primary/20 transition-all">
                <div className="flex items-center gap-3">
                  <HelpCircle className="h-5 w-5 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-lg font-bold text-foreground">{faq.q}</h4>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm font-medium pl-8">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-[#F5F5F7] dark:bg-black border-t border-black/[0.03] dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold italic">K</div>
            <div className="text-left">
              <p className="font-bold text-sm text-foreground">科晟智慧 · KORSON ACADEMY</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">© 2019-2026 北京融知高科</p>
            </div>
          </div>
          <div className="flex gap-8">
            <a href="#" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">微信公众号</a>
            <a href="#" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">SciRise 社群</a>
            <a href="#" className="text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest">服务条款</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
