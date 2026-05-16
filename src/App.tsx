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
  const [profile, setProfile] = useState<{ id: string, display_name: string, partner_name: string, partner_id: string | null } | null>(null);
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
      .select('id, display_name, partner_name, partner_id, partner_code')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setProfile(data);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[var(--bg)] text-white font-bold">
        <p className="animate-pulse">Lädt...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen w-screen overflow-hidden relative bg-[var(--bg)]">
        <Login onLogin={() => {}} />
      </div>
    );
  }

  const renderContent = () => {
    if (!profile) return null;

    // Falls noch kein Partner verknüpft ist, zeigen wir das Onboarding
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

    if (!profile.partner_id) {
       return <Onboarding onComplete={() => {
        fetchProfile(session.user.id);
        setView('main');
      }} />;
    }

    return null;
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative text-[#1E1B4B] select-none bg-[var(--bg)] flex flex-col">
      <div className="bg-aura" />
      
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden px-6 pb-20 pt-8">
        {renderContent()}
      </main>

      {profile?.partner_id && (
        <nav className="nav-dock max-w-md mx-auto">
          <button onClick={() => setActiveTab('dashboard')} className={`nav-item ${activeTab === 'dashboard' ? 'nav-item-active' : ''}`}>
            <Home className="w-6 h-6" />
          </button>

          <button onClick={() => setActiveTab('questions')} className={`nav-item ${activeTab === 'questions' ? 'nav-item-active' : ''}`}>
            <MessageCircle className="w-6 h-6" />
          </button>

          <button onClick={() => setActiveTab('profile')} className={`nav-item ${activeTab === 'profile' ? 'nav-item-active' : ''}`}>
            <UserIcon className="w-6 h-6" />
          </button>
        </nav>
      )}
    </div>
  );
}
