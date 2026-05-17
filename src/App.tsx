import React, { useState, useEffect } from 'react';
import { Home, MessageCircle, User as UserIcon } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate, NavLink } from 'react-router-dom';
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

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    // Initialen Session-Status abrufen
    const initAuth = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      if (mounted) {
        if (initialSession) {
          setSession(initialSession);
          await fetchProfile(initialSession.user.id);
        } else {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Auf Auth-Änderungen hören
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("🔔 Auth Event:", event);
      
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
        if (currentSession) {
          await fetchProfile(currentSession.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setDynamicPartnerName(null);
        setLoading(false);
        navigate('/signin');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  const fetchProfile = async (userId: string) => {
    if (!userId) return;
    console.log("🔍 fetchProfile gestartet für:", userId);
    setLoading(true);
    
    try {
      // 1. Profil laden
      let { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Fehler beim Profil-Abruf:", error.message);
      }

      // 2. Self-Healing (Profil erstellen falls fehlt)
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
             const { data: retryData } = await supabase
               .from('profiles')
               .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
               .eq('id', userId)
               .maybeSingle();
             if (retryData) data = retryData;
          } else {
             data = inserted;
          }
        }
      }

      if (data) {
        setProfile(data);
        
        // Partner-Namen laden
        if (data.partner_id) {
          const { data: partnerData } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', data.partner_id)
            .maybeSingle();
          if (partnerData) setDynamicPartnerName(partnerData.display_name);
        } else {
          setDynamicPartnerName(null);
        }
      } else {
        setSession(null);
      }
    } catch (e) {
      console.error("❌ Schwerer Fehler in fetchProfile:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    if (session) {
      setLoading(true); 
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', session.user.id);
        
        if (error) throw error;
        await fetchProfile(session.user.id);
        navigate('/dashboard');
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

  const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
    if (!profile) return (
      <div className="flex flex-col items-center justify-center h-screen w-screen text-[#2D264B] gap-4 bg-[#F8F7FF]">
        <p>Profil konnte nicht geladen werden.</p>
        <button 
          onClick={() => session?.user && fetchProfile(session.user.id)}
          className="bg-[var(--secondary)] text-white px-6 py-2 rounded-xl font-bold shadow-sm"
        >
          Neu laden
        </button>
      </div>
    );

    // Wenn Onboarding nicht abgeschlossen, immer dahin leiten
    if (!profile.onboarding_completed && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" />;
    }

    // Wenn Onboarding abgeschlossen, nicht mehr erlauben
    if (profile.onboarding_completed && location.pathname === '/onboarding') {
      return <Navigate to="/dashboard" />;
    }

    return (
      <div className="h-screen w-screen overflow-hidden relative text-[#2D264B] select-none bg-[#F8F7FF] flex flex-col">
        <div className="bg-aura" />
        
        <main className="flex-1 flex flex-col relative z-10 overflow-hidden px-6 pb-24 pt-8">
          {children}
        </main>

        {profile.onboarding_completed && (
          <nav className="nav-dock max-w-md mx-auto">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <Home className="w-6 h-6" />
            </NavLink>

            <NavLink to="/questions" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <MessageCircle className="w-6 h-6" />
            </NavLink>

            <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <UserIcon className="w-6 h-6" />
            </NavLink>
          </nav>
        )}
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/signin" element={
        session ? <Navigate to="/" /> : (
          <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto">
            <div className="bg-aura" />
            <Login onLogin={() => {}} initialMode="login" />
          </div>
        )
      } />
      <Route path="/signup" element={
        session ? <Navigate to="/" /> : (
          <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto">
            <div className="bg-aura" />
            <Login onLogin={() => {}} initialMode="register" />
          </div>
        )
      } />
      <Route path="/reset-password" element={
        <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto pt-12">
          <div className="bg-aura" />
          <ResetPassword onComplete={() => navigate('/signin')} />
        </div>
      } />
      
      {/* Haupt-App Routen */}
      <Route path="/onboarding" element={
        session ? (
          <AuthenticatedLayout>
            <Onboarding onComplete={handleOnboardingComplete} />
          </AuthenticatedLayout>
        ) : <Navigate to="/signin" />
      } />
      
      <Route path="/dashboard" element={
        session ? (
          <AuthenticatedLayout>
            <Dashboard 
              userName={profile?.display_name} 
              partnerName={dynamicPartnerName || 'Partner'} 
              onStartQuestions={() => navigate('/questions')} 
            />
          </AuthenticatedLayout>
        ) : <Navigate to="/signin" />
      } />

      <Route path="/questions" element={
        session ? (
          <AuthenticatedLayout>
            <Questions 
              userName={profile?.display_name} 
              onComplete={() => navigate('/dashboard')} 
            />
          </AuthenticatedLayout>
        ) : <Navigate to="/signin" />
      } />

      <Route path="/profile" element={
        session ? (
          <AuthenticatedLayout>
            <Profile 
              partnerName={dynamicPartnerName}
              onLogout={() => supabase.auth.signOut()} 
            />
          </AuthenticatedLayout>
        ) : <Navigate to="/signin" />
      } />

      <Route path="/" element={
        session ? (
          profile?.onboarding_completed ? <Navigate to="/dashboard" /> : <Navigate to="/onboarding" />
        ) : <Navigate to="/signin" />
      } />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
