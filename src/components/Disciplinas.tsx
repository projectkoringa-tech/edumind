import { useState, useEffect, FormEvent } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../App';
import { Discipline } from '../types';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Disciplinas() {
  const { user } = useAuth();
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

  useEffect(() => {
    fetchDisciplines();
  }, [user]);

  async function fetchDisciplines() {
    if (!user) return;
    const path = 'disciplines';
    try {
      const q = query(collection(db, path), where('userId', '==', user.uid));
      const snap = await getDocs(q);
      setDisciplines(snap.docs.map(d => ({ id: d.id, ...d.data() } as Discipline)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!user || !newName.trim()) return;
    const path = 'disciplines';
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        name: newName,
        color: newColor,
        createdAt: serverTimestamp(),
      });
      setNewName('');
      fetchDisciplines();
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, path);
    }
  }

  async function handleDelete(id: string) {
    const path = `disciplines/${id}`;
    try {
      await deleteDoc(doc(db, 'disciplines', id));
      setDeletingId(null);
      fetchDisciplines();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Suas Disciplinas</h1>
          <p className="text-slate-500">Gerencie as matérias que você está estudando.</p>
        </div>
      </div>

      <form onSubmit={handleAdd} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-wrap items-end gap-6">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-2">Nome da Disciplina</label>
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Ex: Matemática, História..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Cor</label>
          <div className="flex gap-2">
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`w-10 h-10 rounded-full border-4 transition-all ${newColor === c ? 'border-indigo-600 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Adicionar
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {disciplines.map((d) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center justify-between group overflow-hidden relative"
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-2" 
                style={{ backgroundColor: d.color }} 
              />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${d.color}20`, color: d.color }}>
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{d.name}</h3>
                  <p className="text-xs text-slate-500">Ativa</p>
                </div>
              </div>
              <div className="flex gap-2">
                {deletingId === d.id ? (
                  <div className="flex gap-2 animate-in fade-in slide-in-from-right-2">
                    <button 
                      onClick={() => setDeletingId(null)}
                      className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded"
                    >
                      Não
                    </button>
                    <button 
                      onClick={() => handleDelete(d.id)}
                      className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded"
                    >
                      Excluir
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeletingId(d.id)}
                    className="text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {disciplines.length === 0 && !loading && (
          <div className="col-span-full py-12 text-center">
            <BookOpen size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-500">Nenhuma disciplina cadastrada.</p>
          </div>
        )}
      </div>
    </div>
  );
}
