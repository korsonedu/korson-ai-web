import { createBrowserRouter, RouterProvider, Navigate, useNavigate } from 'react-router-dom';
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
import { useAuthStore } from './store/useAuthStore';
import { useSystemStore } from './store/useSystemStore';
import { FileText, Loader2, Calendar, ChevronRight, LayoutGrid, List } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageWrapper } from '@/components/PageWrapper';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
  const [tagStats, setTagStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
  }, [selectedTag]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/articles/', { params: { tag: selectedTag } });
      setArticles(res.data.articles);
      setTagStats(res.data.tag_stats);
    } catch (e) {}
    finally { setLoading(false); }
  };

  if (loading && articles.length === 0) return <div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-black/10" /></div>;

  return (
    <PageWrapper title="文章中心" subtitle="沉淀学术思想，探索知识前沿。">
      <div className="flex flex-col gap-6 max-w-6xl mx-auto text-left">
        
        {/* Tags & View Toggle */}
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={() => setSelectedTag(null)}
              variant={selectedTag === null ? "default" : "outline"}
              className="rounded-full h-7 px-3 text-[9px] font-bold uppercase tracking-widest transition-all"
            >
              全部
            </Button>
            {Object.entries(tagStats).map(([name, count]) => (
              <Button 
                key={name}
                onClick={() => setSelectedTag(name)}
                variant={selectedTag === name ? "default" : "outline"}
                className="rounded-full h-7 px-3 text-[9px] font-bold uppercase tracking-widest transition-all border-black/5"
              >
                {name} · {count}
              </Button>
            ))}
          </div>
          <div className="flex bg-[#F5F5F7] p-1 rounded-xl gap-1">
            <Button onClick={() => setViewMode('grid')} variant="ghost" size="icon" className={cn("h-7 w-7 rounded-lg", viewMode === 'grid' && "bg-white shadow-sm")}><LayoutGrid className="w-3.5 h-3.5"/></Button>
            <Button onClick={() => setViewMode('list')} variant="ghost" size="icon" className={cn("h-7 w-7 rounded-lg", viewMode === 'list' && "bg-white shadow-sm")}><List className="w-3.5 h-3.5"/></Button>
          </div>
        </div>

        <div className={cn(
          "grid gap-4 animate-in fade-in duration-500",
          viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1"
        )}>
          {articles.length === 0 ? (
            <Card className="col-span-full border-none shadow-sm rounded-3xl bg-white p-16 flex flex-col items-center justify-center text-center space-y-6 border border-black/[0.03]">
              <FileText className="h-12 w-12 text-black/5" />
              <p className="text-[#86868B] font-bold text-xs uppercase tracking-widest">暂无文章</p>
            </Card>
          ) : articles.map(article => (
            <Card 
              key={article.id} 
              onClick={() => navigate(`/article/${article.id}`)}
              className={cn(
                "border-none shadow-sm rounded-2xl bg-white group hover:shadow-md transition-all duration-300 border border-black/[0.01] cursor-pointer",
                viewMode === 'list' ? "p-5" : "p-4"
              )}
            >
              <div className={cn(
                "flex justify-between gap-4",
                viewMode === 'list' ? "flex-col md:flex-row md:items-center" : "flex-col h-full"
              )}>
                 <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                       <span className="opacity-40 font-bold text-[8px] uppercase tracking-widest">{new Date(article.created_at).toLocaleDateString()}</span>
                       {article.author_display_name && (
                         <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[8px] font-bold text-slate-500 uppercase">@{article.author_display_name}</span>
                       )}
                    </div>
                    <h3 className={cn("font-bold text-[#1D1D1F] group-hover:text-emerald-600 transition-colors leading-tight truncate", viewMode === 'list' ? "text-base max-w-2xl" : "text-sm")}>{article.title}</h3>
                    <p className="text-[#86868B] text-[11px] font-medium line-clamp-1 opacity-60">{article.content}</p>
                 </div>
                 <div className="flex items-center gap-1.5 text-[10px] font-bold text-black group-hover:text-emerald-600 transition-all shrink-0 self-end">
                   READ <ChevronRight className="w-3 h-3"/>
                 </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </PageWrapper>
  );
};

import { Landing } from './pages/Landing';
import { CourseDetails } from './pages/CourseDetails';

// Root entry handler to manage landing vs app logic
const RootRedirect = () => {
  const { token, user, setAuth } = useAuthStore();
  const [loading, setLoading] = useState(!!token && !user);

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
      { path: "articles", element: <RequireAuth><ArticleCenter /></RequireAuth> },
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
      <RouterProvider router={router} />
    </>
  );
}

export default App;
