import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, addDoc } from 'firebase/firestore';
import { db, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Summary, Discipline } from '../types';
import { FileText, Plus, Search, ChevronDown, ChevronUp, Sparkles, X, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { generateStudySummary } from '../services/geminiService';

import MarkdownRenderer from './MarkdownRenderer';

export default function Resumos() {
  const { user } = useAuth();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // New Summary Form State
  const [showForm, setShowForm] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [theme, setTheme] = useState('');
  const [baseKnowledge, setBaseKnowledge] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleGenerateSummary = async () => {
    if (!selectedDiscipline || !theme) return;
    setIsGenerating(true);
    setError(null);
    try {
      const discipline = disciplines.find(d => d.id === selectedDiscipline);
      const content = await generateStudySummary(discipline?.name || '', theme, baseKnowledge);
      
      const summaryPath = 'summaries';
      await addDoc(collection(db, summaryPath), {
        userId: user?.uid,
        disciplineId: selectedDiscipline,
        theme,
        content,
        source: 'automated',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Clear form and reload data
      setShowForm(false);
      setSelectedDiscipline('');
      setTheme('');
      setBaseKnowledge('');
      await fetchData();
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('503')) {
        setError('Servidor em alta demanda. Tente novamente em segundos.');
      } else {
        setError('Erro ao gerar resumo. Verifique sua conexão.');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Meus Resumos</h1>
          <p className="text-slate-500">Todos os seus resumos automáticos e manuais organizados.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-sm transition-all",
            showForm ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-primary text-white hover:brightness-110 shadow-xl shadow-primary/20"
          )}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'Cancelar' : 'Novo Resumo IA'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white rounded-[32px] p-8 border-2 border-primary/10 shadow-2xl shadow-primary/5 space-y-6"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Sparkles size={20} />
              </div>
              <h2 className="text-xl font-black text-slate-900">Gerar Resumo com IA</h2>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold flex items-center gap-2">
                <RefreshCcw size={14} className="animate-spin-once" />
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Disciplina</label>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => setSelectedDiscipline(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-700 bg-slate-50"
                >
                  <option value="">Escolher disciplina...</option>
                  {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tema Principal</label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: Revolução Industrial..."
                  className="w-full px-5 py-4 rounded-xl border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-700 bg-slate-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conteúdo Base (Opcional)</label>
              <textarea
                value={baseKnowledge}
                onChange={(e) => setBaseKnowledge(e.target.value)}
                placeholder="Cole aqui o texto de um PDF ou anotações para a IA resumir..."
                className="w-full px-5 py-4 rounded-xl border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-700 bg-slate-50 min-h-[120px] resize-none"
              />
            </div>

            <button
              onClick={handleGenerateSummary}
              disabled={isGenerating || !selectedDiscipline || !theme}
              className="w-full bg-primary text-white font-black py-5 rounded-xl hover:brightness-110 transition-all shadow-xl shadow-primary/10 flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCcw className="animate-spin" size={20} />
                  Estilizando o Resumo...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Gerar Resumo Agora
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
