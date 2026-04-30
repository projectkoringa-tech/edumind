import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Brain, 
  User as UserIcon, 
  Mail, 
  Lock, 
  Loader2 
} from 'lucide-react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  updateUserProfile 
} from '../firebase';

export const Auth = () => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthLoading(true);
    try {
      if (authMode === 'signup') {
        await signUpWithEmail(email, password);
        if (displayName) await updateUserProfile(displayName);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    if (isAuthLoading) return;
    setAuthError('');
    setIsAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setAuthError('O popup foi bloqueado pelo navegador. Por favor, permita popups para este site.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        setAuthError('A solicitação de login foi cancelada.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setAuthError('O login foi cancelado ao fechar a janela.');
      } else {
        setAuthError('Erro ao entrar com Google: ' + err.message);
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-3xl shadow-xl border border-slate-100"
      >
        <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-indigo-200">
          <Brain className="text-white" size={40} />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">EduMind AI</h1>
        <p className="text-slate-600 mb-8 text-lg">Sua plataforma de estudo inteligente.</p>

        <form onSubmit={handleAuth} className="space-y-4 mb-6">
          {authMode === 'signup' && (
            <div className="relative">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Nome completo"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
          )}
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              required
            />
          </div>
          {authError && <p className="text-xs text-red-500 text-left px-2">{authError}</p>}
          <button
            type="submit"
            disabled={isAuthLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
          >
            {isAuthLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (authMode === 'login' ? 'Entrar' : 'Criar Conta')}
          </button>
        </form>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">ou</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          onClick={handleGoogleAuth}
          disabled={isAuthLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 py-3 px-6 rounded-xl font-semibold hover:bg-slate-50 transition-all shadow-sm active:scale-95 mb-6 disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" className="w-5 h-5" />
          {isAuthLoading ? <Loader2 className="animate-spin" size={20} /> : 'Entrar com Google'}
        </button>

        <p className="text-sm text-slate-500">
          {authMode === 'login' ? 'Não tem uma conta?' : 'Já tem uma conta?'}
          <button 
            onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
            className="ml-1 font-bold text-indigo-600 hover:underline"
          >
            {authMode === 'login' ? 'Cadastre-se' : 'Faça login'}
          </button>
        </p>
      </motion.div>
    </div>
  );
};
