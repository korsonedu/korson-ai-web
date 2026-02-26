import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Loader2, ChevronRight, ChevronLeft } from 'lucide-react';
import { PageWrapper } from '@/components/PageWrapper';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

export const ArticleCenter: React.FC = () => {
  const [articles, setArticles] = useState<any[]>([]);
  const [tagStats, setTagStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const navigate = useNavigate();

  useEffect(() => {
    setPage(1);
    fetchArticles(1);
  }, [selectedTag]);

  const fetchArticles = async (p = page) => {
    setLoading(true);
    try {
      const res = await api.get('/articles/', { params: { tag: selectedTag, page: p } });
      setArticles(res.data.articles);
      setTagStats(res.data.tag_stats);
      setTotalPages(res.data.total_pages);
    } catch (e) {}
    finally { setLoading(false); }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchArticles(newPage);
    // Scroll the main layout container to top
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading && articles.length === 0) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-black/10" /></div>;

  return (
    <PageWrapper title="文章中心" subtitle="沉淀学术思想，探索知识前沿。">
      <div className="flex flex-col gap-8 w-full text-left">
        
        {/* Tags */}
        <div className="flex flex-col gap-3 px-2">
          <div className={cn(
            "flex flex-wrap gap-2 overflow-hidden transition-all duration-500",
            !showAllTags ? "max-h-[32px]" : "max-h-[500px]"
          )}>
            <Button 
              onClick={() => setSelectedTag(null)}
              variant={selectedTag === null ? "default" : "outline"}
              className="rounded-full h-7 px-4 text-[11px] font-bold uppercase tracking-widest transition-all"
            >
              全部
            </Button>
            {tagStats && Array.isArray(tagStats) && tagStats.map((tag) => (
              <Button 
                key={tag.name}
                onClick={() => setSelectedTag(tag.name)}
                variant={selectedTag === tag.name ? "default" : "outline"}
                className="rounded-full h-7 px-4 text-[11px] font-bold uppercase tracking-widest transition-all border-black/5"
              >
                {tag.name} · {tag.count}
              </Button>
            ))}
          </div>
          {tagStats.length > 4 && (
            <div className="flex justify-start mt-1">
              <Button 
                onClick={() => setShowAllTags(!showAllTags)}
                variant="ghost"
                className="h-6 px-2 text-[11px] font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 group"
              >
                {showAllTags ? "收起全部分类" : `查看更多分类 (${tagStats.length - 4})`}
                <div className={cn("transition-transform duration-300", showAllTags ? "rotate-180" : "rotate-0")}>
                  <ChevronRight className={cn("w-3 h-3 transform rotate-90")} />
                </div>
              </Button>
            </div>
          )}
        </div>

        {/* List Content */}
        <div className="flex flex-col border border-border/50 rounded-[2rem] bg-card overflow-hidden shadow-sm">
          {/* List Header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-muted/30 text-[11px] font-black uppercase tracking-widest border-b border-border/50">
            <div className="col-span-2">日期</div>
            <div className="col-span-2">作者</div>
            <div className="col-span-6">标题</div>
            <div className="col-span-2 text-right pr-4">观看量</div>
          </div>

          <div className="flex flex-col animate-in fade-in duration-500">
            {articles.length === 0 ? (
              <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
                <FileText className="h-12 w-12 text-muted-foreground/20" />
                <p className="text-muted-foreground font-bold text-xs uppercase tracking-widest">No articles found</p>
              </div>
            ) : articles.map(article => (
              <div 
                key={article.id} 
                onClick={() => navigate(`/article/${article.id}`)}
                className="grid grid-cols-4 md:grid-cols-12 gap-4 px-8 py-5 items-center hover:bg-muted/50 transition-all border-b border-border last:border-0 cursor-pointer group"
              >
                <div className="col-span-1 md:col-span-2 text-[11px] font-bold text-muted-foreground tabular-nums">
                  {new Date(article.created_at).toLocaleDateString('zh-CN')}
                </div>
                <div className="col-span-1 md:col-span-2">
                  <span className="inline-flex px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter truncate max-w-full">
                    {article.author_display_name || 'KS Academy'}
                  </span>
                </div>
                <div className="col-span-2 md:col-span-6">
                  <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-sm truncate pr-4">
                    {article.title}
                  </h3>
                </div>
                <div className="hidden md:flex col-span-2 justify-end items-center gap-4 text-right">
                  <span className="tabular-nums text-[11px] font-bold text-muted-foreground/60">{article.views || 0}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-border/50 flex items-center justify-between bg-muted/10">
              <Button 
                disabled={page === 1} 
                onClick={() => handlePageChange(page - 1)}
                variant="ghost"
                className="rounded-xl font-bold text-[11px] uppercase tracking-widest gap-2"
              >
                <ChevronLeft className="w-3 h-3" /> Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">Page</span>
                <span className="h-7 px-3 bg-card border border-border rounded-lg flex items-center justify-center text-xs font-black tabular-nums">{page}</span>
                <span className="text-[11px] font-bold text-muted-foreground">/ {totalPages}</span>
              </div>
              <Button 
                disabled={page === totalPages} 
                onClick={() => handlePageChange(page + 1)}
                variant="ghost"
                className="rounded-xl font-bold text-[11px] uppercase tracking-widest gap-2"
              >
                Next <ChevronRight className="w-3 h-3" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};
