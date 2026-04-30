import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Bell,
  Loader2,
  LogOut,
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import 'katex/dist/katex.min.css';

// Firebase
import { 
  auth, 
  db, 
  logOut, 
  handleFirestoreError, 
} from './firebase';
import { 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

// Types
import { 
  StudySession, 
  FlashcardDeck, 
  Summary, 
  UserProfile, 
  Subject, 
  Task, 
  VideoLesson, 
  AppNotification 
} from './types';

// Layout & Components
import { Sidebar } from './components/Sidebar';
import { NotificationCenter } from './components/NotificationCenter';

// Pages
import { Auth } from './pages/Auth';
import { ProfileSetup } from './pages/ProfileSetup';
import { Dashboard } from './pages/Dashboard';
import { TutorIA } from './pages/TutorIA';
import { Subjects } from './pages/Subjects';
import { Tasks } from './pages/Tasks';
import { StudyZone } from './pages/StudyZone';
import { Flashcards } from './pages/Flashcards';
import { Summaries } from './pages/Summaries';
import { VideoLessons } from './pages/VideoLessons';
import { Profile } from './pages/Profile';
import { About } from './pages/About';
import { StudySchedule } from './pages/StudySchedule';
import { Schedule } from './pages/Schedule';

export default function App() {
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // App State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Data State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [videos, setVideos] = useState<VideoLesson[]>([]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    // Profile listener
    const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        setProfile(null);
      }
    });

    // Subjects
    const unsubSubjects = onSnapshot(
      query(collection(db, 'subjects'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => setSubjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject)))
    );

    // Sessions
    const unsubSessions = onSnapshot(
      query(collection(db, 'sessions'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudySession)))
    );

    // Decks
    const unsubDecks = onSnapshot(
      query(collection(db, 'decks'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => setDecks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlashcardDeck)))
    );

    // Summaries
    const unsubSummaries = onSnapshot(
      query(collection(db, 'summaries'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => setSummaries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Summary)))
    );

    // Tasks
    const unsubTasks = onSnapshot(
      query(collection(db, 'tasks'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => setTasks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task)))
    );

    // Videos
    const unsubVideos = onSnapshot(
      query(collection(db, 'videos'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => setVideos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as VideoLesson)))
    );

    // Notifications
    const unsubNotifs = onSnapshot(
      query(collection(db, 'notifications'), where('userId', '==', user.uid), orderBy('createdAt', 'desc')),
      (snapshot) => setNotifications(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification)))
    );

    return () => {
      unsubProfile();
      unsubSubjects();
      unsubSessions();
      unsubDecks();
      unsubSummaries();
      unsubTasks();
      unsubVideos();
      unsubNotifs();
    };
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 animate-pulse">
          <Loader2 className="animate-spin text-indigo-600" size={32} />
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Iniciando sua mente...</p>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!profile) {
    return <ProfileSetup user={user} onComplete={() => {}} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        user={user} 
        onLogout={logOut}
        notificationsCount={notifications.filter(n => !n.read).length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen relative">
        {/* Header Bar */}
        <header className="h-20 bg-white/50 backdrop-blur-md border-b border-slate-100 px-6 sm:px-10 flex items-center justify-between sticky top-0 z-30">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-3 hover:bg-white rounded-2xl transition-all text-slate-600 border-none bg-transparent cursor-pointer"
          >
            <Menu size={24} />
          </button>

          <div className="flex-1" />

          {/* Action Bar */}
          <div className="flex items-center gap-4">
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-3 bg-white rounded-2xl border border-slate-200 text-slate-600 hover:shadow-md transition-all relative overflow-hidden cursor-pointer"
                >
                  <Bell size={20} />
                  {notifications.filter(n => !n.read).length > 0 && (
                    <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-bounce" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showNotifications && (
                    <NotificationCenter 
                      notifications={notifications} 
                      onClose={() => setShowNotifications(false)} 
                      onMarkRead={async (id) => {
                        const notification = notifications.find(n => n.id === id);
                        if (notification) {
                          await setDoc(doc(db, 'notifications', id), { 
                            read: true,
                            userId: user.uid,
                            title: notification.title,
                            message: notification.message,
                            type: notification.type,
                            createdAt: notification.createdAt || serverTimestamp()
                          }, { merge: true });
                        }
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-6 sm:p-10 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
               <Dashboard 
                 key="dashboard"
                 user={user} 
                 sessions={sessions} 
                 decks={decks} 
                 summaries={summaries} 
                 tasks={tasks} 
                 subjects={subjects} 
                 setActiveTab={setActiveTab} 
               />
            )}
            {activeTab === 'tutor' && (
               <TutorIA 
                 key="tutor"
                 user={user} 
                 sessions={sessions} 
                 profile={profile} 
                 subjects={subjects} 
               />
            )}
            {activeTab === 'subjects' && (
               <Subjects 
                 key="subjects"
                 user={user} 
                 subjects={subjects} 
               />
            )}
            {activeTab === 'tasks' && (
               <Tasks 
                 key="tasks"
                 user={user} 
                 tasks={tasks} 
               />
            )}
            {activeTab === 'study-zone' && (
               <StudyZone 
                 key="study-zone"
                 user={user} 
                 profile={profile} 
                 subjects={subjects} 
               />
            )}
            {activeTab === 'video-lessons' && (
               <VideoLessons 
                 key="video-lessons"
                 user={user} 
                 subjects={subjects} 
                 videos={videos} 
               />
            )}
            {activeTab === 'flashcards' && (
               <Flashcards 
                 key="flashcards"
                 user={user} 
                 decks={decks} 
               />
            )}
            {activeTab === 'summaries' && (
               <Summaries 
                 key="summaries"
                 user={user} 
                 summaries={summaries} 
               />
            )}
            {activeTab === 'study-schedule' && (
               <StudySchedule 
                 key="study-schedule"
                 user={user} 
                 subjects={subjects} 
                 profile={profile} 
               />
            )}
            {activeTab === 'schedule' && (
               <Schedule 
                 key="schedule"
                 user={user} 
                 profile={profile} 
                 subjects={subjects} 
               />
            )}
            {activeTab === 'profile' && (
               <Profile 
                 key="profile"
                 user={user} 
                 profile={profile} 
               />
            )}
            {activeTab === 'about' && <About key="about" />}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
