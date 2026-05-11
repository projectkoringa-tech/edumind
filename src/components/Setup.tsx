import React, { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db, serverTimestamp, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Save } from 'lucide-react';

const ACADEMIC_LEVELS = [
  'Primário',
  'I Ciclo do Ensino Secundário',
  'II Ciclo do Ensino Secundário',
  'Ensino Superior',
  'Pós-Graduação',
];

const ANGOLA_PROVINCES = [
  'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte', 
  'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Luanda', 'Lunda Norte', 
  'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'
];

export default function Setup() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    age: '',
    academicLevel: ACADEMIC_LEVELS[0],
    country: 'Angola',
    province: '',
    school: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    const path = `users/${user.uid}`;
    try {
      const userData: any = {
        id: user.uid,
        email: user.email,
        ...formData,
        age: Number(formData.age),
        updatedAt: serverTimestamp(),
      };

      // Only set createdAt and initial stats if profile doesn't exist
      if (!profile) {
        userData.createdAt = serverTimestamp();
        userData.xp = 0;
        userData.level = 1;
        userData.dailyXP = 0;
        userData.relaxoXP = 0;
        userData.relaxoLevel = 1;
        userData.streak = 0;
        userData.lastXPDate = new Date().toISOString().split('T')[0];
      }

      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });
      await refreshProfile();
      navigate('/');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl shadow-xl p-8 border border-slate-100"
      >
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Complete seu Perfil</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Idade</label>
            <input
              type="number"
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nível Académico</label>
            <select
              value={formData.academicLevel}
              onChange={(e) => setFormData({ ...formData, academicLevel: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
            >
              {ACADEMIC_LEVELS.map((level) => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">País</label>
              <input
                type="text"
                required
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              />
            </div>

            {formData.country.toLowerCase() === 'angola' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Província</label>
                <select
                  required
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                >
                  <option value="">Selecionar...</option>
                  {ANGOLA_PROVINCES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formData.academicLevel !== 'Primário' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Escola / Instituição</label>
              <input
                type="text"
                required
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Nome da sua escola ou faculdade"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Salvando...' : <><Save size={20} /> Salvar e Continuar</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
