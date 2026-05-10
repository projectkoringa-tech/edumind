import { useState, useEffect, FormEvent } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Material as IMaterial, Discipline } from '../types';
import { Files, Plus, Trash2, ExternalLink, Image as ImageIcon, FileText, Link as LinkIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export default function Material() {
  const { user } = useAuth();
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<IMaterial['type']>('link');
  const [newUrl, setNewUrl] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('');

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    try {
      const dSnap = await getDocs(query(collection(db, 'disciplines'), where('userId', '==', user.uid)));
      const mSnap = await getDocs(query(collection(db, 'materials'), where('userId', '==', user.uid)));
      
      setDisciplines(dSnap.docs.map(d => ({ id: d.id, ...d.data() } as Discipline)));
      setMaterials(mSnap.docs.map(d => ({ id: d.id, ...d.data() } as IMaterial)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'materials');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!user || !selectedDiscipline || !newName) return;
    const path = 'materials';
    try {
      await addDoc(collection(db, path), {
        userId: user.uid,
        disciplineId: selectedDiscipline,
        title: newName,
        type: newType,
        url: newUrl,
        createdAt: serverTimestamp(),
      });
      setNewName('');
      setNewUrl('');
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir material?')) return;
    const path = `materials/${id}`;
    try {
      await deleteDoc(doc(db, 'materials', id));
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon size={20} />;
      case 'pdf': return <FileText size={20} />;
      case 'link': return <LinkIcon size={20} />;
      default: return <Files size={20} />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Materiais de Apoio</h1>
        <p className="text-slate-500">Armazene e organize seus links, imagens e referências externas.</p>
      </div>

      <form onSubmit={handleAdd} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Título</label>
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none"
            placeholder="Nome do material"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Disciplina</label>
          <select
            required
            value={selectedDiscipline}
            onChange={(e) => setSelectedDiscipline(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200"
          >
            <option value="">Selecionar...</option>
            {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">URL / Link</label>
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none"
            placeholder="https://..."
          />
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700"
        >
          <Plus size={20} />
          Adicionar
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {materials.map((m) => {
          const discipline = disciplines.find(d => d.id === m.disciplineId);
          return (
            <motion.div
              key={m.id}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-start justify-between group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  {getTypeIcon(m.type)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-1">{m.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: discipline?.color || '#ccc' }} />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{discipline?.name}</span>
                  </div>
                  {m.url && (
                    <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 font-bold hover:underline">
                      Abrir Material <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>
              <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
