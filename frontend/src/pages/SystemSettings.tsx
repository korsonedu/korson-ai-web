import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { PageWrapper } from '@/components/PageWrapper';
import { useSystemStore } from '@/store/useSystemStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Sun, Moon, Palette, Check, Sparkles, Globe, ImageIcon, Save, Upload, Fingerprint } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

const PRESET_COLORS = [
  { name: '极简黑', hex: '#000000' },
  { name: '学术蓝', hex: '#1d4ed8' },
  { name: '常春藤绿', hex: '#059669' },
  { name: '牛津红', hex: '#991b1b' },
  { name: '果粒橙', hex: '#d97706' },
];

export const SystemSettings: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, setTheme, primaryColor, setPrimaryColor } = useSystemStore();
  
  const [system, setSystem] = useState({
    schoolName: '',
    schoolShortName: '',
    schoolDesc: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [currentLogo, setCurrentLogo] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/users/config/').then(res => {
        setSystem({
          schoolName: res.data.school_name,
          schoolShortName: res.data.school_short_name || '',
          schoolDesc: res.data.school_description,
        });
        setCurrentLogo(res.data.school_logo || '');
      }).catch(() => {});
    }
  }, [user]);

  const handleSaveSystem = async () => {
    const formData = new FormData();
    formData.append('school_name', system.schoolName);
    formData.append('school_short_name', system.schoolShortName);
    formData.append('school_description', system.schoolDesc);
    if (logoFile) {
      formData.append('school_logo', logoFile);
    }

    try {
      await api.patch('/users/config/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("系统全局配置已同步");
      setTimeout(() => window.location.reload(), 1000);
    } catch (e) { toast.error("更新失败"); }
  };

  return (
    <PageWrapper title="系统偏好设置" subtitle="定制网校的视觉身份、机构品牌及全局交互逻辑。">
      <div className="max-w-4xl mx-auto space-y-8 text-left animate-in fade-in duration-700">
        
        {user?.role === 'admin' && (
          <Card className="border-none shadow-sm rounded-3xl bg-[#1D1D1F] text-white overflow-hidden p-10 relative group">
             <div className="space-y-8 relative z-10 text-left">
               <div className="flex items-center gap-4">
                 <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-xl">
                   <Globe className="h-6 w-6 text-white" />
                 </div>
                 <div>
                    <h3 className="text-xl font-bold tracking-tight text-white">机构品牌管理控制台</h3>
                    <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest mt-1">Institutional Identity & Branding</p>
                 </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 text-left">
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">网校官方全称</Label>
                    <Input 
                      value={system.schoolName}
                      onChange={e => setSystem({...system, schoolName: e.target.value})}
                      className="bg-white/10 border-none h-12 rounded-2xl text-white font-bold px-5 focus-visible:ring-white/20" 
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">网校缩写名称 (用于侧边栏)</Label>
                    <div className="relative">
                       <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20" />
                       <Input 
                        value={system.schoolShortName}
                        onChange={e => setSystem({...system, schoolShortName: e.target.value})}
                        placeholder="如：科晟"
                        className="pl-12 bg-white/10 border-none h-12 rounded-2xl text-white font-bold px-5 focus-visible:ring-white/20" 
                       />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">机构 LOGO 标识</Label>
                    <div className="flex gap-3">
                       <div className="relative group/upload flex-1">
                          <Button variant="outline" className="w-full h-12 rounded-2xl bg-white/10 border-dashed border-white/20 hover:bg-white/20 hover:border-white/40 text-white font-bold justify-between px-5">
                             <span className="truncate text-xs">{logoFile ? logoFile.name : '上传 Logo 图像'}</span>
                             <Upload className="w-4 h-4 opacity-40"/>
                          </Button>
                          <input type="file" onChange={e => setLogoFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                       </div>
                       <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                          {logoFile ? <img src={URL.createObjectURL(logoFile)} className="w-full h-full object-cover"/> : currentLogo ? <img src={currentLogo} className="w-full h-full object-cover"/> : <ImageIcon className="w-4 h-4 opacity-20"/>}
                       </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-white/40 ml-1">官方 SLOGAN</Label>
                    <Input 
                      value={system.schoolDesc}
                      onChange={e => setSystem({...system, schoolDesc: e.target.value})}
                      className="bg-white/10 border-none h-12 rounded-2xl text-white font-bold px-5 focus-visible:ring-white/20" 
                    />
                  </div>
               </div>
               
               <Button onClick={handleSaveSystem} className="bg-white text-black hover:bg-white/90 rounded-2xl px-12 h-14 font-bold shadow-2xl transition-all hover:scale-[1.02] active:scale-95">
                 <Save className="mr-2 h-4 w-4" /> 同步更新全局品牌设置
               </Button>
             </div>
             <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-48 -mt-48 transition-all group-hover:bg-white/10 duration-1000" />
          </Card>
        )}

        {/* Visual Styling Card */}
        <Card className="border-none shadow-sm rounded-3xl bg-white border border-black/[0.03] overflow-hidden">
          <CardHeader className="p-10 pb-6 border-b border-black/[0.02]">
            <div className="flex items-center gap-4">
               <div className="h-12 w-12 rounded-2xl bg-black/5 flex items-center justify-center"><Palette className="h-6 w-6 opacity-40" /></div>
               <div className="text-left">
                  <CardTitle className="text-xl font-bold tracking-tight">界面视觉定制</CardTitle>
                  <CardDescription className="text-sm font-medium text-[#86868B]">调整全站的主题模式与品牌核心色彩。</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent className="p-10 space-y-12">
            <div className="flex items-center justify-between p-6 rounded-[2rem] bg-[#F5F5F7]">
              <div className="flex items-center gap-5">
                <div className="h-12 w-12 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-black/5">{theme === 'light' ? <Sun className="h-6 w-6 text-amber-500" /> : <Moon className="h-6 w-6 text-blue-500" />}</div>
                <div className="space-y-0.5 text-left"><p className="text-base font-bold text-[#1D1D1F]">深色模式 (Beta)</p><p className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest">Toggle dark appearance</p></div>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')} />
            </div>
            <div className="space-y-6 text-left">
              <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-black/20" /><Label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">品牌重点色 / Brand Accent</Label></div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {PRESET_COLORS.map((color) => (
                  <button key={color.hex} onClick={() => setPrimaryColor(color.hex)} className={cn("group relative h-24 rounded-[1.5rem] border-2 transition-all flex flex-col items-center justify-center gap-3 overflow-hidden", primaryColor === color.hex ? "border-black shadow-xl scale-105 bg-white" : "border-transparent bg-[#F5F5F7]/50 hover:border-black/10")}>
                    <div className="h-8 w-8 rounded-full shadow-inner ring-4 ring-white" style={{ backgroundColor: color.hex }} /><span className="text-[10px] font-bold uppercase tracking-widest">{color.name}</span>
                    {primaryColor === color.hex && <div className="absolute top-2 right-2 h-5 w-5 bg-black rounded-full flex items-center justify-center animate-in zoom-in"><Check className="h-3 w-3 text-white" /></div>}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  );
};
