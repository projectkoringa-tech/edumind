import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Play, Trash2, Plus, Loader2 } from 'lucide-react';
import { User } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { VideoLesson, Subject } from '../types';
import { Card } from '../components/Card';
import { recommendVideos } from '../services/openai';
import { cn } from '../lib/utils';

interface VideoLessonsProps {
  user: User;
  videos: VideoLesson[];
  subjects: Subject[];
}

export const VideoLessons = ({ user, videos, subjects }: VideoLessonsProps) => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const handleSearch = async () => {
    if (!selectedSubject || !topic) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const recommended = await recommendVideos(selectedSubject, topic);
      setSearchResults(recommended);
    } catch (error) {
      console.error("Error searching videos:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const saveVideo = async (video: any) => {
    try {
      await addDoc(collection(db, 'videos'), {
        userId: user.uid,
        subject: selectedSubject,
        topic: topic,
        title: video.title,
        url: video.url,
        thumbnail: video.thumbnail,
        createdAt: serverTimestamp()
      });
      setSearchResults(prev => prev.filter(v => v.url !== video.url));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'videos');
    }
  };

  const deleteVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'videos', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `videos/${id}`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-6xl mx-auto"
    >
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Videoaulas Recomendadas</h2>
        <p className="text-slate-500 mt-2">Encontre as melhores aulas do YouTube com base no seu perfil de estudo.</p>
      </header>

      <Card className="p-8 mb-12 bg-indigo-600 text-white border-none shadow-xl shadow-indigo-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-80 decoration-none">Matéria</label>
            <select 
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white outline-none text-white appearance-none decoration-none"
            >
              <option value="" className="text-slate-900">Selecione uma disciplina</option>
              {subjects.map(s => (
                <option key={s.id} value={s.name} className="text-slate-900">{s.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-bold uppercase tracking-widest mb-2 opacity-80 decoration-none">Assunto Específico</label>
            <input 
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Anatomia Humana, Ondulatória..."
              className="w-full p-4 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-white outline-none placeholder:text-white/50 text-white decoration-none"
            />
          </div>
          <button 
            onClick={handleSearch}
            disabled={!selectedSubject || !topic || isSearching}
            className="w-full bg-white text-indigo-600 py-4 rounded-xl font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 border-none cursor-pointer"
          >
            {isSearching ? <Loader2 className="animate-spin" size={20} /> : <Search size={20} />}
            Pesquisar Aulas
          </button>
        </div>
      </Card>

      {searchResults.length > 0 && (
        <section className="mb-12">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
            Resultados para: <span className="text-indigo-600 font-medium italic">{topic}</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((video, idx) => (
              <Card key={idx} className="overflow-hidden group hover:shadow-xl transition-all border-slate-100">
                <div className="relative aspect-video bg-slate-100">
                  <img 
                    src={video.thumbnail || undefined} 
                    alt={video.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-indigo-600 shadow-lg hover:scale-110 transition-transform">
                      <Play size={24} fill="currentColor" />
                    </a>
                  </div>
                </div>
                <div className="p-5">
                  <h4 className="font-bold text-slate-800 line-clamp-2 leading-snug mb-4 h-12">
                    {video.title}
                  </h4>
                  <button 
                    onClick={() => saveVideo(video)}
                    className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 border-none cursor-pointer"
                  >
                    <Plus size={16} /> Salvar na minha biblioteca
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-6 underline decoration-indigo-200">Minha Biblioteca de Vídeos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <motion.div 
              key={video.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Card className="overflow-hidden group hover:shadow-xl transition-all border-slate-100 relative">
                <button 
                  onClick={() => deleteVideo(video.id)}
                  className="absolute top-2 right-2 z-10 p-2 bg-white/90 text-slate-300 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="block relative aspect-video bg-slate-100">
                  <img 
                    src={video.thumbnail || undefined} 
                    alt={video.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center text-indigo-600 shadow-lg transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                      <Play size={24} fill="currentColor" />
                    </div>
                  </div>
                </a>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{video.subject}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] text-slate-400">{video.topic}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 line-clamp-1 leading-snug">
                     {video.title}
                  </h4>
                </div>
              </Card>
            </motion.div>
          ))}
          {videos.length === 0 && !isSearching && searchResults.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mx-auto mb-4">
                  <Search size={32} />
               </div>
               <p className="text-slate-400">Nenhum vídeo salvo. Comece uma busca acima!</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
