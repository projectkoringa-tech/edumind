import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, X, Clock, Calendar } from 'lucide-react';
import { User } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Subject } from '../types';
import { Card } from '../components/Card';

interface ScheduleProps {
  user: User;
  profile: UserProfile | null;
  subjects: Subject[];
}

export const Schedule = ({ user, profile, subjects }: ScheduleProps) => {
  const days = ['segunda', 'terça', 'quarta', 'quinta', 'sexta'];
  const [isEditing, setIsEditing] = useState(false);
  const [tempSchedule, setTempSchedule] = useState<any>(profile?.schedule || {});

  const handleAddSlot = (day: string) => {
    const newSlot = { subject: subjects[0]?.name || '', time: '08:00' };
    setTempSchedule({
      ...tempSchedule,
      [day]: [...(tempSchedule[day] || []), newSlot]
    });
  };

  const handleRemoveSlot = (day: string, index: number) => {
    const updated = [...tempSchedule[day]];
    updated.splice(index, 1);
    setTempSchedule({ ...tempSchedule, [day]: updated });
  };

  const handleUpdateSlot = (day: string, index: number, field: string, value: string) => {
    const updated = [...tempSchedule[day]];
    updated[index] = { ...updated[index], [field]: value };
    setTempSchedule({ ...tempSchedule, [day]: updated });
  };

  const saveSchedule = async () => {
    try {
      await updateDoc(doc(db, 'users', user.uid), { schedule: tempSchedule });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto">
      <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Cronograma de Estudos</h2>
          <p className="text-slate-500 mt-2">Personalize sua rotina semanal para um melhor desempenho.</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => { setIsEditing(true); setTempSchedule(profile?.schedule || {}); }}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all border-none cursor-pointer flex items-center gap-2"
          >
            <Calendar size={18} /> Editar Horário
          </button>
        ) : (
          <div className="flex gap-3">
            <button 
              onClick={() => setIsEditing(false)}
              className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all border-none cursor-pointer"
            >
              Cancelar
            </button>
            <button 
              onClick={saveSchedule}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all border-none cursor-pointer"
            >
              Salvar Alterações
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        {days.map(day => (
          <div key={day} className="space-y-4">
            <div className="bg-white border border-slate-200 text-slate-900 p-3 rounded-2xl text-center font-bold capitalize shadow-sm">
              {day}
            </div>
            <div className="space-y-3">
              {(isEditing ? tempSchedule[day] : profile?.schedule?.[day])?.map((slot: any, idx: number) => (
                <Card key={idx} className="p-4 relative group hover:border-indigo-200 transition-all">
                  {isEditing ? (
                    <div className="space-y-2">
                      <select 
                        value={slot.subject} 
                        onChange={(e) => handleUpdateSlot(day, idx, 'subject', e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg outline-none"
                      >
                        {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        {subjects.length === 0 && <option value="">Nenhuma disciplina</option>}
                      </select>
                      <input 
                        type="time" 
                        value={slot.time}
                        onChange={(e) => handleUpdateSlot(day, idx, 'time', e.target.value)}
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg outline-none"
                      />
                      <button 
                        onClick={() => handleRemoveSlot(day, idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md border-none cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-2 h-2 bg-indigo-500 rounded-full mb-2"></div>
                      <p className="font-bold text-slate-800 text-sm leading-tight">{slot.subject}</p>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider">
                        <Clock size={10} />
                        {slot.time}
                      </div>
                    </div>
                  )}
                </Card>
              ))}
              {isEditing && (
                <button 
                  onClick={() => handleAddSlot(day)}
                  className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all flex items-center justify-center gap-2 bg-transparent cursor-pointer"
                >
                  <Plus size={16} /> Adicionar
                </button>
              )}
              {(!isEditing && (!profile?.schedule?.[day] || profile.schedule[day].length === 0)) && (
                <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-[10px] text-slate-400 italic">Vago</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
