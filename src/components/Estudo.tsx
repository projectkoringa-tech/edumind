import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Discipline } from '../types';
import { generateStudySummary, generateStudyPack } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Play, Square, RefreshCcw, Save, MessageSquare, Volume2, Music } from 'lucide-react';
import { cn } from '../lib/utils';

import MarkdownRenderer from './MarkdownRenderer';

export default function Estudo() {
  const { user } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [theme, setTheme] = useState('');
  const [isStudying, setIsStudying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [pomodoro, setPomodoro] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [studyContent, setStudyContent] = useState('');
  
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  
  const [audioUrl, setAudioUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); // More stable test track
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseKnowledge, setBaseKnowledge] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    fetchDisciplines();
  }, [user]);

  // Audio Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      if (isMusicPlaying) {
        audio.play().catch(e => {
          console.error("Audio play failed:", e);
          setIsMusicPlaying(false);
        });
      } else {
        audio.pause();
      }
    }
  }, [isMusicPlaying]);

  async function fetchDisciplines() {
    if (!user) return;
    const path = 'disciplines';
    try {
      const q = query(collection(db, path), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setDisciplines(snap.docs.map(d => ({ id: d.id, ...d.data() } as Discipline)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  useEffect(() => {
    let interval: any = null;
    if (isActive && pomodoro > 0) {
      interval = setInterval(() => {
        setPomodoro((prev) => prev - 1);
      }, 1000);
    } else if (pomodoro === 0) {
      setIsActive(false);
      alert('Tempo de estudo concluído! Faça uma pausa.');
    }
    return () => clearInterval(interval);
  }, [isActive, pomodoro]);

  const handleStartStudy = async () => {
    if (!selectedDiscipline || !theme) return;
    setLoading(true);
    setError(null);
    try {
      const discipline = disciplines.find(d => d.id === selectedDiscipline);
      const content = await generateStudySummary(discipline?.name || '', theme, baseKnowledge);
      setStudyContent(content);
      setIsStudying(true);
      setIsActive(true);
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('503') || e.message?.includes('high demand')) {
        setError('Os servidores da IA estão com alta demanda no momento. Por favor, tente novamente em alguns segundos.');
      } else {
        setError('Erro ao gerar conteúdo de estudo. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFinishStudy = async () => {
    setSaving(true);
    setError(null);
    try {
      const discipline = disciplines.find(d => d.id === selectedDiscipline);
      const pack = await generateStudyPack(discipline?.name || '', theme, studyContent);
      
      const batchPromises = [];

      // Save flashcards
      for (const fc of pack.flashcards) {
        const path = 'flashcards';
        batchPromises.push(
          addDoc(collection(db, path), {
            userId: user?.uid,
            disciplineId: selectedDiscipline,
            theme,
            question: fc.question,
            answer: fc.answer,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }).catch(error => handleFirestoreError(error, OperationType.WRITE, path))
        );
      }

      // Save summary
      const summaryPath = 'summaries';
      batchPromises.push(
        addDoc(collection(db, summaryPath), {
          userId: user?.uid,
          disciplineId: selectedDiscipline,
          theme,
          content: pack.summary,
          source: 'automated',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }).catch(error => handleFirestoreError(error, OperationType.WRITE, summaryPath))
      );

      // Save tasks
      for (const task of pack.tasks) {
        const taskPath = 'tasks';
        batchPromises.push(
          addDoc(collection(db, taskPath), {
            userId: user?.uid,
            disciplineId: selectedDiscipline,
            theme,
            content: task.content,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }).catch(error => handleFirestoreError(error, OperationType.WRITE, taskPath))
        );
      }

      await Promise.all(batchPromises);

      setIsStudying(false);
      setIsActive(false);
      setTheme('');
      setStudyContent('');
      setShowConfirmFinish(false);
    } catch (error) {
      console.error(error);
      setError('Erro ao processar fim de estudo. Verifique sua conexão.');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-8">
      <audio ref={audioRef} loop src={audioUrl} />
      {!isStudying ? (
        <div className="max-w-2xl mx-auto text-center space-y-8 py-12">
          <div className="space-y-4">
            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Estudo Imersivo 2.0</span>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">Zona de Estudo do Prof. Mir Koringa</h1>
            <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">Prepare-se para uma sessão de estudo imersiva impulsionada por tecnologia inteligente.</p>
          </div>

          <div className="card text-left p-10 space-y-8">
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4">
                  <div className="flex items-center gap-3">
                    <RefreshCcw size={20} className="animate-spin-once" />
                    <p className="font-bold">{error}</p>
                  </div>
                  <button 
                    onClick={handleStartStudy}
                    className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg font-black w-fit hover:bg-red-700 transition-all"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] leading-none">Disciplina Foco</label>
                <select
                  value={selectedDiscipline}
                  onChange={(e) => setSelectedDiscipline(e.target.value)}
                  className="w-full px-6 py-5 rounded-2xl border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-700 bg-slate-50"
                >
                  <option value="">Escolher disciplina...</option>
                  {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] leading-none">Tema específico</label>
                <input
                  type="text"
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ex: Arquitetura de Microserviços..."
                  className="w-full px-6 py-5 rounded-2xl border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-700 bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-black text-slate-400 mb-3 uppercase tracking-[0.2em] leading-none">Base de Conhecimento (Opcional)</label>
                <textarea
                  value={baseKnowledge}
                  onChange={(e) => setBaseKnowledge(e.target.value)}
                  placeholder="Cole aqui textos longos, conteúdos de PDFs ou sites para que o resumo seja focado neles..."
                  className="w-full px-6 py-5 rounded-2xl border border-slate-100 outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-slate-700 bg-slate-50 min-h-[150px] resize-none"
                />
                <p className="text-[10px] text-slate-400 font-medium mt-2 italic">* Cole o texto de PDFs ou Imagens para treinar a IA neste conteúdo específico.</p>
              </div>
            </div>

            <button
              onClick={handleStartStudy}
              disabled={loading || !selectedDiscipline || !theme}
              className="w-full bg-secondary text-white font-black py-6 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center gap-3 disabled:opacity-50 text-base"
            >
              {loading ? <RefreshCcw className="animate-spin" /> : <><Zap size={22} fill="currentColor" /> Começar Estudo Imersivo</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="card min-h-[600px] flex flex-col p-10 bg-white">
              <div className="flex items-center gap-5 mb-10 pb-8 border-b border-slate-100">
                <div className="w-14 h-14 bg-sidebar rounded-2xl flex items-center justify-center font-black text-2xl text-white shadow-xl">
                  {disciplines.find(d => d.id === selectedDiscipline)?.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <span className="text-secondary text-[10px] font-black uppercase tracking-widest mb-1 block">Estudando Agora</span>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none truncate max-w-[300px]">{theme}</h2>
                </div>
                <div className="flex gap-3">
                  {showConfirmExit ? (
                    <div className="flex bg-slate-100 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-right-4">
                      <button 
                        onClick={() => setShowConfirmExit(false)}
                        className="px-4 py-4 text-slate-400 font-bold text-xs hover:bg-slate-200 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => {
                          setIsStudying(false);
                          setIsActive(false);
                          setTheme('');
                          setStudyContent('');
                          setShowConfirmExit(false);
                        }}
                        className="px-6 py-4 bg-red-500 text-white font-black text-xs hover:bg-red-600 transition-all"
                      >
                        Sim, Sair
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowConfirmExit(true)}
                      className="bg-slate-100 text-slate-400 px-6 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all text-xs"
                    >
                      Sair
                    </button>
                  )}

                  {showConfirmFinish ? (
                    <div className="flex bg-accent/10 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-right-4 border border-accent/20">
                      <button 
                        onClick={() => setShowConfirmFinish(false)}
                        className="px-4 py-4 text-accent font-bold text-xs hover:bg-accent/10 transition-all"
                      >
                        Ainda não
                      </button>
                      <button 
                        onClick={handleFinishStudy}
                        disabled={saving}
                        className="px-8 py-4 bg-accent text-white font-black text-xs hover:brightness-110 transition-all disabled:opacity-50"
                      >
                        {saving ? 'A finalizar...' : 'Confirmar e Guardar'}
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowConfirmFinish(true)}
                      disabled={saving}
                      className="bg-accent text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:brightness-110 transition-all shadow-xl shadow-accent/20 disabled:opacity-75"
                    >
                      {saving ? (
                        <>
                          <RefreshCcw className="animate-spin" size={20} />
                          A finalizar...
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          Terminar Estudo
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 text-slate-700 overflow-y-auto pr-6 custom-scrollbar leading-relaxed text-lg font-medium">
                <MarkdownRenderer content={studyContent} />
              </div>
            </div>
          </div>

          {/* Tools Area */}
          <div className="space-y-8">
            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl border border-red-100 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            {/* Pomodoro */}
            <div className="card p-10 bg-white flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-[10px] border-slate-50 border-t-secondary flex flex-col items-center justify-center mb-8 shadow-inner">
                <div className="text-3xl font-black text-slate-900 tabular-nums leading-none mb-1">{formatTime(pomodoro)}</div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Restante</span>
              </div>
              <div className="flex gap-4 mb-8">
                <button 
                  onClick={() => setIsActive(!isActive)}
                  className={cn(
                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                    isActive ? "bg-sidebar text-white shadow-sidebar/20" : "bg-primary text-white shadow-primary/20"
                  )}
                >
                  {isActive ? <Square size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <button 
                  onClick={() => { setPomodoro(25 * 60); setIsActive(false); }}
                  className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all shadow-xl shadow-slate-100"
                >
                  <RefreshCcw size={24} />
                </button>
              </div>

              <button 
                onClick={() => setShowConfirmFinish(true)}
                disabled={saving || showConfirmFinish}
                className="w-full bg-accent/10 text-accent border-2 border-accent/20 font-black py-4 rounded-2xl hover:bg-accent/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCcw className="animate-spin" size={18} />
                ) : (
                  <>
                    <Save size={18} />
                    Terminar Agora e Guardar
                  </>
                )}
              </button>
            </div>

            {/* Study Music */}
            <div 
              onClick={() => setIsMusicPlaying(!isMusicPlaying)}
              className="card p-8 bg-white flex items-center justify-between group cursor-pointer hover:border-primary/20 transition-all"
            >
              <div className="flex gap-4 items-center">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center transition-all", isMusicPlaying ? "bg-secondary text-white animate-pulse" : "bg-slate-100 text-slate-400")}>
                  <Music size={20} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-sm">Som de Foco</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Mix Prof. Mir</p>
                </div>
              </div>
              <button 
                onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg", isMusicPlaying ? "bg-secondary text-white" : "bg-white text-slate-300 border border-slate-100")}
              >
                <Volume2 size={18} />
              </button>
            </div>

            {/* Doubt Box */}
            <div className="bg-primary rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <p className="font-black tracking-tight uppercase text-xs">Tens Alguma Dúvida?</p>
              </div>
              <p className="text-white/70 text-xs font-medium leading-relaxed mb-6">Pergunta ao Tutor Pacavira agora mesmo.</p>
              <input 
                type="text" 
                placeholder="Ex: O que é Microserviço?..."
                className="w-full bg-white/10 px-5 py-4 rounded-xl border border-white/10 outline-none focus:bg-white/20 text-white placeholder:text-white/40 text-sm font-medium transition-all"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
