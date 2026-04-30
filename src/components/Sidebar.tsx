import React from 'react';
import { 
  LogOut, 
  BookOpen, 
  GraduationCap, 
  Menu, 
  X,
  Bell
} from 'lucide-react';
import { cn } from '../lib/utils';
import { 
  CustomDashboardIcon, 
  CustomTutorIcon, 
  CustomFlashcardsIcon, 
  CustomSummariesIcon, 
  CustomStudyZoneIcon, 
  CustomVideosIcon, 
  CustomScheduleIcon, 
  CustomTasksIcon, 
  CustomProfileIcon, 
  CustomAboutIcon,
  CustomLogoutIcon
} from './Icons';

const SidebarItem = ({ icon: Icon, label, active, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" 
        : "text-slate-600 hover:bg-slate-100"
    )}
  >
    <Icon size={20} />
    <span className="font-medium whitespace-nowrap">{label}</span>
  </button>
);

export const Sidebar = ({ 
  activeTab, 
  setActiveTab, 
  isOpen, 
  setIsOpen, 
  user, 
  onLogout,
  notificationsCount
}: any) => {
  const tabs = [
    { id: 'dashboard', label: 'Painel Central', icon: CustomDashboardIcon },
    { id: 'tutor', label: 'Tutor IA', icon: CustomTutorIcon },
    { id: 'subjects', label: 'Matérias', icon: BookOpen },
    { id: 'tasks', label: 'Tarefas e Exercícios', icon: CustomTasksIcon },
    { id: 'study-zone', label: 'Zona de Foco', icon: CustomStudyZoneIcon },
    { id: 'video-lessons', label: 'Videoaulas', icon: CustomVideosIcon },
    { id: 'flashcards', label: 'Flashcards', icon: CustomFlashcardsIcon },
    { id: 'summaries', label: 'Resumos IA', icon: CustomSummariesIcon },
    { id: 'study-schedule', label: 'Cronograma IA', icon: CustomScheduleIcon },
    { id: 'profile', label: 'Meu Perfil', icon: CustomProfileIcon },
    { id: 'about', label: 'Sobre', icon: CustomAboutIcon },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-72 bg-white border-r border-slate-100 z-50 transition-transform duration-300 transform lg:translate-x-0 overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={24} />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              EduMind AI
            </h1>
          </div>

          <nav className="space-y-2">
            {tabs.map((tab) => (
              <SidebarItem
                key={tab.id}
                icon={tab.icon}
                label={tab.label}
                active={activeTab === tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsOpen(false);
                }}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-slate-50">
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl mb-4">
            <img 
              src={user?.photoURL || undefined} 
              alt="" 
              className="w-10 h-10 rounded-full border-2 border-white shadow-sm" 
            />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.displayName || 'Usuário'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
          >
            <CustomLogoutIcon size={20} />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  );
};
