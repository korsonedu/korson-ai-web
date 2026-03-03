import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PageWrapper } from '@/components/PageWrapper';
import { useSystemStore } from '@/store/useSystemStore';
import { Sun, Moon, Palette, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRESET_COLORS = [
  { name: '极简黑', hex: '#000000' },
  { name: '学术蓝', hex: '#1d4ed8' },
  { name: '常春藤绿', hex: '#059669' },
  { name: '牛津红', hex: '#991b1b' },
  { name: '果粒橙', hex: '#d97706' },
];

export const SystemSettings: React.FC = () => {
  const { theme, setTheme, primaryColor, setPrimaryColor } = useSystemStore();

  return (
    <PageWrapper title="系统偏好设置" subtitle="官方品牌名称固定为 unimind.ai，可在此调整主题与全局视觉。">
      <div className="max-w-4xl mx-auto space-y-8 text-left animate-in fade-in duration-700">

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
