import React from 'react';
import { motion } from 'motion/react';
import { X, Bell, Info, AlertCircle, CheckCircle2, Brain, Clock } from 'lucide-react';
import { AppNotification } from '../types';
import { cn } from '../lib/utils';

interface NotificationCenterProps {
  notifications: AppNotification[];
  onClose: () => void;
  onMarkRead: (id: string) => void;
}

export const NotificationCenter = ({ notifications, onClose, onMarkRead }: NotificationCenterProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute right-0 top-full mt-4 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 overflow-hidden"
    >
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={18} className="text-indigo-600" />
          <h3 className="font-bold text-slate-900">Notificações</h3>
          <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            {notifications.filter(n => !n.read).length}
          </span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-xl transition-colors border-none bg-transparent cursor-pointer">
          <X size={18} />
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-2">
        {notifications.length > 0 ? (
          <div className="space-y-1">
            {notifications.map((n) => (
              <div 
                key={n.id}
                onClick={() => !n.read && onMarkRead(n.id)}
                className={cn(
                  "p-4 rounded-2xl transition-all cursor-pointer relative",
                  n.read ? "opacity-60 grayscale-[0.5]" : "bg-indigo-50/50 hover:bg-indigo-50"
                )}
              >
                <div className="flex gap-3">
                  <div className={cn(
                    "mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    n.type === 'tutor' ? "bg-rose-100 text-rose-600" : 
                    n.type === 'reminder' ? "bg-emerald-100 text-emerald-600" : 
                    "bg-blue-100 text-blue-600"
                  )}>
                    {n.type === 'tutor' ? <Brain size={16} /> : 
                     n.type === 'reminder' ? <Clock size={16} /> : 
                     <Info size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 leading-tight">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                      {n.createdAt?.toDate ? new Date(n.createdAt.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora mesmo'}
                    </p>
                  </div>
                </div>
                {!n.read && (
                  <div className="absolute right-4 top-4 w-2 h-2 bg-indigo-600 rounded-full" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <Bell size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 text-sm">Tudo em dia!</p>
            <p className="text-xs text-slate-300">Você não tem novas notificações.</p>
          </div>
        )}
      </div>
      
      {notifications.length > 0 && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fim das notificações</p>
        </div>
      )}
    </motion.div>
  );
};
