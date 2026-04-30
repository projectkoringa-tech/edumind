import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, Send, Loader2, ClipboardList } from 'lucide-react';
import { User } from 'firebase/auth';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Task } from '../types';
import { Card } from '../components/Card';
import { cn } from '../lib/utils';
import { correctTask } from '../services/geminiService';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface TasksProps {
  user: User;
  tasks: Task[];
}

export const Tasks = ({ user, tasks }: TasksProps) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [studentResponse, setStudentResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTaskStatus = async (task: Task) => {
    try {
      await setDoc(doc(db, 'tasks', task.id), {
        status: task.status === 'pending' ? 'completed' : 'pending',
        userId: user.uid,
        subject: task.subject,
        topic: task.topic,
        content: task.content,
        createdAt: task.createdAt || serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `tasks/${task.id}`);
    }
  };

  const submitResponse = async (task: Task) => {
    if (!studentResponse.trim()) return;
    setIsSubmitting(true);
    try {
      const correction = await correctTask(task.content, studentResponse);
      await setDoc(doc(db, 'tasks', task.id), {
        response: studentResponse,
        correction: correction,
        status: 'completed',
        userId: user.uid,
        subject: task.subject,
        topic: task.topic,
        content: task.content,
        createdAt: task.createdAt || serverTimestamp()
      }, { merge: true });
      setStudentResponse('');
      setSelectedTask(null);
    } catch (error) {
      console.error("Error submitting task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto"
    >
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Tarefas e Exercícios</h2>
        <p className="text-slate-500 mt-2">Atividades geradas pelo Prof. Eng. Mir Koringa para reforçar seu aprendizado.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {tasks.map((task) => (
          <Card key={task.id} className={cn(
            "p-6 transition-all",
            task.status === 'completed' ? "bg-slate-50 opacity-75" : "bg-white shadow-sm hover:shadow-md"
          )}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <button 
                  onClick={() => toggleTaskStatus(task)}
                  className={cn(
                    "mt-1 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer",
                    task.status === 'completed' ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 hover:border-indigo-500"
                  )}
                >
                  {task.status === 'completed' && <Check size={14} />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{task.subject}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs text-slate-500">
                      {task.createdAt?.toDate ? new Date(task.createdAt.toDate()).toLocaleDateString() : 'Aguardando...'}
                    </span>
                  </div>
                  <h3 className={cn(
                    "text-lg font-bold text-slate-900 cursor-pointer",
                    task.status === 'completed' && "line-through text-slate-400"
                  )} onClick={() => setSelectedTask(selectedTask?.id === task.id ? null : task)}>
                    {task.topic}
                  </h3>
                  
                  {selectedTask?.id === task.id ? (
                    <div className="mt-4 space-y-6">
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Enunciado</p>
                        <div className="markdown-body prose prose-slate max-w-none">
                          <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{task.content}</Markdown>
                        </div>
                      </div>

                      {!task.response && (
                        <div className="space-y-3">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sua Resposta</p>
                          <textarea
                            value={studentResponse}
                            onChange={(e) => setStudentResponse(e.target.value)}
                            placeholder="Digite sua resposta aqui..."
                            className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none min-h-[150px]"
                          />
                          <button
                            onClick={() => submitResponse(task)}
                            disabled={isSubmitting || !studentResponse.trim()}
                            className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                          >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                            Enviar Resposta para Correção
                          </button>
                        </div>
                      )}

                      {task.response && (
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Sua Resposta</p>
                          <p className="text-slate-700 whitespace-pre-wrap">{task.response}</p>
                        </div>
                      )}

                      {task.correction && (
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2">Correção do Prof. Mir Koringa</p>
                          <div className="markdown-body prose prose-emerald max-w-none">
                            <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{task.correction}</Markdown>
                          </div>
                        </div>
                      )}

                      <button 
                        onClick={() => setSelectedTask(null)}
                        className="text-sm font-bold text-indigo-600 hover:underline border-none bg-transparent cursor-pointer"
                      >
                        Fechar detalhes
                      </button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedTask(task)}
                      className="mt-2 text-xs font-bold text-indigo-600 hover:underline border-none bg-transparent cursor-pointer"
                    >
                      Ver detalhes
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {tasks.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
             <ClipboardList size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400">Nenhuma tarefa pendente no momento.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
