import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  Pause, 
  Play, 
  RotateCcw, 
  Music, 
  School, 
  BookOpen, 
  MessageCircle, 
  Send, 
  Loader2, 
  X, 
  Brain 
} from 'lucide-react';
import { User } from 'firebase/auth';
import { query, collection, where, orderBy, onSnapshot, addDoc, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, Subject, StudyMusic, Message } from '../types';
import { Card } from '../components/Card';
import { DEFAULT_STUDY_MUSIC } from '../constants';
import { generateMirKoringaLesson, chatInLesson, assignHomework, generateFlashcards } from '../services/openai';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface StudyZoneProps {
  user: User;
  profile: UserProfile | null;
  subjects: Subject[];
}

export const StudyZone = ({ user, profile, subjects }: StudyZoneProps) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [isStudying, setIsStudying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [lessonContent, setLessonContent] = useState('');
  const [isLoadingLesson, setIsLoadingLesson] = useState(false);
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  const [currentMusic, setCurrentMusic] = useState<StudyMusic | null>(null);
  const [userMusics, setUserMusics] = useState<StudyMusic[]>([]);
  const [newMusicTitle, setNewMusicTitle] = useState('');
  const [newMusicUrl, setNewMusicUrl] = useState('');
  
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'musics'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      setUserMusics(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudyMusic)));
    });
  }, [user]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startLesson = async () => {
    if (!selectedSubject || !topic) return;
    
    setIsLoadingLesson(true);
    setIsStudying(true);
    setIsTimerRunning(true);
    setChatMessages([]);

    try {
      const subject = subjects.find(s => s.name === selectedSubject);
      if (subject && (!subject.topics || !subject.topics.includes(topic))) {
        const updatedTopics = [...(subject.topics || []), topic];
        await setDoc(doc(db, 'subjects', subject.id), {
          topics: updatedTopics,
          userId: user.uid,
          name: subject.name,
          createdAt: subject.createdAt || serverTimestamp()
        }, { merge: true });
      }

      const lesson = await generateMirKoringaLesson(selectedSubject, topic, profile?.educationLevel?.toLowerCase());
      setLessonContent(lesson);
      
      await addDoc(collection(db, 'summaries'), {
        userId: user.uid,
        title: `${selectedSubject}: ${topic}`,
        content: lesson,
        sourceText: `Aula gerada pelo Prof. Eng. Mir Koringa sobre ${topic} de ${selectedSubject}`,
        signature: 'Prof. Eng. Mir Koringa',
        createdAt: serverTimestamp()
      });

      const flashcards = await generateFlashcards(topic);
      if (flashcards.length > 0) {
        await addDoc(collection(db, 'decks'), {
          userId: user.uid,
          topic: `${selectedSubject}: ${topic}`,
          cards: flashcards.map((c: any) => ({ ...c, mastered: false })),
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error generating lesson:", error);
    } finally {
      setIsLoadingLesson(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isSendingMessage) return;

    const userMsg: Message = {
      role: 'user',
      content: userInput,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setUserInput('');
    setIsSendingMessage(true);

    try {
      const history = chatMessages.map(m => ({ role: m.role, content: m.content }));
      const aiResponse = await chatInLesson(selectedSubject, topic, lessonContent, userMsg.content, history);
      
      const modelMsg: Message = {
        role: 'model',
        content: aiResponse || 'Desculpe, tive um problema ao processar sua pergunta.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, modelMsg]);
    } catch (error) {
      console.error("Error in lesson chat:", error);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const finishSession = async () => {
    setIsStudying(false);
    setIsTimerRunning(false);
    try {
      const homework = await assignHomework(selectedSubject, topic, profile?.educationLevel?.toLowerCase());
      await addDoc(collection(db, 'tasks'), {
        userId: user.uid,
        subject: selectedSubject,
        topic: topic,
        content: homework,
        status: 'pending',
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error generating homework:", error);
    }
  };

  const addMusic = async () => {
    if (!newMusicTitle || !newMusicUrl) return;
    try {
      await addDoc(collection(db, 'musics'), {
        userId: user.uid,
        title: newMusicTitle,
        url: newMusicUrl,
        createdAt: serverTimestamp()
      });
      setNewMusicTitle('');
      setNewMusicUrl('');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'musics');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto"
    >
      <header className="mb-6 sm:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Zona de Estudo</h2>
          <p className="text-slate-500 mt-1 sm:text-base text-sm">Aulas imersivas com o Prof. Eng. Mir Koringa.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <div className="bg-white px-3 sm:px-6 py-2 sm:py-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 shrink-0">
            <Clock size={18} className="text-indigo-600" />
            <span className="text-lg sm:text-2xl font-mono font-bold text-slate-900">{formatTime(timeLeft)}</span>
            <button 
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className={cn(
                "p-1.5 sm:p-2 rounded-lg transition-colors border-none cursor-pointer",
                isTimerRunning ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
              )}
            >
              {isTimerRunning ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button 
              onClick={() => { setTimeLeft(25 * 60); setIsTimerRunning(false); }}
              className="p-1.5 sm:p-2 bg-slate-100 text-slate-600 rounded-lg border-none cursor-pointer"
            >
              <RotateCcw size={16} />
            </button>
          </div>
          <button 
            onClick={() => setShowMusicPlayer(!showMusicPlayer)}
            className={cn(
              "p-3 sm:p-4 rounded-2xl border transition-all shrink-0 cursor-pointer",
              showMusicPlayer ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"
            )}
          >
            <Music size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6 lg:space-y-8">
          {!isStudying ? (
            <Card className="p-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <School size={32} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Nova Sessão de Aula</h3>
                  <p className="text-slate-500">Defina o tema e comece o seu aprendizado.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Selecione a Disciplina</label>
                  <select 
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setTopic('');
                    }}
                    className="w-full p-4 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione uma disciplina</option>
                    {subjects.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">O que vamos estudar?</label>
                  <div className="space-y-4">
                    <input 
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Ex: Revolução Francesa, Derivadas, Bioquímica..."
                      className="w-full p-4 bg-slate-50 border-slate-200 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                    
                    {selectedSubject && (
                      <div className="flex flex-wrap gap-2">
                        {subjects.find(s => s.name === selectedSubject)?.topics?.map((t, idx) => (
                          <button 
                            key={idx}
                            onClick={() => setTopic(t)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-bold transition-all border cursor-pointer",
                              topic === t 
                                ? "bg-indigo-600 text-white border-indigo-600" 
                                : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"
                            )}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={startLesson}
                  disabled={!selectedSubject || !topic || isLoadingLesson}
                  className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-none cursor-pointer"
                >
                  {isLoadingLesson ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} />}
                  Começar Aula
                </button>
              </div>
            </Card>
          ) : (
            <Card className="p-8">
              <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 truncate max-w-[200px] sm:max-w-md">{topic}</h3>
                    <p className="text-sm text-slate-500">{selectedSubject}</p>
                  </div>
                </div>
                <button 
                  onClick={finishSession}
                  className="bg-emerald-600 text-white px-4 sm:px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100 border-none cursor-pointer text-sm"
                >
                  Concluir
                </button>
              </div>

              {isLoadingLesson ? (
                <div className="py-20 text-center">
                  <Loader2 className="animate-spin text-indigo-600 mx-auto mb-4" size={48} />
                  <p className="text-slate-500 font-medium">O Prof. Eng. Mir Koringa está preparando o conteúdo...</p>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="markdown-body prose prose-slate max-w-none">
                    <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{lessonContent}</Markdown>
                  </div>

                  <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-md">
                        <MessageCircle size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">Conversar com o Tutor</h4>
                        <p className="text-xs text-slate-500">Tire suas dúvidas em tempo real</p>
                      </div>
                    </div>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6 p-2">
                      {chatMessages.map((msg, idx) => (
                        <div key={idx} className={cn(
                          "flex flex-col max-w-[85%]",
                          msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                        )}>
                          <div className={cn(
                            "p-4 rounded-2xl text-sm shadow-sm",
                            msg.role === 'user' ? "bg-indigo-600 text-white rounded-tr-none" : "bg-white text-slate-700 border border-slate-100 rounded-tl-none"
                          )}>
                            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{msg.content}</Markdown>
                          </div>
                        </div>
                      ))}
                      {isSendingMessage && (
                        <div className="flex items-center gap-2 text-slate-400 text-xs italic">
                          <Loader2 size={12} className="animate-spin" /> Digitando...
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="relative">
                      <input
                        type="text"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Pergunte algo sobre a aula..."
                        className="w-full p-4 pr-14 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                      />
                      <button
                        type="submit"
                        disabled={!userInput.trim() || isSendingMessage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors border-none cursor-pointer"
                      >
                        <Send size={20} />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-6 lg:space-y-8">
          {showMusicPlayer && (
            <Card className="p-6 bg-slate-900 text-white border-none shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2">
                  <Music size={20} className="text-indigo-400" /> Ambiente Sonoro
                </h3>
                <button onClick={() => setShowMusicPlayer(false)} className="text-slate-400 hover:text-white border-none bg-transparent cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {currentMusic ? (
                <div className="mb-8">
                  <div className="aspect-video bg-slate-800 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                    {(currentMusic.url.includes('youtube.com') || currentMusic.url.includes('youtu.be')) ? (
                      <iframe 
                        width="100%" 
                        height="100%" 
                        src={`https://www.youtube.com/embed/${currentMusic.url.split('v=')[1]?.split('&')[0] || currentMusic.url.split('/').pop()}?autoplay=1`}
                        title="Music player" 
                        frameBorder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen
                      ></iframe>
                    ) : <Music size={48} className="text-slate-700" />}
                  </div>
                  <p className="font-bold text-center text-sm">{currentMusic.title}</p>
                  <button 
                    onClick={() => setCurrentMusic(null)}
                    className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors border-none cursor-pointer text-white"
                  >
                    Mudar Música
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center text-slate-500 text-xs italic">
                   Selecione uma faixa para focar
                </div>
              )}

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {[...DEFAULT_STUDY_MUSIC, ...userMusics].map((m: any, i) => (
                  <button 
                    key={m.id || i}
                    onClick={() => setCurrentMusic(m)}
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left text-xs border-none cursor-pointer",
                      currentMusic?.url === m.url ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    <Play size={12} />
                    <span className="truncate">{m.title}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Brain size={20} className="text-indigo-600" /> Professor Mir Koringa
            </h3>
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
               <p className="text-sm text-slate-700 leading-relaxed italic">
                 "O conhecimento é a única ferramenta que ninguém pode te tirar. Estude com paixão!"
               </p>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
