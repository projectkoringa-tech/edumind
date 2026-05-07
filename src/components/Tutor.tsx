import { useState, useEffect, useRef, FormEvent } from 'react';
import { useAuth } from '../App';
import { chatWithPacavira } from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

import MarkdownRenderer from './MarkdownRenderer';

export default function Tutor() {
  const { profile, user } = useAuth();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: `Olá ${profile?.name}! Eu sou o Pacavira, seu tutor acadêmico. Como posso te ajudar hoje?` }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await chatWithPacavira(messages, userMessage, profile);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Desculpe, tive um erro ao processar sua dúvida." }]);
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
        <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/10">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-widest">Online</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#F8FAFC]">
        {messages.map((msg, i) => (
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
        ))}
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
          placeholder="Pergunta qualquer coisa ao Pacavira..."
          className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-4 focus:ring-primary/10 bg-slate-50 transition-all font-medium text-sm"
        />
        <button
          type="submit"
          className="bg-secondary text-white px-6 rounded-2xl hover:brightness-110 transition-all shadow-xl shadow-secondary/20 flex items-center justify-center"
        >
          <Send size={20} fill="currentColor" />
        </button>
      </form>
    </div>
  );
}
