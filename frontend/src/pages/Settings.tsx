import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/useAuthStore';
import { 
  User as UserIcon, RefreshCcw, Save, Camera, Mail, Lock, Trash2, RotateCcw, ShieldAlert
} from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { PageWrapper } from '@/components/PageWrapper';
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const AVATAR_STYLES = [
  { id: 'avataaars', label: '简约角色' },
  { id: 'bottts', label: '机器人' },
  { id: 'pixel-art', label: '像素艺术' },
  { id: 'adventurer', label: '冒险家' },
  { id: 'big-smile', label: '大笑脸' },
  { id: 'micah', label: '扁平化' },
  { id: 'lorelei', label: '手绘风格' },
  { id: 'notionists', label: '极简主义' },
];

export const Settings: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Profile
  const [profile, setProfile] = useState({
    nickname: user?.nickname || user?.username || '',
    bio: user?.bio || '',
  });

  // Avatar
  const [avatar, setAvatar] = useState({
    style: user?.avatar_style || 'avataaars',
    seed: user?.avatar_seed || user?.username || '',
  });

  // Security
  const [email, setEmail] = useState('');
  const [passwords, setPasswords] = useState({ old: '', new: '' });

  const previewUrl = `https://api.dicebear.com/7.x/${avatar.style}/svg?seed=${avatar.seed}`;

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await api.patch('/users/me/update/', {
        nickname: profile.nickname,
        bio: profile.bio,
        avatar_style: avatar.style,
        avatar_seed: avatar.seed
      });
      updateUser(res.data);
      toast.success("个人账户信息已同步");
    } catch (err) { toast.error("保存失败"); }
    finally { setLoading(false); }
  };

  const handleResetElo = async () => {
    try {
      const res = await api.post('/users/me/reset-elo/');
      updateUser(res.data);
      toast.success("ELO 已重置", { description: "你现在可以重新进行学术评估。" });
    } catch (e: any) {
      toast.error(e.response?.data?.error || "重置失败");
    }
  };

  const handleUpdateEmail = async () => {
    if (!email) return toast.error("请输入新邮箱");
    try {
      const res = await api.patch('/users/me/email/', { email });
      updateUser(res.data);
      toast.success("邮箱更新成功");
      setEmail('');
    } catch (e) { toast.error("更新失败"); }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.old || !passwords.new) return toast.error("请完善密码信息");
    try {
      await api.patch('/users/me/password/', { old_password: passwords.old, new_password: passwords.new });
      toast.success("密码重置成功");
      setPasswords({ old: '', new: '' });
    } catch (e) { toast.error("原始密码错误"); }
  };

  return (
    <PageWrapper title="个人设置" subtitle="管理个人身份标识、学术简介及数字化化身。">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in fade-in duration-700">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-8 flex flex-col items-center text-center border border-black/[0.03]">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-2xl ring-1 ring-black/5">
                <AvatarImage src={previewUrl} />
                <AvatarFallback className="text-4xl font-bold">{profile.username[0]}</AvatarFallback>
              </Avatar>
              <Sheet>
                <SheetTrigger asChild><button className="absolute bottom-0 right-0 bg-black text-white p-2.5 rounded-full shadow-xl border-4 border-white transition-transform hover:scale-110"><Camera className="h-4 w-4" /></button></SheetTrigger>
                <SheetContent side="right" className="rounded-l-[2.5rem] border-none bg-white/95 backdrop-blur-2xl shadow-2xl w-[450px]">
                  <SheetHeader className="p-8 border-b border-black/[0.03]"><SheetTitle className="text-2xl font-bold text-left">化身实验室</SheetTitle></SheetHeader>
                  <div className="p-8 space-y-10">
                    <div className="flex justify-center py-10 bg-slate-50 rounded-[2rem]"><Avatar className="h-44 w-44 border-8 border-white shadow-2xl"><AvatarImage src={previewUrl} /></Avatar></div>
                    <div className="space-y-6 text-left">
                      <div className="space-y-3"><Label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">风格选择</Label>
                        <Select value={avatar.style} onValueChange={(v) => setAvatar({...avatar, style: v})}>
                          <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl">
                            {AVATAR_STYLES.map(s => <SelectItem key={s.id} value={s.id} className="rounded-xl py-3 px-4"><div className="flex items-center gap-3 font-bold">{s.label}</div></SelectItem>)}
                          </SelectContent>
                        </Select></div>
                      <div className="space-y-3"><Label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">特征种子 (Seed)</Label>
                        <div className="flex gap-3"><Input value={avatar.seed} onChange={e => setAvatar({ ...avatar, seed: e.target.value })} className="bg-slate-50 border-none h-12 rounded-2xl font-bold" /><Button variant="outline" onClick={() => setAvatar({...avatar, seed: Math.random().toString(36).substring(7)})} className="rounded-2xl h-12 w-12 border-black/5"><RefreshCcw className="h-4 w-4" /></Button></div></div>
                    </div>
                    <Button onClick={handleSaveProfile} className="w-full bg-black text-white h-14 rounded-2xl font-bold shadow-xl shadow-black/10">同步修改</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            <h3 className="mt-6 text-xl font-bold text-foreground">{user?.nickname || user?.username}</h3>
            <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-widest leading-none text-emerald-600">Active Academic Rank: {user?.elo_score}</p>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white p-8 space-y-6 border border-black/[0.03]">
             <div className="space-y-6 text-left">
                <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">安全与重置</h4>
                <div className="space-y-4">
                   <div className="space-y-2"><Label className="text-[10px] font-bold opacity-40 ml-1 uppercase">修改邮箱</Label><div className="flex gap-2"><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="New Email" className="bg-[#F5F5F7] border-none h-10 rounded-xl text-xs font-bold px-4" /><Button onClick={handleUpdateEmail} className="rounded-xl bg-black text-white h-10 px-4 text-[10px] font-bold uppercase tracking-widest">Update</Button></div></div>
                   <div className="space-y-2 pt-2"><Label className="text-[10px] font-bold opacity-40 ml-1 uppercase">安全密码</Label><Input type="password" value={passwords.old} onChange={e => setPasswords({...passwords, old: e.target.value})} placeholder="Old Password" className="bg-[#F5F5F7] border-none h-10 rounded-xl text-xs font-bold px-4 mb-2" /><div className="flex gap-2"><Input type="password" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} placeholder="New Password" className="bg-[#F5F5F7] border-none h-10 rounded-xl text-xs font-bold px-4 flex-1" /><Button onClick={handleUpdatePassword} className="rounded-xl bg-black text-white h-10 px-4 text-[10px] font-bold uppercase tracking-widest">Reset</Button></div></div>
                </div>
             </div>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white p-8 space-y-4 border border-black/[0.03] text-left">
             <h4 className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">天梯定位校准</h4>
             <p className="text-[10px] text-[#86868B] font-medium leading-relaxed">每个账户仅有一次机会重置分位记录。</p>
             <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="outline" disabled={user?.elo_reset_count >= 1} className="w-full rounded-2xl h-11 border-black/5 font-bold text-xs"><RotateCcw className="h-3.5 w-3.5 mr-2" /> 重置分位 ({1 - (user?.elo_reset_count || 0)}/1)</Button></AlertDialogTrigger>
                <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                  <AlertDialogHeader><div className="h-12 w-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-2"><ShieldAlert className="h-6 w-6"/></div><AlertDialogTitle>确认重置 ELO 吗？</AlertDialogTitle><AlertDialogDescription>重置后需重新进行评估赛。此操作不可撤回。</AlertDialogDescription></AlertDialogHeader>
                  <AlertDialogFooter><AlertDialogCancel className="rounded-xl font-bold">取消</AlertDialogCancel><AlertDialogAction onClick={handleResetElo} className="rounded-xl bg-black text-white font-bold">确定重置</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
             </AlertDialog>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden p-10 border border-black/[0.03]">
             <div className="space-y-8 text-left">
               <div className="space-y-3">
                 <Label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">我的昵称 (公开显示)</Label>
                 <Input value={profile.nickname} onChange={e => setProfile({...profile, nickname: e.target.value})} className="bg-[#F5F5F7] border-none h-12 rounded-2xl font-bold px-5" />
                 <p className="text-[10px] text-muted-foreground font-bold ml-1 uppercase">登录账号: {user?.username} (不可修改)</p>
               </div>
               <div className="space-y-3">
                 <Label className="text-xs font-bold uppercase tracking-widest opacity-40 ml-1">个人履历 / Bio</Label>
                 <textarea value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full bg-[#F5F5F7] border-none rounded-2xl p-6 min-h-[250px] focus:outline-none focus:ring-1 focus:ring-black/10 font-bold text-sm leading-relaxed" placeholder="写下你的学术格言与研究方向..." />
               </div>
               <Button onClick={handleSaveProfile} disabled={loading} className="w-full h-14 bg-black text-white rounded-2xl font-bold shadow-xl transition-all hover:scale-[1.01]"><Save className="mr-2 h-4 w-4" /> 保存所有个人资料</Button>
             </div>
          </Card>
        </div>
      </div>
    </PageWrapper>
  );
};
