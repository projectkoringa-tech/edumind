import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Coffee, Brain, Calculator, Grid, RefreshCw, Trophy, ArrowLeft, Timer, 
  Flame, Zap, Bike, ChevronRight, User, Star, Target, Sparkles, Rocket,
  BookOpen, PlayCircle, Lock, X, MousePointer2, Type, Layers, Palette, Hash
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { generateStudyQuiz } from '../services/geminiService';
import { addRelaxoXP } from '../lib/gamification';

// --- Types ---
interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

// --- Immersive Portal ---

const PortalEntrance = ({ onFinish }: { onFinish: () => void }) => {
  return (
    <motion.div 
      className="fixed inset-0 z-[100] bg-slate-950 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
    >
      {/* Hyperdrive stars */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full"
          initial={{ 
            x: Math.random() * window.innerWidth - window.innerWidth/2, 
            y: Math.random() * window.innerHeight - window.innerHeight/2,
            z: 0,
            width: 2,
            height: 2,
            opacity: 0
          }}
          animate={{ 
            z: 1000,
            opacity: [0, 1, 0],
            scale: [1, 2, 0]
          }}
          transition={{ 
            duration: 1 + Math.random() * 2, 
            repeat: Infinity,
            delay: Math.random() * 2 
          }}
          style={{
            boxShadow: '0 0 10px #fff'
          }}
        />
      ))}

      <motion.div 
        className="relative z-10 text-center space-y-8"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <div className="relative inline-block">
          <motion.div 
            className="absolute inset-0 bg-primary/30 blur-[100px] rounded-full"
            animate={{ scale: [1, 1.5, 1], rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <div className="relative bg-slate-900 border-2 border-primary/50 w-32 h-32 rounded-[40px] flex items-center justify-center mx-auto shadow-2xl shadow-primary/20 mb-8">
            <Sparkles size={60} className="text-primary" />
          </div>
        </div>
        
        <div className="space-y-4">
          <motion.h1 
            className="text-6xl font-black text-white tracking-tighter"
            initial={{ y: 20 }}
            animate={{ y: 0 }}
          >
            ZONA DE <span className="text-primary">RELAXO</span>
          </motion.h1>
          <p className="text-primary/60 font-bold uppercase tracking-[0.4em] text-xs">Entrando em outra dimensão...</p>
        </div>

        <motion.button
          onClick={onFinish}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-primary text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-primary/20 mt-12 text-lg flex items-center gap-3 mx-auto"
        >
          <Rocket size={24} /> VAMOS LÁ
        </motion.button>
      </motion.div>

      {/* Pulsing light rings */}
      <motion.div 
        className="absolute w-[800px] h-[800px] border border-primary/10 rounded-full"
        animate={{ scale: [0.5, 2], opacity: [0, 0.5, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      <motion.div 
        className="absolute w-[800px] h-[800px] border border-secondary/10 rounded-full"
        animate={{ scale: [0.3, 1.8], opacity: [0, 0.3, 0] }}
        transition={{ duration: 4, repeat: Infinity, delay: 1 }}
      />
    </motion.div>
  );
};

// --- Games ---

const MathDash = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const [problem, setProblem] = useState({ q: '', a: 0 });
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'end'>('idle');

  const generateProblem = useCallback(() => {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let q = '', ans = 0;
    
    switch(op) {
      case '+': q = `${a} + ${b}`; ans = a + b; break;
      case '-': q = `${a + b} - ${a}`; ans = b; break;
      case '*': q = `${Math.floor(Math.random() * 10) + 1} × ${Math.floor(Math.random() * 10) + 1}`; 
                 const parts = q.split(' × '); ans = parseInt(parts[0]) * parseInt(parts[2]); break;
    }
    setProblem({ q, a: ans });
    setInput('');
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('end');
      onWin(score * 15);
    }
  }, [timeLeft, gameState, score, onWin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parseInt(input) === problem.a) {
      setScore(s => s + 1);
      generateProblem();
    } else {
      setInput('');
    }
  };

  if (gameState === 'idle') return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 text-center">
      <div className="w-24 h-24 bg-accent text-white rounded-[32px] flex items-center justify-center shadow-xl shadow-accent/30 lowercase font-black text-4xl">±</div>
      <div className="space-y-2">
        <h2 className="text-3xl font-black text-white px-4">Sprint Numérico</h2>
        <p className="text-slate-500 font-medium max-w-xs mx-auto">Resolva o máximo de contas em 30 segundos!</p>
      </div>
      <button onClick={() => { setGameState('playing'); generateProblem(); setTimeLeft(30); setScore(0); }} className="bg-accent text-white px-12 py-5 rounded-2xl font-black text-xl shadow-xl shadow-accent/20">INICIAR SPRINT</button>
      <button onClick={onBack} className="text-slate-600 font-bold uppercase tracking-widest text-xs">Desistir</button>
    </div>
  );

  if (gameState === 'end') return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 text-center p-10">
      <Trophy size={60} className="text-yellow-400" />
      <div className="space-y-2">
        <h3 className="text-4xl font-black text-white italic">FIM DE TEMPO!</h3>
        <p className="text-slate-500 font-bold uppercase tracking-widest">Calculou {score} fórmulas corretamente</p>
      </div>
      <div className="bg-slate-950 p-8 rounded-[32px] border border-slate-800 w-full">
        <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1">XP Conquistado</p>
        <p className="text-5xl font-black text-accent">+{score * 15}</p>
      </div>
      <button onClick={() => setGameState('idle')} className="bg-accent text-white w-full py-5 rounded-2xl font-black text-lg">Tentar Novamente</button>
      <button onClick={onBack} className="text-slate-600 font-bold text-sm uppercase tracking-widest">Sair</button>
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-12">
      <div className="flex justify-between items-center bg-slate-950 p-6 rounded-[32px]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-accent/20 text-accent rounded-xl flex items-center justify-center font-black">Lvl</div>
          <p className="font-black text-2xl text-white">Score: {score}</p>
        </div>
        <div className={cn("text-2xl font-black px-6 py-2 rounded-full border-2", timeLeft < 10 ? "text-red-500 border-red-500/50 animate-pulse" : "text-white border-white/10")}>
          {timeLeft}s
        </div>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        <motion.div 
          key={problem.q}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-7xl font-black text-white tracking-tighter"
        >
          {problem.q} = ?
        </motion.div>
        
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <input 
            autoFocus
            type="number"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full bg-slate-950 border-4 border-slate-800 rounded-[32px] p-8 text-5xl font-black text-center text-white focus:border-accent focus:outline-none transition-all"
            placeholder="0"
          />
        </form>
      </div>
    </div>
  );
};

const ReactionGame = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const [state, setState] = useState<'idle' | 'wait' | 'ready' | 'result'>('idle');
  const [startTime, setStartTime] = useState(0);
  const [reactionTime, setReactionTime] = useState(0);
  const timeoutRef = useRef<any>(null);

  const startTest = () => {
    setState('wait');
    const delay = 1000 + Math.random() * 4000;
    timeoutRef.current = setTimeout(() => {
      setState('ready');
      setStartTime(Date.now());
    }, delay);
  };

  const handleClick = () => {
    if (state === 'wait') {
      clearTimeout(timeoutRef.current);
      alert('Cedo demais! Pressione apenas quando ficar VERDE.');
      setState('idle');
    } else if (state === 'ready') {
      const diff = Date.now() - startTime;
      setReactionTime(diff);
      setState('result');
      onWin(diff < 200 ? 300 : diff < 300 ? 150 : 50);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-950/50 rounded-[48px] border border-white/5 relative overflow-hidden">
      {state === 'idle' && (
        <div className="text-center space-y-8">
          <div className="w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-red-500/20">
            <Target size={48} />
          </div>
          <div className="space-y-4">
            <h3 className="text-3xl font-black text-white">Reflexo Puro</h3>
            <p className="text-slate-500 font-medium">Clique assim que a tela ficar VERDE!</p>
          </div>
          <button onClick={startTest} className="bg-white text-slate-950 px-12 py-5 rounded-2xl font-black text-xl">ESTOU PRONTO</button>
          <button onClick={onBack} className="block mx-auto text-slate-700 font-bold uppercase tracking-widest text-[10px]">Voltar</button>
        </div>
      )}

      {state === 'wait' && (
        <div onClick={handleClick} className="absolute inset-0 bg-red-600/20 backdrop-blur-3xl flex items-center justify-center cursor-pointer transition-colors duration-200">
           <h2 className="text-4xl font-black text-red-500 animate-pulse tracking-widest">ESPERE...</h2>
        </div>
      )}

      {state === 'ready' && (
        <div onClick={handleClick} className="absolute inset-0 bg-green-500 flex items-center justify-center cursor-pointer">
           <h2 className="text-6xl font-black text-white animate-bounce tracking-widest">CLIQUE AGORA!</h2>
        </div>
      )}

      {state === 'result' && (
        <div className="text-center space-y-8">
          <div className="text-9xl font-black text-white tracking-tighter mb-4">{reactionTime}ms</div>
          <p className="text-xl font-bold text-slate-400 italic">
            {reactionTime < 200 ? "Você é um Ninja! 🥷" : reactionTime < 300 ? "Boa velocidade! ⚡" : "Nada mal, mas pode melhorar! 🐢"}
          </p>
          <div className="flex flex-col gap-4">
            <button onClick={startTest} className="bg-white text-slate-950 px-12 py-5 rounded-2xl font-black text-xl">TENTAR DE NOVO</button>
            <button onClick={() => setState('idle')} className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Ver Ranking</button>
            <button onClick={onBack} className="text-slate-700 font-bold uppercase tracking-widest text-[10px]">Sair</button>
          </div>
        </div>
      )}
    </div>
  );
};

const SimonGame = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerSeq, setPlayerSeq] = useState<number[]>([]);
  const [activeBtn, setActiveBtn] = useState<number | null>(null);
  const [isShowing, setIsShowing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'playing' | 'lost'>('idle');

  const buttons = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500'];

  const playSequence = async (seq: number[]) => {
    setIsShowing(true);
    for (const id of seq) {
      setActiveBtn(id);
      await new Promise(r => setTimeout(r, 600));
      setActiveBtn(null);
      await new Promise(r => setTimeout(r, 200));
    }
    setIsShowing(false);
  };

  const nextRound = () => {
    const next = Math.floor(Math.random() * 4);
    const newSeq = [...sequence, next];
    setSequence(newSeq);
    setPlayerSeq([]);
    playSequence(newSeq);
  };

  const handleBtnClick = (id: number) => {
    if (isShowing || status !== 'playing') return;
    
    setActiveBtn(id);
    setTimeout(() => setActiveBtn(null), 300);

    if (id === sequence[playerSeq.length]) {
      const nextPlayerSeq = [...playerSeq, id];
      if (nextPlayerSeq.length === sequence.length) {
        setPlayerSeq([]);
        setTimeout(nextRound, 800);
      } else {
        setPlayerSeq(nextPlayerSeq);
      }
    } else {
      setStatus('lost');
      onWin(sequence.length * 20);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-slate-950/30 rounded-[48px] border border-white/5">
       <div className="mb-12 text-center">
         <h2 className="text-3xl font-black text-white">Sequência Zen</h2>
         <p className="text-slate-500 font-medium">Repita o padrão perfeitamente</p>
         <div className="mt-4 bg-white/5 py-2 px-6 rounded-full inline-block border border-white/5">
            <span className="text-secondary font-black">Score: {sequence.length}</span>
         </div>
       </div>

       <div className="grid grid-cols-2 gap-4 w-64 h-64">
          {buttons.map((color, i) => (
            <motion.button
              key={i}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleBtnClick(i)}
              className={cn(
                "rounded-[32px] transition-all duration-300 shadow-2xl",
                color,
                activeBtn === i ? "brightness-150 scale-105 shadow-current/50 ring-4 ring-white/50" : "opacity-40 brightness-50"
              )}
            />
          ))}
       </div>

       <div className="mt-12 w-full">
          {status === 'idle' && (
            <button onClick={() => { setStatus('playing'); nextRound(); }} className="w-full bg-white text-slate-950 py-5 rounded-2xl font-black text-lg">COMEÇAR MEDITAÇÃO</button>
          )}
          {status === 'lost' && (
            <div className="space-y-4">
              <p className="text-red-500 font-black text-center">SEQUÊNCIA QUEBRADA!</p>
              <button onClick={() => { setStatus('idle'); setSequence([]); }} className="w-full bg-slate-800 text-white py-5 rounded-2xl font-black text-lg">Tentar de Novo</button>
            </div>
          )}
          <button onClick={onBack} className="block w-full mt-4 text-slate-700 font-bold uppercase tracking-widest text-xs">Sair do Mundo</button>
       </div>
    </div>
  );
};

const MemoryGame = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const [cards, setCards] = useState<number[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);

  const initGame = useCallback(() => {
    const nums = Array.from({ length: 8 }, (_, i) => i + 1);
    const pairs = [...nums, ...nums].sort(() => Math.random() - 0.5);
    setCards(pairs);
    setFlipped([]);
    setSolved([]);
    setMoves(0);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  const handleCardClick = (index: number) => {
    if (flipped.length === 2 || flipped.includes(index) || solved.includes(index)) return;

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [first, second] = newFlipped;
      if (cards[first] === cards[second]) {
        setSolved(s => [...s, first, second]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  useEffect(() => {
    if (solved.length === cards.length && cards.length > 0) {
      onWin(200); // 200 XP for memory game
    }
  }, [solved, cards, onWin]);

  const isWon = solved.length === cards.length && cards.length > 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-all text-white/50 hover:text-white"><ArrowLeft /></button>
        <div className="text-center">
          <h2 className="text-xl font-black text-white leading-tight">Mente Blindada</h2>
          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Treine sua retenção visual</p>
        </div>
        <div className="w-10" />
      </div>

      <div className="grid grid-cols-4 gap-4 max-w-sm mx-auto">
        {cards.map((num, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleCardClick(i)}
            className={cn(
              "aspect-square rounded-2xl flex items-center justify-center text-2xl font-black cursor-pointer transition-all duration-500 preserve-3d shadow-sm",
              flipped.includes(i) || solved.includes(i) 
                ? "bg-primary text-white rotate-y-180" 
                : "bg-slate-800 border-2 border-slate-700 text-transparent"
            )}
          >
            {(flipped.includes(i) || solved.includes(i)) && num}
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-8 items-center pt-4">
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Jogadas</p>
          <p className="text-2xl font-black text-white">{moves}</p>
        </div>
        <button onClick={initGame} className="bg-primary/20 text-primary border border-primary/30 py-3 px-6 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-primary/30 transition-all flex items-center gap-2">
          <RefreshCw size={16} /> Reiniciar
        </button>
      </div>

      <AnimatePresence>
        {isWon && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-[40px] p-10 text-center"
          >
            <div className="w-20 h-20 bg-primary text-white rounded-[32px] flex items-center justify-center mb-6 shadow-xl shadow-primary/20">
              <Trophy size={40} />
            </div>
            <h3 className="text-3xl font-black text-white tracking-tight">Increível!</h3>
            <p className="text-slate-400 font-medium mb-8">Sua mente está afiada. Ganhou +200 XP!</p>
            <button onClick={initGame} className="bg-primary text-white px-10 py-5 rounded-2xl font-black text-lg shadow-xl shadow-primary/20">Jogar de Novo</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MotoQuiz = ({ userId, onBack, onWin }: { userId: string, onBack: () => void, onWin: (xp: number) => void }) => {
  const [step, setStep] = useState<'pick' | 'loading' | 'play' | 'result'>('pick');
  const [summaries, setSummaries] = useState<any[]>([]);
  const [quiz, setQuiz] = useState<{ questions: QuizQuestion[] } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [motoPos, setMotoPos] = useState(0);
  const [wrongAnswers, setWrongAnswers] = useState(0);
  const [isWon, setIsWon] = useState(false);

  useEffect(() => {
    const fetchSummaries = async () => {
      const q = query(collection(db, 'summaries'), where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(5));
      const snap = await getDocs(q);
      setSummaries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchSummaries();
  }, [userId]);

  const startQuiz = async (summary: any) => {
    setStep('loading');
    try {
      const data = await generateStudyQuiz(summary.content);
      setQuiz(data);
      setStep('play');
    } catch (e) {
      console.error(e);
      setStep('pick');
    }
  };

  const handleAnswer = (idx: number) => {
    if (!quiz) return;
    const isCorrect = idx === quiz.questions[currentQuestion].answerIndex;
    
    if (isCorrect) {
      setScore(s => s + 1);
      setMotoPos(p => p + (100 / quiz.questions.length));
    } else {
      setWrongAnswers(w => w + 1);
    }

    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(q => q + 1);
    } else {
      setStep('result');
      const win = score + (isCorrect ? 1 : 0) >= 3;
      setIsWon(win);
      if (win) onWin(500); // 500 XP for moto racing
    }
  };

  return (
    <div className="space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-all text-white/50 hover:text-white sm:hidden"><ArrowLeft /></button>
        <div className="flex items-center gap-3">
          <div className="bg-secondary p-2 rounded-xl text-white shadow-lg shadow-secondary/20">
            <Bike size={20} />
          </div>
          <h2 className="text-xl font-black text-white leading-tight">Moto Quiz Racer</h2>
        </div>
        <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-xl transition-all text-white/50 hover:text-white hidden sm:block"><X size={20} /></button>
      </div>

      {step === 'pick' && (
        <div className="space-y-6 flex-1 overflow-y-auto">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-black text-white">Escolha sua "Pista"</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Baseado nos temas que você estudou</p>
          </div>
          <div className="grid gap-4">
            {summaries.length === 0 ? (
              <div className="text-center p-12 bg-slate-900/50 rounded-[32px] border-2 border-dashed border-slate-800">
                <BookOpen className="mx-auto text-slate-700 mb-4" size={40} />
                <p className="text-slate-500 font-bold">Você ainda não tem resumos de estudo. Estude primeiro para habilitar esta pista!</p>
              </div>
            ) : (
              summaries.map(s => (
                <button
                  key={s.id}
                  onClick={() => startQuiz(s)}
                  className="bg-slate-900 border border-slate-800 p-6 rounded-[28px] text-left hover:border-secondary transition-all flex items-center justify-between group"
                >
                  <div className="flex-1">
                    <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-1">{s.theme}</p>
                    <h4 className="text-white font-bold truncate max-w-[200px]">{s.content.substring(0, 50)}...</h4>
                  </div>
                  <PlayCircle className="text-secondary opacity-0 group-hover:opacity-100 transition-all" size={24} />
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {step === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            <motion.div 
              className="w-24 h-24 border-4 border-secondary/20 border-t-secondary rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-secondary">
              <Zap size={32} fill="currentColor" />
            </div>
          </div>
          <p className="text-white font-black uppercase tracking-[0.2em] text-xs">Preparando a pista e motores...</p>
        </div>
      )}

      {step === 'play' && quiz && (
        <div className="space-y-8 flex-1 flex flex-col">
          {/* Race Track */}
          <div className="relative h-24 bg-slate-950 rounded-3xl border-4 border-slate-800 overflow-hidden shadow-inner">
            <div className="absolute inset-0 flex items-center py-2 px-8">
              <div className="h-2 w-full bg-slate-800 rounded-full relative">
                {/* Finish line */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-10 w-2 bg-yellow-400 brightness-150 shadow-[0_0_20px_#facc15] flex flex-col gap-1 overflow-hidden rounded-full">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-1 bg-black w-full" />
                  ))}
                </div>
                
                {/* Moto */}
                <motion.div 
                  className="absolute top-1/2 -translate-y-1/2"
                  animate={{ left: `${motoPos}%` }}
                  transition={{ type: "spring", stiffness: 50 }}
                >
                  <div className="relative">
                    <motion.div 
                      className="absolute -bottom-4 -left-2 w-8 h-2 bg-secondary/30 blur-sm rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ duration: 0.2, repeat: Infinity }}
                    />
                    <Bike size={32} className="text-secondary rotate-[-10deg]" fill="currentColor" />
                  </div>
                </motion.div>
              </div>
            </div>
            <div className="absolute top-2 right-4 flex gap-1">
              {quiz.questions.map((_, i) => (
                <div key={i} className={cn(
                  "w-2 h-2 rounded-full",
                  i < currentQuestion ? (score > i ? "bg-green-500" : "bg-red-500") : "bg-slate-700"
                )} />
              ))}
            </div>
          </div>

          <div className="space-y-6 flex-1 flex flex-col justify-center">
            <div className="text-center px-4">
              <span className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mb-3 block">Pergunta {currentQuestion + 1} de {quiz.questions.length}</span>
              <h3 className="text-xl font-black text-white leading-tight">{quiz.questions[currentQuestion].question}</h3>
            </div>

            <div className="grid gap-3 px-4">
              {quiz.questions[currentQuestion].options.map((opt, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleAnswer(i)}
                  className="w-full p-5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-left hover:bg-slate-800 hover:border-secondary transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-black text-slate-500">
                      {String.fromCharCode(65 + i)}
                    </div>
                    {opt}
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 'result' && (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={cn(
              "w-24 h-24 rounded-[32px] flex items-center justify-center shadow-2xl",
              isWon ? "bg-secondary text-white shadow-secondary/50" : "bg-red-500 text-white shadow-red-500/50"
            )}
          >
            {isWon ? <Trophy size={48} /> : <Rocket size={48} className="rotate-180" />}
          </motion.div>
          
          <div className="space-y-2">
            <h3 className="text-4xl font-black text-white tracking-tight">
              {isWon ? "CHAMPION!" : "QUASE LÁ!"}
            </h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Precisão: {Math.round((score / quiz!.questions.length) * 100)}%</p>
          </div>

          <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 w-full max-w-xs flex justify-around">
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score</p>
              <p className="text-2xl font-black text-white">{score}/{quiz?.questions.length}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">XP Ganho</p>
              <p className="text-2xl font-black text-secondary">+{isWon ? 500 : 50}</p>
            </div>
          </div>

          <button onClick={() => setStep('pick')} className="bg-secondary text-white w-full py-5 rounded-2xl font-black text-lg shadow-xl shadow-secondary/20">Jogar de Novo</button>
          <button onClick={onBack} className="text-slate-500 font-bold text-sm uppercase tracking-widest">Voltar ao Menu</button>
        </div>
      )}
    </div>
  );
};

const ZenPop = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const [bubbles, setBubbles] = useState<{id: number, x: number, y: number}[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    const g = setInterval(() => {
      setBubbles(b => [...b, { id: Date.now(), x: 10 + Math.random() * 80, y: 10 + Math.random() * 80 }]);
    }, 700);
    return () => { clearInterval(t); clearInterval(g); };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) onWin(score * 10);
  }, [timeLeft, score, onWin]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-900 rounded-[40px]">
      <div className="absolute top-6 left-6 text-white font-black z-20">Foco Zen: {score} | {timeLeft}s</div>
      <AnimatePresence>
        {bubbles.map(b => (
          <motion.div 
            key={b.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 2, opacity: 0 }}
            onClick={() => { setScore(s => s + 1); setBubbles(prev => prev.filter(x => x.id !== b.id)); }}
            className="absolute w-16 h-16 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full cursor-pointer shadow-lg shadow-purple-500/20"
            style={{ left: `${b.x}%`, top: `${b.y}%`, transform: 'translate(-50%, -50%)' }}
          />
        ))}
      </AnimatePresence>
      {timeLeft <= 0 && (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center z-50">
          <h2 className="text-4xl font-black text-white">RELAXADO!</h2>
          <p className="text-slate-400 mt-2">Score final: {score}</p>
          <button onClick={onBack} className="mt-8 bg-primary text-white px-12 py-4 rounded-xl font-black">SAIR</button>
        </div>
      )}
    </div>
  );
};

const WordScramble = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const words = ['ESTUDO', 'SABER', 'FUTURO', 'MENTE', 'FOCO', 'LÓGICA', 'CIÊNCIA', 'HISTÓRIA', 'LINGUA', 'DADOS'];
  const [word, setWord] = useState('');
  const [scrambled, setScrambled] = useState('');
  const [input, setInput] = useState('');
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);

  const initWord = useCallback((i: number) => {
    const w = words[i % words.length];
    setWord(w);
    setScrambled(w.split('').sort(() => Math.random() - 0.5).join(''));
    setInput('');
  }, []);

  useEffect(() => initWord(0), [initWord]);

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.toUpperCase() === word) {
      setScore(s => s + 50);
      const next = idx + 1;
      setIdx(next);
      if (next < 5) initWord(next);
      else onWin(score + 50);
    } else setInput('');
  };

  if (idx >= 5) return (
    <div className="text-center p-10 space-y-6">
      <Trophy size={60} className="text-yellow-400 mx-auto" />
      <h2 className="text-3xl font-black text-white">MESTRE DAS PALAVRAS!</h2>
      <p className="text-slate-400">Você reconstruiu as idéias perdidas. +{score} XP</p>
      <button onClick={onBack} className="bg-primary text-white px-12 py-5 rounded-2xl font-black">VOLTAR</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black text-primary tracking-tighter">{scrambled}</h2>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Desembaralhe a palavra ({idx+1}/5)</p>
      </div>
      <form onSubmit={check} className="w-full max-w-xs">
        <input 
          autoFocus 
          value={input} 
          onChange={e => setInput(e.target.value)}
          className="w-full bg-slate-950 border-4 border-slate-800 rounded-2xl p-6 text-3xl font-black text-center text-white focus:border-primary outline-none"
          placeholder="REPOSTA"
        />
      </form>
    </div>
  );
};

const StarFlight = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const [pos, setPos] = useState(50);
  const [obstacles, setObstacles] = useState<{id: number, x: number, y: number}[]>([]);
  const [score, setScore] = useState(0);
  const [alive, setAlive] = useState(true);

  useEffect(() => {
    if (!alive) return;
    const interval = setInterval(() => {
      setObstacles(prev => [
        ...prev.map(o => ({ ...o, y: o.y + 5 })).filter(o => o.y < 110),
        ...(Math.random() > 0.7 ? [{ id: Date.now(), x: Math.random() * 90, y: -10 }] : [])
      ]);
      setScore(s => s + 1);
    }, 50);
    return () => clearInterval(interval);
  }, [alive]);

  useEffect(() => {
    const shipRect = { x: pos, y: 85, w: 10, h: 5 };
    obstacles.forEach(o => {
      if (o.y > 80 && o.y < 90 && Math.abs(o.x - pos) < 8) {
        setAlive(false);
        onWin(Math.floor(score / 10));
      }
    });
  }, [obstacles, pos, score, onWin]);

  return (
    <div className="relative h-full w-full bg-slate-950 overflow-hidden rounded-[40px]">
       <div className="absolute top-4 left-4 text-white font-black z-20">SCORE: {score}</div>
       {!alive && (
         <div className="absolute inset-0 bg-red-600/20 backdrop-blur-xl flex flex-col items-center justify-center z-30">
            <h2 className="text-4xl font-black text-white">GAME OVER</h2>
            <p className="text-white/60 mb-8">Viagem interrompida. XP: {Math.floor(score/10)}</p>
            <button onClick={onBack} className="bg-white text-slate-950 px-8 py-3 rounded-xl font-black">VOLTAR</button>
         </div>
       )}
       <div className="absolute bottom-10 inset-x-0 h-2 px-10 flex items-center">
         <input type="range" value={pos} onChange={e => setPos(Number(e.target.value))} className="w-full accent-primary" />
       </div>
       <motion.div 
         className="absolute bottom-20 text-primary"
         style={{ left: `${pos}%` }}
       >
         <Rocket size={40} className="-rotate-45" fill="currentColor" />
       </motion.div>
       {obstacles.map(o => (
         <div key={o.id} className="absolute w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center" style={{ left: `${o.x}%`, top: `${o.y}%` }}>
           <Sparkles size={16} className="text-slate-600" />
         </div>
       ))}
    </div>
  );
};

const ColorMatch = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const colors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
  const names = ['VERMELHO', 'AZUL', 'VERDE', 'AMARELO', 'ROXO'];
  const [pair, setPair] = useState({ text: 0, color: 0 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);

  const next = useCallback(() => {
    setPair({ text: Math.floor(Math.random() * 5), color: Math.floor(Math.random() * 5) });
  }, []);

  useEffect(() => {
    next();
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(t);
  }, [next]);

  useEffect(() => {
    if (timeLeft <= 0) onWin(score * 20);
  }, [timeLeft, score, onWin]);

  const answer = (match: boolean) => {
    const isMatch = pair.text === pair.color;
    if (match === isMatch) setScore(s => s + 1);
    next();
  };

  if (timeLeft <= 0) return (
    <div className="text-center p-10 space-y-6">
      <Palette size={60} className="text-primary mx-auto" />
      <h2 className="text-3xl font-black text-white px-4">TESTE DE CORES</h2>
      <p className="text-slate-400">Você acertou {score} combinações. +{score * 20} XP</p>
      <button onClick={onBack} className="bg-primary text-white px-12 py-5 rounded-2xl font-black">SAIR</button>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12">
      <div className="text-white font-black text-xl bg-slate-800 px-6 py-2 rounded-full">{timeLeft}s</div>
      <h3 className="text-6xl font-black transition-all" style={{ color: colors[pair.color] }}>{names[pair.text]}</h3>
      <div className="flex gap-4 w-full max-w-xs">
        <button onClick={() => answer(true)} className="flex-1 bg-green-500 py-6 rounded-2xl text-white font-black">IGUAL</button>
        <button onClick={() => answer(false)} className="flex-1 bg-red-500 py-6 rounded-2xl text-white font-black">DIFERENTE</button>
      </div>
    </div>
  );
};

const BubbleBlast = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const [bubbles, setBubbles] = useState<{id: number, x: number, y: number}[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    const g = setInterval(() => {
      setBubbles(b => [...b, { id: Date.now(), x: Math.random() * 90, y: Math.random() * 90 }]);
    }, 500);
    return () => { clearInterval(t); clearInterval(g); };
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) onWin(score * 5);
  }, [timeLeft, score, onWin]);

  return (
    <div className="relative h-full w-full select-none">
       <div className="absolute top-4 left-4 text-white font-black">Score: {score} | {timeLeft}s</div>
       {bubbles.map(b => (
         <motion.div 
           key={b.id}
           initial={{ scale: 0 }} animate={{ scale: 1 }}
           onClick={() => { setScore(s => s + 1); setBubbles(prev => prev.filter(x => x.id !== b.id)); }}
           className="absolute w-12 h-12 bg-red-400 rounded-full cursor-pointer border-4 border-white/20"
           style={{ left: `${b.x}%`, top: `${b.y}%` }}
         />
       ))}
       {timeLeft <= 0 && <div className="absolute inset-0 bg-slate-900/90 flex flex-col items-center justify-center rounded-[40px] z-50">
          <h2 className="text-4xl font-black text-white">FIM!</h2>
          <button onClick={onBack} className="mt-8 bg-primary text-white px-12 py-4 rounded-xl font-black">SAIR</button>
       </div>}
    </div>
  );
};

const TypeSpeed = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const sentences = ["O conhecimento expande horizontes", "A prática leva à perfeição", "Foco absoluto gera resultados incríveis"];
  const [target, setTarget] = useState('');
  const [input, setInput] = useState('');
  const [startTime, setStartTime] = useState(0);

  useEffect(() => { setTarget(sentences[Math.floor(Math.random() * sentences.length)]); setStartTime(Date.now()); }, []);

  const handleChange = (val: string) => {
    setInput(val);
    if (val === target) {
      const time = (Date.now() - startTime) / 1000;
      onWin(Math.max(10, Math.floor(200 / time)));
      onBack();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-6 text-center">
      <Type size={48} className="text-primary" />
      <h3 className="text-2xl font-black text-white">"{target}"</h3>
      <textarea autoFocus value={input} onChange={e => handleChange(e.target.value)} className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 text-white outline-none resize-none" rows={3} />
    </div>
  );
};

const DiceArena = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const [dice, setDice] = useState([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [total, setTotal] = useState(0);

  const roll = () => {
    setRolling(true);
    setTimeout(() => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      setDice([d1, d2]);
      setTotal(t => t + d1 + d2);
      setRolling(false);
      if (d1 === d2) onWin(100);
    }, 600);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-12">
      <div className="flex gap-8">
        {dice.map((d, i) => (
          <motion.div key={i} animate={rolling ? { rotate: 360 } : {}} className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-5xl font-black text-slate-900 shadow-2xl">
            {d}
          </motion.div>
        ))}
      </div>
      <div className="text-center">
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Total Ganho: {total}</p>
        <button onClick={roll} disabled={rolling} className="mt-6 bg-primary text-white px-12 py-5 rounded-2xl font-black text-xl shadow-xl shadow-primary/20">LANÇAR DADOS</button>
      </div>
      <button onClick={onBack} className="text-slate-600 font-bold uppercase tracking-widest text-xs">Sair</button>
    </div>
  );
};

const PatternMatch = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const [pattern, setPattern] = useState<number[]>([]);
  const [userPattern, setUserPattern] = useState<number[]>([]);
  const [round, setRound] = useState(1);
  const startRound = useCallback((r: number) => {
    const p = Array.from({ length: r + 2 }, () => Math.floor(Math.random() * 9));
    setPattern(p); setUserPattern([]);
  }, []);
  useEffect(() => startRound(1), [startRound]);
  const click = (i: number) => {
    const next = [...userPattern, i];
    setUserPattern(next);
    if (pattern[next.length - 1] !== i) { onWin(round * 50); onBack(); }
    else if (next.length === pattern.length) { setRound(r => r + 1); startRound(round + 1); }
  };
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <h3 className="text-2xl font-black text-white">Padrão Secreto (R{round})</h3>
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 9 }).map((_, i) => (
          <button key={i} onClick={() => click(i)} className={cn("w-16 h-16 rounded-xl", pattern[userPattern.length] === i ? "bg-primary" : "bg-slate-800")} />
        ))}
      </div>
    </div>
  );
};

const PuzzleGame = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const [blocks, setBlocks] = useState<number[]>([]);
  useEffect(() => { setBlocks(Array.from({ length: 9 }, (_, i) => i).sort(() => Math.random() - 0.5)); }, []);
  const swap = (i: number) => {
    const empty = blocks.indexOf(8);
    const adj = [empty-1, empty+1, empty-3, empty+3];
    if (adj.includes(i)) {
      const next = [...blocks];
      [next[empty], next[i]] = [next[i], next[empty]];
      setBlocks(next);
      if (next.every((v, i) => v === i)) onWin(1000);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <div className="grid grid-cols-3 gap-1 bg-slate-800 p-1 rounded-xl">
        {blocks.map((v, i) => (
          <div key={i} onClick={() => swap(i)} className={cn("w-20 h-20 rounded-lg flex items-center justify-center text-2xl font-black cursor-pointer", v === 8 ? "bg-slate-900" : "bg-primary text-white")}>
            {v !== 8 && v + 1}
          </div>
        ))}
      </div>
      <button onClick={onBack} className="text-slate-500 font-bold">VOLTAR</button>
    </div>
  );
};


const Minesweeper = ({ onBack, onWin }: { onBack: () => void, onWin: (xp: number) => void }) => {
  const [grid, setGrid] = useState<{mine: boolean, revealed: boolean}[]>([]);
  const [gameOver, setGameOver] = useState(false);
  useEffect(() => { setGrid(Array.from({ length: 16 }, () => ({ mine: Math.random() > 0.8, revealed: false }))); }, []);
  const reveal = (i: number) => {
    if (gameOver) return;
    const newGrid = [...grid]; newGrid[i].revealed = true; setGrid(newGrid);
    if (newGrid[i].mine) { setGameOver(true); onWin(newGrid.filter(x => x.revealed && !x.mine).length * 10); }
  };
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8">
      <div className="grid grid-cols-4 gap-2">
        {grid.map((cell, i) => (
          <div key={i} onClick={() => reveal(i)} className={cn("w-16 h-16 rounded-xl flex items-center justify-center text-2xl cursor-pointer", cell.revealed ? (cell.mine ? "bg-red-500" : "bg-slate-700") : "bg-slate-800")}>
            {cell.revealed && (cell.mine ? "💣" : "💎")}
          </div>
        ))}
      </div>
      {gameOver && <button onClick={onBack} className="bg-primary text-white px-8 py-3 rounded-xl font-black">SAIR</button>}
    </div>
  );
};

export default function Relaxo() {
  const { user, profile } = useAuth();
  const [showPortal, setShowPortal] = useState(true);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // Initial time setup
  const isCapped = (profile?.level || 1) < 20;
  const baseMinutes = Math.floor((profile?.level || 1) / 3) * 5;
  const initialTime = isCapped 
    ? ((profile?.relaxoTimeMinutes || 0) + baseMinutes) * 60 
    : 3600; // Value not used when Level >= 20

  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [showTimesUp, setShowTimesUp] = useState(false);
  const lastLevel = useRef(profile?.relaxoLevel || 1);
  const hasInitializedTime = useRef(false);

  // Sync initial time when profile loads
  useEffect(() => {
    if (profile && !hasInitializedTime.current) {
      const base = Math.floor((profile.level || 1) / 3) * 5;
      setTimeRemaining(isCapped ? ((profile.relaxoTimeMinutes || 0) + base) * 60 : 3600);
      hasInitializedTime.current = true;
    }
  }, [profile, isCapped]);

  // Level 3 Access Restriction
  const isLocked = (profile?.level || 1) < 3;

  // Session Timer
  useEffect(() => {
    if (showPortal || isLocked) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (isCapped && prev <= 1) {
          clearInterval(timer);
          setShowTimesUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showPortal, isLocked, isCapped]);

  // Periodic Save (every minute)
  useEffect(() => {
    if (showPortal || isLocked || !isCapped) return;

    const saver = setInterval(async () => {
      if (user) {
        const totalMinutes = Math.ceil(timeRemaining / 60);
        const base = Math.floor((profile?.level || 1) / 3) * 5;
        // Only save what's beyond the base level-allowance
        const earnedMinutes = Math.max(0, totalMinutes - base);
        
        await updateDoc(doc(db, 'users', user.uid), {
          relaxoTimeMinutes: earnedMinutes,
          updatedAt: serverTimestamp()
        });
      }
    }, 60000);

    return () => clearInterval(saver);
  }, [showPortal, isLocked, isCapped, user, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (profile?.relaxoLevel && profile.relaxoLevel > lastLevel.current) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 6000);
      lastLevel.current = profile.relaxoLevel;
    }
  }, [profile?.relaxoLevel]);

  const handleWin = async (xp: number) => {
    if (user) {
      await addRelaxoXP(user.uid, xp);
    }
  };

  const gameOptions = [
    { 
      id: 'moto', 
      title: 'Moto Quiz Racer', 
      desc: 'Corra contra o cronômetro usando seu conhecimento de estudo.', 
      icon: Bike, 
      color: 'bg-secondary',
      tag: 'XP ALTO',
      component: <MotoQuiz userId={user?.uid || ''} onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'memory', 
      title: 'Mente Blindada', 
      desc: 'Encontre os pares e treine o foco visual.', 
      icon: Grid, 
      color: 'bg-primary',
      tag: 'FIXAÇÃO',
      component: <MemoryGame onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'math', 
      title: 'Sprint Numérico', 
      desc: 'Desafio de cálculo rápido para agilizar o raciocínio.', 
      icon: Calculator, 
      color: 'bg-accent',
      tag: 'AGILIDADE',
      component: <MathDash onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'reaction', 
      title: 'Reflexo Puro', 
      desc: 'Quanto tempo leva para você reagir ao estímulo?', 
      icon: Target, 
      color: 'bg-red-500',
      tag: 'ARCADE',
      component: <ReactionGame onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'simon', 
      title: 'Sequência Zen', 
      desc: 'Repita os padrões musicais e treine seu ouvido.', 
      icon: Brain, 
      color: 'bg-yellow-500',
      tag: 'MEMÓRIA',
      component: <SimonGame onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'scramble', 
      title: 'Engenho Local', 
      desc: 'Reconstrua os termos dos seus estudos em pedaços.', 
      icon: RefreshCw, 
      color: 'bg-cyan-500',
      tag: 'ESTUDO',
      component: <WordScramble onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'zen', 
      title: 'Foco Zen', 
      desc: 'Limpe as bolhas da tela no ritmo da música.', 
      icon: Sparkles, 
      color: 'bg-purple-500',
      tag: 'RELAXO',
      component: <ZenPop onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'fly', 
      title: 'Voo Espacial', 
      desc: 'Controle sua nave e desvie de obstáculos.', 
      icon: Rocket, 
      color: 'bg-slate-700',
      tag: 'LENDÁRIO',
      component: <StarFlight onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'puzzle', 
      title: 'Enigma Pacavira', 
      desc: 'Resolva o mistério escondido nos blocos.', 
      icon: Star, 
      color: 'bg-blue-600',
      tag: 'LÓGICA',
      component: <PuzzleGame onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'blast', 
      title: 'Explosão de Bolhas', 
      desc: 'Estoure bolhas rapidamente antes do tempo acabar.', 
      icon: MousePointer2, 
      color: 'bg-red-400',
      tag: 'ARCADE',
      component: <BubbleBlast onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'pattern', 
      title: 'Mestre do Padrão', 
      desc: 'Repita padrões complexos de luz e cor.', 
      icon: Layers, 
      color: 'bg-emerald-500',
      tag: 'LÓGICA',
      component: <PatternMatch onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'typing', 
      title: 'Digitador Ninja', 
      desc: 'O quão rápido você consegue digitar estas frases?', 
      icon: Type, 
      color: 'bg-indigo-600',
      tag: 'ACADÊMICO',
      component: <TypeSpeed onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'colors', 
      title: 'Pares Cromáticos', 
      desc: 'Combine as cores com os seus nomes reais.', 
      icon: Palette, 
      color: 'bg-pink-500',
      tag: 'PERCEPÇÃO',
      component: <ColorMatch onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'dice', 
      title: 'Arena de Dados', 
      desc: 'Tire a sorte grande para ganhar bônus de XP.', 
      icon: Hash, 
      color: 'bg-amber-600',
      tag: 'SORTE',
      component: <DiceArena onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
    { 
      id: 'mines', 
      title: 'Campo Minado', 
      desc: 'Encontre os diamantes sem explodir nada.', 
      icon: Flame, 
      color: 'bg-slate-600',
      tag: 'ESTRATÉGIA',
      component: <Minesweeper onBack={() => setActiveGame(null)} onWin={handleWin} />
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#020617] text-slate-100 overflow-y-auto font-sans selection:bg-primary/30 scroll-smooth">
      <AnimatePresence>
        {showPortal && <PortalEntrance onFinish={() => setShowPortal(false)} />}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        {isLocked ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 bg-slate-900/50 p-12 rounded-[60px] border border-slate-800 backdrop-blur-xl"
          >
            <div className="w-24 h-24 bg-slate-800 rounded-[32px] flex items-center justify-center text-slate-500 shadow-2xl relative">
              <Lock size={48} />
              <motion.div 
                className="absolute -top-2 -right-2 bg-primary text-white text-xs font-black px-3 py-1 rounded-full shadow-lg"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                LEVEL 3
              </motion.div>
            </div>
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-white italic tracking-tighter">PORTAL BLOQUEADO</h2>
              <p className="text-slate-400 font-medium max-w-sm mx-auto">
                Para acessar a Zona de Relaxo, você precisa atingir o <span className="text-primary font-black">Nível 3</span>. 
                Estude e complete tarefas para ganhar XP e desbloquear este mundo!
              </p>
            </div>
            <Link 
              to="/"
              className="bg-primary text-white font-black px-12 py-5 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-3"
            >
              <ArrowLeft size={20} /> VOLTAR AO PAINEL
            </Link>
          </motion.div>
        ) : (
          <>
            {/* World Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 bg-slate-900/50 p-8 rounded-[40px] border border-slate-800 backdrop-blur-xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5 shadow-2xl">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <User size={30} className="text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                  {profile?.name} <span className="text-primary text-sm uppercase tracking-[0.2em] font-black bg-primary/10 px-3 py-1 rounded-full">Explorer</span>
                </h1>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-secondary font-black text-sm">
                    <Trophy size={16} /> Rank Provisório
                  </div>
                  <div className="flex items-center gap-1.5 text-primary font-black text-sm">
                    <Zap size={16} fill="currentColor" /> {profile?.relaxoXP || 0} Relaxo XP
                  </div>
                </div>
              </div>
            </div>
          </div>

            <div className="flex gap-6 items-center">
              <div className="flex flex-col items-center bg-slate-800/50 px-6 py-4 rounded-3xl border border-slate-700">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Timer size={12} /> {isCapped ? 'Relax Time' : 'Relax Life'}
                </p>
                <span className={cn(
                  "text-2xl font-black tabular-nums",
                  isCapped && timeRemaining < 60 ? "text-red-500 animate-pulse" : "text-white"
                )}>
                  {isCapped ? formatTime(timeRemaining) : '∞'}
                </span>
              </div>

            <div className="text-right">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 text-primary">Relaxo Level</p>
              <div className="flex items-center gap-4">
                <div className="w-48 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-primary to-secondary"
                    initial={{ width: 0 }}
                    animate={{ width: `${((profile?.relaxoXP || 0) % 500) / 5}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white">Lvl {profile?.relaxoLevel || 1}</span>
                </div>
              </div>
              <p className="text-[10px] font-bold text-slate-500 mt-2">{profile?.relaxoXP || 0} XP acumulado</p>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {!activeGame ? (
            <motion.div 
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {gameOptions.map((game, i) => (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setActiveGame(game.id)}
                  className="group relative bg-slate-900/40 border border-slate-800 p-8 rounded-[48px] text-left hover:border-primary/50 hover:bg-slate-900/60 transition-all duration-500 overflow-hidden"
                >
                  <div className={cn("inline-flex w-16 h-16 rounded-[24px] items-center justify-center text-white mb-8 shadow-2xl group-hover:scale-110 transition-transform duration-500", game.color)}>
                    <game.icon size={30} />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{game.tag}</span>
                      {game.id === 'math' && <Lock size={14} className="text-slate-600" />}
                    </div>
                    <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors">{game.title}</h3>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed">{game.desc}</p>
                  </div>
                  
                  {/* Neon Glow Decoration */}
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="mt-8 flex items-center gap-2 text-white font-black text-[11px] uppercase tracking-widest">
                    <span>Aceder Mundo</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              ))}

              <div className="md:col-span-1 lg:col-span-1 bg-slate-900/20 border-4 border-dashed border-slate-800/50 rounded-[48px] p-12 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center opacity-50">
                  <Sparkles className="text-slate-500" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-slate-700">Novos Portais</h4>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Sendo Descobertos...</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="game"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-slate-900/80 backdrop-blur-2xl rounded-[60px] p-10 border border-slate-800 shadow-3xl shadow-black/50 min-h-[600px] relative overflow-hidden"
            >
              {/* Game Background Decorations */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 blur-[100px] rounded-full" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 blur-[100px] rounded-full" />
              
              <div className="relative z-10 h-full">
                {gameOptions.find(g => g.id === activeGame)?.component}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
          </>
        )}
      </div>

      {/* Persistent Back Button (World Exit) */}
      {!activeGame && (
        <Link 
          to="/"
          className="fixed bottom-8 right-8 bg-white text-slate-950 font-black px-8 py-4 rounded-2xl shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all flex items-center gap-3 z-50 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
          VOLTAR À REALIDADE
        </Link>
      )}

      {/* Level Up Notification */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-gradient-to-r from-primary to-secondary p-1 rounded-3xl shadow-[0_0_50px_rgba(var(--primary),0.5)]"
          >
            <div className="bg-slate-950 px-12 py-6 rounded-[22px] text-center">
              <Star className="text-yellow-400 mx-auto mb-2 animate-bounce" fill="currentColor" />
              <h2 className="text-3xl font-black text-white">RELAXO LEVEL UP!</h2>
              <p className="text-primary font-bold uppercase tracking-widest text-xs">Você alcançou o Nível {profile?.relaxoLevel} do Mundo Relax</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Time's Up Modal */}
      <AnimatePresence>
        {showTimesUp && (
          <motion.div 
            className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-3xl flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-[48px] p-12 text-center space-y-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <div className="w-24 h-24 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <Timer size={48} />
              </div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-white tracking-tighter">TEMPO ESGOTADO!</h2>
                <p className="text-slate-400 font-medium">Você aproveitou bem seu descanso. Agora é hora de voltar ao foco e construir seu futuro!</p>
              </div>
              <Link 
                to="/" 
                className="block w-full bg-white text-slate-950 font-black py-5 rounded-2xl text-lg shadow-xl shadow-white/10 hover:scale-[1.02] transition-all"
              >
                VOLTAR À REALIDADE
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
