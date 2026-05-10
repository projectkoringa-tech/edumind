import React, { useState, useEffect, FormEvent } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { ScheduleEntry, Discipline } from '../types';
import { Plus, Clock, Trash } from 'lucide-react';

interface ScheduleColumnProps {
  dayIndex: number;
  schedules: ScheduleEntry[];
  disciplines: Discipline[];
  DAYS: string[];
  handleDelete: (id: string) => void;
  key?: any;
}

const ScheduleColumn = ({ dayIndex, schedules, disciplines, DAYS, handleDelete }: ScheduleColumnProps) => {
  const daySchedules = schedules
    .filter(s => Number(s.dayOfWeek) === dayIndex)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-slate-800 border-b border-slate-200 pb-2">{DAYS[dayIndex]}</h3>
      {daySchedules.length > 0 ? daySchedules.map(s => {
        const discipline = disciplines.find(d => d.id === s.disciplineId);
        return (
          <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-1 relative group">
            <div 
              className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full" 
              style={{ backgroundColor: discipline?.color || '#ccc' }} 
            />
            <p className="font-bold text-sm text-slate-900 truncate">{discipline?.name || 'Disciplina apagada'}</p>
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold uppercase">
              <Clock size={10} />
              {s.startTime} - {s.endTime}
            </div>
            <button 
              onClick={() => handleDelete(s.id)}
              className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash size={14} />
            </button>
          </div>
        );
      }) : (
        <p className="text-xs text-slate-300 italic">Sem aulas</p>
      )}
    </div>
  );
};

export default function Horario() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [formData, setFormData] = useState({
    disciplineId: '',
    dayOfWeek: 1,
    startTime: '08:00',
    endTime: '09:00',
  });

  const DAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    try {
      const dSnap = await getDocs(query(collection(db, 'disciplines'), where('userId', '==', user.uid)));
      const sSnap = await getDocs(query(collection(db, 'schedules'), where('userId', '==', user.uid)));
      
      setDisciplines(dSnap.docs.map(d => ({ id: d.id, ...d.data() } as Discipline)));
      setSchedules(sSnap.docs.map(d => ({ id: d.id, ...d.data() } as ScheduleEntry)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'horario');
    }
  }

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (!user || !formData.disciplineId) return;
    const path = 'schedules';
    try {
      await addDoc(collection(db, path), {
        ...formData,
        userId: user.uid,
      });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }

  async function handleDelete(id: string) {
    const path = `schedules/${id}`;
    try {
      await deleteDoc(doc(db, 'schedules', id));
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Horário Escolar</h1>
        <p className="text-slate-500">Organize sua rotina de aulas semanais.</p>
      </div>

      <form onSubmit={handleAdd} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Disciplina</label>
          <select
            required
            value={formData.disciplineId}
            onChange={(e) => setFormData({ ...formData, disciplineId: e.target.value })}
            className="w-full px-4 py-2 rounded-xl border border-slate-200"
          >
            <option value="">Selecionar...</option>
            {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Dia</label>
          <select
            required
            value={formData.dayOfWeek}
            onChange={(e) => setFormData({ ...formData, dayOfWeek: Number(e.target.value) })}
            className="w-full px-4 py-2 rounded-xl border border-slate-200"
          >
            {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Início</label>
            <input
              type="time"
              required
              value={formData.startTime}
              onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              className="w-full px-2 py-2 rounded-xl border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Fim</label>
            <input
              type="time"
              required
              value={formData.endTime}
              onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              className="w-full px-2 py-2 rounded-xl border border-slate-200"
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Add
        </button>
      </form>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
        {[1, 2, 3, 4, 5, 6, 0].map(day => (
          <ScheduleColumn 
            key={day} 
            dayIndex={day} 
            schedules={schedules} 
            disciplines={disciplines} 
            DAYS={DAYS} 
            handleDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
