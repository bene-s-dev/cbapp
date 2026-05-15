import React, { useState, useEffect } from 'react';
import { Home, MessageCircle, User as UserIcon } from 'lucide-react';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// Importiere die modularen Komponenten
import Login from './components/Login';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';
import Questions from './components/Questions';
import Profile from './components/Profile';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string, partner_name: string } | null>(null);
  const [view, setView] = useState<'onboarding' | 'main'>('main');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'profile'>('dashboard');

  useEffect(() => {
    // Session beim Laden abrufen
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    // Auf Auth-Änderungen hören
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, partner_name, partner_id, partner_code')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg)] text-white">
        <p className="animate-pulse">Lädt...</p>
      </div>
    );
  }

  if (!session || !profile) {
    return (
      <div className="h-screen w-screen overflow-hidden relative bg-[var(--bg)]">
        <main className="h-full flex flex-col safe-top px-8 max-w-md mx-auto relative z-10 bg-white">
          <Login onLogin={() => {}} />
        </main>
      </div>
    );
  }

  const renderContent = () => {
    // Falls noch kein Partner verknüpft ist, zeigen wir das Onboarding (Step 4)
    if (!profile.partner_id && view !== 'main') {
      return <Onboarding onComplete={() => {
        fetchProfile(session.user.id);
        setView('main');
      }} />;
    }

    if (view === 'main') {
      switch (activeTab) {
        case 'dashboard': 
          return <Dashboard 
            userName={profile.display_name} 
            partnerName={profile.partner_name} 
            onStartQuestions={() => setActiveTab('questions')} 
          />;
        case 'questions': 
          return <Questions 
            userName={profile.display_name} 
            onComplete={() => setActiveTab('dashboard')} 
          />;
        case 'profile': 
          return <Profile onLogout={async () => {
            await supabase.auth.signOut();
          }} />;
      }
    }

    // Fallback: Falls Partner fehlt aber wir im Main-View sind (z.B. nach Abbruch)
    if (!profile.partner_id) {
       return <Onboarding onComplete={() => {
        fetchProfile(session.user.id);
        setView('main');
      }} />;
    }

    return null;
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative text-[#1E1B4B] select-none bg-[var(--bg)]">
      <div className="bg-aura" />
      
      <div className="fixed top-0 left-0 right-0 h-[65px] px-[25px] flex justify-between items-center z-20 bg-white border-b-2 border-[#f1f2f6] max-w-md mx-auto">
        <div className="text-[1.4rem] font-semibold bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] bg-clip-text text-transparent">
          CB-App
        </div>
      </div>

      <main className="h-full flex flex-col pt-[65px] pb-[100px] safe-top px-6 max-w-md mx-auto relative z-10 bg-white overflow-y-auto">
        {renderContent()}
      </main>

      <nav className="nav-dock animate-in fade-in slide-in-from-bottom-10 duration-700 max-w-[calc(450px-48px)] mx-auto">
        <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'nav-item-active' : ''}`}>
          <Home className={`w-6 h-6 ${activeTab === 'dashboard' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        <button onClick={() => setActiveTab('questions')} className={`nav-item ${activeTab === 'questions' ? 'nav-item-active' : ''}`}>
          <MessageCircle className={`w-6 h-6 ${activeTab === 'questions' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold">Fragen</span>
        </button>

        <button onClick={() => setActiveTab('profile')} className={`nav-item ${activeTab === 'profile' ? 'nav-item-active' : ''}`}>
          <UserIcon className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-bold">Profil</span>
        </button>
      </nav>
    </div>
  );
}
