import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Calendar, User } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Loader2 } from 'lucide-react';

export const ArticleDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/articles/${id}/`).then(res => {
      setArticle(res.data);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-black/10" />
      <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">Loading Academic Context...</p>
    </div>
  );

  if (!article) return <div className="h-screen flex items-center justify-center font-bold">Article Not Found</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-700 text-left p-6">
      <header className="space-y-8 border-b border-black/[0.03] pb-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl hover:bg-white shadow-sm border border-black/5 h-10 w-10 transition-all">
          <ChevronLeft className="h-5 w-5"/>
        </Button>
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full uppercase tracking-widest border border-emerald-100/50">Formal Publication</span>
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3"/> {new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
           </div>
           <h1 className="text-5xl font-bold tracking-tight text-[#1D1D1F] leading-[1.1]">{article.title}</h1>
           <div className="flex flex-wrap gap-2">
              {article.tags?.map((t: string) => (
                <span key={t} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg uppercase tracking-wider">{t}</span>
              ))}
           </div>
        </div>
      </header>

      <article className="prose prose-slate max-w-none prose-headings:text-[#1D1D1F] prose-headings:font-bold prose-p:text-[#1D1D1F]/80 prose-p:leading-relaxed prose-p:text-lg">
         <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
           {article.content}
         </ReactMarkdown>
      </article>

      <footer className="pt-12 border-t border-black/[0.03] flex items-center justify-between">
         <div className="flex items-center gap-4 text-left">
            <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm shadow-xl uppercase">
               {article.author_display_name?.[0] || 'KS'}
            </div>
            <div>
               <p className="text-sm font-bold text-[#1D1D1F]">{article.author_display_name || '科晟网校学术编辑部'}</p>
               <p className="text-[10px] font-medium text-[#86868B] uppercase tracking-widest">Verified Academic Resource</p>
            </div>
         </div>
         <Button onClick={() => navigate('/articles')} variant="outline" className="rounded-2xl font-bold h-12 px-8 border-black/5 hover:bg-slate-50">返回文章列表</Button>
      </footer>
    </div>
  );
};
