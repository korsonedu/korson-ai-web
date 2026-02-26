import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Upload, FileUp, RefreshCcw, ChevronDown, ChevronRight, Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';

export const QuestionBankPanel = ({ kpList, onEdit, onDelete }: { kpList: any[], onEdit: (q: any) => void, onDelete: (id: number) => void }) => {
  const [bankSearch, setBankSearch] = useState('');
  const [bankKP, setBankKP] = useState('0');
  const [bankType, setBankType] = useState('all');
  const [bankPage, setBankPage] = useState(1);
  const [bankData, setBankData] = useState<{ total: number, total_pages: number, results: any[] }>({ total: 0, total_pages: 1, results: [] });
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      toast.success(res.data.message || `已同步 ${res.data.total} 道题至服务器`);
    } catch (e) { toast.error('导出失败'); }
  };

  const handleImportCSV = async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      try {
          const res = await api.post('/quizzes/import-csv/', fd);
          toast.success(`成功导入 ${res.data.count} 道题目`);
          fetchBank(1);
      } catch (e: any) {
          toast.error(e.response?.data?.error || "导入失败");
      }
      e.target.value = '';
  };

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white border border-black/[0.03] overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 260px)', minHeight: '600px' }}>
      <div className="p-4 border-b border-black/[0.03] bg-slate-50/50 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-black/40 uppercase tracking-widest">题库浏览</span>
            <span className="text-[11px] font-bold bg-black text-white rounded-full px-2 py-0.5">{bankData.total}</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="h-8 px-3 rounded-xl text-[11px] font-bold border-black/10 gap-1.5">
                <Upload className="w-3 h-3" /> 导入CSV
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleImportCSV} className="hidden" accept=".csv" />
            <Button onClick={handleExport} variant="outline" className="h-8 px-3 rounded-xl text-[11px] font-bold border-black/10 gap-1.5">
                <FileUp className="w-3 h-3" /> 导出AI结构化
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 opacity-30" />
            <Input value={bankSearch} onChange={e => setBankSearch(e.target.value)} placeholder="搜索题干..." className="pl-8 h-8 bg-white border-none rounded-xl font-bold text-xs shadow-sm" />
          </div>
          <Select value={bankKP} onValueChange={setBankKP}>
            <SelectTrigger className="h-8 w-32 rounded-xl bg-white border-none font-bold text-[11px] shadow-sm"><SelectValue placeholder="全部知识点" /></SelectTrigger>
            <SelectContent className="rounded-xl"><SelectItem value="0" className="text-xs">全部知识点</SelectItem>{kpList.map(kp => <SelectItem key={kp.id} value={kp.id.toString()} className="text-xs">{kp.name}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={bankType} onValueChange={setBankType}>
            <SelectTrigger className="h-8 w-24 rounded-xl bg-white border-none font-bold text-[11px] shadow-sm"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl"><SelectItem value="all" className="text-xs">全部题型</SelectItem><SelectItem value="objective" className="text-xs">客观题</SelectItem><SelectItem value="subjective" className="text-xs">主观题</SelectItem></SelectContent>
          </Select>
          <Button onClick={() => fetchBank(bankPage)} variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0">
            <RefreshCcw className={cn('w-3.5 h-3.5 opacity-40', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-1.5">
          {loading && <div className="py-10 text-center text-xs font-bold opacity-20">加载中...</div>}
          {!loading && bankData.results.length === 0 && <div className="py-10 text-center text-xs font-bold opacity-20">暂无题目</div>}
          {bankData.results.map(q => (
            <div key={q.id} className="rounded-2xl bg-[#F5F5F7]/70 hover:bg-[#F5F5F7] transition-colors border border-transparent hover:border-black/[0.04]">
              <div className="p-3 flex items-start gap-3 cursor-pointer" onClick={() => setExpanded(expanded === q.id ? null : q.id)}>
                <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                  <Badge className={cn('text-[11px] py-0 h-4 px-1.5 rounded-md border-none font-bold', q.q_type === 'objective' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700')}>{q.q_type === 'objective' ? '客' : '主'}</Badge>
                  {q.subjective_type && <Badge className="text-[11px] py-0 h-3.5 px-1 rounded-md border-none bg-black/5 text-black/40 font-bold">{q.subjective_type}</Badge>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-[#1D1D1F] leading-relaxed line-clamp-2">{q.text}</p>
                  <p className="text-[11px] font-bold text-black/30 mt-1">{q.knowledge_point_name} · {q.difficulty_level_display} (ELO {q.difficulty})</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button onClick={e => { e.stopPropagation(); onEdit(q); }} variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-white text-blue-600 shadow-sm"><Edit3 className="w-3 h-3" /></Button>
                  <Button onClick={e => { e.stopPropagation(); onDelete(q.id); fetchBank(bankPage); }} variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-white text-red-500 shadow-sm"><Trash2 className="w-3 h-3" /></Button>
                  <div className="h-7 w-7 flex items-center justify-center opacity-30">{expanded === q.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}</div>
                </div>
              </div>
              {expanded === q.id && (
                <div className="px-4 pb-4 space-y-2 border-t border-black/[0.04] mt-0 pt-3">
                  {q.correct_answer && <div><p className="text-[11px] font-bold opacity-30 uppercase tracking-widest mb-1">答案</p><p className="text-[11px] font-medium text-black/70 whitespace-pre-wrap bg-emerald-50/50 rounded-xl p-3">{q.correct_answer}</p></div>}
                  {q.grading_points && <div><p className="text-[11px] font-bold opacity-30 uppercase tracking-widest mb-1">判分点</p><p className="text-[11px] font-medium text-black/70 bg-blue-50/50 rounded-xl p-3">{q.grading_points}</p></div>}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {bankData.total_pages > 1 && (
        <div className="p-3 border-t border-black/[0.03] flex items-center justify-between shrink-0">
          <Button onClick={() => { const p = Math.max(1, bankPage - 1); setBankPage(p); fetchBank(p); }} disabled={bankPage === 1} variant="ghost" className="h-8 px-4 rounded-xl text-xs font-bold">← 上一页</Button>
          <span className="text-[11px] font-bold opacity-40">{bankPage} / {bankData.total_pages}</span>
          <Button onClick={() => { const p = Math.min(bankData.total_pages, bankPage + 1); setBankPage(p); fetchBank(p); }} disabled={bankPage === bankData.total_pages} variant="ghost" className="h-8 px-4 rounded-xl text-xs font-bold">下一页 →</Button>
        </div>
      )}
    </Card>
  );
};
