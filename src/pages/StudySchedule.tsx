import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserProfile, Subject } from '../types';
import { Card } from '../components/Card';
import { generateStudySchedule } from '../services/openai';

interface StudyScheduleProps {
  user: User;
  subjects: Subject[];
  profile: UserProfile | null;
}

export const StudySchedule = ({ user, subjects, profile }: StudyScheduleProps) => {
  const [schedule, setSchedule] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolHours, setSchoolHours] = useState('08:00 - 13:00');

  const generateSchedule = async () => {
    if (subjects.length === 0) return;
    setIsLoading(true);
    try {
      const subjectNames = subjects.map(s => s.name);
      const result = await generateStudySchedule(subjectNames, schoolHours);
      setSchedule(result);
      
      await updateDoc(doc(db, 'users', user.uid), {
        studySchedule: result
      });
    } catch (error) {
      console.error("Error generating schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.studySchedule) {
      setSchedule(profile.studySchedule);
    }
  }, [profile]);

  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-6xl mx-auto"
    >
      <header className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Cronograma IA</h2>
          <p className="text-slate-500 mt-2">Organize sua semana de forma inteligente com base nas suas disciplinas.</p>
        </div>
        <button 
          onClick={generateSchedule}
          disabled={isLoading || subjects.length === 0}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2 disabled:opacity-50 border-none cursor-pointer"
        >
          {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Calendar size={20} />}
          Gerar Novo Cronograma
        </button>
      </header>

      <Card className="p-6 mb-8 bg-slate-50 border-slate-200">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h4 className="font-bold text-slate-900 mb-1">Horário de Ocupação Extra</h4>
            <p className="text-sm text-slate-500">Informe o período em que você está ocupado (escola, trabalho, etc).</p>
          </div>
          <input 
            type="text"
            value={schoolHours}
            onChange={(e) => setSchoolHours(e.target.value)}
            placeholder="Ex: 08:00 - 13:00"
            className="w-full md:w-64 p-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
      </Card>

      {schedule ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {days.map((day) => (
            <div key={day} className="space-y-4">
              <div className="text-center py-2 bg-indigo-50 rounded-xl border border-indigo-100">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{day}</span>
              </div>
              <div className="space-y-3">
                {schedule[day]?.map((item: any, idx: number) => (
                  <Card key={idx} className="p-3 border-slate-100 hover:border-indigo-200 transition-colors bg-white">
                    <p className="text-[9px] font-bold text-slate-400 mb-1">{item.time}</p>
                    <p className="text-xs font-bold text-slate-900 leading-tight">{item.activity}</p>
                    {item.subject && (
                      <p className="text-[9px] text-indigo-600 font-bold mt-1 uppercase tracking-tight">{item.subject}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar size={32} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Nenhum cronograma ativo</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">
            Clique no botão de geração para que o Prof. Mir Koringa organize sua semana!
          </p>
        </div>
      )}
    </motion.div>
  );
};
