import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './lib/firebase';
import { UserProfile } from './types';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Files, 
  MessageSquare, 
  Zap, 
  CreditCard, 
  FileText, 
  CheckSquare, 
  Info,
  LogOut,
  Menu,
  X,
  User as UserIcon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';

// --- Lazy Load Pages ---
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Setup from './components/Setup';
import Disciplinas from './components/Disciplinas';
import Horario from './components/Horario';
import Material from './components/Material';
import Tutor from './components/Tutor';
import Estudo from './components/Estudo';
import Flashcards from './components/Flashcards';
import Resumos from './components/Resumos';
import Tarefas from './components/Tarefas';
import Sobre from './components/Sobre';

// --- Context ---
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const path = `users/${user.uid}`;
        try {
          const docSnap = await getDoc(doc(db, 'users', user.uid));
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          }
        } catch (e) {
          handleFirestoreError(e, OperationType.GET, path);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) {
      const path = `users/${user.uid}`;
      try {
        const docSnap = await getDoc(doc(db, 'users', user.uid));
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        }
      } catch (e) {
        handleFirestoreError(e, OperationType.GET, path);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

// --- Components ---
function Sidebar() {
  const { logout, profile } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Disciplinas', path: '/disciplinas', icon: BookOpen },
    { name: 'Horário', path: '/horario', icon: Calendar },
    { name: 'Material', path: '/material', icon: Files },
    { name: 'Tutor Pacavira', path: '/tutor', icon: MessageSquare },
    { name: 'Zona de Estudo', path: '/estudo', icon: Zap },
    { name: 'Flashcards', path: '/flashcards', icon: CreditCard },
    { name: 'Resumos', path: '/resumos', icon: FileText },
    { name: 'Tarefas', path: '/tarefas', icon: CheckSquare },
    { name: 'Sobre', path: '/sobre', icon: Info },
  ];

  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-md shadow-md border border-slate-200"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-sidebar text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-2 mb-10 px-2">
            <h1 className="text-2xl font-extrabold tracking-tighter">EduMind</h1>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold text-[14px]",
                  location.pathname === item.path 
                    ? "bg-primary text-white shadow-lg shadow-primary/20" 
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon size={18} />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <div className="flex items-center gap-3 px-3 py-3 mb-6 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-sm font-bold shadow-lg">
                {profile?.name?.charAt(0) || <UserIcon size={18} />}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[13px] font-bold truncate">{profile?.name || 'Estudante'}</p>
                <p className="text-[10px] text-white/50 truncate uppercase tracking-widest leading-none mt-1">{profile?.academicLevel}</p>
              </div>
            </div>
            <button 
              onClick={logout}
              className="flex items-center gap-3 px-4 py-3 w-full text-white/40 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all text-sm font-bold"
            >
              <LogOut size={18} />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  
  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
        <p className="text-slate-500 font-medium animate-pulse">Carregando EduMind...</p>
      </div>
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  
  // If user is logged in but has no profile, redirect to setup
  if (!profile && window.location.pathname !== '/setup') {
    return <Navigate to="/setup" />;
  }
  
  return (
    <div className="min-h-screen bg-bg lg:pl-64">
      <Sidebar />
      <header className="hidden lg:flex h-20 bg-white border-b border-slate-200 items-center justify-between px-10">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Escola Actual</span>
            <span className="text-sm font-bold text-slate-900">{profile?.school || 'Não definida'}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/estudo" className="btn-vibrant flex items-center gap-2">
            <Zap size={18} />
            Iniciar Novo Estudo
          </Link>
        </div>
      </header>
      <main className="p-6 lg:p-10 max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={window.location.pathname}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/setup" element={<PrivateRoute><Setup /></PrivateRoute>} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/disciplinas" element={<PrivateRoute><Disciplinas /></PrivateRoute>} />
          <Route path="/horario" element={<PrivateRoute><Horario /></PrivateRoute>} />
          <Route path="/material" element={<PrivateRoute><Material /></PrivateRoute>} />
          <Route path="/tutor" element={<PrivateRoute><Tutor /></PrivateRoute>} />
          <Route path="/estudo" element={<PrivateRoute><Estudo /></PrivateRoute>} />
          <Route path="/flashcards" element={<PrivateRoute><Flashcards /></PrivateRoute>} />
          <Route path="/resumos" element={<PrivateRoute><Resumos /></PrivateRoute>} />
          <Route path="/tarefas" element={<PrivateRoute><Tarefas /></PrivateRoute>} />
          <Route path="/sobre" element={<PrivateRoute><Sobre /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
