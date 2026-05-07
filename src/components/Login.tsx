import { useAuth } from '../App';
import { motion } from 'motion/react';
import { LogIn, BookOpen } from 'lucide-react';

export default function Login() {
  const { login, user, loading } = useAuth();

  if (user) return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-screen">Redirecionando...</motion.div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
          <BookOpen size={40} className="text-white" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">EduMind</h1>
        <p className="text-slate-500 mb-8">Sua plataforma de estudo inteligente integrada</p>
        
        <button
          onClick={login}
          disabled={loading}
          className="flex items-center justify-center gap-3 w-full bg-slate-900 text-white font-bold py-4 px-6 rounded-2xl hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-95 shadow-lg"
        >
          <LogIn size={20} />
          Entrar com Google
        </button>
        
        <div className="mt-8 pt-8 border-t border-slate-100 italic text-slate-400 text-sm">
          Aprenda mais rápido com o Pacavira e o Prof. Mir Koringa
        </div>
      </motion.div>
    </div>
  );
}
