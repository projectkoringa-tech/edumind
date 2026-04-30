import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, BookOpen, X, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Subject } from '../types';
import { Card } from '../components/Card';

interface SubjectsProps {
  user: User;
  subjects: Subject[];
}

export const Subjects = ({ user, subjects }: SubjectsProps) => {
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTopic, setNewTopic] = useState<{ [key: string]: string }>({});

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isAdding) return;
    setIsAdding(true);
    try {
      await addDoc(collection(db, 'subjects'), {
        userId: user.uid,
        name,
        topics: [],
        createdAt: serverTimestamp()
      });
      setName('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'subjects');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'subjects', id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'subjects');
    }
  };

  const handleAddTopic = async (subjectId: string) => {
    const topicName = newTopic[subjectId]?.trim();
    if (!topicName) return;

    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;

    const updatedTopics = [...(subject.topics || []), topicName];
    
    try {
      await setDoc(doc(db, 'subjects', subjectId), {
        topics: updatedTopics,
        userId: user.uid,
        name: subject.name,
        createdAt: subject.createdAt || serverTimestamp()
      }, { merge: true });
      setNewTopic({ ...newTopic, [subjectId]: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `subjects/${subjectId}`);
    }
  };

  const removeTopic = async (subjectId: string, topicIndex: number) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject || !subject.topics) return;

    const updatedTopics = subject.topics.filter((_, i) => i !== topicIndex);
    
    try {
      await setDoc(doc(db, 'subjects', subjectId), {
        topics: updatedTopics,
        userId: user.uid,
        name: subject.name,
        createdAt: subject.createdAt || serverTimestamp()
      }, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `subjects/${subjectId}`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Minhas Disciplinas</h2>
        <p className="text-slate-500 mt-2">Cadastre as matérias e os temas que você está estudando.</p>
      </header>

      <Card className="p-6 mb-8">
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-4">
          <input 
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da disciplina (ex: Matemática, Física...)"
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            required
          />
          <button 
            type="submit"
            disabled={isAdding}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isAdding ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
            Adicionar Disciplina
          </button>
        </form>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {subjects.map(s => (
          <Card key={s.id} className="p-6 flex flex-col group relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <span className="font-bold text-slate-800 text-lg">{s.name}</span>
              </div>
              <button 
                onClick={() => handleDelete(s.id)}
                className="p-2 text-slate-300 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Temas / Tópicos</h4>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                  {s.topics?.length || 0}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {s.topics?.map((topic, idx) => (
                  <div key={topic + idx} className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-medium group/topic">
                    {topic}
                    <button onClick={() => removeTopic(s.id, idx)} className="hover:text-red-500 transition-colors border-none bg-transparent cursor-pointer">
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {(!s.topics || s.topics.length === 0) && (
                  <p className="text-xs text-slate-400 italic">Nenhum tema adicionado.</p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <input 
                  type="text"
                  value={newTopic[s.id] || ''}
                  onChange={(e) => setNewTopic({ ...newTopic, [s.id]: e.target.value })}
                  placeholder="Novo tema..."
                  className="flex-1 text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg focus:ring-1 focus:ring-indigo-500 outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTopic(s.id)}
                />
                <button 
                  onClick={() => handleAddTopic(s.id)}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
        {subjects.length === 0 && (
          <div className="md:col-span-2 text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
             <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
             <p className="text-slate-400">Você ainda não cadastrou nenhuma disciplina.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
