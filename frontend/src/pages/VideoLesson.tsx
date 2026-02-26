import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, Play, User, Calendar, BookOpen, 
  Share2, Star, ShieldCheck, FileText, Download, 
  Clock, ListVideo, Layers
} from 'lucide-react';
import api from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/useAuthStore';
import { toast } from 'sonner';

export const VideoLesson: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateUser } = useAuthStore();
  const [course, setCourse] = useState<any>(null);
  const [relatedCourses, setRelatedCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasAwarded, setHasAwarded] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setHasAwarded(false);
        const res = await api.get(`/courses/${id}/`);
        setCourse(res.data);
        
        // Fetch same-album courses
        if (res.data.album) {
          const allRes = await api.get('/courses/');
          setRelatedCourses(allRes.data.filter((c: any) => c.album === res.data.album && c.id !== res.data.id));
        }
      } catch (e) {}
      finally { setLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleVideoEnd = async () => {
    if (hasAwarded) return;
    
    // Report finished status and get reward in one go
    try {
      const res = await api.post(`/courses/${id}/progress/`, { is_finished: true });
      if (res.data.elo_added > 0) {
        setHasAwarded(true);
        toast.success(`观看完成！奖励 ${res.data.elo_added} ELO`, {
          description: `当前积分: ${res.data.new_score}`
        });
        // 更新全局用户信息以反映分数变化
        const me = await api.get('/users/me/');
        updateUser(me.data);
      }
    } catch (e) {
      console.error("Failed to update progress/award ELO", e);
    }
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    // 每 10 秒上报一次进度
    if (Math.floor(video.currentTime) % 10 === 0) {
      api.post(`/courses/${id}/progress/`, { position: video.currentTime }).catch(() => {});
    }
  };

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 text-center bg-[#F5F5F7]">
      <div className="h-10 w-10 border-4 border-black/5 border-t-emerald-500 rounded-full animate-spin" />
      <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">Preparing Theater...</p>
    </div>
  );
  
  if (!course) return <div className="h-screen flex items-center justify-center font-bold">Resource Not Found</div>;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 text-left p-6">
      <header className="flex items-center justify-between border-b border-black/[0.03] pb-6">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl hover:bg-white shadow-sm border border-black/5 h-12 w-12"><ChevronLeft className="h-6 w-6"/></Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-tighter">Academic Theater</span>
               <h2 className="text-3xl font-bold tracking-tight text-[#1D1D1F]">{course.title}</h2>
            </div>
            <div className="flex items-center gap-4 opacity-40 font-bold text-[10px] uppercase tracking-widest leading-none">
               {course.album && <span className="flex items-center gap-1.5 text-black"><Layers className="w-3 h-3"/> Album: {course.album}</span>}
               <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3"/> {new Date(course.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-xl font-bold h-11 border-black/5 hover:bg-white transition-all shadow-sm"><Share2 className="h-4 w-4 mr-2"/> 分享</Button>
           <Button variant="outline" className="rounded-xl font-bold h-11 border-black/5 hover:bg-white transition-all shadow-sm text-amber-500"><Star className="h-4 w-4 mr-2"/> 收藏</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Side: Player & Info */}
        <div className="lg:col-span-9 space-y-8">
           <div className="bg-black overflow-hidden relative aspect-video flex items-center justify-center rounded-[2rem] shadow-2xl">
             {course.video_file ? (
               <video 
                 onEnded={handleVideoEnd} 
                 onTimeUpdate={handleTimeUpdate}
                 src={course.video_file} 
                 controls 
                 className="w-full h-full" 
                 preload="metadata" 
                 poster={course.cover_image || undefined} 
               />
             ) : (
               <div className="flex flex-col items-center gap-4 opacity-20"><div className="h-24 w-24 rounded-full border-4 border-white/10 flex items-center justify-center"><Play className="h-10 w-10 text-white fill-white"/></div><p className="text-xs font-bold uppercase tracking-widest">No Stream Available</p></div>
             )}
           </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="md:col-span-2 space-y-8">
                <section className="space-y-6">
                   <div className="flex items-center gap-3 border-b border-black/[0.03] pb-4"><BookOpen className="h-5 w-5 text-emerald-600"/><h3 className="text-xl font-bold text-[#1D1D1F]">课程大纲与简介</h3></div>
                   <p className="text-[#86868B] text-base font-medium leading-relaxed whitespace-pre-wrap">{course.description}</p>
                </section>

                <section className="space-y-4">
                   <h4 className="text-[10px] font-bold uppercase tracking-widest text-black/30">教学资源下载</h4>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.courseware && (
                        <div className="p-5 rounded-2xl bg-white border border-black/[0.03] shadow-sm flex items-center justify-between group hover:border-black/10 transition-all">
                           <div className="flex items-center gap-4 text-left"><div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><FileText className="w-5 h-5"/></div><div><p className="text-xs font-bold truncate w-32">教学课件 (Lecture)</p><p className="text-[9px] font-bold opacity-30 uppercase">Academic PDF</p></div></div>
                           <Button asChild variant="ghost" size="icon" className="rounded-full"><a href={course.courseware} download><Download className="w-4 h-4"/></a></Button>
                        </div>
                      )}
                      {course.reference_materials && (
                        <div className="p-5 rounded-2xl bg-white border border-black/[0.03] shadow-sm flex items-center justify-between group hover:border-black/10 transition-all">
                           <div className="flex items-center gap-4 text-left"><div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><BookOpen className="w-5 h-5"/></div><div><p className="text-xs font-bold truncate w-32">参考文献 (Ref)</p><p className="text-[9px] font-bold opacity-30 uppercase">Resource PDF</p></div></div>
                           <Button asChild variant="ghost" size="icon" className="rounded-full"><a href={course.reference_materials} download><Download className="w-4 h-4"/></a></Button>
                        </div>
                      )}
                   </div>
                </section>
             </div>
             <div className="space-y-6">
                <Card className="border-none shadow-sm rounded-3xl bg-white p-8 border border-black/[0.03] space-y-6 text-left">
                   <div className="space-y-1"><h4 className="text-xs font-bold uppercase tracking-widest text-black/80">学习奖励</h4><p className="text-2xl font-bold text-green-700">+{course.elo_reward} ELO</p></div>
                   <p className="text-xs font-medium text-[#86868B] leading-relaxed">完整观看教学内容后，系统将自动结算并同步至您的学术分位。</p>
                </Card>
             </div>
          </div>
        </div>

        {/* Right Side: Album & Related */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center justify-between px-2"><h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#86868B]">同辑系列 / Album</h4><ListVideo className="w-4 h-4 opacity-20"/></div>
           <ScrollArea className="h-[750px] pr-4">
              <div className="space-y-3">
                 {relatedCourses.map((c, i) => (
                   <Link key={c.id} to={`/course/${c.id}`}>
                     <div className="p-4 rounded-2xl border bg-transparent border-transparent hover:bg-white hover:border-black/5 hover:shadow-md transition-all text-left mb-2 group">
                        <div className="aspect-video bg-slate-100 rounded-xl mb-3 overflow-hidden">
                           {c.cover_image && <img src={c.cover_image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />}
                        </div>
                        <div className="space-y-1">
                           <span className="text-[9px] font-bold opacity-30 uppercase">Track 0{i+1}</span>
                           <p className="text-xs font-bold leading-relaxed text-[#1D1D1F] line-clamp-2">{c.title}</p>
                        </div>
                     </div>
                   </Link>
                 ))}
                 {relatedCourses.length === 0 && <div className="py-20 text-center opacity-20 italic text-[10px] font-bold uppercase">No other courses in this album</div>}
              </div>
           </ScrollArea>
        </div>
      </div>
    </div>
  );
};
