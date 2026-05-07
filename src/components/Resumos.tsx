import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../App';
import { Summary, Discipline } from '../types';
import { FileText, Plus, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

import MarkdownRenderer from './MarkdownRenderer';

export default function Resumos() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    try {
      const dSnap = await getDocs(query(collection(db, 'disciplines'), where('userId', '==', user.uid)));
      const sSnap = await getDocs(query(collection(db, 'summaries'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')));
      
      setDisciplines(dSnap.docs.map(d => ({ id: d.id, ...d.data() } as Discipline)));
      setSummaries(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as Summary)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'summaries');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Meus Resumos</h1>
        <p className="text-slate-500">Todos os seus resumos automáticos e manuais organizados.</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {summaries.length > 0 ? summaries.map((s) => {
          const discipline = disciplines.find(d => d.id === s.disciplineId);
          const isExpanded = expandedId === s.id;

          return (
            <motion.div
              key={s.id}
              layout
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
            >
              <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : s.id)}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: discipline?.color || '#ccc' }} 
                  />
                  <div>
                    <h3 className="font-bold text-slate-900">{s.theme}</h3>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                      {discipline?.name} • {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter",
                    s.source === 'automated' ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600"
                  )}>
                    {s.source === 'automated' ? 'GERADO AUTOMATICAMENTE' : 'MANUAL'}
                  </span>
                  {isExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-6 pb-6"
                  >
                    <div className="pt-4 border-t border-slate-50 text-slate-600 leading-relaxed font-medium text-sm">
                      <MarkdownRenderer content={s.content} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        }) : (
          <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
            <FileText size={64} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500 font-medium">Nenhum resumo encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}
