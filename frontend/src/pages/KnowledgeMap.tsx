import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { BrainCircuit, Layers, Target, BookOpen, FileText, Video, Search, Maximize2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { cn, processMathContent } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KPNode {
  id: number;
  name: string;
  description: string;
  parent: number | null;
  questions_count?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

// --- Force Directed Graph Component ---
const KnowledgeGraph = ({ nodes, onNodeClick }: { nodes: KPNode[], onNodeClick: (node: KPNode) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const nodesRef = useRef<KPNode[]>([]);
  const requestRef = useRef<number>(null);

  // Initialize nodes with random positions
  useEffect(() => {
    nodesRef.current = nodes.map(n => ({
      ...n,
      x: (Math.random() - 0.5) * 800,
      y: (Math.random() - 0.5) * 600,
      vx: 0,
      vy: 0
    }));
  }, [nodes]);

  const animate = (time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // --- Physics Simulation ---
    const nodes = nodesRef.current;
    const k = 0.05; // spring constant
    const repulsion = 1500;
    const centerForce = 0.01;

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];

      // Repulsion between all nodes
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = b.x! - a.x!;
        const dy = b.y! - a.y!;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        a.vx! -= fx;
        a.vy! -= fy;
        b.vx! += fx;
        b.vy! += fy;
      }

      // Attraction to center
      a.vx! -= a.x! * centerForce;
      a.vy! -= a.y! * centerForce;

      // Damping
      a.vx! *= 0.9;
      a.vy! *= 0.9;
    }

    // Update positions
    for (const node of nodes) {
      node.x! += node.vx!;
      node.y! += node.vy!;
    }

    // --- Rendering ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 + transform.x, canvas.height / 2 + transform.y);
    ctx.scale(transform.k, transform.k);

    // Draw Edges (to center/parent if needed, but let's just do a cloud for now as requested)
    // If we want Obsidian style, we can draw lines to '金融理论' (ID could be found)
    const parentNode = nodes.find(n => n.name === "金融理论");
    if (parentNode) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(0,0,0,0.05)';
      ctx.lineWidth = 1;
      for (const node of nodes) {
        if (node === parentNode) continue;
        ctx.moveTo(parentNode.x!, parentNode.y!);
        ctx.lineTo(node.x!, node.y!);
      }
      ctx.stroke();
    }

    // Draw Nodes
    for (const node of nodes) {
      const radius = 5 + Math.sqrt(node.questions_count || 0) * 2;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, radius, 0, Math.PI * 2);
      ctx.fillStyle = node.name === "金融理论" ? "#4f46e5" : "white";
      ctx.fill();
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      if (transform.k > 0.6) {
        ctx.fillStyle = "#1e293b";
        ctx.font = `bold ${10 / transform.k}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x!, node.y! + radius + 12 / transform.k);
      }
    }

    ctx.restore();
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [transform]);

  const handleWheel = (e: React.WheelEvent) => {
    // Slower zoom speed
    const delta = e.deltaY > 0 ? 0.98 : 1.02;
    setTransform(prev => ({ ...prev, k: Math.max(0.1, Math.min(5, prev.k * delta)) }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX - transform.x;
    const startY = e.clientY - transform.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setTransform(prev => ({
        ...prev,
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Exact relative coordinates considering transform
    const mouseX = (e.clientX - rect.left - canvas.width / 2 - transform.x) / transform.k;
    const mouseY = (e.clientY - rect.top - canvas.height / 2 - transform.y) / transform.k;

    // Enhanced hit detection
    for (const node of nodesRef.current) {
      const dx = node.x! - mouseX;
      const dy = node.y! - mouseY;
      const radius = (5 + Math.sqrt(node.questions_count || 0) * 2);
      // Added absolute distance check unaffected by zoom
      if (Math.sqrt(dx * dx + dy * dy) < radius + 15) {
        onNodeClick(node);
        break;
      }
    }
  };

  return (
    <div className="relative w-full h-[600px] bg-slate-50/50 rounded-[3rem] border border-border/50 overflow-hidden cursor-move shadow-inner">
      <canvas
        ref={canvasRef}
        width={1200}
        height={600}
        className="w-full h-full"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
      />
      <div className="absolute bottom-8 left-8 flex flex-col gap-2">
        <Button variant="secondary" size="icon" className="rounded-xl shadow-lg" onClick={() => setTransform(p => ({ ...p, k: p.k * 1.2 }))}><ZoomIn className="h-4 w-4" /></Button>
        <Button variant="secondary" size="icon" className="rounded-xl shadow-lg" onClick={() => setTransform(p => ({ ...p, k: p.k * 0.8 }))}><ZoomOut className="h-4 w-4" /></Button>
        <Button variant="secondary" size="icon" className="rounded-xl shadow-lg" onClick={() => setTransform({ x: 0, y: 0, k: 1 })}><Maximize2 className="h-4 w-4" /></Button>
      </div>
      <div className="absolute top-8 right-8">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm">
          <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Graph View Active</span>
        </div>
      </div>
    </div>
  );
};

export const KnowledgeMap: React.FC = () => {
  const [nodes, setNodes] = useState<KPNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<KPNode | null>(null);
  const [nodeDetails, setNodeDetails] = useState<{ courses: any[], articles: any[], questions: any[] }>({ courses: [], articles: [], questions: [] });
  const [searchQuery, setSearchSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph');

  // Question Detail State
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  useEffect(() => { fetchMap(); }, []);

  const fetchMap = async () => {
    try {
      const [kpRes, qRes] = await Promise.all([
        api.get('/quizzes/knowledge-points/'),
        api.get('/quizzes/questions/')
      ]);
      const kps = kpRes.data;
      const questions = qRes.data;

      const flatNodes = kps.map((kp: any) => ({
        ...kp,
        questions_count: (questions || []).filter((q: any) => q.knowledge_point === kp.id).length
      }));

      flatNodes.sort((a: any, b: any) => (b.questions_count || 0) - (a.questions_count || 0) || a.name.localeCompare(b.name));
      setNodes(flatNodes);
    } catch (e) { } finally { setLoading(false); }
  };

  const handleNodeSelect = async (node: KPNode) => {
    setSelectedNode(node);
    try {
      const [cRes, aRes, qRes] = await Promise.all([
        api.get('/courses/', { params: { kp: node.id } }),
        api.get('/articles/', { params: { kp: node.id } }),
        api.get('/quizzes/questions/', { params: { kp: node.id } })
      ]);
      setNodeDetails({
        courses: cRes.data || [],
        articles: aRes.data.articles || [],
        questions: qRes.data || []
      });
    } catch (e) { }
  };

  const filteredNodes = nodes.filter(n => n.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <PageWrapper title="知识地图" subtitle="可视化呈现知识载体间的逻辑脉络与关联结构。">
      <div className="w-full space-y-6 text-left animate-in fade-in duration-700">

        <div className="flex justify-between items-center">
          <div className="max-w-md flex-1">
            <Input
              placeholder="搜索知识点..."
              value={searchQuery}
              onChange={e => setSearchSearchQuery(e.target.value)}
              className="rounded-2xl bg-white border-border shadow-sm h-11 px-5 font-bold"
            />
          </div>
          <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/50">
            <Button variant={viewMode === 'graph' ? 'secondary' : 'ghost'} onClick={() => setViewMode('graph')} className="rounded-xl h-9 text-xs font-bold px-6">关系图</Button>
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => setViewMode('list')} className="rounded-xl h-9 text-xs font-bold px-6">词条表</Button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center opacity-20 font-bold uppercase text-[10px] animate-pulse">Mapping connections...</div>
        ) : viewMode === 'graph' ? (
          <KnowledgeGraph nodes={nodes} onNodeClick={handleNodeSelect} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredNodes.map(node => (
              <div
                key={node.id}
                onClick={() => handleNodeSelect(node)}
                className="group flex items-center gap-2 bg-white border border-border/50 hover:border-primary/30 hover:shadow-md px-3 py-1.5 rounded-xl cursor-pointer transition-all active:scale-95"
              >
                <span className="text-xs font-bold text-foreground">{node.name}</span>
                {node.questions_count !== undefined && node.questions_count > 0 && (
                  <Badge variant="secondary" className="text-[8px] rounded-full px-1 py-0 h-3 bg-muted/50 border-none font-black opacity-50 group-hover:opacity-100 transition-opacity">
                    {node.questions_count}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog modal={false} open={!!selectedNode} onOpenChange={open => !open && setSelectedNode(null)}>
          <DialogContent className="sm:max-w-[750px] rounded-[3rem] p-10 border-none shadow-2xl text-left overflow-hidden max-h-[85vh] flex flex-col">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2"><Badge className="bg-emerald-500 text-white border-none uppercase text-[9px] font-bold">Node Detail</Badge></div>
              <DialogTitle className="text-3xl font-bold tracking-tight">{selectedNode?.name}</DialogTitle>
              <div className="text-sm font-medium text-[#86868B] mt-2 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {processMathContent(selectedNode?.description || "")}
                </ReactMarkdown>
              </div>
            </DialogHeader>
            <ScrollArea className="flex-1 mt-8 pr-4">
              <div className="space-y-8 pb-4 text-left">
                <div className="space-y-4 text-left">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-black/30 flex items-center gap-2"><Target className="w-3.5 h-3.5" /> 关联题目 ({nodeDetails.questions.length})</h5>
                  <div className="grid gap-2">{nodeDetails.questions.map(q => (
                    <div
                      key={q.id}
                      onClick={() => setSelectedQuestion(q)}
                      className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-black/[0.01] cursor-pointer hover:bg-slate-100 transition-colors group"
                    >
                      <Badge variant="outline" className="text-[8px] py-0 h-4 uppercase">{q.subjective_type || q.q_type}</Badge>
                      <div className="text-xs font-bold text-[#1D1D1F] truncate flex-1">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                          {processMathContent(q.text)}
                        </ReactMarkdown>
                      </div>
                      <Maximize2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                    </div>))}
                  </div>
                </div>
                <div className="space-y-4 text-left">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-black/30 flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> 课程资源 ({nodeDetails.courses.length})</h5>
                  <div className="grid gap-2">{nodeDetails.courses.map(c => (<div key={c.id} className="p-4 bg-emerald-50/50 rounded-2xl flex items-center gap-3 border border-emerald-100/20"><Video className="w-3.5 h-3.5 text-emerald-600" /><p className="text-xs font-bold text-emerald-900 truncate">{c.title}</p></div>))}</div>
                </div>
                <div className="space-y-4 text-left">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-black/30 flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> 参考文章 ({nodeDetails.articles.length})</h5>
                  <div className="grid gap-2">{nodeDetails.articles.map(a => (<div key={a.id} className="p-4 bg-orange-50/50 rounded-2xl flex items-center gap-3 border border-orange-100/20"><FileText className="w-3.5 h-3.5 text-orange-600" /><p className="text-xs font-bold text-orange-900 truncate">{a.title}</p></div>))}</div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Question Detail Dialog */}
        <Dialog modal={false} open={!!selectedQuestion} onOpenChange={open => !open && setSelectedQuestion(null)}>
          <DialogContent className="sm:max-w-[800px] rounded-[3rem] p-12 border-none shadow-2xl text-left overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <Badge className="bg-indigo-600 text-white border-none uppercase text-[9px] font-bold">Question Details</Badge>
                <Badge variant="outline" className="text-[9px] font-bold">ELO {selectedQuestion?.difficulty}</Badge>
              </div>
              <DialogTitle className="text-2xl font-bold leading-relaxed text-slate-900">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {processMathContent(selectedQuestion?.text || "")}
                </ReactMarkdown>
              </DialogTitle>
            </DialogHeader>
            <div className="mt-10 space-y-8">
              <div className="space-y-3">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">标准答案</h5>
                <div className="p-8 bg-emerald-50/30 rounded-[2rem] border border-emerald-100/50 text-sm font-medium leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {processMathContent(selectedQuestion?.correct_answer || "")}
                  </ReactMarkdown>
                </div>
              </div>
              {selectedQuestion?.ai_answer && (
                <div className="space-y-3">
                  <h5 className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">深度学术解析</h5>
                  <div className="p-8 bg-slate-900 text-slate-200 rounded-[2rem] text-sm leading-relaxed shadow-xl">
                    <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                      {processMathContent(selectedQuestion.ai_answer)}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
};
