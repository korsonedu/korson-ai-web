import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { Target, Maximize2, ZoomIn, ZoomOut, GitMerge } from 'lucide-react';
import api from '@/lib/api';
import { processMathContent, cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

// Modularized Components
import { KnowledgeTrainingDialog } from './knowledge-map/TrainingDialog';

export interface KPNode {
  id: number;
  name: string;
  description: string;
  parent: number | null;
  level: string; 
  questions_count?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

const LEVEL_ORDER: Record<string, number> = { sub: 0, ch: 1, sec: 2, kp: 3 };

const sortNodes = (a: KPNode, b: KPNode) =>
  (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99) || a.name.localeCompare(b.name);

const buildStableLayout = (nodes: KPNode[]) => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const childrenMap = new Map<number, KPNode[]>();
  const roots: KPNode[] = [];

  for (const node of nodes) {
    if (node.parent && nodeMap.has(node.parent)) {
      const bucket = childrenMap.get(node.parent) || [];
      bucket.push(node);
      childrenMap.set(node.parent, bucket);
    } else {
      roots.push(node);
    }
  }

  for (const children of childrenMap.values()) children.sort(sortNodes);
  roots.sort(sortNodes);

  const rootCount = Math.max(roots.length, 1);
  const sectorWidth = (Math.PI * 2) / rootCount;
  const rootRadius = rootCount > 1 ? 260 : 0;
  const depthSpacing = 140;
  const positions = new Map<number, { x: number; y: number }>();

  const collectDescendants = (nodeId: number, acc: KPNode[]) => {
    const children = childrenMap.get(nodeId) || [];
    for (const child of children) {
      acc.push(child);
      collectDescendants(child.id, acc);
    }
  };

  const getDepthFromRoot = (node: KPNode, rootId: number) => {
    let depth = 0;
    let current: KPNode | undefined = node;
    while (current && current.id !== rootId) {
      depth += 1;
      current = current.parent ? nodeMap.get(current.parent) : undefined;
      if (!current) break;
    }
    return depth;
  };

  roots.forEach((root, idx) => {
    const sectorStart = -Math.PI / 2 + idx * sectorWidth;
    const sectorEnd = sectorStart + sectorWidth;
    const sectorCenter = (sectorStart + sectorEnd) / 2;

    positions.set(root.id, {
      x: Math.cos(sectorCenter) * rootRadius,
      y: Math.sin(sectorCenter) * rootRadius,
    });

    const descendants: KPNode[] = [];
    collectDescendants(root.id, descendants);
    if (!descendants.length) return;

    descendants.forEach((node, order) => {
      const t = (order + 1) / (descendants.length + 1);
      const angle = sectorStart + t * (sectorEnd - sectorStart);
      const depth = getDepthFromRoot(node, root.id);
      const radius = rootRadius + depth * depthSpacing;
      positions.set(node.id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    });
  });

  return positions;
};

// --- 高级力导向图引擎 ---
export const KnowledgeGraph = ({ nodes, onNodeClick }: { nodes: KPNode[], onNodeClick: (node: KPNode) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const nodesRef = useRef<KPNode[]>([]);
  const targetRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const existingNodes = new Map(nodesRef.current.map(n => [n.id, n]));
    const layout = buildStableLayout(nodes);
    targetRef.current = layout;

    nodesRef.current = nodes.map(n => {
      const existing = existingNodes.get(n.id);
      const target = layout.get(n.id) || { x: 0, y: 0 };
      return {
        ...n,
        x: existing?.x ?? target.x,
        y: existing?.y ?? target.y,
        vx: 0,
        vy: 0,
      };
    });
    setTransform({ x: 0, y: 0, k: 1 });
  }, [nodes]);

  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const currentNodes = nodesRef.current;
    const nodeMap = new Map(currentNodes.map(n => [n.id, n]));
    let moving = false;
    for (const node of currentNodes) {
      const target = targetRef.current.get(node.id);
      if (!target) continue;
      const dx = target.x - (node.x || 0);
      const dy = target.y - (node.y || 0);
      node.x = (node.x || 0) + dx * 0.15;
      node.y = (node.y || 0) + dy * 0.15;
      if (Math.abs(dx) > 0.4 || Math.abs(dy) > 0.4) moving = true;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(canvas.width / 2 + transform.x, canvas.height / 2 + transform.y);
    ctx.scale(transform.k, transform.k);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.28)';
    ctx.lineWidth = 1.2 / transform.k;
    const hideDenseKpEdges = currentNodes.length > 180 && transform.k < 1.05;
    for (const node of currentNodes) {
      if (node.parent) {
        if (hideDenseKpEdges && node.level === 'kp') continue;
        const parentNode = nodeMap.get(node.parent);
        if (parentNode) { ctx.moveTo(parentNode.x!, parentNode.y!); ctx.lineTo(node.x!, node.y!); }
      }
    }
    ctx.stroke();

    for (const node of currentNodes) {
      const radius = node.level === 'sub' ? 20 : node.level === 'ch' ? 14 : node.level === 'sec' ? 10 : 6 + Math.sqrt(node.questions_count || 0) * 1.5;
      ctx.beginPath();
      ctx.arc(node.x!, node.y!, radius, 0, Math.PI * 2);
      ctx.fillStyle = node.level === 'sub' ? '#1e1b4b' : node.level === 'ch' ? '#4338ca' : node.level === 'sec' ? '#818cf8' : '#ffffff';
      ctx.fill();
      if (node.level === 'kp') { ctx.strokeStyle = "#94a3b8"; ctx.lineWidth = 1.2 / transform.k; ctx.stroke(); }
      if (node.level !== 'kp' || transform.k > 1.15) {
        ctx.fillStyle = node.level === 'kp' ? "#475569" : "#1e293b";
        ctx.font = `${node.level === 'kp' ? 'normal' : 'bold'} ${ (node.level === 'kp' ? 10 : 13) / transform.k}px sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(node.name, node.x!, node.y! + radius + (14 / transform.k));
      }
    }
    ctx.restore();
    if (moving) requestRef.current = requestAnimationFrame(animate);
    else requestRef.current = null;
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [nodes, transform]);
  const handleWheel = (e: React.WheelEvent) => { const delta = e.deltaY > 0 ? 0.9 : 1.1; setTransform(prev => ({ ...prev, k: Math.max(0.1, Math.min(5, prev.k * delta)) })); };
  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX - transform.x, startY = e.clientY - transform.y;
    const handleMouseMove = (mv: MouseEvent) => setTransform(prev => ({ ...prev, x: mv.clientX - startX, y: mv.clientY - startY }));
    const handleMouseUp = () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
    window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp);
  };
  const handleClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left - canvas.width / 2 - transform.x) / transform.k;
    const my = (e.clientY - rect.top - canvas.height / 2 - transform.y) / transform.k;
    for (const n of nodesRef.current) { if (Math.sqrt((n.x! - mx) ** 2 + (n.y! - my) ** 2) < (n.level === 'kp' ? 12 : 20)) { onNodeClick(n); break; } }
  };

  return (
    <div className="relative w-full h-[650px] bg-slate-50/50 rounded-[3rem] border border-border/50 overflow-hidden cursor-move shadow-inner">
      <canvas ref={canvasRef} width={1200} height={650} className="w-full h-full" onWheel={handleWheel} onMouseDown={handleMouseDown} onClick={handleClick} />
      <div className="absolute bottom-8 left-8 flex flex-col gap-2">
        <Button variant="secondary" size="icon" className="rounded-xl shadow-lg" onClick={() => setTransform(p => ({ ...p, k: p.k * 1.2 }))}><ZoomIn className="h-4 w-4" /></Button>
        <Button variant="secondary" size="icon" className="rounded-xl shadow-lg" onClick={() => setTransform(p => ({ ...p, k: p.k * 0.8 }))}><ZoomOut className="h-4 w-4" /></Button>
        <Button variant="secondary" size="icon" className="rounded-xl shadow-lg" onClick={() => setTransform({ x: 0, y: 0, k: 1 })}><Maximize2 className="h-4 w-4" /></Button>
      </div>
    </div>
  );
};

export const KnowledgeMap: React.FC = () => {
  const [allNodes, setAllNodes] = useState<KPNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<KPNode | null>(null);
  const [nodeDetails, setNodeDetails] = useState<{ courses: any[], articles: any[], questions: any[] }>({ courses: [], articles: [], questions: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('graph');
  const [selectedRootId, setSelectedRootId] = useState<string>('all');
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  useEffect(() => { fetchMap(); }, []);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const fetchMap = async () => {
    try {
      const res = await api.get('/quizzes/knowledge-points/');
      let rawData = res.data;
      const flatNodes: KPNode[] = [];
      const flatten = (items: any[]) => {
          for (const item of items) {
              flatNodes.push({ id: item.id, name: item.name, description: item.description, parent: item.parent, level: item.level, questions_count: item.questions_count });
              if (item.children && item.children.length > 0) flatten(item.children);
          }
      };
      if (rawData.length > 0 && rawData[0].children !== undefined) flatten(rawData); else flatNodes.push(...rawData);
      flatNodes.sort((a, b) => (b.questions_count || 0) - (a.questions_count || 0) || a.name.localeCompare(b.name));
      setAllNodes(flatNodes);
    } catch (e) { } finally { setLoading(false); }
  };

  const handleNodeSelect = async (node: KPNode) => {
    if (node.level !== 'kp') return; 
    setSelectedNode(node);
    try {
      const [cRes, aRes, qRes] = await Promise.all([
        api.get('/courses/', { params: { kp: node.id } }),
        api.get('/articles/', { params: { kp: node.id } }),
        api.get('/quizzes/questions/', { params: { kp: node.id } })
      ]);
      setNodeDetails({ courses: cRes.data || [], articles: aRes.data.articles || [], questions: qRes.data || [] });
    } catch (e) { }
  };

  const rootOptions = useMemo(() => allNodes.filter(n => n.level === 'sub'), [allNodes]);
  const displayNodes = useMemo(() => {
    if (selectedRootId === 'all') return allNodes;
    const rootId = parseInt(selectedRootId);
    const validIds = new Set<number>([rootId]);
    let added = true;
    while (added) {
      added = false;
      for (const node of allNodes) {
        if (node.parent && validIds.has(node.parent) && !validIds.has(node.id)) {
          validIds.add(node.id);
          added = true;
        }
      }
    }
    return allNodes.filter(n => validIds.has(n.id));
  }, [allNodes, selectedRootId]);

  const listNodes = useMemo(
    () => (isMobile ? allNodes : displayNodes).filter(n => n.level === 'kp' && n.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [allNodes, displayNodes, isMobile, searchQuery]
  );

  return (
    <PageWrapper title="知识地图" subtitle="可视化呈现知识载体间的逻辑脉络与关联结构。">
      <div className={cn("w-full text-left animate-in fade-in duration-700", isMobile ? "space-y-3" : "space-y-6")}>
        {isMobile ? (
          <div className="w-full">
            <Input
              placeholder="搜索知识卡片..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl bg-white border-border shadow-sm h-10 px-4 font-bold"
            />
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3 w-full sm:max-w-xl">
              <Select value={selectedRootId} onValueChange={setSelectedRootId}>
                <SelectTrigger className="w-[220px] h-11 bg-white rounded-2xl font-bold border-border shadow-sm">
                  <GitMerge className="w-4 h-4 mr-2 text-indigo-500" />
                  <SelectValue placeholder="全部分支" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="all" className="font-bold">全部分支</SelectItem>
                  {rootOptions.map(opt => (
                    <SelectItem key={opt.id} value={opt.id.toString()}>
                      {opt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder={viewMode === 'list' ? "搜索考点..." : "关系图模式"}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 rounded-2xl bg-white border-border shadow-sm h-11 px-5 font-bold"
                disabled={viewMode === 'graph'}
              />
            </div>
            <div className="flex bg-muted/30 p-1 rounded-2xl border border-border/50 shrink-0">
              <Button variant={viewMode === 'graph' ? 'secondary' : 'ghost'} onClick={() => setViewMode('graph')} className="rounded-xl h-9 text-xs font-bold px-6">关系图</Button>
              <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => setViewMode('list')} className="rounded-xl h-9 text-xs font-bold px-6">词条表</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className={cn("text-center opacity-20 font-bold uppercase text-[10px] animate-pulse", isMobile ? "py-16" : "py-20")}>Mapping...</div>
        ) : (!isMobile && viewMode === 'graph') ? (
          <KnowledgeGraph nodes={displayNodes} onNodeClick={handleNodeSelect} />
        ) : (
          <div
            className={cn(
              "bg-slate-50/50 border border-border/50",
              isMobile
                ? "rounded-[2rem] grid grid-cols-2 gap-2 p-2 h-[calc(100dvh-15.5rem)] overflow-y-auto content-start min-h-[360px]"
                : "rounded-[3rem] flex flex-wrap gap-2 p-6 content-start min-h-[400px]"
            )}
          >
            {listNodes.map(node => isMobile ? (
              <button
                key={node.id}
                onClick={() => handleNodeSelect(node)}
                className="group flex items-center justify-between bg-white border border-border/50 hover:border-indigo-500/30 hover:shadow-md px-2.5 py-2 rounded-xl cursor-pointer transition-all active:scale-[0.99] text-left min-h-[58px]"
              >
                <span className="text-[12px] font-bold text-slate-700 truncate pr-2 leading-snug">{node.name}</span>
              </button>
            ) : (
              <div key={node.id} onClick={() => handleNodeSelect(node)} className="group flex items-center gap-2 bg-white border border-border/50 hover:border-indigo-500/30 hover:shadow-md px-4 py-2 rounded-xl cursor-pointer transition-all active:scale-95">
                <span className="text-xs font-bold text-slate-700">{node.name}</span>
                {node.questions_count !== undefined && node.questions_count > 0 && (
                  <Badge variant="secondary" className="text-[9px] rounded-full px-1.5 py-0.5 h-4 bg-indigo-50 text-indigo-600 border-none font-black opacity-60 group-hover:opacity-100 transition-opacity">
                    {node.questions_count} 题
                  </Badge>
                )}
              </div>
            ))}
            {listNodes.length === 0 && (
              <div className={cn("w-full text-center text-xs font-bold text-muted-foreground", isMobile ? "col-span-2 py-12" : "py-20")}>
                没有匹配到相关知识点
              </div>
            )}
          </div>
        )}

        <Dialog modal={false} open={!!selectedNode} onOpenChange={open => !open && setSelectedNode(null)}>
          <DialogContent className={cn(
            "sm:max-w-[750px] border-none shadow-2xl text-left overflow-hidden min-h-0 flex flex-col",
            isMobile ? "rounded-[2rem] p-5 max-h-[90vh]" : "rounded-[3rem] p-10 max-h-[85vh]"
          )}>
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2"><Badge className="bg-emerald-500 text-white border-none uppercase text-[9px] font-bold">Knowledge Point</Badge></div>
              <DialogTitle className="text-3xl font-bold tracking-tight">{selectedNode?.name}</DialogTitle>
              <div className="text-sm font-medium text-[#86868B] mt-2 leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{processMathContent(selectedNode?.description || "")}</ReactMarkdown>
              </div>
            </DialogHeader>
            <ScrollArea className="flex-1 min-h-0 mt-8 pr-4">
              <div className="space-y-4 text-left">
                <h5 className="text-[10px] font-bold uppercase tracking-widest text-black/30 flex items-center gap-2"><Target className="w-3.5 h-3.5" /> 关联题目 ({nodeDetails.questions.length})</h5>
                <div className="grid gap-2">{nodeDetails.questions.map(q => (
                  <div key={q.id} onClick={() => setSelectedQuestion(q)} className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-black/[0.01] cursor-pointer hover:bg-slate-100 transition-colors group">
                    <Badge variant="outline" className="text-[8px] py-0 h-4 uppercase">{q.subjective_type || q.q_type}</Badge>
                    <div className="text-xs font-bold text-[#1D1D1F] truncate flex-1"><ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{processMathContent(q.text)}</ReactMarkdown></div>
                    <Maximize2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>))}
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        <KnowledgeTrainingDialog question={selectedQuestion} onClose={() => setSelectedQuestion(null)} />
      </div>
    </PageWrapper>
  );
};
