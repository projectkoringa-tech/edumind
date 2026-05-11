import { useState, useEffect, useRef } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, deleteDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Discipline } from '../types';
import { generateStudySummary, generateStudyPack } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Play, Square, RefreshCcw, Save, MessageSquare, Volume2, Music, PauseCircle, Trash2, Clock, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

import MarkdownRenderer from './MarkdownRenderer';

interface StudySession {
  id: string;
  userId: string;
  disciplineId: string;
  theme: string;
  content: string;
  baseKnowledge: string;
  timeSpent: number;
  isActive: boolean;
  lastAccessed: any;
  createdAt: any;
}

export default function Estudo() {
  const { user } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [savedSessions, setSavedSessions] = useState<StudySession[]>([]);
  const [selectedDiscipline, setSelectedDiscipline] = useState('');
  const [theme, setTheme] = useState('');
  const [isStudying, setIsStudying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pausing, setPausing] = useState(false);
  
  const [pomodoro, setPomodoro] = useState(25 * 60);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [studyContent, setStudyContent] = useState('');
  
  const [showConfirmFinish, setShowConfirmFinish] = useState(false);
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  
  const [audioUrl, setAudioUrl] = useState('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'); 
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseKnowledge, setBaseKnowledge] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (user) {
      fetchDisciplines();
      fetchSavedSessions();
    }
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

  async function fetchSavedSessions() {
    if (!user) return;
    const path = 'study_sessions';
    try {
      const q = query(
        collection(db, path), 
        where('userId', '==', user.uid),
        orderBy('lastAccessed', 'desc')
      );
      const snap = await getDocs(q);
      setSavedSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudySession)));
    } catch (error) {
      console.error("Error fetching saved sessions:", error);
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
      
      // Create a session in FS immediately to allow pausing
      const sessionPath = 'study_sessions';
      const docRef = await addDoc(collection(db, sessionPath), {
        userId: user?.uid,
        disciplineId: selectedDiscipline,
        theme,
        content,
        baseKnowledge,
        timeSpent: 0,
        isActive: true,
        lastAccessed: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      setCurrentSessionId(docRef.id);
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

  const handleResumeSession = (session: StudySession) => {
    setCurrentSessionId(session.id);
    setSelectedDiscipline(session.disciplineId);
    setTheme(session.theme);
    setStudyContent(session.content);
    setBaseKnowledge(session.baseKnowledge || '');
    // For simplicity, we keep pomodoro as is, but we could subtract session.timeSpent if we wanted
    setIsStudying(true);
    setIsActive(true);
    
    // Update lastAccessed
    if (user) {
      const docRef = doc(db, 'study_sessions', session.id);
      updateDoc(docRef, { lastAccessed: serverTimestamp() });
    }
  };

  const handlePauseAndSave = async () => {
    if (!currentSessionId || !user) return;
    setPausing(true);
    try {
      const docRef = doc(db, 'study_sessions', currentSessionId);
      await updateDoc(docRef, {
        content: studyContent, // In case AI adds anything later or if we allow editing
        isActive: false,
        lastAccessed: serverTimestamp(),
        timeSpent: (25 * 60) - pomodoro // Approximate time spent in THIS "leg"
      });
      setIsStudying(false);
      setIsActive(false);
      setCurrentSessionId(null);
      setTheme('');
      setStudyContent('');
      fetchSavedSessions();
    } catch (e) {
      console.error("Error pausing session:", e);
      setError("Erro ao guardar sessão.");
    } finally {
      setPausing(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Deseja apagar esta sessão guardada?')) return;
    try {
      await deleteDoc(doc(db, 'study_sessions', id));
      setSavedSessions(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error("Error deleting session:", e);
    }
  };

  const handleFinishStudy = async () => {
    setSaving(true);
    setError(null);
    try {
      const discipline = disciplines.find(d => d.id === selectedDiscipline);
      const pack = await generateStudyPack(discipline?.name || '', theme, studyContent);
      
      const batchPromises = [];

      // Save flashcards, summary, tasks... (existing logic)
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

      // Delete the temporary study session since it's "finished" and converted to permanent materials
      if (currentSessionId) {
        batchPromises.push(deleteDoc(doc(db, 'study_sessions', currentSessionId)));
      }

      await Promise.all(batchPromises);

      setIsStudying(false);
      setIsActive(false);
      setCurrentSessionId(null);
      setTheme('');
      setStudyContent('');
      setShowConfirmFinish(false);
      fetchSavedSessions();
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
        <div className="max-w-4xl mx-auto space-y-12 py-12">
          <div className="text-center space-y-4">
            <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Estudo Imersivo 2.0</span>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">Zona de Estudo do Prof. Mir Koringa</h1>
            <p className="text-slate-500 text-lg font-medium max-w-md mx-auto">Prepare-se para uma sessão de estudo imersiva impulsionada por tecnologia inteligente.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* New Study Form */}
            <div className="card text-left p-10 space-y-8">
              <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                <Play size={20} className="text-secondary" fill="currentColor" /> Nova Sessão
              </h2>
              <div className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <RefreshCcw size={20} className="animate-spin-once" />
                      <p className="font-bold">{error}</p>
                    </div>
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

            {/* Saved Sessions */}
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 border-b border-slate-100 pb-4 flex items-center gap-2">
                <Clock size={20} className="text-primary" /> Continuar Estudando
              </h2>
              
              <div className="space-y-4">
                {savedSessions.length === 0 ? (
                  <div className="bg-slate-50 rounded-[32px] p-10 text-center border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold text-sm">Nenhuma sessão pausada encontrada.</p>
                  </div>
                ) : (
                  savedSessions.map((session) => (
                    <div 
                      key={session.id}
                      onClick={() => handleResumeSession(session)}
                      className="group bg-white rounded-[26px] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all cursor-pointer flex items-center gap-5"
                    >
                      <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black group-hover:bg-primary group-hover:text-white transition-all">
                        {disciplines.find(d => d.id === session.disciplineId)?.name.charAt(0) || <BookOpen size={24} />}
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">
                          {disciplines.find(d => d.id === session.disciplineId)?.name}
                        </p>
                        <h3 className="font-black text-slate-900 truncate max-w-[200px] leading-tight text-lg">{session.theme}</h3>
                        <p className="text-[11px] text-slate-400 font-bold mt-1">
                          Acesso: {session.lastAccessed?.toDate ? session.lastAccessed.toDate().toLocaleDateString() : 'Recentemente'}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
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
                  <button 
                    onClick={handlePauseAndSave}
                    disabled={pausing}
                    className="bg-slate-100 text-slate-600 px-6 py-4 rounded-2xl font-black hover:bg-slate-200 transition-all text-xs flex items-center gap-2"
                  >
                    {pausing ? <RefreshCcw className="animate-spin" size={16} /> : <PauseCircle size={16} />}
                    Pausar Sessão
                  </button>

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
            {/* Pomodoro */}
            <div className="card p-10 bg-white flex flex-col items-center">
              <div className="w-32 h-32 rounded-full border-[10px] border-slate-50 border-t-secondary flex flex-col items-center justify-center mb-8 shadow-inner">
                <div className="text-3xl font-black text-slate-900 tabular-nums leading-none mb-1">{formatTime(pomodoro)}</div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Restante</span>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsActive(!isActive)}
                  className={cn(
                    "w-full h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                    isActive ? "bg-sidebar text-white shadow-sidebar/20" : "bg-primary text-white shadow-primary/20"
                  )}
                >
                  {isActive ? <><Square size={20} fill="currentColor" className="mr-2" /> Pausar Timer</> : <><Play size={20} fill="currentColor" className="mr-2" /> Retomar Timer</>}
                </button>
              </div>
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
