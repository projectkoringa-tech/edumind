import { useState, useEffect, FormEvent } from 'react';
import { collection, query, where, getDocs, orderBy, updateDoc, doc } from 'firebase/firestore';
import { db, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../App';
import { Task, Discipline } from '../types';
import { CheckSquare, MessageSquare, Send, Check, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";
import MarkdownRenderer from './MarkdownRenderer';

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function Tarefas() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [correcting, setCorrecting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    const path = 'tasks';
    try {
      const dSnap = await getDocs(query(collection(db, 'disciplines'), where('userId', '==', user.uid)));
      const tSnap = await getDocs(query(collection(db, path), where('userId', '==', user.uid), orderBy('createdAt', 'desc')));
      
      setDisciplines(dSnap.docs.map(d => ({ id: d.id, ...d.data() } as Discipline)));
      setTasks(tSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  }

  const handleCorrect = async (task: Task) => {
    if (!answer.trim() || correcting) return;
    setCorrecting(true);
    const path = `tasks/${task.id}`;
    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Você é o Professor Mir Koringa. Corrija o seguinte exercício:
        Exercício: ${task.content}
        Resposta do Aluno: ${answer}
        
        Forneça um feedback construtivo e a resolução correta se necessário.`,
      });

      const correction = response.text;

      await updateDoc(doc(db, 'tasks', task.id), {
        userAnswer: answer,
        correction,
        status: 'completed',
        updatedAt: serverTimestamp()
      });

      setAnswer('');
      setRespondingId(null);
      fetchData();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    } finally {
      setCorrecting(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-3 inline-block">Missões Académicas</span>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Tarefas e Exercícios</h1>
          <p className="text-slate-500 font-medium mt-1">Domina os temas respondendo aos desafios do Prof. Mir Koringa.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm uppercase text-[10px] font-black tracking-widest text-slate-400">
          <span>Total: {tasks.length}</span>
          <div className="w-1 h-1 rounded-full bg-slate-200"></div>
          <span className="text-secondary">Puri: {tasks.filter(t => t.status === 'pending').length}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {tasks.length > 0 ? tasks.map((t) => {
          const discipline = disciplines.find(d => d.id === t.disciplineId);
          return (
            <motion.div
              key={t.id}
              className={cn(
                "card bg-white p-10 hover:translate-y-[-4px] transition-all duration-300",
                t.status === 'completed' ? "border-accent/20" : "border-slate-100"
              )}
            >
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                <div className="flex items-center gap-5">
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl text-white shadow-xl" 
                    style={{ backgroundColor: discipline?.color || '#ccc' }}
                  >
                    {discipline?.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1">{t.theme}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{discipline?.name}</p>
                  </div>
                </div>
                <div className={cn(
                  "px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                  t.status === 'completed' ? "bg-accent/10 text-accent" : "bg-secondary/10 text-secondary"
                )}>
                  {t.status === 'completed' ? 'Concluída ✅' : 'Pendente ⏱️'}
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[24px] mb-8 border border-slate-100 text-slate-700 font-bold italic text-base relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20"></div>
                <MarkdownRenderer content={t.content} />
              </div>

              {t.status === 'pending' ? (
                respondingId === t.id ? (
                  <div className="space-y-6">
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Escreve aqui a tua resposta detalhada..."
                      className="w-full h-40 p-6 rounded-3xl border border-slate-100 outline-none focus:ring-8 focus:ring-primary/5 font-bold text-slate-700 bg-white shadow-inner transition-all"
                    />
                    <div className="flex gap-4">
                       <button
                        onClick={() => handleCorrect(t)}
                        disabled={correcting}
                        className="bg-primary text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 hover:brightness-110 disabled:opacity-50 shadow-xl shadow-primary/20"
                      >
                        {correcting ? <RefreshCcw className="animate-spin" size={18} /> : <><Send size={18} fill="currentColor" /> Submeter Resposta</>}
                      </button>
                      <button
                        onClick={() => setRespondingId(null)}
                        className="bg-slate-50 text-slate-400 px-8 py-5 rounded-2xl font-black hover:bg-slate-100 transition-all uppercase tracking-widest text-[11px]"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setRespondingId(t.id)}
                    className="w-full bg-sidebar text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 hover:brightness-125 transition-all shadow-xl shadow-sidebar/20"
                  >
                    <MessageSquare size={20} fill="currentColor" />
                    Responder Agora
                  </button>
                )
              ) : (
                <div className="space-y-8 pt-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tua Contribuição</p>
                    </div>
                    <p className="text-slate-600 font-bold text-sm px-4">{t.userAnswer}</p>
                  </div>
                  <div className="bg-accent/5 p-8 rounded-[32px] border border-accent/10 relative overflow-hidden">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white shadow-lg">
                          <Check size={16} strokeWidth={4} />
                        </div>
                        <p className="text-[11px] font-black text-accent uppercase tracking-widest">Feedback do Prof. Mir Koringa</p>
                      </div>
                      <div className="text-slate-800 text-base font-semibold leading-relaxed">
                        <MarkdownRenderer content={t.correction} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        }) : (
          <div className="text-center py-32 bg-white rounded-[48px] border-4 border-dashed border-slate-50 flex flex-col items-center">
            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
              <CheckSquare size={48} className="text-slate-200" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Tudo em dia!</h3>
            <p className="text-slate-400 font-medium">Não tens tarefas pendentes de momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
