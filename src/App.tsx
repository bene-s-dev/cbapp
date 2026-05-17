import React, { useState, useEffect, useCallback } from 'react';
import { Home, MessageCircle, User as UserIcon, Lock } from 'lucide-react';
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
import LoadingSkeleton from './components/LoadingSkeleton';
import { GREETINGS } from './constants/questions';
import { getDailyKey } from './lib/dateUtils';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [dynamicPartnerName, setDynamicPartnerName] = useState<string | null>(null);
  const [dynamicPartnerAvatar, setDynamicPartnerAvatar] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showLockedModal, setShowLockedModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const fetchProfile = useCallback(async (userId: string, forceLoading = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    const shouldShowLoading = forceLoading || !profile;
    console.log("🔍 Fetching profile for:", userId, shouldShowLoading ? "(Loading)" : "(Background)");
    
    if (shouldShowLoading) setLoading(true);
    
    // Attempt with retry logic for mobile resilience
    const maxRetries = 2;
    let attempt = 0;
    
    while (attempt <= maxRetries) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
          .eq('id', userId)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          // Self-healing logic for missing profiles
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const newProfile = {
              id: userId,
              display_name: user.user_metadata?.display_name || 'User',
              partner_code: 'CB-' + userId.substring(0, 6).toUpperCase(),
              onboarding_completed: false
            };
            const { data: inserted, error: insertError } = await supabase.from('profiles').insert([newProfile]).select().maybeSingle();
            if (insertError) throw insertError;
            setProfile(inserted);
          }
        } else {
          setProfile(data);
          if (data.partner_id) {
            const { data: partnerData } = await supabase.from('profiles').select('display_name, avatar_url').eq('id', data.partner_id).maybeSingle();
            if (partnerData) {
              setDynamicPartnerName(partnerData.display_name);
              setDynamicPartnerAvatar(partnerData.avatar_url);
            }
          }
        }
        
        setErrorDetails(null);
        setLoading(false);
        return; // Success
      } catch (e: any) {
        attempt++;
        console.warn(`⚠️ Fetch attempt ${attempt} failed:`, e.message);
        if (attempt > maxRetries) {
          if (!profile) setErrorDetails("Verbindung fehlgeschlagen. Bitte prüfe dein Internet.");
          setLoading(false);
        } else {
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }, [profile]);

  useEffect(() => {
    let mounted = true;

    // Handle mobile background/foreground transition
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && session?.user?.id) {
        console.log("📱 App back in foreground, refreshing session...");
        fetchProfile(session.user.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const initAuth = async () => {
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (mounted) {
          if (initialSession) {
            setSession(initialSession);
            await fetchProfile(initialSession.user.id, true);
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
      if (!mounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setSession(currentSession);
        if (currentSession && (!profile || profile.id !== currentSession.user.id)) {
          await fetchProfile(currentSession.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setDynamicPartnerName(null);
        setDynamicPartnerAvatar(null);
        setLoading(false);
        if (!window.location.pathname.includes('signin')) {
          navigate('/signin', { replace: true });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProfile, navigate, session?.user?.id]); 



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

  if (loading && !profile) {
    return <LoadingSkeleton />;
  }

  // Fallback if profile is still missing after loading finished
  const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
    if (!profile && !loading) return (
      <div className="flex flex-col items-center justify-center h-screen w-screen text-[#1F1939] gap-4 bg-[#F8F7FF] px-4 text-center">
        <p className="font-bold text-lg">Profil wird geladen...</p>
        <button onClick={() => session?.user && fetchProfile(session.user.id, true)} className="btn-action">Erneut versuchen</button>
        <button onClick={() => supabase.auth.signOut()} className="btn-secondary">Abmelden</button>
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
      <div className="h-screen w-screen overflow-hidden relative text-[#1F1939] select-none bg-[#F8F7FF] flex flex-col">
        <div className="bg-aura" />
        
        <main className="flex-1 flex flex-col relative z-10 px-4 pb-36 pt-4 max-w-md mx-auto w-full overflow-y-auto">
          {children}
        </main>

        {profile.onboarding_completed && (
          <nav className="nav-dock max-w-md mx-auto">
            <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <Home className="w-6 h-6" />
            </NavLink>

            <div className="relative">
              {profile.partner_id ? (
                <NavLink to="/questions" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
                  <MessageCircle className="w-6 h-6" />
                </NavLink>
              ) : (
                <div 
                  onClick={() => setShowLockedModal(true)}
                  className="nav-item opacity-40 cursor-pointer relative"
                >
                  <MessageCircle className="w-6 h-6" />
                  <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5">
                    <Lock className="w-2.5 h-2.5 text-[var(--primary)]" />
                  </div>
                </div>
              )}
            </div>

            <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}>
              <UserIcon className="w-6 h-6" />
            </NavLink>
          </nav>
        )}

        {/* Custom Locked Modal */}
        {showLockedModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-[#2D264B]/40 backdrop-blur-sm" onClick={() => setShowLockedModal(false)} />
            <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative z-10 animate-entrance border border-purple-100">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Lock className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <h3 className="text-xl font-bold text-center text-[#1F1939] mb-4">Bereich gesperrt</h3>
              <p className="text-center text-[#4A4468] leading-relaxed mb-8">
                Du kannst den Fragenbereich<br />nur mit einem <span className="font-bold text-[var(--secondary)]">Bisou-Partner</span> öffnen.<br /><br />✨ Verknüpfe dich dazu im Profil-Tab.
              </p>
              <button 
                onClick={() => {
                  setShowLockedModal(false);
                  navigate('/profile');
                }}
                className="btn-action"
              >
                Zum Profil ✨
              </button>
              <button 
                onClick={() => setShowLockedModal(false)}
                className="w-full mt-4 text-sm font-bold text-[var(--muted)] hover:text-[#1F1939] transition-colors"
              >
                Schließen
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Routes>
      <Route path="/signin" element={
        session ? <Navigate to="/" replace /> : (
          <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto px-4">
            <div className="bg-aura" />
            <Login onLogin={() => {}} initialMode="login" />
          </div>
        )
      } />
      <Route path="/signup" element={
        session ? <Navigate to="/" replace /> : (
          <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto px-4">
            <div className="bg-aura" />
            <Login onLogin={() => {}} initialMode="register" />
          </div>
        )
      } />
      <Route path="/reset-password" element={
        <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto pt-12 px-4">
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
              userAvatar={profile?.avatar_url}
              partnerName={dynamicPartnerName || 'Partner'} 
              partnerAvatar={dynamicPartnerAvatar}
              onStartQuestions={async () => {
                // Re-verify partner status to prevent stale state bypass
                const { data } = await supabase
                  .from('profiles')
                  .select('partner_id')
                  .eq('id', session.user.id)
                  .maybeSingle();
                
                if (!data?.partner_id) {
                  setShowLockedModal(true);
                } else {
                  navigate('/questions');
                }
              }} 
            />
          </AuthenticatedLayout>
        ) : <Navigate to="/signin" replace />
      } />

      <Route path="/questions" element={
        session ? (
          <AuthenticatedLayout>
            {profile?.partner_id ? (
              <Questions 
                userName={profile?.display_name} 
                onComplete={() => navigate('/dashboard')} 
              />
            ) : (
              <Navigate to="/dashboard" replace />
            )}
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
