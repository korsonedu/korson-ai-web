import { createBrowserRouter, RouterProvider, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { CourseCenter } from './pages/CourseCenter';
import { TestLadder } from './pages/TestLadder';
import { StudyRoom } from './pages/StudyRoom';
import { Settings } from './pages/Settings';
import { Maintenance } from './pages/Maintenance';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VideoLesson } from './pages/VideoLesson';
import { ArticleDetail } from './pages/ArticleDetail';
import { AIAssistant } from './pages/AIAssistant';
import { SystemSettings } from './pages/SystemSettings';
import { KnowledgeMap } from './pages/KnowledgeMap';
import { QASystem } from './pages/QASystem';
import { useAuthStore } from './store/useAuthStore';
import { useSystemStore } from './store/useSystemStore';
import { FileText, Loader2, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageWrapper } from '@/components/PageWrapper';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WeeklyReportDialog } from './components/WeeklyReportDialog';

// Auth Guard with Persistence
const RequireAuth = ({ children }: { children: JSX.Element }) => {
  const { token, user, setAuth } = useAuthStore();
  const { theme, setTheme } = useSystemStore();
  const [loading, setLoading] = useState(!user && !!token);

  useEffect(() => {
    // Initialize theme
    setTheme(theme);

    if (!user && token) {
      api.get('/users/me/')
        .then(res => setAuth(res.data, token))
        .catch(() => {
          localStorage.removeItem('token');
          window.location.href = '/login';
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user, token, theme, setTheme]);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#F5F5F7]">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-black/10" />
        <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">Synchronizing Secure Session...</p>
      </div>
    </div>
  );

  if (!token) return <Navigate to="/login" replace />;
  return children;
};

// Simplified Article Center (independent page navigation)
const ArticleCenter = () => {
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
              className="rounded-full h-7 px-4 text-[9px] font-bold uppercase tracking-widest transition-all"
            >
              全部
            </Button>
            {tagStats && Array.isArray(tagStats) && tagStats.map((tag) => (
              <Button 
                key={tag.name}
                onClick={() => setSelectedTag(tag.name)}
                variant={selectedTag === tag.name ? "default" : "outline"}
                className="rounded-full h-7 px-4 text-[9px] font-bold uppercase tracking-widest transition-all border-black/5"
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
                className="h-6 px-2 text-[9px] font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 group"
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
          <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-4 bg-muted/30 text-[10px] font-black uppercase tracking-widest border-b border-border/50">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Author</div>
            <div className="col-span-6">Title</div>
            <div className="col-span-2 text-right pr-4">Views</div>
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
                className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2"
              >
                <ChevronLeft className="w-3 h-3" /> Previous
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Page</span>
                <span className="h-7 px-3 bg-card border border-border rounded-lg flex items-center justify-center text-xs font-black tabular-nums">{page}</span>
                <span className="text-[10px] font-bold text-muted-foreground">/ {totalPages}</span>
              </div>
              <Button 
                disabled={page === totalPages} 
                onClick={() => handlePageChange(page + 1)}
                variant="ghost"
                className="rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2"
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

import { Landing } from './pages/Landing';
import { CourseDetails } from './pages/CourseDetails';
import StartupMaterials from './pages/StartupMaterials';

// Root entry handler to manage landing vs app logic
const RootRedirect = () => {
  const { token, user, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(!!token && !user);
  const location = useLocation();

  useEffect(() => {
    if (token && !user) {
      api.get('/users/me/')
        .then(res => setAuth(res.data, token))
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => setLoading(false));
    }
  }, [token, user, setAuth]);

  if (loading) return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#F5F5F7]">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-black/10" />
        <p className="text-[10px] font-bold text-black/20 uppercase tracking-[0.2em]">Authenticating Secure Session...</p>
      </div>
    </div>
  );

  // Allow access to startup materials even if not logged in (using MainLayout)
  if (location.pathname === '/startup-materials') return <MainLayout />;

  // If logged in, wrap the app content in MainLayout
  if (token && user) return <MainLayout />;
  
  // Otherwise, return the landing page (outside layout)
  return <Landing />;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootRedirect />,
    children: [
      { index: true, element: <RequireAuth><CourseCenter /></RequireAuth> },
      { path: "intro", element: <Landing /> },
      { path: "course-details", element: <CourseDetails /> },
      { path: "startup-materials", element: <StartupMaterials /> },
      { path: "articles", element: <RequireAuth><ArticleCenter /></RequireAuth> },
      { path: "qa", element: <RequireAuth><QASystem /></RequireAuth> },
      { path: "article/:id", element: <RequireAuth><ArticleDetail /></RequireAuth> },
      { path: "tests", element: <RequireAuth><TestLadder /></RequireAuth> },
      { path: "study", element: <RequireAuth><StudyRoom /></RequireAuth> },
      { path: "ai", element: <RequireAuth><AIAssistant /></RequireAuth> },
      { path: "knowledge-map", element: <RequireAuth><KnowledgeMap /></RequireAuth> },
      { path: "settings", element: <RequireAuth><Settings /></RequireAuth> },
      { path: "system-settings", element: <RequireAuth><SystemSettings /></RequireAuth> },
      { path: "admin", element: <RequireAuth><Maintenance /></RequireAuth> },
      { path: "course/:id", element: <RequireAuth><VideoLesson /></RequireAuth> },
    ],
  },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
]);

function App() {
  return (
    <>
      <Toaster position="top-center" richColors />
      <WeeklyReportDialog />
      <RouterProvider router={router} />
    </>
  );
}

export default App;
