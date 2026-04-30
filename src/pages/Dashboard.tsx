import React from 'react';
import { motion } from 'motion/react';
import { 
  Award, 
  School, 
  Brain, 
  ClipboardList, 
  ChevronRight, 
  MessageSquare, 
  Layers, 
  BookOpen, 
  ArrowRight 
} from 'lucide-react';
import { Card } from '../components/Card';

export const Dashboard = ({ sessions, decks, summaries, tasks, subjects, setActiveTab, profile }: any) => {
  const pendingTasks = tasks.filter((t: any) => t.status === 'pending');
  const totalTopics = subjects?.reduce((acc: number, s: any) => acc + (s.topics?.length || 0), 0) || 0;
  
  // Calculate XP (simple logic: 10 XP per session, 5 XP per flashcard, 5 XP per summary, 20 XP per task, 2 XP per topic)
  const xp = (sessions.length * 10) + (decks.length * 5) + (summaries.length * 5) + (tasks.filter((t: any) => t.status === 'completed').length * 20) + (totalTopics * 2);
  const level = Math.floor(xp / 100) + 1;
  const xpToNextLevel = 100 - (xp % 100);
  const progress = (xp % 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Bem-vindo de volta!</h2>
          <p className="text-slate-500">O que vamos aprender hoje?</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 min-w-[200px]">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <Award size={24} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nível {level}</span>
                <span className="text-xs font-bold text-amber-600">{xp} XP</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-amber-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">{xpToNextLevel} XP para o próximo nível</p>
            </div>
          </div>
          
          <button 
            onClick={() => setActiveTab('study-zone')}
            className="hidden md:flex items-center gap-2 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
          >
            <School size={20} /> Estudar Agora
          </button>
        </div>
      </header>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[400px]">
        {/* Main Action Card */}
        <Card className="md:col-span-2 md:row-span-2 p-8 bg-indigo-600 text-white border-none relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div>
              <div className="p-3 bg-white/20 rounded-xl w-fit mb-6 backdrop-blur-md">
                <Brain size={32} />
              </div>
              <h3 className="text-3xl font-bold mb-4">Zona de Estudo</h3>
              <p className="text-indigo-100 max-w-xs leading-relaxed">
                Inicie uma sessão de estudo personalizada com o Prof. Eng. Mir Koringa.
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('study-zone')}
              className="w-fit bg-white text-indigo-600 px-8 py-4 rounded-2xl font-bold hover:bg-indigo-50 transition-all shadow-xl"
            >
              Começar Aula
            </button>
          </div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-indigo-400/20 rounded-full blur-3xl" />
        </Card>

        {/* Stats Grid */}
        <Card className="p-6 bg-white hover:border-indigo-200 transition-all cursor-pointer group" onClick={() => setActiveTab('tasks')}>
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-all">
                <ClipboardList size={20} />
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900">{pendingTasks.length}</p>
              <p className="text-sm font-medium text-slate-500">Tarefas Pendentes</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
              Ver tarefas <ArrowRight size={12} className="ml-1" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white hover:border-indigo-200 transition-all cursor-pointer group" onClick={() => setActiveTab('tutor')}>
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-slate-900 group-hover:text-white transition-all">
                <MessageSquare size={20} />
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900">{sessions.length}</p>
              <p className="text-sm font-medium text-slate-500">Sessões de Chat</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
              Abrir tutor <ArrowRight size={12} className="ml-1" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white hover:border-indigo-200 transition-all cursor-pointer group" onClick={() => setActiveTab('flashcards')}>
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Layers size={20} />
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900">{decks.length}</p>
              <p className="text-sm font-medium text-slate-500">Decks de Flashcards</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
              Estudar cards <ArrowRight size={12} className="ml-1" />
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-white hover:border-indigo-200 transition-all cursor-pointer group" onClick={() => setActiveTab('subjects')}>
          <div className="flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-slate-50 text-slate-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <BookOpen size={20} />
              </div>
              <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-slate-900">{totalTopics}</p>
              <p className="text-sm font-medium text-slate-500">Conteúdos Registrados</p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-all">
              Ver matérias <ArrowRight size={12} className="ml-1" />
            </div>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
