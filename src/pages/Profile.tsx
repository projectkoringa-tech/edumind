import React from 'react';
import { motion } from 'motion/react';
import { Award, GraduationCap, LogOut, MapPin, Mail, User as UserIcon, BookOpen } from 'lucide-react';
import { User } from 'firebase/auth';
import { logOut } from '../firebase';
import { UserProfile } from '../types';
import { Card } from '../components/Card';
import { cn } from '../lib/utils';

interface ProfileProps {
  user: User;
  profile: UserProfile | null;
}

export const Profile = ({ user, profile }: ProfileProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto">
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Meu Perfil</h2>
        <p className="text-slate-500 mt-2">Visão geral da sua conta e progresso acadêmico.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10">
        <Card className="p-8 text-center md:col-span-1 border-none shadow-xl shadow-slate-100 bg-white">
          <div className="relative inline-block mb-6">
            <img 
               src={user.photoURL || undefined} 
               alt={user.displayName || 'User'} 
               className="w-32 h-32 rounded-full border-4 border-white shadow-lg mx-auto" 
               referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 border-4 border-white rounded-full"></div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-1">{user.displayName}</h3>
          <div className="flex items-center justify-center gap-1 text-slate-400 text-sm mb-6">
            <Mail size={12} /> {user.email}
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-widest">
            <Award size={14} /> Estudante Verificado
          </div>
        </Card>

        <Card className="p-8 md:col-span-2 border-none shadow-xl shadow-slate-100 bg-white">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <GraduationCap className="text-indigo-600" size={20} /> Detalhes da Formação
            </h4>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full">
              ID: {user.uid.slice(0, 8)}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-8 gap-x-12">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nível de Ensino</p>
              <div className="flex items-center gap-2 text-slate-800 font-bold capitalize">
                <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                {profile?.educationLevel || 'Não informado'}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Localização</p>
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                 <MapPin size={14} className="text-slate-400" />
                 {profile?.country} {profile?.province ? `, ${profile.province}` : ''}
              </div>
            </div>
            {profile?.university && (
              <div className="sm:col-span-2 space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instituição de Ensino</p>
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                    <School size={16} />
                  </div>
                  {profile.university}
                </div>
              </div>
            )}
          </div>

          <div className="mt-12 pt-10 border-t border-slate-50 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-xs text-slate-400 italic">
               Conta criada em {user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}
            </div>
            <button 
              onClick={() => logOut()}
              className="flex items-center gap-2 px-6 py-3 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-all border-none cursor-pointer"
            >
              <LogOut size={18} /> Sair da Conta
            </button>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-20">
         <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
               <BookOpen size={20} />
            </div>
            <div>
               <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">Status</p>
               <p className="text-sm font-bold text-slate-900">Em desenvolvimento</p>
            </div>
         </div>
         {/* More status cards could go here */}
      </div>
    </motion.div>
  );
};

const School = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3 10 5-10 5-10-5Z" />
    <path d="m2 17 10 5 10-5" />
    <path d="m2 12 10 5 10-5" />
  </svg>
);
