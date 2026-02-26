import React, { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/PageWrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import api from '@/lib/api';

// Modularized Components
import { KnowledgeGraph } from './knowledge-map/KnowledgeGraph';
import type { KPNode } from './knowledge-map/types';
import { NodeDetailDialog, QuestionDetailDialog } from './knowledge-map/MapDialogs';

export const KnowledgeMap: React.FC = () => {
  const [nodes, setNodes] = useState<KPNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<KPNode | null>(null);
  const [nodeDetails, setNodeDetails] = useState<{ courses: any[], articles: any[], questions: any[] }>({ courses: [], articles: [], questions: [] });
  const [searchQuery, setSearchSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list');

  // Question Detail State
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);

  useEffect(() => { fetchMap(); }, []);

  const fetchMap = async () => {
    try {
      const res = await api.get('/quizzes/knowledge-points/');
      const kps = res.data;
      kps.sort((a: any, b: any) => (b.questions_count || 0) - (a.questions_count || 0) || a.name.localeCompare(b.name));
      setNodes(kps);
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
            <Button variant={viewMode === 'list' ? 'secondary' : 'ghost'} onClick={() => setViewMode('list')} className="rounded-xl h-9 text-xs font-bold px-6">词条表</Button>
            <Button variant={viewMode === 'graph' ? 'secondary' : 'ghost'} onClick={() => setViewMode('graph')} className="rounded-xl h-9 text-xs font-bold px-6">关系图</Button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center opacity-20 font-bold uppercase text-[11px] animate-pulse">Mapping connections...</div>
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
                  <Badge variant="secondary" className="text-[11px] rounded-full px-1 py-0 h-3 bg-muted/50 border-none font-black opacity-50 group-hover:opacity-100 transition-opacity">
                    {node.questions_count}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        <NodeDetailDialog 
          node={selectedNode} 
          details={nodeDetails} 
          onClose={() => setSelectedNode(null)} 
          onQuestionClick={setSelectedQuestion} 
        />

        <QuestionDetailDialog 
          question={selectedQuestion} 
          onClose={() => setSelectedQuestion(null)} 
        />
      </div>
    </PageWrapper>
  );
};
