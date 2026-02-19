import React, { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { Card } from '@/components/ui/card';
import { BrainCircuit, ChevronRight, ChevronDown, Target, Layers, Network, BookOpen, FileText, Video } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
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
  children?: KPNode[];
  questions_count?: number;
}

const TreeNode: React.FC<{ node: KPNode; level: number; onSelect: (node: KPNode) => void }> = ({ node, level, onSelect }) => {
  const [isOpen, setIsOpen] = useState(level === 0);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col">
      <div 
        className={cn(
          "flex items-center gap-4 p-4 rounded-2xl transition-all group cursor-pointer border border-transparent",
          level === 0 ? "bg-card shadow-sm border-border hover:border-primary/20" : "hover:bg-muted/50"
        )}
        style={{ marginLeft: `${level * 2}rem` }}
      >
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-110",
          level === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )} onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
          {level === 0 ? <Network className="h-4 w-4" /> : <Layers className="h-3.5 w-3.5" />}
        </div>
        
        <div className="flex-1 min-w-0" onClick={() => onSelect(node)}>
          <div className="flex items-center gap-2 text-left">
            <h4 className={cn("font-bold truncate group-hover:text-primary transition-colors", level === 0 ? "text-base" : "text-sm")}>{node.name}</h4>
            {node.questions_count !== undefined && (
              <Badge variant="secondary" className="text-[9px] rounded-full px-2 py-0 h-4">{node.questions_count} 题</Badge>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5 text-left">{node.description}</p>
        </div>

        {hasChildren && (
          <div className="h-6 w-6 rounded-full flex items-center justify-center hover:bg-muted" onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}>
            {isOpen ? <ChevronDown className="h-4 w-4 opacity-30" /> : <ChevronRight className="h-4 w-4 opacity-30" />}
          </div>
        )}
      </div>

      {isOpen && hasChildren && (
        <div className="border-l border-border/50 ml-8 pl-4 my-1 animate-in slide-in-from-left-2 duration-300">
          {node.children?.map(child => <TreeNode key={child.id} node={child} level={level + 1} onSelect={onSelect} />)}
        </div>
      )}
    </div>
  );
};

export const KnowledgeMap: React.FC = () => {
  const [nodes, setNodes] = useState<KPNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<KPNode | null>(null);
  const [nodeDetails, setNodeDetails] = useState<{courses: any[], articles: any[], questions: any[]}>({courses: [], articles: [], questions: []});

  useEffect(() => {
    fetchMap();
  }, []);

  const fetchMap = async () => {
    try {
      const [kpRes, qRes] = await Promise.all([
        api.get('/quizzes/knowledge-points/'),
        api.get('/quizzes/questions/')
      ]);
      const kps = kpRes.data;
      const questions = qRes.data;
      const map: Record<number, KPNode> = {};
      const roots: KPNode[] = [];
      kps.forEach((kp: any) => {
        map[kp.id] = { ...kp, children: [], questions_count: (questions || []).filter((q: any) => q.knowledge_point === kp.id).length };
      });
      kps.forEach((kp: any) => {
        if (kp.parent && map[kp.parent]) map[kp.parent].children?.push(map[kp.id]);
        else roots.push(map[kp.id]);
      });
      setNodes(roots);
    } catch (e) {} finally { setLoading(false); }
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
    } catch (e) {}
  };

  return (
    <PageWrapper title="知识地图" subtitle="可视化呈现知识载体间的逻辑脉络与关联结构。">
      <div className="w-full space-y-8 text-left animate-in fade-in duration-700">
        {loading ? (
          <div className="py-20 text-center opacity-20 font-bold uppercase text-[10px] animate-pulse">Mapping connections...</div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {nodes.map(root => <TreeNode key={root.id} node={root} level={0} onSelect={handleNodeSelect} />)}
          </div>
        )}

        <Dialog open={!!selectedNode} onOpenChange={open => !open && setSelectedNode(null)}>
           <DialogContent className="sm:max-w-[700px] rounded-[3rem] p-10 border-none shadow-2xl text-left overflow-hidden max-h-[85vh] flex flex-col">
              <DialogHeader>
                 <div className="flex items-center gap-3 mb-2"><Badge className="bg-emerald-500 text-white border-none uppercase text-[9px] font-bold">Node Detail</Badge></div>
                 <DialogTitle className="text-3xl font-bold tracking-tight">{selectedNode?.name}</DialogTitle>
                 <p className="text-sm font-medium text-[#86868B] mt-2 leading-relaxed">{selectedNode?.description}</p>
              </DialogHeader>
              <ScrollArea className="flex-1 mt-8 pr-4">
                 <div className="space-y-8 pb-4 text-left">
                    <div className="space-y-4 text-left">
                       <h5 className="text-[10px] font-bold uppercase tracking-widest text-black/30 flex items-center gap-2"><Target className="w-3.5 h-3.5"/> 关联题目 ({nodeDetails.questions.length})</h5>
                       <div className="grid gap-2">{nodeDetails.questions.map(q => (<div key={q.id} className="p-4 bg-slate-50 rounded-2xl flex items-center gap-3 border border-black/[0.01]"><Badge variant="outline" className="text-[8px] py-0 h-4 uppercase">{q.q_type}</Badge><p className="text-xs font-bold text-[#1D1D1F] truncate">{q.text}</p></div>))}</div>
                    </div>
                    <div className="space-y-4 text-left">
                       <h5 className="text-[10px] font-bold uppercase tracking-widest text-black/30 flex items-center gap-2"><BookOpen className="w-3.5 h-3.5"/> 课程资源 ({nodeDetails.courses.length})</h5>
                       <div className="grid gap-2">{nodeDetails.courses.map(c => (<div key={c.id} className="p-4 bg-emerald-50/50 rounded-2xl flex items-center gap-3 border border-emerald-100/20"><Video className="w-3.5 h-3.5 text-emerald-600"/><p className="text-xs font-bold text-emerald-900 truncate">{c.title}</p></div>))}</div>
                    </div>
                    <div className="space-y-4 text-left">
                       <h5 className="text-[10px] font-bold uppercase tracking-widest text-black/30 flex items-center gap-2"><FileText className="w-3.5 h-3.5"/> 参考文章 ({nodeDetails.articles.length})</h5>
                       <div className="grid gap-2">{nodeDetails.articles.map(a => (<div key={a.id} className="p-4 bg-orange-50/50 rounded-2xl flex items-center gap-3 border border-orange-100/20"><FileText className="w-3.5 h-3.5 text-orange-600"/><p className="text-xs font-bold text-orange-900 truncate">{a.title}</p></div>))}</div>
                    </div>
                 </div>
              </ScrollArea>
           </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  );
};
