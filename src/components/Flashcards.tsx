import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../App';
import { Flashcard, Discipline } from '../types';
import { CreditCard, ChevronRight, ChevronLeft, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function Flashcards() {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [disciplines, setDisciplines] = useState<Discipline[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');

  useEffect(() => {
    fetchData();
  }, [user]);

  async function fetchData() {
    if (!user) return;
    try {
      const dSnap = await getDocs(query(collection(db, 'disciplines'), where('userId', '==', user.uid)));
      const fSnap = await getDocs(query(collection(db, 'flashcards'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')));
      
      setDisciplines(dSnap.docs.map(d => ({ id: d.id, ...d.data() } as Discipline)));
      setFlashcards(fSnap.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard)));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'flashcards');
    } finally {
      setLoading(false);
    }
  }

  const filteredCards = selectedDiscipline === 'all' 
    ? flashcards 
    : flashcards.filter(f => f.disciplineId === selectedDiscipline);

  const currentCard = filteredCards[currentIndex];

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
    }, 200);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
    }, 200);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Flashcards</h1>
          <p className="text-slate-500">Pratique sua memória ativa por disciplina e tema.</p>
        </div>
        
        <select
          value={selectedDiscipline}
          onChange={(e) => { setSelectedDiscipline(e.target.value); setCurrentIndex(0); setIsFlipped(false); }}
          className="px-4 py-2 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="all">Todas as disciplinas</option>
          {disciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {filteredCards.length > 0 ? (
        <div className="max-w-xl mx-auto space-y-8">
          <div className="perspective-1000 h-80 relative group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
            <motion.div
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
              className="w-full h-full relative preserve-3d"
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden bg-white border-4 border-indigo-600 rounded-[40px] flex flex-col p-10 shadow-2xl items-center justify-center text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-4">
                  {disciplines.find(d => d.id === currentCard.disciplineId)?.name} • {currentCard.theme}
                </p>
                <p className="text-2xl font-bold text-slate-800 leading-tight">
                  {currentCard.question}
                </p>
                <div className="mt-auto text-slate-300 text-xs italic">Clique para ver a resposta</div>
              </div>

              {/* Back */}
              <div className="absolute inset-0 backface-hidden bg-indigo-600 rounded-[40px] flex flex-col p-10 shadow-2xl items-center justify-center text-center rotate-y-180 text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-4">Resposta</p>
                <p className="text-xl font-medium leading-relaxed">
                  {currentCard.answer}
                </p>
                <div className="mt-auto text-indigo-300 text-xs italic">Clique para voltar à pergunta</div>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <button onClick={prevCard} className="w-14 h-14 bg-white rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
              <ChevronLeft size={32} />
            </button>
            <div className="text-sm font-bold text-slate-400 tabular-nums">
              {currentIndex + 1} / {filteredCards.length}
            </div>
            <button onClick={nextCard} className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-24 bg-white rounded-[40px] border-2 border-dashed border-slate-100">
          <CreditCard size={64} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-medium">Nenhum flashcard gerado ainda.</p>
          <p className="text-sm text-slate-400">Vá para a Zona de Estudo para gerar novos flashcards.</p>
        </div>
      )}
    </div>
  );
}
