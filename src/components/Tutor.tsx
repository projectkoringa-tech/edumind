import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { chatWithPacavira } from '../services/geminiService';
import { addXP } from '../lib/gamification';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, Trash2, RefreshCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp, deleteDoc, doc, writeBatch } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

import MarkdownRenderer from './MarkdownRenderer';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function Tutor() {
  const { profile, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchChatHistory();
    }
  }, [user]);

  async function fetchChatHistory() {
    if (!user) return;
    const chatPath = 'chats';
    try {
      const q = query(
        collection(db, chatPath),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      const history = snapshot.docs.map(doc => doc.data() as Message);
      
      if (history.length === 0) {
        setMessages([
          { role: 'assistant', content: `Olá ${profile?.name}! Eu sou o Pacavira, seu tutor acadêmico. Como posso te ajudar hoje?` }
        ]);
      } else {
        setMessages(history);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, chatPath);
    } finally {
      setFetchingHistory(false);
    }
  }

  async function saveMessage(role: 'user' | 'assistant', content: string) {
    if (!user) return;
    const chatPath = 'chats';
    try {
      await addDoc(collection(db, chatPath), {
        userId: user.uid,
        role,
        content,
        createdAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, chatPath);
    }
  }

  async function clearHistory() {
    if (!user || messages.length === 0) return;
    if (!confirm('Deseja realmente apagar todo o histórico de conversas?')) return;
    
    const chatPath = 'chats';
    try {
      const q = query(
        collection(db, chatPath),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      setMessages([
        { role: 'assistant', content: `Histórico limpo. Como posso te ajudar agora?` }
      ]);
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, chatPath);
    }
  }

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !user || !profile) return;

    const userMessage = input.trim();
    setInput('');
    
    const updatedMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      // Award XP for interaction
      await addXP(user.uid, 50);

      // Save user message
      await saveMessage('user', userMessage);

      // Get AI response
      const response = await chatWithPacavira(messages, userMessage, profile);
      
      // Save and update assistant message
      await saveMessage('assistant', response);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error: any) {
      console.error(error);
      let errorMsg = "Desculpe, tive um erro ao processar sua dúvida.";
      if (error.message?.includes('503') || error.message?.includes('high demand')) {
        errorMsg = "O sistema de IA está com muita demanda (Erro 503). Por favor, aguarde alguns segundos e tente perguntar novamente.";
      }
      setMessages(prev => [...prev, { role: 'assistant', content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-14rem)] flex flex-col bg-white rounded-[32px] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
      <div className="bg-primary p-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-2xl text-primary shadow-lg">🤖</div>
          <div>
            <h2 className="font-black text-lg tracking-tight leading-none">PACAVIRA</h2>
            <p className="text-[10px] text-white/60 uppercase tracking-[0.2em] font-bold mt-1">Tutor Assistente Virtual</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={clearHistory}
            className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/70 hover:text-white"
            title="Limpar Histórico"
          >
            <Trash2 size={18} />
          </button>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
            <span className="text-[10px] font-bold uppercase tracking-widest">Online</span>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#F8FAFC]">
        {fetchingHistory ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
            <RefreshCcw className="animate-spin" />
            <p className="text-xs font-black uppercase tracking-widest">A carregar histórico...</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "flex flex-col max-w-[85%]",
                msg.role === 'user' ? "ml-auto items-end" : "items-start"
              )}
            >
              <div className={cn(
                "px-5 py-4 rounded-[22px] text-[14px] leading-relaxed font-medium shadow-sm",
                msg.role === 'user' 
                  ? "bg-primary text-white rounded-tr-none shadow-primary/20" 
                  : "bg-white text-slate-800 rounded-tl-none border border-slate-100"
              )}>
                {msg.role === 'assistant' ? (
                  <MarkdownRenderer content={msg.content} />
                ) : (
                  msg.content
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-widest px-1">
                {msg.role === 'user' ? 'Tu' : 'Pacavira'}
              </p>
            </motion.div>
          ))
        )}
        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-[11px] font-bold tracking-widest uppercase p-2">
            <div className="flex gap-1">
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-primary rounded-full"></motion.div>
            </div>
            Pacavira está a pensar...
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100 flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || fetchingHistory}
          placeholder="Pergunta qualquer coisa ao Pacavira..."
          className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-primary/10 bg-slate-50 transition-all font-medium text-sm"
        />
        <button
          type="submit"
          disabled={loading || fetchingHistory || !input.trim()}
          className="bg-secondary text-white px-6 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center disabled:opacity-50"
        >
          <Send size={20} fill="currentColor" />
        </button>
      </form>
    </div>
  );
}
