import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen, FileText, Target, Video, Image as ImageIcon,
  Upload, Trash2, Edit3, Settings2, Bot, Sparkles,
  RefreshCcw, BrainCircuit, Search, X,
  Layers, FileUp, ChevronRight, ChevronDown, CheckCircle2, Rocket
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MarkdownEditor } from '@/components/MarkdownEditor';

// --- Sub-Component: TagInput ---
const TagInput = ({ tags, setTags, compact = false }: { tags: string[], setTags: (t: string[]) => void, compact?: boolean }) => {
  const [inputValue, setInputValue] = useState('');
  const addTag = () => {
    const val = inputValue.trim();
    if (val && !tags.includes(val)) {
      setTags([...tags, val]);
      setInputValue('');
    }
  };
  return (
    <div className="space-y-1.5 text-left">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          placeholder="标签..."
          className={cn("bg-[#F5F5F7] border-none rounded-xl font-bold text-[10px]", compact ? "h-8 px-3" : "h-9 px-4")}
        />
      </div>
      <div className="flex flex-wrap gap-1 min-h-[1rem]">
        {tags.map((tag, i) => (
          <Badge key={i} className="bg-black text-white hover:bg-black/80 gap-1 pl-2 pr-1 py-0.5 rounded-lg text-[8px] font-bold uppercase tracking-wider">
            {tag} <X className="w-2.5 h-2.5 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
          </Badge>
        ))}
      </div>
    </div>
  );
};

// --- Sub-Component: KPTreeNode ---
const KPTreeNode = ({ node, allNodes, onDelete, onEdit }: { node: any, allNodes: any[], onDelete: (id: number) => void, onEdit: (node: any) => void }) => {
  const [isOpen, setIsOpen] = useState(true);
  const children = allNodes.filter(n => n.parent === node.id);
  const hasChildren = children.length > 0;

  return (
    <div className="ml-4 border-l border-black/[0.03] pl-3 py-0.5">
      <div className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-black/[0.02] transition-all">
        <div className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
          {hasChildren ? (
            isOpen ? <ChevronDown className="w-3 h-3 opacity-30" /> : <ChevronRight className="w-3 h-3 opacity-30" />
          ) : <div className="w-3" />}
          <p className="text-[11px] font-bold text-[#1D1D1F] truncate text-left">{node.name}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <Button onClick={() => onEdit(node)} variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white shadow-sm text-blue-600"><Edit3 className="w-3 h-3" /></Button>
          <Button onClick={() => onDelete(node.id)} variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-white shadow-sm text-red-500"><Trash2 className="w-3 h-3" /></Button>
        </div>
      </div>
      {isOpen && hasChildren && (
        <div className="mt-0.5">
          {children.map(child => <KPTreeNode key={child.id} node={child} allNodes={allNodes} onDelete={onDelete} onEdit={onEdit} />)}
        </div>
      )}
    </div>
  );
};

// --- Sub-Component: QuestionBankPanel ---
const QuestionBankPanel = ({ kpList, onEdit, onDelete }: { kpList: any[], onEdit: (q: any) => void, onDelete: (id: number) => void }) => {
  const [bankSearch, setBankSearch] = useState('');
  const [bankKP, setBankKP] = useState('0');
  const [bankType, setBankType] = useState('all');
  const [bankPage, setBankPage] = useState(1);
  const [bankData, setBankData] = useState<{ total: number, total_pages: number, results: any[] }>({ total: 0, total_pages: 1, results: [] });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchBank = async (page = bankPage) => {
    setLoading(true);
    try {
      const res = await api.get('/quizzes/admin/questions/', {
        params: {
          search: bankSearch || undefined, kp_id: bankKP !== '0' ? bankKP : undefined,
          q_type: bankType !== 'all' ? bankType : undefined, page, page_size: 50
        }
      });
      setBankData(res.data);
    } catch (e) { toast.error('加载失败'); }
    setLoading(false);
  };

  useEffect(() => { setBankPage(1); fetchBank(1); }, [bankSearch, bankKP, bankType]);

  const handleExport = async () => {
    try {
      const res = await api.get('/quizzes/admin/export-structured/', { params: { kp_id: bankKP !== '0' ? bankKP : undefined } });
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `question_bank_structured_${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
      toast.success(`已导出 ${res.data.total} 道题的结构化数据`);
    } catch (e) { toast.error('导出失败'); }
  };

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white border border-black/[0.03] overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 260px)', minHeight: '600px' }}>
      {/* 头部工具栏 */}
      <div className="p-4 border-b border-black/[0.03] bg-slate-50/50 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-black/40 uppercase tracking-widest">题库浏览</span>
            <span className="text-[10px] font-bold bg-black text-white rounded-full px-2 py-0.5">{bankData.total}</span>
          </div>
          <Button onClick={handleExport} variant="outline" className="h-8 px-3 rounded-xl text-[10px] font-bold border-black/10 gap-1.5">
            <FileUp className="w-3 h-3" /> 导出AI结构化
          </Button>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
            <Input value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="搜索题干..." className="pl-8 h-8 bg-white border-none rounded-xl font-bold text-xs shadow-sm" />
          </div>
          <Select value={bankKP} onValueChange={setBankKP}>
            <SelectTrigger className="h-8 w-32 rounded-xl bg-white border-none font-bold text-[10px] shadow-sm"><SelectValue placeholder="全部知识点" /></SelectTrigger>
            <SelectContent className="rounded-xl"><SelectItem value="0" className="text-xs">全部知识点</SelectItem>{kpList.map(kp => <SelectItem key={kp.id} value={kp.id.toString()} className="text-xs">{kp.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={bankType} onValueChange={setBankType}>
            <SelectTrigger className="h-8 w-24 rounded-xl bg-white border-none font-bold text-[10px] shadow-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl"><SelectItem value="all" className="text-xs">全部题型</SelectItem><SelectItem value="objective" className="text-xs">客观题</SelectItem><SelectItem value="subjective" className="text-xs">主观题</SelectItem></SelectContent>
          </Select>
          <Button onClick={() => fetchBank(bankPage)} variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0">
            <RefreshCcw className={cn('w-3.5 h-3.5 opacity-40', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* 题目列表 */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1.5">
          {loading && <div className="py-10 text-center text-xs font-bold opacity-20">加载中...</div>}
          {!loading && bankData.results.length === 0 && <div className="py-10 text-center text-xs font-bold opacity-20">暂无题目</div>}
          {bankData.results.map(q => (
            <div key={q.id} className="rounded-2xl bg-[#F5F5F7]/70 hover:bg-[#F5F5F7] transition-colors border border-transparent hover:border-black/[0.04]">
              {/* 题目行 */}
              <div className="p-3 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                  <Badge className={cn('text-[8px] py-0 h-4 px-1.5 rounded-md border-none font-bold', q.q_type === 'objective' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>{q.q_type === 'objective' ? '客' : '主'}</Badge>
                  {q.subjective_type && <Badge className="text-[7px] py-0 h-3.5 px-1 rounded-md border-none bg-black/5 text-black/40 font-bold">{q.subjective_type}</Badge>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-[#1D1D1F] leading-relaxed line-clamp-2">{q.text}</p>
                  <p className="text-[9px] font-bold text-black/30 mt-1">{q.knowledge_point_name} · ELO {q.difficulty}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button onClick={e => { e.stopPropagation(); onEdit(q); }} variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-white text-blue-600 shadow-sm"><Edit3 className="w-3 h-3" /></Button>
                  <Button onClick={e => { e.stopPropagation(); onDelete(q.id); fetchBank(bankPage); }} variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-white text-red-500 shadow-sm"><Trash2 className="w-3 h-3" /></Button>
                  <div className="h-7 w-7 flex items-center justify-center opacity-30">{expanded === q.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}</div>
                </div>
              </div>
              {/* 展开详情 */}
              {expanded === q.id && (
                <div className="px-4 pb-4 space-y-2 border-t border-black/[0.04] mt-0 pt-3">
                  {q.correct_answer && <div><p className="text-[8px] font-bold opacity-30 uppercase tracking-widest mb-1">答案</p><p className="text-[10px] font-medium text-black/70 whitespace-pre-wrap bg-emerald-50/50 rounded-xl p-3">{q.correct_answer}</p></div>}
                  {q.grading_points && <div><p className="text-[8px] font-bold opacity-30 uppercase tracking-widest mb-1">判分点</p><p className="text-[10px] font-medium text-black/70 bg-blue-50/50 rounded-xl p-3">{q.grading_points}</p></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* 分页 */}
      {bankData.total_pages > 1 && (
        <div className="p-3 border-t border-black/[0.03] flex items-center justify-between shrink-0">
          <Button onClick={() => { const p = Math.max(1, bankPage - 1); setBankPage(p); fetchBank(p); }} disabled={bankPage === 1} variant="ghost" className="h-8 px-4 rounded-xl text-xs font-bold">← 上一页</Button>
          <span className="text-[10px] font-bold opacity-40">{bankPage} / {bankData.total_pages}</span>
          <Button onClick={() => { const p = Math.min(bankData.total_pages, bankPage + 1); setBankPage(p); fetchBank(p); }} disabled={bankPage === bankData.total_pages} variant="ghost" className="h-8 px-4 rounded-xl text-xs font-bold">下一页 →</Button>
        </div>
      )}
    </Card>
  );
};

export const Maintenance: React.FC = () => {
  const [isUploading, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [courseList, setCourseList] = useState<any[]>([]);
  const [articleList, setArticleList] = useState<any[]>([]);
  const [botList, setBotList] = useState<any[]>([]);
  const [kpList, setKpList] = useState<any[]>([]);
  const [albumList, setAlbumList] = useState<any[]>([]);
  const [smList, setSmList] = useState<any[]>([]);

  const [auditMode, setAuditMode] = useState<'hub' | 'courses' | 'articles' | 'kp' | 'sm'>('hub');
  const [qSearch, setQSearch] = useState('');
  const [editingItem, setEditingItem] = useState<{ type: string, data: any } | null>(null);

  // New KP State for dynamic creation
  const [showNewKPDialog, setShowNewKPDialog] = useState(false);
  const [newKPForm, setNewKPForm] = useState({ name: '', description: '', parent: '0' });
  const [kpCreationTarget, setKPCreationTarget] = useState<'course' | 'article' | 'none'>('course');

  // AI Workshop States
  const [showAIWorkstation, setShowAIWorkstation] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [aiFile, setAiFile] = useState<File | null>(null);
  const [aiTargetKP, setAiTargetKP] = useState('0');
  const [aiPreviewData, setAiPreviewData] = useState<any[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState("");

  useEffect(() => { fetchLists(); }, []);
  const fetchLists = async () => {
    try {
      const [c, a, b, k, al, sm] = await Promise.all([
        api.get('/courses/'),
        api.get('/articles/'),
        api.get('/ai/bots/'),
        api.get('/quizzes/knowledge-points/'),
        api.get('/courses/albums/'),
        api.get('/courses/startup-materials/')
      ]);
      setCourseList(c.data);
      setArticleList(a.data.articles || []);
      setBotList(b.data);
      setKpList(k.data);
      setAlbumList(al.data);
      setSmList(sm.data);
    } catch (e) { }
  };

  useEffect(() => { if (auditMode !== 'hub') fetchLists(); }, [qSearch, auditMode]);

  const [courseForm, setCourseForm] = useState({ title: '', album_obj: '0', desc: '', elo_reward: 50, knowledge_point: '0', video: null as File | null, cover: null as File | null, courseware: null as File | null });
  const [articleForm, setArticleForm] = useState({ title: '', content: '', author_display_name: '', tags: [] as string[], knowledge_point: '0' });
  const [botForm, setBotForm] = useState({ name: '', prompt: '', avatar: null as File | null, is_exclusive: false });
  const [albumForm, setAlbumForm] = useState({ name: '', description: '', cover: null as File | null });
  const [quizForm, setQuizForm] = useState({ text: '', q_type: 'objective', subjective_type: 'noun', grading_points: '', knowledge_point: '0', options: ['', '', '', ''], answer: '', difficulty: 1000 });
  const [kpForm, setKpForm] = useState({ name: '', description: '', parent: '0' });
  const [smForm, setSmForm] = useState({ name: '', description: '', file: null as File | null });

  const handleDelete = async (type: string, id: number) => {
    try {
      let endpoint = `/${type}/${id}/`;
      if (type === 'kp') endpoint = `/quizzes/knowledge-points/${id}/`;
      if (type === 'quizzes') endpoint = `/quizzes/questions/${id}/`;
      if (type === 'sm') endpoint = `/courses/startup-materials/${id}/`;
      await api.delete(endpoint);
      toast.success("已移除"); fetchLists();
    } catch (e) { toast.error("删除失败"); }
  };

  const handleCreateCourse = async () => {
    if (!courseForm.title || !courseForm.video) return toast.error("核心信息不全");
    setIsSubmitting(true); setUploadProgress(10);
    const fd = new FormData();
    fd.append('title', courseForm.title); fd.append('description', courseForm.desc); fd.append('elo_reward', courseForm.elo_reward.toString());
    if (courseForm.album_obj !== '0') fd.append('album_obj', courseForm.album_obj);
    if (courseForm.knowledge_point !== '0') fd.append('knowledge_point', courseForm.knowledge_point);
    fd.append('video_file', courseForm.video); if (courseForm.cover) fd.append('cover_image', courseForm.cover);
    if (courseForm.courseware) fd.append('courseware', courseForm.courseware);
    try { await api.post('/courses/', fd, { onUploadProgress: p => p.total && setUploadProgress(Math.round((p.loaded / p.total) * 100)) }); toast.success("发布成功"); fetchLists(); }
    catch (e) { toast.error("发布失败"); } finally { setIsSubmitting(false); setUploadProgress(0); }
  };

  const handleCreateQuiz = async () => {
    if (!quizForm.text) return toast.error("题目缺失");
    try {
      await api.post('/quizzes/questions/', {
        text: quizForm.text, q_type: quizForm.q_type, subjective_type: quizForm.subjective_type,
        grading_points: quizForm.grading_points, knowledge_point: quizForm.knowledge_point === "0" ? null : quizForm.knowledge_point,
        options: quizForm.q_type === 'objective' ? quizForm.options : null, correct_answer: quizForm.answer, difficulty: quizForm.difficulty
      });
      toast.success("题目已入库"); fetchLists();
    } catch (e) { toast.error("入库失败"); }
  };

  const handleCreateBot = async () => {
    if (!botForm.name || !botForm.prompt) return toast.error("信息不完整");
    const fd = new FormData();
    fd.append('name', botForm.name);
    fd.append('system_prompt', botForm.prompt);
    fd.append('is_exclusive', String(botForm.is_exclusive));
    if (botForm.avatar) fd.append('avatar', botForm.avatar);
    try { await api.post('/ai/bots/', fd); toast.success("助教已上线"); setBotForm({ name: '', prompt: '', avatar: null, is_exclusive: false }); fetchLists(); }
    catch (e) { toast.error("发布失败"); }
  };

  const handleCreateAlbum = async () => {
    if (!albumForm.name) return toast.error("专辑名称必填");
    const fd = new FormData(); fd.append('name', albumForm.name); fd.append('description', albumForm.description); if (albumForm.cover) fd.append('cover_image', albumForm.cover);
    try { await api.post('/courses/albums/', fd); toast.success("专辑已创建"); setAlbumForm({ name: '', description: '', cover: null }); fetchLists(); }
    catch (e) { toast.error("失败"); }
  };

  const handleCreateSM = async () => {
    if (!smForm.name || !smForm.file) return toast.error("名称和文件必填");
    setIsSubmitting(true); setUploadProgress(10);
    const fd = new FormData();
    fd.append('name', smForm.name);
    fd.append('description', smForm.description);
    fd.append('file', smForm.file);
    try { await api.post('/courses/startup-materials/', fd, { onUploadProgress: p => p.total && setUploadProgress(Math.round((p.loaded / p.total) * 100)) }); toast.success("资料已上传"); setSmForm({ name: '', description: '', file: null }); fetchLists(); }
    catch (e) { toast.error("上传失败"); } finally { setIsSubmitting(false); setUploadProgress(0); }
  };

  const handleQuickCreateKP = async () => {
    if (!newKPForm.name) return toast.error("名称必填");
    try {
      const res = await api.post('/quizzes/knowledge-points/', { ...newKPForm, parent: newKPForm.parent === "0" ? null : newKPForm.parent });
      toast.success("知识点已创建并同步");
      const newKPId = res.data.id.toString();
      await fetchLists();
      if (kpCreationTarget === 'course') setCourseForm(prev => ({ ...prev, knowledge_point: newKPId }));
      else if (kpCreationTarget === 'article') setArticleForm(prev => ({ ...prev, knowledge_point: newKPId }));
      setShowNewKPDialog(false);
      setNewKPForm({ name: '', description: '', parent: '0' });
    } catch (e) { toast.error("创建失败"); }
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const { type, data } = editingItem;
    let endpoint = "";
    if (type === 'courses') endpoint = `/courses/${data.id}/`;
    else if (type === 'articles') endpoint = `/articles/${data.id}/`;
    else if (type === 'albums') endpoint = `/courses/albums/${data.id}/`;
    else if (type === 'bots') endpoint = `/ai/bots/${data.id}/`;
    else if (type === 'quizzes') endpoint = `/quizzes/questions/${data.id}/`;
    else if (type === 'kp') endpoint = `/quizzes/knowledge-points/${data.id}/`;
    else if (type === 'sm') endpoint = `/courses/startup-materials/${data.id}/`;

    try {
      if (['courses', 'albums', 'bots', 'sm'].includes(type)) {
        const fd = new FormData();
        Object.keys(data).forEach(key => {
          if (data[key] instanceof File) {
            fd.append(key, data[key]);
          } else if (data[key] !== null) {
            if (['video_file', 'cover_image', 'avatar', 'courseware', 'file'].includes(key) && typeof data[key] === 'string') return;
            fd.append(key, String(data[key]));
          }
        });
        await api.patch(endpoint, fd);
      } else {
        await api.patch(endpoint, data);
      }
      toast.success("核心配置已同步"); setEditingItem(null); fetchLists();
    } catch (e: any) { toast.error("更新失败"); }
  };

  // --- AI Workflow Logic ---
  const handleAIParse = async () => {
    if (!aiInputText.trim() && !aiFile) return toast.error("请输入语料或选择文件");
    setIsParsing(true);
    setParseProgress("初始化分片引擎...");
    const fd = new FormData();
    if (aiInputText) fd.append('raw_text', aiInputText);
    if (aiFile) fd.append('file', aiFile);

    try {
      const res = await api.post('/quizzes/ai-parse-raw-text/', fd);
      const taskId = res.data.task_id;

      const poll = setInterval(async () => {
        try {
          const checkRes = await api.get(`/quizzes/ai-parse-raw-text/?task_id=${taskId}`);
          if (checkRes.data.progress) {
            setParseProgress(`正在深度解析: 分片 ${checkRes.data.progress}`);
          }
          if (checkRes.data.status === 'completed') {
            clearInterval(poll);
            setAiPreviewData(checkRes.data.data);
            toast.success(`AI 已完成海量语料解析，共梳理出 ${checkRes.data.data.length} 道题目`);
            setIsParsing(false);
            setParseProgress("");
          }
        } catch (e) {
          clearInterval(poll);
          setIsParsing(false);
          setParseProgress("");
          toast.error("解析任务中断，请检查后端日志");
        }
      }, 3000);

    } catch (e) {
      toast.error("任务启动失败");
      setIsParsing(false);
      setParseProgress("");
    }
  };

  const handleAIImport = async () => {
    if (!aiPreviewData) return;
    try {
      await api.post('/quizzes/ai-bulk-import/', {
        questions: aiPreviewData,
        kp_id: aiTargetKP === '0' ? null : aiTargetKP
      });
      toast.success(`成功入库 ${aiPreviewData.length} 道题目`);
      setAiPreviewData(null); setAiInputText(''); setAiFile(null); setShowAIWorkstation(false); fetchLists();
    } catch (e) { toast.error("导入失败"); }
  };

  const roots = useMemo(() => kpList.filter(kp => !kp.parent), [kpList]);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-[1600px] mx-auto overflow-hidden text-left">
      <Button onClick={() => setShowAIWorkstation(true)} className="fixed bottom-10 right-10 h-12 w-12 rounded-full bg-emerald-500 text-white shadow-2xl hover:scale-110 active:scale-95 transition-all z-[60] border-none group animate-pulse flex items-center justify-center"><Sparkles className="w-5 h-5" /></Button>

      <Tabs defaultValue="courses" className="space-y-6 text-left">
        <TabsList className="bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border border-black/5 h-auto inline-flex shadow-sm">
          <TabsTrigger value="courses" className="rounded-xl px-5 py-2 data-[state=active]:bg-black data-[state=active]:text-white transition-all text-[11px] font-bold uppercase tracking-widest leading-none"><BookOpen className="w-3.5 h-3.5 mr-2" />课程上传</TabsTrigger>
          <TabsTrigger value="articles" className="rounded-xl px-5 py-2 data-[state=active]:bg-black data-[state=active]:text-white transition-all text-[11px] font-bold uppercase tracking-widest leading-none"><FileText className="w-3.5 h-3.5 mr-2" />发布文章</TabsTrigger>
          <TabsTrigger value="quizzes" className="rounded-xl px-5 py-2 data-[state=active]:bg-black data-[state=active]:text-white transition-all text-[11px] font-bold uppercase tracking-widest leading-none"><Target className="w-3.5 h-3.5 mr-2" />智能题库</TabsTrigger>
          <TabsTrigger value="kp" className="rounded-xl px-5 py-2 data-[state=active]:bg-black data-[state=active]:text-white transition-all text-[11px] font-bold uppercase tracking-widest leading-none"><BrainCircuit className="w-3.5 h-3.5 mr-2" />知识体系</TabsTrigger>
          <TabsTrigger value="albums" className="rounded-xl px-5 py-2 data-[state=active]:bg-black data-[state=active]:text-white transition-all text-[11px] font-bold uppercase tracking-widest leading-none"><Layers className="w-3.5 h-3.5 mr-2" />专辑管理</TabsTrigger>
          <TabsTrigger value="bots" className="rounded-xl px-5 py-2 data-[state=active]:bg-black data-[state=active]:text-white transition-all text-[11px] font-bold uppercase tracking-widest leading-none"><Bot className="w-3.5 h-3.5 mr-2" />AI 机器人</TabsTrigger>
          <TabsTrigger value="sm" className="rounded-xl px-5 py-2 data-[state=active]:bg-black data-[state=active]:text-white transition-all text-[11px] font-bold uppercase tracking-widest leading-none"><Rocket className="w-3.5 h-3.5 mr-2" />启动资料</TabsTrigger>
          <TabsTrigger value="manage" className="rounded-xl px-5 py-2 data-[state=active]:bg-black data-[state=active]:text-white transition-all text-[11px] font-bold uppercase tracking-widest leading-none"><Settings2 className="w-3.5 h-3.5 mr-2" />资源审计</TabsTrigger>
        </TabsList>

        <TabsContent value="sm" className="outline-none m-0 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start text-left">
            <Card className="border-none shadow-sm rounded-3xl p-10 bg-white border border-black/[0.03] space-y-8 text-left"><div className="flex items-center gap-3 text-left"><Rocket className="h-6 w-6 text-red-600" /><h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">上传启动资料</h3></div><div className="space-y-6 text-left"><div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">文件名称 (必填)</Label><Input value={smForm.name} onChange={e => setSmForm({ ...smForm, name: e.target.value })} className="bg-[#F5F5F7] border-none h-12 rounded-xl font-bold px-5" /></div><div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">简介 (可选)</Label><textarea value={smForm.description} onChange={e => setSmForm({ ...smForm, description: e.target.value })} className="w-full bg-[#F5F5F7] border-none rounded-2xl p-6 min-h-[100px] font-bold text-sm" /></div><div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">资料文件</Label><div className="relative group text-left"><Button variant="outline" className="w-full h-16 rounded-2xl border-dashed border-2 border-black/10 flex justify-between px-6 font-bold"><span>{smForm.file ? smForm.file.name : '上传文件'}</span><Upload className="w-4 h-4 opacity-20" /></Button><input type="file" onChange={e => setSmForm({ ...smForm, file: e.target.files?.[0] || null })} className="absolute inset-0 opacity-0 cursor-pointer" /></div></div><Button onClick={handleCreateSM} disabled={isUploading} className="w-full bg-black text-white h-14 rounded-2xl font-bold shadow-xl uppercase text-xs tracking-widest">Upload Material</Button></div></Card>
            <Card className="border-none shadow-sm rounded-3xl p-10 bg-[#F5F5F7]/50 border border-black/[0.03] space-y-6 text-left"><div className="flex items-center justify-between text-left"><h3 className="text-sm font-bold uppercase tracking-widest text-black/40">已存资料</h3><Button variant="ghost" size="icon" onClick={fetchLists} className="rounded-full"><RefreshCcw className="w-4 h-4 opacity-40" /></Button></div><ScrollArea className="h-[520px] text-left"><div className="grid gap-3 pr-4 text-left">{smList.map(sm => (<div key={sm.id} className="p-5 bg-white rounded-2xl border border-black/[0.02] shadow-sm flex items-center justify-between group text-left"><p className="text-sm font-bold text-[#1D1D1F]">{sm.name}</p><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-left"><Button onClick={() => setEditingItem({ type: 'sm', data: { ...sm } })} variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-blue-600"><Edit3 className="w-3.5 h-3.5" /></Button><Button onClick={() => handleDelete('sm', sm.id)} variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button></div></div>))}</div></ScrollArea></Card>
          </div>
        </TabsContent>

        <TabsContent value="courses" className="outline-none m-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
            <Card className="lg:col-span-8 border-none shadow-sm rounded-3xl p-8 bg-white border border-black/[0.03] space-y-6">
              <div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">课程标题</Label><Input value={courseForm.title} onChange={e => setCourseForm({ ...courseForm, title: e.target.value })} className="bg-[#F5F5F7] border-none h-12 rounded-xl font-bold px-5 text-base" /></div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="space-y-2 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">所属专辑</Label><Select value={courseForm.album_obj} onValueChange={v => setCourseForm({ ...courseForm, album_obj: v })}><SelectTrigger className="h-10 rounded-xl bg-[#F5F5F7] border-none font-bold px-4 text-xs"><SelectValue placeholder="选择专辑" /></SelectTrigger><SelectContent className="rounded-xl">{albumList.map(al => <SelectItem key={al.id} value={al.id.toString()} className="text-xs font-bold">{al.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">关联知识点</Label>
                  <Select
                    value={courseForm.knowledge_point}
                    onValueChange={v => {
                      if (v === 'NEW_KP') {
                        setKPCreationTarget('course');
                        setShowNewKPDialog(true);
                      } else {
                        setCourseForm({ ...courseForm, knowledge_point: v })
                      }
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-[#F5F5F7] border-none font-bold px-4 text-xs"><SelectValue placeholder="不挂载" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="0" className="text-xs font-bold text-muted-foreground italic">不挂载</SelectItem>
                      <SelectItem value="NEW_KP" className="text-xs font-bold text-indigo-600 bg-indigo-50/50">+ 新建知识点</SelectItem>
                      {kpList.map(kp => <SelectItem key={kp.id} value={kp.id.toString()} className="text-xs font-bold">{kp.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">详细描述</Label>
                <MarkdownEditor content={courseForm.desc} onChange={v => setCourseForm({ ...courseForm, desc: v })} />
              </div>
            </Card>
            <Card className="lg:col-span-4 border-none shadow-sm rounded-3xl p-8 bg-white border border-black/[0.03] space-y-6 h-fit text-left">
              <div className="space-y-3 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">奖励设定</Label><div className="flex items-center gap-3"><Input type="number" value={courseForm.elo_reward} onChange={e => setCourseForm({ ...courseForm, elo_reward: parseInt(e.target.value) || 0 })} className="bg-[#F5F5F7] border-none h-10 rounded-xl font-bold w-20 text-center text-xs" /><span className="text-[9px] font-bold text-black/40 uppercase">ELO Reward</span></div></div>
              <div className="space-y-4 pt-2 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">媒体附件</Label><div className="grid grid-cols-1 gap-2.5">
                <div className="relative group text-left"><Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 border-black/10 flex justify-between px-4 font-bold text-[11px]"><span>{courseForm.video ? <span className="text-emerald-600">已就绪</span> : '上传视频'}</span><Video className="w-4 h-4 opacity-20" /></Button><input type="file" onChange={e => setCourseForm({ ...courseForm, video: e.target.files?.[0] || null })} className="absolute inset-0 opacity-0 cursor-pointer" accept="video/*" /></div>
                <div className="relative group text-left"><Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 border-black/10 flex justify-between px-4 font-bold text-[11px]"><span>{courseForm.cover ? <span className="text-blue-600">已就绪</span> : '上传封面'}</span><ImageIcon className="w-4 h-4 opacity-20" /></Button><input type="file" onChange={e => setCourseForm({ ...courseForm, cover: e.target.files?.[0] || null })} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" /></div>
                <div className="relative group text-left"><Button variant="outline" className="w-full h-12 rounded-xl border-dashed border-2 border-black/10 flex justify-between px-4 font-bold text-[11px]"><span>{courseForm.courseware ? <span className="text-purple-600">PDF就绪</span> : '上传课件'}</span><FileUp className="w-4 h-4 opacity-20" /></Button><input type="file" onChange={e => setCourseForm({ ...courseForm, courseware: e.target.files?.[0] || null })} className="absolute inset-0 opacity-0 cursor-pointer" accept=".pdf" /></div>
              </div></div>
              <Button onClick={handleCreateCourse} disabled={isUploading} className="w-full h-14 rounded-2xl bg-black text-white font-bold shadow-xl uppercase text-[11px] tracking-widest">Publish Academy</Button>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="articles" className="outline-none m-0 text-left">
          <Card className="border-none shadow-sm rounded-[2rem] p-10 bg-white border border-black/[0.03] space-y-6 max-w-5xl mx-auto text-left">
            <div className="flex items-center gap-3 text-left"><FileText className="h-5 w-5 text-orange-600" /><h3 className="text-lg font-bold tracking-tight text-[#1D1D1F]">撰写深度文章</h3></div>
            <div className="space-y-4 text-left">
              <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">文章标题</Label><Input value={articleForm.title} onChange={e => setArticleForm({ ...articleForm, title: e.target.value })} className="bg-[#F5F5F7] border-none h-14 rounded-xl font-black px-5 text-2xl tracking-tighter" /></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">挂载知识点</Label>
                  <Select
                    value={articleForm.knowledge_point}
                    onValueChange={v => {
                      if (v === 'NEW_KP') {
                        setKPCreationTarget('article');
                        setShowNewKPDialog(true);
                      } else {
                        setArticleForm({ ...articleForm, knowledge_point: v })
                      }
                    }}
                  >
                    <SelectTrigger className="h-10 rounded-xl bg-[#F5F5F7] border-none font-bold px-4 text-[11px]"><SelectValue placeholder="选择知识点" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="0" className="text-xs font-bold text-muted-foreground italic">不挂载</SelectItem>
                      <SelectItem value="NEW_KP" className="text-xs font-bold text-indigo-600 bg-indigo-50/50">+ 新建知识点</SelectItem>
                      {kpList.map(kp => <SelectItem key={kp.id} value={kp.id.toString()} className="text-xs font-bold">{kp.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">发布人署名</Label><Input value={articleForm.author_display_name} onChange={e => setArticleForm({ ...articleForm, author_display_name: e.target.value })} className="bg-[#F5F5F7] border-none h-10 rounded-xl font-bold px-5 text-[11px]" /></div>
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">标签分类</Label><TagInput tags={articleForm.tags} setTags={(t) => setArticleForm({ ...articleForm, tags: t })} compact /></div>
              </div>
              <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">正文内容 (Markdown)</Label>
                <MarkdownEditor content={articleForm.content} onChange={v => setArticleForm({ ...articleForm, content: v })} />
              </div>
              <Button onClick={async () => { try { await api.post('/articles/', { ...articleForm, knowledge_point: articleForm.knowledge_point === "0" ? null : articleForm.knowledge_point }); toast.success("文章已发布"); setArticleForm({ title: '', content: '', author_display_name: '', tags: [], knowledge_point: '0' }); fetchLists(); } catch (e) { toast.error("发布失败"); } }} className="w-full h-12 rounded-xl bg-black text-white font-bold shadow-xl text-[11px] tracking-widest uppercase">Publish Article</Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="kp" className="outline-none m-0 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-left">
            <Card className="lg:col-span-5 border-none shadow-sm rounded-3xl p-8 bg-white border border-black/[0.03] space-y-6 text-left">
              <div className="flex items-center gap-3 text-left"><BrainCircuit className="h-5 w-5 text-purple-600" /><h3 className="text-lg font-bold tracking-tight text-[#1D1D1F]">建立学术拓扑</h3></div>
              <div className="space-y-4 text-left">
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">节点名称</Label><Input value={kpForm.name} onChange={e => setKpForm({ ...kpForm, name: e.target.value })} className="bg-[#F5F5F7] border-none h-10 rounded-xl font-bold px-4 text-xs" /></div>
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">隶属父级</Label><Select value={kpForm.parent} onValueChange={v => setKpForm({ ...kpForm, parent: v })}><SelectTrigger className="h-10 rounded-xl bg-[#F5F5F7] border-none font-bold text-[11px] px-4"><SelectValue placeholder="顶级节点" /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="0" className="text-xs font-bold">顶级节点</SelectItem>{kpList.map(kp => <SelectItem key={kp.id} value={kp.id.toString()} className="text-xs font-bold">{kp.name}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">描述</Label><textarea value={kpForm.description} onChange={e => setKpForm({ ...kpForm, description: e.target.value })} className="w-full bg-[#F5F5F7] border-none rounded-xl p-4 min-h-[80px] font-bold text-xs" /></div>
                <Button onClick={async () => { try { await api.post('/quizzes/knowledge-points/', { ...kpForm, parent: kpForm.parent === "0" ? null : kpForm.parent }); toast.success("已保存"); setKpForm({ name: '', description: '', parent: '0' }); fetchLists(); } catch (e: any) { toast.error("失败"); } }} className="w-full h-12 rounded-xl bg-black text-white font-bold shadow-xl text-[11px] tracking-widest uppercase">Save Node</Button>
              </div>
            </Card>
            <Card className="lg:col-span-7 border-none shadow-sm rounded-3xl p-8 bg-[#F5F5F7]/50 border border-black/[0.03] space-y-6 text-left">
              <div className="flex items-center justify-between text-left"><h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-black/40">实时逻辑树状结构</h3><Button variant="ghost" size="icon" onClick={fetchLists} className="rounded-full h-8 w-8"><RefreshCcw className="w-3.5 h-3.5 opacity-40" /></Button></div>
              <ScrollArea className="h-[500px] text-left">
                <div className="pr-4 text-left">
                  {roots.length === 0 ? <div className="py-20 text-center opacity-20 font-bold uppercase text-[10px]">No Data</div> : roots.map(root => (<KPTreeNode key={root.id} node={root} allNodes={kpList} onDelete={(id) => handleDelete('quizzes/knowledge-points', id)} onEdit={(node) => setEditingItem({ type: 'kp', data: node })} />))}
                </div>
              </ScrollArea>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="albums" className="outline-none m-0 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start text-left">
            <Card className="border-none shadow-sm rounded-3xl p-10 bg-white border border-black/[0.03] space-y-8 text-left"><div className="flex items-center gap-3 text-left"><Layers className="h-6 w-6 text-emerald-600" /><h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">建立课程专辑</h3></div><div className="space-y-6 text-left"><div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">专辑名称</Label><Input value={albumForm.name} onChange={e => setAlbumForm({ ...albumForm, name: e.target.value })} className="bg-[#F5F5F7] border-none h-12 rounded-xl font-bold px-5" /></div><div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">描述</Label><textarea value={albumForm.description} onChange={e => setAlbumForm({ ...albumForm, description: e.target.value })} className="w-full bg-[#F5F5F7] border-none rounded-2xl p-6 min-h-[100px] font-bold text-sm" /></div><div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">视觉封面</Label><div className="relative group text-left"><Button variant="outline" className="w-full h-16 rounded-2xl border-dashed border-2 border-black/10 flex justify-between px-6 font-bold"><span>{albumForm.cover ? albumForm.cover.name : '上传封面图'}</span><Upload className="w-4 h-4 opacity-20" /></Button><input type="file" onChange={e => setAlbumForm({ ...albumForm, cover: e.target.files?.[0] || null })} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" /></div></div><Button onClick={handleCreateAlbum} className="w-full bg-black text-white h-14 rounded-2xl font-bold shadow-xl uppercase text-xs tracking-widest">Create Album</Button></div></Card>
            <Card className="border-none shadow-sm rounded-3xl p-10 bg-[#F5F5F7]/50 border border-black/[0.03] space-y-6 text-left"><div className="flex items-center justify-between text-left"><h3 className="text-sm font-bold uppercase tracking-widest text-black/40">现有专辑矩阵</h3><Button variant="ghost" size="icon" onClick={fetchLists} className="rounded-full"><RefreshCcw className="w-4 h-4 opacity-40" /></Button></div><ScrollArea className="h-[520px] text-left"><div className="grid gap-3 pr-4 text-left">{albumList.map(al => (<div key={al.id} className="p-5 bg-white rounded-2xl border border-black/[0.02] shadow-sm flex items-center justify-between group text-left"><p className="text-sm font-bold text-[#1D1D1F]">{al.name}</p><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-left"><Button onClick={() => setEditingItem({ type: 'albums', data: { ...al } })} variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-blue-600"><Edit3 className="w-3.5 h-3.5" /></Button><Button onClick={() => handleDelete('courses/albums', al.id)} variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button></div></div>))}</div></ScrollArea></Card>
          </div>
        </TabsContent>

        <TabsContent value="bots" className="outline-none m-0 text-left">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start text-left">
            <Card className="border-none shadow-sm rounded-3xl p-10 bg-white border border-black/[0.03] space-y-8 text-left"><div className="flex items-center gap-3 text-left"><Bot className="h-6 w-6 text-emerald-600" /><h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">部署 AI 助教</h3></div><div className="space-y-6 text-left"><div className="flex items-center gap-6 text-left"><div className="relative group shrink-0"><Avatar className="h-20 w-20 border-4 border-white shadow-xl ring-1 ring-black/5 overflow-hidden">{botForm.avatar ? <AvatarImage src={URL.createObjectURL(botForm.avatar)} /> : <AvatarFallback className="bg-slate-50 text-[10px] font-bold">INIT</AvatarFallback>}</Avatar><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center cursor-pointer"><Upload className="w-4 h-4 text-white" /><input type="file" onChange={e => setBotForm({ ...botForm, avatar: e.target.files?.[0] || null })} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" /></div></div><div className="flex-1 space-y-3 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">昵称</Label><Input value={botForm.name} onChange={e => setBotForm({ ...botForm, name: e.target.value })} className="bg-[#F5F5F7] border-none h-12 rounded-2xl font-bold px-5" /></div></div><div className="space-y-3 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">引导词 (Prompt)</Label><textarea value={botForm.prompt} onChange={e => setBotForm({ ...botForm, prompt: e.target.value })} className="w-full bg-[#F5F5F7] border-none rounded-2xl p-6 min-h-[200px] font-bold text-sm" /></div><Button onClick={handleCreateBot} className="w-full bg-black text-white h-14 rounded-2xl font-bold shadow-xl uppercase text-xs tracking-widest">Deploy Bot</Button></div></Card>
            <Card className="border-none shadow-sm rounded-3xl p-10 bg-[#F5F5F7]/50 border border-black/[0.03] space-y-6 text-left"><div className="flex items-center justify-between text-left"><h3 className="text-sm font-bold uppercase tracking-widest text-black/40">助教矩阵</h3><Button variant="ghost" size="icon" onClick={fetchLists} className="rounded-full"><RefreshCcw className="w-4 h-4 opacity-40" /></Button></div><ScrollArea className="h-[520px] text-left"><div className="grid gap-3 pr-4 text-left">{botList.map(b => (<div key={b.id} className="flex items-center justify-between p-5 bg-white rounded-2xl border border-black/[0.02] shadow-sm group text-left"><div className="flex items-center gap-4 text-left"><Avatar className="h-10 w-10"><AvatarImage src={b.avatar} /><AvatarFallback>{b.name[0]}</AvatarFallback></Avatar><p className="text-sm font-bold text-[#1D1D1F] truncate text-left">{b.name}</p></div><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-left"><Button onClick={() => setEditingItem({ type: 'bots', data: { ...b } })} variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-blue-600"><Edit3 className="w-3.5 h-3.5" /></Button><Button onClick={() => handleDelete('ai/bots', b.id)} variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-red-500"><Trash2 className="w-3.5 h-3.5" /></Button></div></div>))}</div></ScrollArea></Card>
          </div>
        </TabsContent>

        <TabsContent value="quizzes" className="outline-none m-0 text-left">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start text-left">
            <Card className="border-none shadow-sm rounded-[2rem] p-8 bg-white border border-black/[0.03] space-y-6 text-left">
              <div className="flex items-center gap-3 text-left"><Target className="h-6 w-6 text-blue-600" /><h3 className="text-xl font-bold tracking-tight text-[#1D1D1F]">手工录入题目</h3></div>
              <div className="space-y-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left">
                  <div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">题型</Label><Select value={quizForm.q_type} onValueChange={v => setQuizForm({ ...quizForm, q_type: v })}><SelectTrigger className="h-10 rounded-xl bg-[#F5F5F7] border-none font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="objective">客观题</SelectItem><SelectItem value="subjective">主观题</SelectItem></SelectContent></Select></div>
                  {quizForm.q_type === 'subjective' && (<div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">子类</Label><Select value={quizForm.subjective_type} onValueChange={v => setQuizForm({ ...quizForm, subjective_type: v })}><SelectTrigger className="h-10 rounded-xl bg-[#F5F5F7] border-none font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="noun">名词解释</SelectItem><SelectItem value="short">简答题</SelectItem><SelectItem value="essay">论述题</SelectItem></SelectContent></Select></div>)}
                  <div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">挂载点</Label><Select value={quizForm.knowledge_point} onValueChange={v => setQuizForm({ ...quizForm, knowledge_point: v })}><SelectTrigger className="h-10 rounded-xl bg-[#F5F5F7] border-none font-bold text-xs px-4"><SelectValue placeholder="不挂载" /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="0" className="text-xs font-bold">不挂载</SelectItem>{kpList.map(kp => <SelectItem key={kp.id} value={kp.id.toString()} className="text-xs font-bold">{kp.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">难度</Label><Input type="number" value={quizForm.difficulty} onChange={e => setQuizForm({ ...quizForm, difficulty: parseInt(e.target.value) })} className="h-10 rounded-xl bg-[#F5F5F7] border-none font-bold text-xs px-4" /></div>
                </div>
                <div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">题目文本</Label><textarea value={quizForm.text} onChange={e => setQuizForm({ ...quizForm, text: e.target.value })} className="w-full bg-[#F5F5F7] border-none rounded-2xl p-6 min-h-[100px] font-bold text-sm" /></div>
                {quizForm.q_type === 'objective' ? (
                  <div className="space-y-4 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">选项与答案</Label><div className="grid grid-cols-2 gap-3 text-left">{quizForm.options.map((opt, i) => (<div key={i} className="flex gap-2 text-left"><div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center font-bold shrink-0 text-xs">{String.fromCharCode(65 + i)}</div><Input value={opt} onChange={e => { const no = [...quizForm.options]; no[i] = e.target.value; setQuizForm({ ...quizForm, options: no }); }} className="h-10 rounded-xl bg-[#F5F5F7] border-none font-bold text-xs px-4" /></div>))}</div><Input value={quizForm.answer} onChange={e => setQuizForm({ ...quizForm, answer: e.target.value })} placeholder="正确答案字母" className="h-11 rounded-xl bg-[#F5F5F7] border-none font-bold text-xs mt-2 px-5" /></div>
                ) : (
                  <div className="space-y-4 text-left"><div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">判分点</Label><textarea value={quizForm.grading_points} onChange={e => setQuizForm({ ...quizForm, grading_points: e.target.value })} className="w-full bg-[#F5F5F7] border-none rounded-xl p-4 min-h-[80px] font-bold text-sm" /></div><div className="space-y-2.5 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">参考答案</Label><textarea value={quizForm.answer} onChange={e => setQuizForm({ ...quizForm, answer: e.target.value })} className="w-full bg-[#F5F5F7] border-none rounded-xl p-4 min-h-[80px] font-bold text-sm" /></div></div>
                )}
                <Button onClick={handleCreateQuiz} className="w-full h-14 rounded-2xl bg-black text-white font-bold shadow-xl uppercase text-xs tracking-widest">Entry Bank</Button>
              </div>
            </Card>
            {/* 右侧：题库浏览器 */}
            <QuestionBankPanel kpList={kpList} onEdit={(q) => setEditingItem({ type: 'quizzes', data: { ...q } })} onDelete={(id) => handleDelete('quizzes/questions', id)} />
          </div>
        </TabsContent>

        <TabsContent value="manage" className="outline-none m-0 text-left">
          {auditMode === 'hub' ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-left">
              {[
                { id: 'courses', label: '课程审计', icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { id: 'articles', label: '文章管理', icon: FileText, color: 'text-orange-600', bg: 'bg-orange-50' },
                { id: 'kp', label: '知识节点', icon: BrainCircuit, color: 'text-purple-600', bg: 'bg-purple-50' },
                { id: 'sm', label: '启动资料', icon: Rocket, color: 'text-red-600', bg: 'bg-red-50' },
              ].map(item => (
                <Card key={item.id} onClick={() => setAuditMode(item.id as any)} className="p-8 rounded-[2rem] bg-white border border-black/5 flex flex-col items-center gap-4 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group text-left">
                  <div className={cn("h-16 w-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform", item.bg, item.color)}><item.icon className="w-8 h-8" /></div>
                  <div className="text-center text-left"><h4 className="text-sm font-bold tracking-tight">{item.label}</h4></div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-none shadow-sm rounded-[2.5rem] bg-white border border-black/[0.03] overflow-hidden text-left">
              <div className="p-6 border-b border-black/[0.03] flex justify-between items-center bg-slate-50/50 text-left">
                <Button variant="ghost" onClick={() => setAuditMode('hub')} className="rounded-xl gap-2 font-bold text-xs"><X className="w-4 h-4" /> 退出列表</Button>
                <div className="flex gap-4 items-center text-left">
                  <div className="relative text-left"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-30" /><Input value={qSearch} onChange={e => setQSearch(e.target.value)} placeholder="搜索..." className="pl-12 bg-white border-none h-10 rounded-xl font-bold w-64 shadow-sm text-xs" /></div>
                  <Button variant="ghost" size="icon" onClick={fetchLists} className="rounded-full"><RefreshCcw className="w-4 h-4 opacity-40" /></Button>
                </div>
              </div>
              <ScrollArea className="h-[600px] p-6 text-left">
                <div className="grid gap-2 text-left">
                  {auditMode === 'courses' && courseList.map(c => (<div key={c.id} className="p-4 bg-[#F5F5F7]/50 rounded-2xl flex items-center justify-between group border border-transparent hover:border-black/5 transition-all text-left"><p className="text-sm font-bold text-[#1D1D1F]">{c.title}</p><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-left"><Button onClick={() => setEditingItem({ type: 'courses', data: { ...c } })} variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-white text-blue-600 shadow-sm"><Edit3 className="w-4 h-4" /></Button><Button onClick={() => handleDelete('courses', c.id)} variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-white text-red-500 shadow-sm"><Trash2 className="w-4 h-4" /></Button></div></div>))}
                  {auditMode === 'articles' && articleList.map(a => (<div key={a.id} className="p-4 bg-[#F5F5F7]/50 rounded-2xl flex items-center justify-between group border border-transparent hover:border-black/5 transition-all text-left"><p className="text-sm font-bold text-[#1D1D1F]">{a.title}</p><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-left"><Button onClick={() => setEditingItem({ type: 'articles', data: { ...a } })} variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-white text-blue-600 shadow-sm"><Edit3 className="w-4 h-4" /></Button><Button onClick={() => handleDelete('articles', a.id)} variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-white text-red-500 shadow-sm"><Trash2 className="w-4 h-4" /></Button></div></div>))}
                  {auditMode === 'kp' && kpList.map(kp => (<div key={kp.id} className="p-4 bg-[#F5F5F7]/50 rounded-2xl flex items-center justify-between group border border-transparent hover:border-black/5 transition-all text-left"><p className="text-sm font-bold text-[#1D1D1F] text-left">{kp.name}</p><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-left"><Button onClick={() => setEditingItem({ type: 'kp', data: { ...kp } })} variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-white text-blue-600 shadow-sm"><Edit3 className="w-4 h-4" /></Button><Button onClick={() => handleDelete('quizzes/knowledge-points', kp.id)} variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-white text-red-500 shadow-sm"><Trash2 className="w-4 h-4" /></Button></div></div>))}
                  {auditMode === 'sm' && smList.map(sm => (<div key={sm.id} className="p-4 bg-[#F5F5F7]/50 rounded-2xl flex items-center justify-between group border border-transparent hover:border-black/5 transition-all text-left"><p className="text-sm font-bold text-[#1D1D1F] text-left">{sm.name}</p><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-left"><Button onClick={() => setEditingItem({ type: 'sm', data: { ...sm } })} variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-white text-blue-600 shadow-sm"><Edit3 className="w-4 h-4" /></Button><Button onClick={() => handleDelete('sm', sm.id)} variant="ghost" size="icon" className="rounded-xl h-8 w-8 hover:bg-white text-red-500 shadow-sm"><Trash2 className="w-4 h-4" /></Button></div></div>))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* --- Unified Dialogs --- */}
      <Dialog open={!!editingItem} onOpenChange={open => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[850px] max-h-[90vh] overflow-y-auto rounded-[3rem] p-10 border-none shadow-2xl text-left">
          <DialogHeader className="text-left"><DialogTitle className="text-xl font-bold tracking-tight">资源属性核心配置</DialogTitle></DialogHeader>
          <div className="space-y-6 pt-6 text-left">
            {editingItem?.type === 'courses' && (
              <div className="space-y-4 text-left">
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">标题</Label><Input value={editingItem.data.title} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, title: e.target.value } })} className="rounded-xl bg-slate-50 border-none h-10 text-xs font-bold" /></div>
                  <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">ELO 奖励</Label><Input type="number" value={editingItem.data.elo_reward} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, elo_reward: e.target.value } })} className="rounded-xl bg-slate-50 border-none h-10 text-xs font-bold" /></div>
                </div>
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">详细描述</Label>
                  <MarkdownEditor content={editingItem.data.description} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: v } })} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40 text-emerald-600">更新视频</Label><Input type="file" onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, video_file: e.target.files?.[0] } })} className="rounded-xl h-10 bg-slate-50 text-[10px]" /></div>
                  <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40 text-blue-600">更新封面</Label><Input type="file" onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, cover_image: e.target.files?.[0] } })} className="rounded-xl h-10 bg-slate-50 text-[10px]" /></div>
                </div>
              </div>
            )}
            {editingItem?.type === 'articles' && (
              <div className="space-y-4 text-left">
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">标题</Label><Input value={editingItem.data.title} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, title: e.target.value } })} className="rounded-xl bg-[#F5F5F7] border-none h-14 text-2xl font-black px-5 tracking-tighter" /></div>
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">署名</Label><Input value={editingItem.data.author_display_name} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, author_display_name: e.target.value } })} className="rounded-xl bg-slate-50 border-none h-10 text-xs font-bold" /></div>
                  <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">关联知识点</Label>
                    <Select value={editingItem.data.knowledge_point || "0"} onValueChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, knowledge_point: v } })}>
                      <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none font-bold text-xs px-4"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="0" className="text-xs font-bold">不挂载</SelectItem>
                        {kpList.map(kp => <SelectItem key={kp.id} value={kp.id.toString()} className="text-xs font-bold">{kp.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <TagInput tags={editingItem.data.tags || []} setTags={t => setEditingItem({ ...editingItem, data: { ...editingItem.data, tags: t } })} compact />
                <div className="space-y-1.5 text-left mt-4"><Label className="text-[10px] font-bold uppercase opacity-40">正文内容 (Markdown)</Label>
                  <MarkdownEditor content={editingItem.data.content} onChange={v => setEditingItem({ ...editingItem, data: { ...editingItem.data, content: v } })} />
                </div>
              </div>
            )}
            {editingItem?.type === 'albums' && (
              <div className="space-y-4 text-left">
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">专辑名称</Label><Input value={editingItem.data.name} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })} className="rounded-xl bg-slate-50 border-none h-10 text-xs font-bold" /></div>
                <textarea value={editingItem.data.description} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value } })} className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50 border-none text-xs" />
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">更新封面</Label><Input type="file" onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, cover_image: e.target.files?.[0] } })} className="rounded-xl h-10 bg-slate-50 text-[10px]" /></div>
              </div>
            )}
            {editingItem?.type === 'bots' && (
              <div className="space-y-4 text-left">
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1"><Label className="text-[10px] font-bold uppercase opacity-40">助教昵称</Label><Input value={editingItem.data.name} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })} className="rounded-xl bg-slate-50 border-none h-10 text-xs font-bold" /></div>
                  <div className="flex items-center gap-2 pt-4">
                    <input type="checkbox" checked={editingItem.data.is_exclusive} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, is_exclusive: e.target.checked } })} className="h-4 w-4 rounded border-gray-300" />
                    <Label className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">专属导师权限</Label>
                  </div>
                </div>
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">System Prompt</Label><textarea value={editingItem.data.system_prompt} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, system_prompt: e.target.value } })} className="w-full min-h-[300px] p-4 rounded-xl bg-slate-50 border-none text-xs font-medium" /></div>
              </div>
            )}
            {editingItem?.type === 'kp' && (
              <div className="space-y-4 text-left">
                <Input value={editingItem.data.name} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })} className="rounded-xl bg-slate-50 border-none h-10 text-xs font-bold" />
                <textarea value={editingItem.data.description} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value } })} className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50 border-none text-xs" />
              </div>
            )}
            {editingItem?.type === 'quizzes' && (
              <div className="space-y-4 text-left">
                <textarea value={editingItem.data.text} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, text: e.target.value } })} className="w-full p-4 rounded-xl bg-slate-50 border-none text-xs font-bold min-h-[80px]" />
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">判分点</Label><textarea value={editingItem.data.grading_points} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, grading_points: e.target.value } })} className="w-full p-4 rounded-xl bg-slate-50 border-none text-[10px] h-24" /></div>
                  <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">答案</Label><textarea value={editingItem.data.correct_answer} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, correct_answer: e.target.value } })} className="w-full p-4 rounded-xl bg-slate-50 border-none text-[10px] h-24" /></div>
                </div>
              </div>
            )}
            {editingItem?.type === 'sm' && (
              <div className="space-y-4 text-left">
                <Input value={editingItem.data.name} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, name: e.target.value } })} className="rounded-xl bg-slate-50 border-none h-10 text-xs font-bold" />
                <textarea value={editingItem.data.description} onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, description: e.target.value } })} className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50 border-none text-xs" />
                <div className="space-y-1.5 text-left"><Label className="text-[10px] font-bold uppercase opacity-40">更新文件</Label><Input type="file" onChange={e => setEditingItem({ ...editingItem, data: { ...editingItem.data, file: e.target.files?.[0] } })} className="rounded-xl h-10 bg-slate-50 text-[10px]" /></div>
              </div>
            )}
            <Button onClick={handleSaveEdit} className="w-full h-12 bg-black text-white rounded-xl font-bold shadow-xl text-xs uppercase tracking-widest text-left">Update & Sync</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAIWorkstation} onOpenChange={setShowAIWorkstation}>
        <DialogContent className="sm:max-w-[1000px] rounded-[3rem] p-10 border-none shadow-2xl text-left overflow-hidden text-left">
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold flex items-center gap-3"><Sparkles className="text-emerald-500" /> AI 题目作业中心</DialogTitle>
            <DialogDescription className="text-xs">
              {aiPreviewData ? "整理完成：请预览并修正题目内容，确认无误后导入库。" : "业务流程：1. AI 整理语料 2. 预览并编辑 3. 确认导入"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-6 text-left">
            {!aiPreviewData ? (
              <div className="space-y-6 text-left">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-8">
                    <textarea value={aiInputText} onChange={e => setAiInputText(e.target.value)} className="w-full bg-[#F5F5F7] border-none rounded-[2rem] p-8 min-h-[350px] font-medium text-sm leading-relaxed" placeholder="在此粘贴 5 万字以内的学术语料..." />
                  </div>
                  <div className="md:col-span-4 space-y-4">
                    <div className="p-8 border-2 border-dashed border-black/10 rounded-[2rem] bg-slate-50 flex flex-col items-center justify-center text-center space-y-4 group hover:border-emerald-500/50 transition-all relative">
                      <div className="h-14 w-14 rounded-2xl bg-white shadow-sm flex items-center justify-center"><FileUp className="h-6 w-6 opacity-40 group-hover:text-emerald-500 transition-colors" /></div>
                      <div><p className="text-[11px] font-bold">拖动 Word 文件至此</p><p className="text-[9px] text-black/30 font-medium mt-1 uppercase">Supports .docx / .txt</p></div>
                      {aiFile && <Badge className="bg-emerald-500 text-white border-none">{aiFile.name}</Badge>}
                      <input type="file" onChange={e => setAiFile(e.target.files?.[0] || null)} className="absolute inset-0 opacity-0 cursor-pointer" accept=".docx,.txt" />
                    </div>
                    <Card className="p-6 border-none bg-emerald-50/50 rounded-[1.5rem] space-y-2">
                      <h5 className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-2"><Sparkles className="w-3 h-3" /> 智能解析建议</h5>
                      <p className="text-[10px] text-emerald-900/60 font-medium leading-relaxed">对于超长文本，AI 将自动启动分片引擎并行作业，确保导入效率。</p>
                    </Card>
                  </div>
                </div>
                <Button onClick={handleAIParse} disabled={isParsing} className="w-full h-14 rounded-2xl bg-black text-white font-bold shadow-xl transition-all hover:scale-[1.01]">
                  {isParsing ? <><RefreshCcw className="mr-2 h-4 w-4 animate-spin" /> {parseProgress || 'AI 深度整理中...'}</> : "开始 AI 自动整理"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6 text-left">
                <ScrollArea className="h-[450px] border rounded-[2rem] bg-slate-50/50 p-6 text-left">
                  <div className="space-y-4 text-left">
                    {aiPreviewData.map((q, i) => (
                      <Card key={i} className="p-5 bg-white rounded-2xl border-none shadow-sm space-y-3 text-left">
                        <div className="flex justify-between items-start text-left">
                          <Badge className="bg-black text-white text-[8px]">{q.q_type}</Badge>
                          <Button variant="ghost" size="icon" onClick={() => setAiPreviewData(aiPreviewData.filter((_, idx) => idx !== i))} className="h-6 w-6 text-red-500"><X className="w-3 h-3" /></Button>
                        </div>
                        <textarea value={q.text} onChange={e => { const nd = [...aiPreviewData]; nd[i].text = e.target.value; setAiPreviewData(nd); }} className="w-full bg-[#F5F5F7] border-none rounded-xl p-3 text-xs font-bold min-h-[60px]" />
                        <div className="grid grid-cols-2 gap-3 text-left">
                          <div className="space-y-1.5 text-left text-left"><Label className="text-[8px] uppercase opacity-40">答案</Label><textarea value={q.correct_answer} onChange={e => { const nd = [...aiPreviewData]; nd[i].correct_answer = e.target.value; setAiPreviewData(nd); }} className="w-full bg-[#F5F5F7] border-none rounded-lg p-2 text-[10px]" /></div>
                          <div className="space-y-1.5 text-left text-left"><Label className="text-[8px] uppercase opacity-40">得分点/解析</Label><textarea value={q.grading_points || q.analysis} onChange={e => { const nd = [...aiPreviewData]; nd[i].grading_points = e.target.value; setAiPreviewData(nd); }} className="w-full bg-[#F5F5F7] border-none rounded-lg p-2 text-[10px]" /></div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
                <div className="grid grid-cols-2 gap-4 items-end text-left">
                  <div className="space-y-2 text-left"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">批量挂载知识点</Label><Select value={aiTargetKP} onValueChange={setAiTargetKP}><SelectTrigger className="h-12 rounded-2xl bg-[#F5F5F7] border-none font-bold px-5 text-xs"><SelectValue placeholder="选择知识点" /></SelectTrigger><SelectContent className="rounded-xl">{kpList.map(kp => <SelectItem key={kp.id} value={kp.id.toString()} className="text-xs font-bold">{kp.name}</SelectItem>)}</SelectContent></Select></div>
                  <div className="flex gap-2 text-left">
                    <Button variant="outline" onClick={() => setAiPreviewData(null)} className="flex-1 h-12 rounded-xl border-black/5 font-bold text-xs">取消重来</Button>
                    <Button onClick={handleAIImport} className="flex-[2] h-12 rounded-xl bg-emerald-500 text-white font-bold shadow-xl shadow-emerald-500/20 text-xs gap-2"><CheckCircle2 className="w-4 h-4" /> 确认导入题库</Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {isUploading && (<div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-bottom-10 duration-500"><Card className="border-none shadow-2xl rounded-3xl bg-white p-6 w-80 flex items-center gap-5 border border-black/5"><div className="relative h-12 w-12 shrink-0"><svg className="h-full w-full -rotate-90"><circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" /><circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="125.6" strokeDashoffset={125.6 - (125.6 * uploadProgress) / 100} className="text-black transition-all duration-500" strokeLinecap="round" /></svg><div className="absolute inset-0 flex items-center justify-center text-[9px] font-bold">{uploadProgress}%</div></div><div className="flex-1 min-w-0"><p className="text-xs font-bold text-[#1D1D1F] truncate text-left">资源同步中...</p></div></Card></div>)}

      {/* --- Dynamic KP Creation Dialog --- */}
      <Dialog open={showNewKPDialog} onOpenChange={setShowNewKPDialog}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-10 border-none shadow-2xl text-left bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-3"><BrainCircuit className="text-indigo-600 w-5 h-5" /> 快速新建知识点</DialogTitle>
            <DialogDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">建立新的学术节点并立即关联</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 pt-6">
            <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">节点名称</Label><Input value={newKPForm.name} onChange={e => setNewKPForm({ ...newKPForm, name: e.target.value })} placeholder="例如：博弈论基础" className="bg-[#F5F5F7] border-none h-11 rounded-xl font-bold px-4 text-sm" /></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">隶属父级</Label><Select value={newKPForm.parent} onValueChange={v => setNewKPForm({ ...newKPForm, parent: v })}><SelectTrigger className="h-11 rounded-xl bg-[#F5F5F7] border-none font-bold text-xs px-4"><SelectValue placeholder="顶级节点" /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="0" className="text-xs font-bold">顶级节点</SelectItem>{kpList.map(kp => <SelectItem key={kp.id} value={kp.id.toString()} className="text-xs font-bold">{kp.name}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><Label className="text-[10px] font-bold uppercase tracking-widest opacity-40">描述</Label><textarea value={newKPForm.description} onChange={e => setNewKPForm({ ...newKPForm, description: e.target.value })} className="w-full bg-[#F5F5F7] border-none rounded-xl p-4 min-h-[100px] font-bold text-xs" placeholder="该知识点的核心定义或范畴..." /></div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowNewKPDialog(false)} className="flex-1 h-12 rounded-xl font-bold text-xs border-slate-100 hover:bg-slate-50">取消</Button>
              <Button onClick={handleQuickCreateKP} className="flex-[2] h-12 rounded-xl bg-black text-white font-black shadow-xl text-xs uppercase tracking-widest">确认并保存节点</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
