import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  FileText,
  Plus, 
  Trash2, 
  Paperclip, 
  Loader2, 
  X, 
  ImageIcon, 
  FileText as FileIcon 
} from 'lucide-react';
import { User } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { Summary } from '../types';
import { Card } from '../components/Card';
import { summarizeText, FileData } from '../services/openai';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface SummariesProps {
  user: User;
  summaries: Summary[];
}

export const Summaries = ({ user, summaries }: SummariesProps) => {
  const [text, setText] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [activeSummary, setActiveSummary] = useState<Summary | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      alert("O arquivo é muito grande. O limite é 4MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedFile({
        mimeType: file.type,
        data: base64
      });
    };
    reader.readAsDataURL(file);
  };

  const handleSummarize = async () => {
    if ((!text.trim() && !selectedFile) || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const content = await summarizeText(text, selectedFile || undefined);
      await addDoc(collection(db, 'summaries'), {
        userId: user.uid,
        title: (text.slice(0, 40) || "Resumo de arquivo") + (text.length > 40 ? '...' : ''),
        content,
        sourceText: text,
        createdAt: serverTimestamp()
      });
      setText('');
      setSelectedFile(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'summaries');
    } finally {
      setIsSummarizing(false);
    }
  };

  const deleteSummary = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'summaries', id));
      if (activeSummary?.id === id) setActiveSummary(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'summaries');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto"
    >
      <header className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Resumos Inteligentes</h2>
        <p className="text-slate-500 mt-2">Sintetize conteúdos extensos em pontos-chave fáceis de revisar.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus size={18} className="text-indigo-600" /> Novo Resumo
            </h4>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Cole seu conteúdo ou anexe um PDF/Imagens..."
              className="w-full h-48 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm mb-4 transition-all"
            />
            
            {selectedFile && (
              <div className="mb-4 p-3 bg-indigo-50 rounded-xl flex items-center justify-between border border-indigo-100">
                <div className="flex items-center gap-2">
                  {selectedFile.mimeType.startsWith('image/') ? <ImageIcon size={14} className="text-indigo-600" /> : <FileIcon size={14} className="text-indigo-600" />}
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Conteúdo Anexado</span>
                </div>
                <button onClick={() => setSelectedFile(null)} className="p-1 hover:bg-white rounded-full text-indigo-400 border-none bg-transparent cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input 
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,application/pdf"
                className="hidden"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all border-none cursor-pointer"
                title="Anexar arquivo"
              >
                <Paperclip size={20} />
              </button>
              <button 
                onClick={handleSummarize}
                disabled={(!text.trim() && !selectedFile) || isSummarizing}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 border-none cursor-pointer"
              >
                {isSummarizing ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                Gerar Resumo
              </button>
            </div>
          </Card>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-400 text-xs uppercase tracking-widest px-2 mb-4">Meus Resumos</h4>
            <div className="space-y-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {summaries.map((s: Summary) => (
                <div 
                  key={s.id}
                  onClick={() => setActiveSummary(s)}
                  className={cn(
                    "group relative p-4 rounded-xl cursor-pointer transition-all border",
                    activeSummary?.id === s.id 
                      ? "bg-white border-indigo-200 shadow-md translate-x-2" 
                      : "bg-white/50 border-transparent hover:bg-white hover:border-slate-200"
                  )}
                >
                  <p className={cn("text-sm font-semibold truncate pr-6", activeSummary?.id === s.id ? "text-indigo-600" : "text-slate-700")}>
                    {s.title}
                  </p>
                  <button 
                    onClick={(e) => deleteSummary(s.id, e)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {summaries.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-10 opacity-50">Nenhum resumo salvo.</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeSummary ? (
            <Card className="p-8 h-full min-h-[600px] shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 border-b border-slate-50 pb-6">
                <h3 className="text-2xl font-bold text-slate-900 leading-tight">{activeSummary.title}</h3>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full shrink-0">
                  <FileText size={12} /> Salvo {activeSummary.createdAt?.toDate ? new Date(activeSummary.createdAt.toDate()).toLocaleDateString() : ''}
                </div>
              </div>
              <div className="markdown-body prose prose-indigo max-w-none">
                <Markdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{activeSummary.content}</Markdown>
              </div>
            </Card>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center text-center bg-white rounded-3xl border-2 border-dashed border-slate-100 p-10">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
                <FileText size={48} />
              </div>
              <h4 className="text-xl font-bold text-slate-900 mb-2">Página de Resumos</h4>
              <p className="text-slate-500 max-w-xs mx-auto">Selecione um resumo da lista lateral ou gere um novo usando nossa Inteligência Artificial.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
