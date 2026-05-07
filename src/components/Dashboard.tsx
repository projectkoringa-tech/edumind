import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../App';
import { motion } from 'motion/react';
import { BookOpen, Calendar, Zap, MessageSquare, ArrowRight, CheckSquare, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { profile, user } = useAuth();
  const [stats, setStats] = useState({
    disciplines: 0,
    tasks: 0,
    summaries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
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
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'stats');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [user]);

  const WelcomeCard = () => (
    <div className="bg-[#4F46E5] rounded-[32px] p-10 text-white relative overflow-hidden shadow-2xl shadow-primary/20">
      <div className="relative z-10 max-w-lg">
        <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest mb-4 inline-block">Benvindo à Nova Era</span>
        <h1 className="text-4xl font-black mb-3 tracking-tighter leading-tight">Olá, {profile?.name}!</h1>
        <p className="text-white/80 mb-8 text-base font-medium leading-relaxed">Pronto para mais um dia de aprendizado? O Pacavira está aqui para impulsionar seus estudos com tecnologia de última geração.</p>
        <Link 
          to="/estudo" 
          className="inline-flex items-center gap-2 bg-[#F97316] text-white px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-xl shadow-secondary/20"
        >
          <Zap size={20} fill="currentColor" />
          Começar a Estudar Agora
        </Link>
      </div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
      <Zap size={200} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
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
          <div className="grid grid-cols-2 gap-5">
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
          </div>
        </div>

        {/* Dica do Tutor */}
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
            <div className="mt-6 flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Sugerido agora</span>
              <button className="text-xs font-bold text-secondary hover:underline underline-offset-4">Ignorar Dica</button>
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-accent/20 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
