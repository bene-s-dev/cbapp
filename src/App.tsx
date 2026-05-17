import React, { useState, useEffect, useCallback } from 'react';
import { Home, MessageCircle, User as UserIcon } from 'lucide-react';
import { Routes, Route, useNavigate, useLocation, Navigate, NavLink } from 'react-router-dom';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// Import modular components
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

  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    console.log("🔍 Fetching profile for:", userId);
    setLoading(true);
    
    try {
      // 1. Load profile
      let { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      // 2. Self-Healing (Create profile if missing)
      if (!data) {
        console.log("⚠️ Profile missing, creating...");
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: userId,
              display_name: user.user_metadata?.display_name || 'User',
              partner_code: 'CB-' + userId.substring(0, 6).toUpperCase(),
              onboarding_completed: false
            }])
            .select()
            .maybeSingle();
          
          if (insertError) {
             console.error("❌ Self-healing failed:", insertError.message);
             // One last try reading
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
        
        // Load partner name if linked
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
      }
    } catch (e) {
      console.error("❌ Critical error in fetchProfile:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          if (initialSession) {
            await fetchProfile(initialSession.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("🔔 Auth Event:", event);
      
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN') {
        setSession(currentSession);
        if (currentSession) {
          await fetchProfile(currentSession.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setDynamicPartnerName(null);
        setLoading(false);
        if (!['/signin', '/signup', '/reset-password'].includes(location.pathname)) {
          navigate('/signin');
        }
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, navigate, location.pathname]);


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
      <div className="flex flex-col items-center justify-center h-screen w-screen text-[#2D264B] gap-4 bg-[#F8F7FF] px-6 text-center">
        <p>Profil konnte nicht geladen werden.</p>
        <button onClick={() => session?.user && fetchProfile(session.user.id)} className="btn-action max-w-xs">
          Neu laden
        </button>
      </div>
    );

    // Redirect to onboarding if not completed
    if (!profile.onboarding_completed && location.pathname !== '/onboarding') {
      return <Navigate to="/onboarding" replace />;
    }

    // Redirect away from onboarding if completed
    if (profile.onboarding_completed && location.pathname === '/onboarding') {
      return <Navigate to="/dashboard" replace />;
    }

    return (
      <div className="h-screen w-screen overflow-hidden relative text-[#2D264B] select-none bg-[#F8F7FF] flex flex-col">
        <div className="bg-aura" />
        
        <main className="flex-1 flex flex-col relative z-10 overflow-hidden px-6 pb-24 pt-8 max-w-lg mx-auto w-full">
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
        session ? <Navigate to="/" replace /> : (
          <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto px-6">
            <div className="bg-aura" />
            <Login onLogin={() => {}} initialMode="login" />
          </div>
        )
      } />
      <Route path="/signup" element={
        session ? <Navigate to="/" replace /> : (
          <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto px-6">
            <div className="bg-aura" />
            <Login onLogin={() => {}} initialMode="register" />
          </div>
        )
      } />
      <Route path="/reset-password" element={
        <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto pt-12 px-6">
          <div className="bg-aura" />
          <ResetPassword onComplete={() => navigate('/signin')} />
        </div>
      } />
      
      {/* Protected Routes */}
      <Route path="/onboarding" element={
        session ? (
          <AuthenticatedLayout>
            <Onboarding onComplete={handleOnboardingComplete} />
          </AuthenticatedLayout>
        ) : <Navigate to="/signin" replace />
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
        ) : <Navigate to="/signin" replace />
      } />

      <Route path="/questions" element={
        session ? (
          <AuthenticatedLayout>
            <Questions 
              userName={profile?.display_name} 
              onComplete={() => navigate('/dashboard')} 
            />
          </AuthenticatedLayout>
        ) : <Navigate to="/signin" replace />
      } />

      <Route path="/profile" element={
        session ? (
          <AuthenticatedLayout>
            <Profile 
              partnerName={dynamicPartnerName}
              onLogout={() => supabase.auth.signOut()} 
            />
          </AuthenticatedLayout>
        ) : <Navigate to="/signin" replace />
      } />

      <Route path="/" element={
        session ? (
          profile?.onboarding_completed ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />
        ) : <Navigate to="/signin" replace />
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
