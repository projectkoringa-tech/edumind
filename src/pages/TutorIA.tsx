import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  MessageSquare, 
  Send, 
  Paperclip, 
  X, 
  Loader2, 
  Brain, 
  BookOpen, 
  ClipboardList 
} from 'lucide-react';
import { User } from 'firebase/auth';
import { doc, addDoc, collection, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { StudySession, Message, UserProfile, Subject } from '../types';
import { askChatGPT, generateLesson, generateExercises, assignHomework, FileData } from '../services/openai'';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface TutorIAProps {
  user: User;
  sessions: StudySession[];
  profile: UserProfile | null;
  subjects: Subject[];
}

export const TutorIA = ({ user, sessions, profile, subjects }: TutorIAProps) => {
  const [activeSession, setActiveSession] = useState<StudySession | null>(null);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.name || '');
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages, isTyping]);

  useEffect(() => {
    if (activeSession) {
      const exists = sessions.find(s => s.id === activeSession.id);
      if (!exists && activeSession.createdAt !== null) {
        setActiveSession(null);
      } else if (exists) {
        if (!isTyping && JSON.stringify(exists.messages) !== JSON.stringify(activeSession.messages)) {
           setActiveSession(exists);
        }
      }
    }
  }, [sessions, activeSession, isTyping]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("O arquivo é muito grande. O limite é 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedFile({
        mimeType: file.type,
        data: base64
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e?: React.FormEvent, customInput?: string) => {
    if (e) e.preventDefault();
    const messageText = customInput || input;
    if ((!messageText.trim() && !selectedFile) || isTyping) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText + (selectedFile ? " [Arquivo enviado]" : ""),
      timestamp: new Date().toISOString()
    };

    if (!customInput) setInput('');
    setIsTyping(true);
    const currentFile = selectedFile;
    setSelectedFile(null);

    let session = activeSession;
    try {
      if (!session) {
        try {
          const docRef = await addDoc(collection(db, 'sessions'), {
            userId: user.uid,
            title: messageText.slice(0, 30) || "Nova conversa",
            messages: [userMessage],
            createdAt: serverTimestamp()
          });
          session = { id: docRef.id, userId: user.uid, title: messageText.slice(0, 30) || "Nova conversa", messages: [userMessage], createdAt: null };
          setActiveSession(session);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'sessions');
          return;
        }
      } else {
        const updatedMessages = [...session.messages, userMessage];
        const sessionRef = doc(db, 'sessions', session.id);
        await setDoc(sessionRef, { 
          messages: updatedMessages,
          userId: user.uid,
          title: session.title,
          createdAt: session.createdAt || serverTimestamp()
        }, { merge: true });
        session = { ...session, messages: updatedMessages };
        setActiveSession(session);
      }

      const aiResponse = await askChatGPT(messageText, session.messages.slice(-6), currentFile || undefined);
      const modelMessage: Message = {
        role: 'model',
        content: aiResponse || 'Desculpe, tive um problema ao processar sua pergunta.',
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...session.messages, modelMessage];
      const sessionRef = doc(db, 'sessions', session.id);
      await setDoc(sessionRef, { 
        messages: finalMessages,
        userId: user.uid,
        title: session.title,
        createdAt: session.createdAt || serverTimestamp()
      }, { merge: true });
      setActiveSession({ ...session, messages: finalMessages });

      if (aiResponse && selectedSubject) {
        const subject = subjects.find(s => s.name === selectedSubject);
        if (subject) {
          const topicMatch = aiResponse.match(/(?:Tema|Tópico|Próximo tema):\s*([^\n.]+)/i);
          if (topicMatch && topicMatch[1]) {
            const suggestedTopic = topicMatch[1].trim();
            if (!subject.topics?.includes(suggestedTopic)) {
              const updatedTopics = [...(subject.topics || []), suggestedTopic];
              await setDoc(doc(db, 'subjects', subject.id), {
                topics: updatedTopics,
                userId: user.uid,
                name: subject.name,
                createdAt: subject.createdAt || serverTimestamp()
              }, { merge: true });
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && (err.message.includes('API key') || err.message.includes('Gemini') || err.message.includes('model'))) {
        const errorMsg: Message = {
          role: 'model',
          content: '⚠️ Erro na IA: Por favor, verifique se a chave da API do Gemini está configurada corretamente.',
          timestamp: new Date().toISOString()
        };
        if (activeSession) {
          setActiveSession({ ...activeSession, messages: [...activeSession.messages, errorMsg] });
        }
      } else {
        const sessionPath = session?.id ? `sessions/${session.id}` : 'sessions';
        handleFirestoreError(err, OperationType.UPDATE, sessionPath);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleAITool = async (tool: 'lesson' | 'exercises' | 'homework') => {
    if (isTyping || !selectedSubject) return;
    setIsTyping(true);
    
    let prompt = "";
    if (tool === 'lesson') prompt = `Gere uma aula completa sobre um tópico importante de ${selectedSubject} para o nível ${profile?.educationLevel}.`;
    if (tool === 'exercises') prompt = `Gere uma lista de exercícios práticos sobre ${selectedSubject} para o nível ${profile?.educationLevel}.`;
    if (tool === 'homework') prompt = `Atribua uma tarefa de casa desafiadora sobre ${selectedSubject} para eu completar.`;

    const userMessage: Message = {
      role: 'user',
      content: prompt,
      timestamp: new Date().toISOString()
    };

    let session = activeSession;
    try {
      if (!session) {
        try {
          const docRef = await addDoc(collection(db, 'sessions'), {
            userId: user.uid,
            title: `${tool.toUpperCase()}: ${selectedSubject}`,
            messages: [userMessage],
            createdAt: serverTimestamp()
          });
          session = { id: docRef.id, userId: user.uid, title: `${tool.toUpperCase()}: ${selectedSubject}`, messages: [userMessage], createdAt: null };
          setActiveSession(session);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, 'sessions');
          return;
        }
      } else {
        const updatedMessages = [...session.messages, userMessage];
        const sessionRef = doc(db, 'sessions', session.id);
        await setDoc(sessionRef, { 
          messages: updatedMessages,
          userId: user.uid,
          title: session.title,
          createdAt: session.createdAt || serverTimestamp()
        }, { merge: true });
        session = { ...session, messages: updatedMessages };
        setActiveSession(session);
      }

      let aiResponse = "";
      if (tool === 'lesson') aiResponse = await generateLesson(selectedSubject, "Tópico Geral", profile?.educationLevel || 'primário');
      if (tool === 'exercises') aiResponse = await generateExercises(selectedSubject, "Tópico Geral", profile?.educationLevel || 'primário');
      if (tool === 'homework') aiResponse = await assignHomework(selectedSubject, "Tópico Geral", profile?.educationLevel || 'primário');

      const modelMessage: Message = {
        role: 'model',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...session.messages, modelMessage];
      const sessionRef = doc(db, 'sessions', session.id);
      await setDoc(sessionRef, { 
        messages: finalMessages,
        userId: user.uid,
        title: session.title,
        createdAt: session.createdAt || serverTimestamp()
      }, { merge: true });
      setActiveSession({ ...session, messages: finalMessages });
    } catch (err) {
      const sessionPath = session?.id ? `sessions/${session.id}` : 'sessions';
      handleFirestoreError(err, OperationType.UPDATE, sessionPath);
    } finally {
      setIsTyping(false);
    }
  };

  const createNewSession = () => {
    setActiveSession(null);
    setInput('');
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'sessions', id));
      if (activeSession?.id === id) setActiveSession(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'sessions');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto"
    >
      {/* Sessions List */}
      <div className="w-full lg:w-80 flex flex-col gap-4">
        <button 
          onClick={createNewSession}
          className="flex items-center justify-center gap-2 w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} /> Nova Conversa
        </button>
        <div className="flex-1 overflow-y-auto space-y-2 pr-2 max-h-[200px] lg:max-h-full">
          {sessions.map((s) => (
            <div 
              key={s.id}
              onClick={() => setActiveSession(s)}
              className={cn(
                "group relative p-4 rounded-2xl cursor-pointer transition-all border",
                activeSession?.id === s.id 
                  ? "bg-white border-indigo-200 shadow-md" 
                  : "bg-white/50 border-transparent hover:bg-white hover:border-slate-200"
              )}
            >
              <p className={cn("text-sm font-semibold truncate pr-6", activeSession?.id === s.id ? "text-indigo-600" : "text-slate-700")}>
                {s.title}
              </p>
              <button 
                onClick={(e) => deleteSession(s.id, e)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className="text-center py-10 opacity-30">
              <MessageSquare size={48} className="mx-auto mb-2" />
              <p className="text-sm">Nenhuma conversa</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col overflow-hidden min-h-[500px]">
        {activeSession ? (
          <>
            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 truncate pr-4">{activeSession.title}</h3>
              <div className="flex gap-2">
                <select 
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg outline-none"
                >
                  {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
                <button onClick={() => handleAITool('lesson')} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                  <BookOpen size={16} />
                </button>
                <button onClick={() => handleAITool('exercises')} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100">
                  <Brain size={16} />
                </button>
              </div>
            </div>
            
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
              {activeSession.messages.map((m, idx) => (
                <div key={idx} className={cn("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl",
                    m.role === 'user' ? "bg-indigo-600 text-white" : "bg-slate-50 text-slate-900 border border-slate-100"
                  )}>
                    <div className="markdown-body">
                      <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{m.content}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-2">
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-6">
            <div className="w-24 h-24 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 mb-4">
              <Brain size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Como posso ajudar?</h3>
              <p className="text-slate-500 max-w-sm mx-auto mt-2 outline-none">Escolha uma matéria e peça uma aula, exercícios ou tire suas dúvidas rapidamente.</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 w-full max-w-md">
              {['Gere uma aula completa', 'Explique o teorema de Pitágoras', 'Exercícios de Química', 'Dúvida em História'].map((hint) => (
                <button 
                  key={hint}
                  onClick={() => handleSendMessage(undefined, hint)}
                  className="px-4 py-2 bg-slate-50 text-slate-600 text-sm rounded-full hover:bg-slate-100 transition-all border border-slate-200"
                >
                  {hint}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-50">
          <div className="relative flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 px-4 focus-within:ring-2 focus-within:ring-indigo-500 transition-all">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-slate-400 hover:text-indigo-600"
            >
              <Paperclip size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept="image/*,application/pdf"
            />
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Digite sua dúvida ou envie um arquivo..."
              className="flex-1 bg-transparent border-none outline-none py-2 text-sm resize-none max-h-32"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={1}
            />
            <button 
              type="submit"
              disabled={isTyping || (!input.trim() && !selectedFile)}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-all"
            >
              <Send size={20} />
            </button>
          </div>
          {selectedFile && (
            <div className="mt-2 inline-flex items-center gap-2 p-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs">
              <Paperclip size={12} /> arquivo selecionado
              <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-indigo-100 rounded-full">
                <X size={12} />
              </button>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
};
