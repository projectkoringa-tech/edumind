import React, { useState } from 'react';
import { motion } from 'motion/react';
import { User as UserIcon, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ANGOLA_PROVINCES, UNIVERSITIES_BY_PROVINCE } from '../constants';

interface ProfileSetupProps {
  user: User;
  onComplete: () => void;
}

export const ProfileSetup = ({ user, onComplete }: ProfileSetupProps) => {
  const [step, setStep] = useState(1);
  const [educationLevel, setEducationLevel] = useState<'primário' | 'secundário' | 'superior'>('primário');
  const [country, setCountry] = useState('Angola');
  const [province, setProvince] = useState('');
  const [university, setUniversity] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        educationLevel,
        country,
        province: country === 'Angola' ? province : null,
        university: (country === 'Angola' && educationLevel === 'superior') ? university : null,
        schedule: {
          segunda: [], terça: [], quarta: [], quinta: [], sexta: []
        }
      });
      onComplete();
    } catch (err) {
      console.error("Error saving profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <UserIcon size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Configurar Perfil</h2>
            <p className="text-sm text-slate-500">Personalize sua experiência de estudo.</p>
          </div>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-700 mb-2 block">Nível de Ensino</span>
                <select 
                  value={educationLevel} 
                  onChange={(e) => setEducationLevel(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="primário">Primário</option>
                  <option value="secundário">Secundário</option>
                  <option value="superior">Superior</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-semibold text-slate-700 mb-2 block">País de Residência</span>
                <input 
                  type="text" 
                  value={country} 
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </label>
              <button 
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all"
              >
                Próximo
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
              {country === 'Angola' && (
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 mb-2 block">Província</span>
                  <select 
                    value={province} 
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Selecione a província</option>
                    {ANGOLA_PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </label>
              )}
              {country === 'Angola' && educationLevel === 'superior' && province && (
                <label className="block">
                  <span className="text-sm font-semibold text-slate-700 mb-2 block">Universidade</span>
                  <select 
                    value={university} 
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="">Selecione a universidade</option>
                    {(UNIVERSITIES_BY_PROVINCE[province] || ["Outra"]).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </label>
              )}
              <div className="flex gap-3">
                <button 
                  onClick={() => setStep(1)}
                  className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Concluir'}
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
