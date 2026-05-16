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
  const [profile, setProfile] = useState<any>(null);
  const [dynamicPartnerName, setDynamicPartnerName] = useState<string | null>(null);
  const [view, setView] = useState<'onboarding' | 'main'>('main');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'profile'>('dashboard');

  useEffect(() => {
    // Initialen Session-Status abrufen
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, true);
      else setLoading(false);
    });

    // Auf Auth-Änderungen hören
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, true);
      else {
        setProfile(null);
        setDynamicPartnerName(null);
        setLoading(false);
        setView('main');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, initialFetch: boolean = false, isNewRegistration: boolean = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfile(data);
        
        // Dynamisch den Partner-Namen laden, falls vorhanden
        if (data.partner_id) {
          const { data: partnerData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', data.partner_id)
            .single();
          
          if (partnerData) {
            setDynamicPartnerName(partnerData.display_name);
          }
        } else {
          setDynamicPartnerName(null);
        }

        // Onboarding NUR bei echter Neuregistrierung ODER falls noch nie abgeschlossen
        if (isNewRegistration || (initialFetch && !data.onboarding_completed)) {
          setView('onboarding');
        } else if (initialFetch) {
          setView('main');
        }
      } else {
        // Fallback für neue User ohne Profilzeile
        const fallback = { id: userId, display_name: 'User' };
        setProfile(fallback);
        setDynamicPartnerName(null);
        setView('onboarding');
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (isNew: boolean = false) => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) fetchProfile(user.id, true, isNew);
    });
  };

  const handleOnboardingComplete = async () => {
    if (session) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', session.user.id);
      
      await fetchProfile(session.user.id);
      setView('main');
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F7FF] text-[#2D264B] font-bold">
        <p className="animate-pulse">Lädt...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto">
        <div className="bg-aura" />
        <Login onLogin={handleLoginSuccess} />
      </div>
    );
  }

  const renderContent = () => {
    if (!profile) return (
      <div className="flex items-center justify-center h-full text-[#2D264B]">
        <p>Profil wird geladen...</p>
      </div>
    );

    if (view === 'onboarding') {
      return <Onboarding onComplete={handleOnboardingComplete} />;
    }

    switch (activeTab) {
      case 'dashboard': 
        return <Dashboard 
          userName={profile.display_name} 
          partnerName={dynamicPartnerName || 'Partner'} 
          onStartQuestions={() => setActiveTab('questions')} 
        />;
      case 'questions': 
        return <Questions 
          userName={profile.display_name} 
          onComplete={() => setActiveTab('dashboard')} 
        />;
      case 'profile': 
        return <Profile 
          partnerName={dynamicPartnerName}
          onLogout={async () => {
            await supabase.auth.signOut();
          }} 
        />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden relative text-[#2D264B] select-none bg-[#F8F7FF] flex flex-col">
      <div className="bg-aura" />
      
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden px-6 pb-24 pt-8">
        {renderContent()}
      </main>

      {view === 'main' && (
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
