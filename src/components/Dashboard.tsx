import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';
import { BookOpen, Calendar, Zap, MessageSquare, ArrowRight, CheckSquare, FileText, Coffee, Trophy, User as UserIcon, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '../lib/utils';

interface RankUser {
  id: string;
  name: string;
  xp: number;
  level: number;
}

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({
    disciplines: 0,
    tasks: 0,
    summaries: 0,
  });
  const [rankings, setRankings] = useState<RankUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const dSnap = await getDocs(query(collection(db, 'disciplines'), where('userId', '==', user.uid)));
        const tSnap = await getDocs(query(collection(db, 'tasks'), where('userId', '==', user.uid), where('status', '==', 'pending')));
        const sSnap = await getDocs(query(collection(db, 'summaries'), where('userId', '==', user.uid)));
        
        setStats({
          disciplines: dSnap.size,
          tasks: tSnap.size,
          summaries: sSnap.size,
        });

        // Fetch rankings
        const rSnap = await getDocs(query(collection(db, 'users'), orderBy('xp', 'desc'), limit(5)));
        setRankings(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as RankUser)));
        
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'dashboard_data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const WelcomeCard = () => (
    <div className="bg-[#4F46E5] rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="max-w-lg">
          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-4 inline-block">Benvindo à Nova Era</span>
          <h1 className="text-4xl font-black mb-3 tracking-tighter leading-tight">Olá, {profile?.name}!</h1>
          <p className="text-white/80 mb-8 text-base font-medium leading-relaxed">Você está evoluindo! Continue seus estudos para subir no ranking global.</p>
          <Link 
            to="/estudo" 
            className="inline-flex items-center gap-2 bg-[#F97316] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-secondary/20"
          >
            <Zap size={20} fill="currentColor" />
            Começar a Estudar Agora
          </Link>
        </div>
        
        <div className="flex flex-col justify-center gap-4 bg-white/10 p-8 rounded-[32px] border border-white/10 backdrop-blur-sm">
            <div className="flex justify-between items-end mb-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">XP Diário</p>
              <div className="text-sm font-black text-white">{profile?.dailyXP || 0} / 5000</div>
           </div>
           <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden mb-4">
             <motion.div 
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(((profile?.dailyXP || 0) / 5000) * 100, 100)}%` }}
                transition={{ duration: 1 }}
             />
           </div>

           <div className="flex justify-between items-end mb-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">Nível {profile?.level || 1}</p>
                <div className="text-xl font-black text-secondary">{profile?.xp || 0} XP Total</div>
              </div>
           </div>
           
           <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden border border-white/5">
             <motion.div 
                className="h-full bg-gradient-to-r from-secondary to-orange-400"
                initial={{ width: 0 }}
                animate={{ width: `${((profile?.xp || 0) % 1000) / 10}%` }}
                transition={{ duration: 1 }}
             />
           </div>
           <p className="text-[11px] font-bold text-white/60 text-right uppercase tracking-widest">
             {1000 - ((profile?.xp || 0) % 1000)} XP para o nível {(profile?.level || 1) + 1}
           </p>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
    </div>
  );

  const RankingItem = ({ user, index }: { user: RankUser, index: number }) => (
    <div className={cn(
      "flex items-center gap-4 p-4 rounded-2xl transition-all",
      user.id === profile?.id ? "bg-primary/5 border border-primary/20" : "hover:bg-slate-50"
    )}>
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs",
        index === 0 ? "bg-yellow-400 text-white shadow-lg shadow-yellow-400/20" :
        index === 1 ? "bg-slate-300 text-white" :
        index === 2 ? "bg-amber-600 text-white" : "bg-slate-100 text-slate-400"
      )}>
        {index + 1}
      </div>
      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
        <UserIcon size={18} />
      </div>
      <div className="flex-1">
        <p className="font-bold text-slate-900 text-sm truncate">{user.name}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Lvl {user.level || 1}</p>
      </div>
      <div className="text-right">
        <p className="font-black text-slate-900 text-sm">{user.xp || 0}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">XP</p>
      </div>
    </div>
  );

  const StatCard = ({ icon: Icon, title, value, color, bg }: any) => (
    <div className="card flex items-center gap-5 hover:translate-y-[-4px] transition-all duration-300">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${bg}`}>
        <Icon size={24} className={color} />
      </div>
      <div>
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest leading-none mb-1">{title}</p>
        <p className="text-3xl font-extrabold text-slate-900 tracking-tighter">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-10">
      <WelcomeCard />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={BookOpen} 
          title="Disciplinas" 
          value={stats.disciplines} 
          color="text-primary" 
          bg="bg-primary/10"
        />
        <StatCard 
          icon={CheckSquare} 
          title="Tarefas Pendentes" 
          value={stats.tasks} 
          color="text-secondary" 
          bg="bg-secondary/10"
        />
        <StatCard 
          icon={FileText} 
          title="Resumos Gerados" 
          value={stats.summaries} 
          color="text-accent" 
          bg="bg-accent/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions & Tips */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card bg-white p-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-lg">
                  <Zap size={16} fill="currentColor" />
                </div>
                Ações Rápidas
              </h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistema Inteligente</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              <Link to="/tutor" className="p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200 transition-all group border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <p className="font-bold text-slate-900 text-sm">Tutor Pacavira</p>
                <p className="text-[11px] text-slate-400 mt-1">Tire dúvidas agora</p>
              </Link>
              <Link to="/horario" className="p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200 transition-all group border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary mb-4 group-hover:scale-110 transition-transform">
                  <Calendar size={20} />
                </div>
                <p className="font-bold text-slate-900 text-sm">Ver Horário</p>
                <p className="text-[11px] text-slate-400 mt-1">O que tenho hoje?</p>
              </Link>
              <Link to="/relaxo" className="p-5 bg-slate-50 border border-slate-100 rounded-2xl hover:bg-white hover:shadow-xl hover:shadow-slate-200 transition-all group border-transparent hover:border-slate-100">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-4 group-hover:scale-110 transition-transform">
                  <Coffee size={20} />
                </div>
                <p className="font-bold text-slate-900 text-sm">Zona de Relaxo</p>
                <p className="text-[11px] text-slate-400 mt-1">Treine o cérebro</p>
              </Link>
            </div>
          </div>

          <div className="bg-sidebar rounded-[32px] p-8 text-white relative overflow-hidden border border-white/5 shadow-2xl shadow-sidebar/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center font-black text-xl shadow-lg border border-white/10">P</div>
              <div>
                <p className="text-sm font-black tracking-tight">PACAVIRA</p>
                <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] leading-none mt-1">Sucesso Académico</p>
              </div>
            </div>
            <div className="relative z-10">
              <div className="bg-primary/20 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-white text-lg leading-relaxed font-semibold italic">
                  "{profile?.name}! Notei que tens {stats.tasks} tarefas pendentes. Que tal dedicar 25 minutos hoje para avançar em uma delas com o Prof. Mir Koringa?"
                </p>
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Global Ranking */}
        <div className="lg:col-span-1">
          <div className="card bg-white p-8 h-full">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
                <Trophy size={20} className="text-yellow-500" />
                Top Exploradores
              </h3>
              <Star size={16} className="text-slate-200" fill="currentColor" />
            </div>
            <div className="space-y-4">
              {rankings.map((user, i) => (
                <RankingItem key={user.id} user={user} index={i} />
              ))}
              {rankings.length === 0 && (
                <p className="text-center text-slate-400 py-10 font-medium">Nenhum explorador registado ainda.</p>
              )}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-50">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Atualizado em tempo real</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
