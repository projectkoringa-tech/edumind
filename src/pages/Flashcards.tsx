import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Layers, ChevronRight, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { FlashcardDeck } from '../types';
import { Card } from '../components/Card';
import { generateFlashcards } from '../services/openai';
import { cn } from '../lib/utils';

interface FlashcardsProps {
  user: User;
  decks: FlashcardDeck[];
}

export const Flashcards = ({ user, decks }: FlashcardsProps) => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const cards = await generateFlashcards(topic);
      await addDoc(collection(db, 'decks'), {
        userId: user.uid,
        topic,
        cards: cards.map((c: any) => ({ ...c, mastered: false })),
        createdAt: serverTimestamp()
      });
      setTopic('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const deleteDeck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'decks', id));
      if (activeDeck?.id === id) setActiveDeck(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'decks');
    }
  };

  const nextCard = () => {
    if (!activeDeck) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % activeDeck.cards.length);
  };

  const prevCard = () => {
    if (!activeDeck) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + activeDeck.cards.length) % activeDeck.cards.length);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Flashcards Inteligentes</h2>
          <p className="text-slate-500 mt-2">Memorize conceitos complexos de forma simples e divertida.</p>
        </div>
        {!activeDeck && (
          <div className="flex gap-2">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Digite um tópico..."
              className="px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
            />
            <button 
              onClick={handleGenerate}
              disabled={!topic.trim() || isGenerating}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-100 border-none cursor-pointer shrink-0"
            >
              {isGenerating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
              Gerar
            </button>
          </div>
        )}
      </header>

      {activeDeck ? (
        <div className="space-y-8">
          <button 
            onClick={() => setActiveDeck(null)} 
            className="text-indigo-600 font-bold flex items-center gap-2 hover:underline border-none bg-transparent cursor-pointer"
          >
            <ChevronRight size={20} className="rotate-180" /> Voltar para a lista
          </button>
          
          <div className="flex flex-col items-center gap-8">
            <div className="w-full max-w-lg" style={{ perspective: '1000px' }}>
              <motion.div 
                onClick={() => setIsFlipped(!isFlipped)}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                className="relative w-full aspect-[4/3] cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* Front */}
                <div 
                  className="absolute inset-0 bg-white rounded-3xl shadow-xl border-2 border-indigo-100 flex flex-col items-center justify-center p-10 text-center"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <span className="absolute top-6 left-6 text-xs font-bold text-indigo-400 uppercase tracking-widest">Pergunta</span>
                  <p className="text-xl sm:text-2xl font-bold text-slate-800 leading-relaxed">
                    {activeDeck.cards[currentCardIndex].front}
                  </p>
                  <p className="mt-8 text-xs text-slate-400 animate-pulse">Clique para ver a resposta</p>
                </div>
                {/* Back */}
                <div 
                  className="absolute inset-0 bg-indigo-600 rounded-3xl shadow-xl flex flex-col items-center justify-center p-10 text-center"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <span className="absolute top-6 left-6 text-xs font-bold text-indigo-200 uppercase tracking-widest">Resposta</span>
                  <p className="text-xl sm:text-2xl font-bold text-white leading-relaxed">
                    {activeDeck.cards[currentCardIndex].back}
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center gap-6 pb-10">
              <button onClick={prevCard} className="p-4 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors text-slate-600 border-none cursor-pointer">
                <ChevronRight size={24} className="rotate-180" />
              </button>
              <div className="text-lg font-bold text-slate-900 bg-white px-6 py-2 rounded-full shadow-sm border border-slate-100">
                {currentCardIndex + 1} <span className="text-slate-300 mx-1">/</span> {activeDeck.cards.length}
              </div>
              <button onClick={nextCard} className="p-4 bg-white rounded-full shadow-md hover:bg-slate-50 transition-colors text-slate-600 border-none cursor-pointer">
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((d: FlashcardDeck) => (
            <Card key={d.id} className="group relative p-6 hover:border-indigo-300 transition-all cursor-pointer" onClick={() => { setActiveDeck(d); setCurrentCardIndex(0); }}>
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
                <Layers size={24} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{d.topic}</h4>
              <p className="text-xs text-slate-500 font-medium">{d.cards.length} cartões de estudo</p>
              <button 
                onClick={(e) => deleteDeck(d.id, e)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-opacity border-none bg-transparent cursor-pointer"
              >
                <Trash2 size={18} />
              </button>
            </Card>
          ))}
          {decks.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
              <Layers className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-500 font-medium italic">Nenhum deck gerado ainda. Que tal começar um agora?</p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};
