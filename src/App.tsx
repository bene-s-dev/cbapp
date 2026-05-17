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
import ResetPassword from './components/ResetPassword';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [dynamicPartnerName, setDynamicPartnerName] = useState<string | null>(null);
  const [view, setView] = useState<'onboarding' | 'main' | 'reset-password'>('main');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'profile'>('dashboard');

  useEffect(() => {
    let isInitialFetch = true;

    // Initialen Session-Status abrufen
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("🏁 Initial getSession fertig");
      if (session) {
        setSession(session);
        fetchProfile(session.user.id);
      } else {
        console.log("ℹ️ Keine initiale Session");
        setLoading(false);
      }
      isInitialFetch = false;
    }).catch(err => {
      console.error("❌ Fehler bei getSession:", err);
      setLoading(false);
      isInitialFetch = false;
    });

    // Auf Auth-Änderungen hören
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("🔔 Auth Event:", event);
      
      if (event === 'PASSWORD_RECOVERY') {
        setView('reset-password');
        setLoading(false);
        return;
      }

      if (isInitialFetch && event !== 'SIGNED_IN') return; // Überspringen, wenn getSession noch läuft, außer bei SIGNED_IN

      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        setDynamicPartnerName(null);
        setLoading(false);
        setView('main');
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const fetchProfile = async (userId: string) => {
    if (!userId) return;
    console.log("🔍 fetchProfile gestartet für:", userId);
    setLoading(true);
    
    try {
      // 1. Versuche das Profil zu laden
      let { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Fehler beim Profil-Abruf:", error.message);
      }

      // 2. Self-Healing: Wenn kein Profil da ist, versuchen wir es zu erstellen
      if (!data) {
        console.log("⚠️ Profil fehlt in Datenbank, erstelle es jetzt...");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: userId,
              display_name: user.user_metadata.display_name || 'User',
              partner_code: 'CB-' + userId.substring(0, 6).toUpperCase(),
              onboarding_completed: false
            }])
            .select()
            .maybeSingle();
          
          if (insertError) {
             console.error("❌ Self-Healing fehlgeschlagen:", insertError.message);
             // Zweiter Versuch: Vielleicht war es ein Race Condition und das Profil wurde gerade erstellt?
             const { data: retryData } = await supabase
               .from('profiles')
               .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
               .eq('id', userId)
               .maybeSingle();
             if (retryData) {
               data = retryData;
             }
          } else {
             console.log("✨ Profil erfolgreich erstellt!");
             data = inserted;
          }
        }
      }

      if (data) {
        console.log("✅ Profil bereit:", data);
        setProfile(data);
        
        // Dynamisch den Partner-Namen laden, falls vorhanden
        if (data.partner_id) {
          const { data: partnerData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', data.partner_id)
            .maybeSingle();
          
          if (partnerData) {
            setDynamicPartnerName(partnerData.display_name);
          }
        } else {
          setDynamicPartnerName(null);
        }

        // Onboarding Logik
        setView(data.onboarding_completed ? 'main' : 'onboarding');
      } else {
        console.error("❌ Kein Profil verfügbar, lade Login...");
        setSession(null);
      }
    } catch (e) {
      console.error("❌ Schwerer Fehler in fetchProfile:", e);
    } finally {
      console.log("🏁 fetchProfile beendet");
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) fetchProfile(user.id);
    });
  };

  const handleOnboardingComplete = async () => {
    if (session) {
      setLoading(true); // Loader zeigen während DB Update
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', session.user.id);
        
        if (error) throw error;
        
        // Profil neu laden (setzt dann automatisch setView('main'))
        await fetchProfile(session.user.id);
      } catch (e) {
        console.error("Error completing onboarding:", e);
        setLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F8F7FF] text-[#2D264B] font-bold">
        <p className="animate-pulse">Lädt...</p>
      </div>
    );
  }

  // Diese Ansichten dürfen auch ohne (volle) Session angezeigt werden
  if (view === 'reset-password') {
    return (
      <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto pt-12">
        <div className="bg-aura" />
        <ResetPassword onComplete={() => setView('main')} />
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
      <div className="flex flex-col items-center justify-center h-full text-[#2D264B] gap-4">
        <p>Profil konnte nicht geladen werden.</p>
        <button 
          onClick={() => session?.user && fetchProfile(session.user.id)}
          className="bg-[var(--secondary)] text-white px-6 py-2 rounded-xl font-bold shadow-sm"
        >
          Neu laden
        </button>
      </div>
    );

    if (view === 'reset-password') {
      return <ResetPassword onComplete={() => setView('main')} />;
    }

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
