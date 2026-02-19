import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Calendar, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export const ArticleDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.pageYOffset / totalHeight) * 100;
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const processedContent = article.content
    .replace(/\\\[/g, '\n\n$$\n')
    .replace(/\\\]/g, '\n$$\n\n')
    .replace(/\\\(/g, '$')
    .replace(/\\\)/g, '$');

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in duration-700 text-left p-10 pb-32 relative">
      <div className="fixed top-0 left-0 w-full h-1 z-[110] bg-muted/20">
        <div 
          className="h-full bg-indigo-500 transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <header className="space-y-8 border-b border-border/50 pb-10 mb-12">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl hover:bg-muted shadow-sm border border-border h-10 w-10 transition-all">
          <ChevronLeft className="h-5 w-5"/>
        </Button>
        <div className="space-y-4">
           <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-full uppercase tracking-widest border border-indigo-100 dark:border-indigo-900/50">Academic Paper</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5"><Calendar className="w-3 h-3"/> {new Date(article.created_at).toLocaleDateString('zh-CN')}</span>
           </div>
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[1.1]">{article.title}</h1>
           <div className="flex flex-wrap gap-2 pt-2">
              {article.tags?.map((t: string) => (
                <span key={t} className="text-[9px] font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-md uppercase tracking-wider">{t}</span>
              ))}
           </div>
        </div>
      </header>

      <div className="prose prose-lg prose-slate dark:prose-invert max-w-none 
        prose-headings:text-slate-900 dark:prose-headings:text-white prose-headings:font-black
        prose-p:text-slate-600 dark:prose-p:text-slate-300
        prose-strong:text-slate-900 dark:prose-strong:text-white
        prose-img:rounded-3xl prose-img:shadow-2xl
        ">
         <ReactMarkdown 
           remarkPlugins={[remarkMath, remarkGfm]} 
           rehypePlugins={[rehypeKatex]}
         >
           {processedContent}
         </ReactMarkdown>
      </div>

      <footer className="mt-20 pt-12 border-t border-border/50 flex items-center justify-between">
         <div className="flex items-center gap-4 text-left">
            <div className="h-12 w-12 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm shadow-xl uppercase">
               {article.author_display_name?.[0] || 'KS'}
            </div>
            <div>
               <p className="text-sm font-bold text-slate-900 dark:text-white">{article.author_display_name || '科晟网校学术编辑部'}</p>
               <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Verified Academic Resource</p>
            </div>
         </div>
         <Button onClick={() => navigate('/articles')} variant="outline" className="rounded-2xl font-bold h-12 px-8 border-border hover:bg-muted transition-colors">返回文章列表</Button>
      </footer>
    </div>
  );
};
