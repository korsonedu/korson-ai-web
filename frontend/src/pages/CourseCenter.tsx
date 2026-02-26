import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutGrid, PlusCircle, PlayCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import { PageWrapper } from '@/components/PageWrapper';
import api from '@/lib/api';

export const CourseCenter: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses/').then(res => {
      setCourses(res.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const ActionBtn = user?.role === 'admin' ? (
    <Button 
      onClick={() => navigate('/management')}
      className="bg-black text-white hover:bg-black/90 rounded-2xl px-6 h-11 font-bold shadow-xl shadow-black/10 transition-all hover:scale-[1.02]"
    >
      <PlusCircle className="mr-2 h-4 w-4" /> 发布新课程
    </Button>
  ) : null;

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-black/20" />
      <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">Synchronizing Catalog...</p>
    </div>
  );

  return (
    <PageWrapper 
      title="课程中心" 
      subtitle="精品课程助你构建完整的专业知识体系。"
      action={ActionBtn}
    >
      {courses.length === 0 ? (
        <div className="space-y-10 text-left">
          <Card className="border-none shadow-sm rounded-3xl bg-white p-16 flex flex-col items-center justify-center text-center space-y-6 border border-black/[0.03]">
            <div className="h-20 w-20 bg-[#F5F5F7] rounded-3xl flex items-center justify-center">
              <LayoutGrid className="h-8 w-8 text-black/10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#1D1D1F]">虚位以待</h3>
              <p className="text-[#86868B] max-w-sm mx-auto text-sm font-medium leading-relaxed">
                目前还没有上传课程。如果你是管理员，可以前往维护中心发布第一门课程。
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 text-left animate-in fade-in duration-700">
           {courses.map(course => (
             <Card 
              key={course.id} 
              onClick={() => navigate(`/course/${course.id}`)}
              className="border-none shadow-sm rounded-2xl overflow-hidden bg-white border border-black/[0.03] group hover:shadow-lg transition-all duration-500 cursor-pointer"
             >
                <div className="aspect-video bg-slate-100 relative overflow-hidden">
                   {course.cover_image ? (
                     <img src={course.cover_image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-black/5 font-bold uppercase tracking-widest text-[11px]">No Preview</div>
                   )}
                   <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform">
                        <PlayCircle className="h-4 w-4 text-black" />
                      </div>
                   </div>
                </div>
                <CardContent className="p-4 space-y-2">
                   <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-sm leading-tight group-hover:text-emerald-600 transition-colors line-clamp-1 flex-1">{course.title}</h3>
                   </div>
                   <p className="text-[11px] text-[#86868B] line-clamp-2 font-medium leading-relaxed min-h-[28px]">{course.description}</p>
                </CardContent>
             </Card>
           ))}
        </div>
      )}
    </PageWrapper>
  );
};
