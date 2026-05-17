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

  const fetchProfile = useCallback(async (userId: string) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    
    console.log("🔍 Fetching profile for:", userId);
    setLoading(true);
    setErrorDetails(null);
    
    try {
      // 1. Load profile
      let { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error("❌ Error fetching profile:", error.message);
        setErrorDetails(error.message);
        throw error;
      }

      // 2. Self-Healing (Create profile if missing)
      if (!data) {
        console.log("⚠️ Profile missing in DB, attempting creation...");
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const newProfile = {
            id: userId,
            display_name: user.user_metadata?.display_name || 'User',
            partner_code: 'CB-' + userId.substring(0, 6).toUpperCase(),
            onboarding_completed: false
          };

          const { data: inserted, error: insertError } = await supabase
            .from('profiles')
            .insert([newProfile])
            .select()
            .maybeSingle();
          
          if (insertError) {
             console.warn("⚠️ Insert failed (possibly exists now):", insertError.message);
             // Final attempt to read
             const { data: retryData, error: retryError } = await supabase
               .from('profiles')
               .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
               .eq('id', userId)
               .maybeSingle();
             
             if (retryError) {
               console.error("❌ Final retry failed:", retryError.message);
               setErrorDetails(retryError.message);
             }
             data = retryData;
          } else {
             console.log("✅ Profile created successfully via self-healing");
             data = inserted;
          }
        }
      }

      if (data) {
        console.log("✅ Profile loaded:", data.display_name);
        setProfile(data);
        
        // Load partner name and avatar if linked
        if (data.partner_id) {
          const { data: partnerData } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', data.partner_id)
            .maybeSingle();
          if (partnerData) {
            setDynamicPartnerName(partnerData.display_name);
            setDynamicPartnerAvatar(partnerData.avatar_url);
          }
        } else {
          setDynamicPartnerName(null);
          setDynamicPartnerAvatar(null);
        }
      } else {
        console.error("❌ No profile data found even after self-healing attempts.");
        setErrorDetails("Profil konnte in der Datenbank nicht gefunden oder erstellt werden.");
        setProfile(null);
      }
    } catch (e: any) {
      console.error("❌ Critical error in fetchProfile:", e);
      setErrorDetails(e.message || "Unbekannter Fehler beim Laden des Profils.");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let isInitializing = false;

    const initAuth = async () => {
      if (isInitializing) return;
      isInitializing = true;

      // Safety timeout: if auth takes more than 7s, something is wrong
      const timeoutId = setTimeout(() => {
        if (mounted && loading) {
          console.error("⌛ Auth initialization timed out");
          setErrorDetails("Die Verbindung zu Supabase dauert zu lange. Bitte prüfe deine Internetverbindung.");
          setLoading(false);
        }
      }, 7000);

      // Check for config error first
      const configError = (window as any).__SUPABASE_CONFIG_ERROR__;
      if (configError) {
        clearTimeout(timeoutId);
        console.error("Supabase Config Error:", configError);
        setErrorDetails(configError);
        setLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        
        if (mounted) {
          clearTimeout(timeoutId);
          if (initialSession) {
            setSession(initialSession);
            await fetchProfile(initialSession.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error("Auth init error:", err);
        if (mounted) setLoading(false);
      } finally {
        isInitializing = false;
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log("🔔 Auth Event:", event);
      
      if (!mounted) return;

      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN') {
        // Only fetch profile if session changed or we don't have a profile yet
        setSession(currentSession);
        if (currentSession && (!profile || profile.id !== currentSession.user.id)) {
          await fetchProfile(currentSession.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setProfile(null);
        setDynamicPartnerName(null);
        setDynamicPartnerAvatar(null);
        setErrorDetails(null);
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
  }, [fetchProfile, navigate, location.pathname, profile?.id]);


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

  const [longLoading, setLongLoading] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (loading) {
      timer = setTimeout(() => setLongLoading(true), 2000);
    } else {
      setLongLoading(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading) {
    return (
      <>
        <LoadingSkeleton />
        {longLoading && (
          <div className="fixed bottom-32 left-0 right-0 flex flex-col items-center gap-2 animate-in fade-in duration-500 px-10 text-center">
            <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest opacity-40">Verbindung wird geprüft...</p>
            <button 
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="text-[10px] text-[var(--secondary)] underline font-medium opacity-60"
            >
              Cache zurücksetzen & neu laden
            </button>
          </div>
        )}
      </>
    );
  }

  // Show global error screen if config or auth failed critically
  if (errorDetails && !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-screen text-[#2D264B] gap-4 bg-[#F8F7FF] px-4 text-center">
        <div className="bg-aura" />
        <p className="font-bold text-lg relative z-10">
          {errorDetails.includes(".env") ? "Konfigurationsfehler" : "Verbindungsproblem"}
        </p>
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-mono max-w-xs break-words relative z-10">
          {errorDetails}
        </div>
        <div className="flex flex-col gap-3 w-full max-w-xs relative z-10">
          <button 
            onClick={() => window.location.reload()} 
            className="btn-action"
          >
            Seite neu laden
          </button>
          {session && (
            <button onClick={() => supabase.auth.signOut()} className="btn-secondary">
              Abmelden
            </button>
          )}
        </div>
      </div>
    );
  }

  const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
    if (!profile) return (
      <div className="flex flex-col items-center justify-center h-screen w-screen text-[#2D264B] gap-4 bg-[#F8F7FF] px-4 text-center">
        <p className="font-bold text-lg">
          {errorDetails?.includes(".env") ? "Konfigurationsfehler" : "Profil konnte nicht geladen werden."}
        </p>
        {errorDetails && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-mono max-w-xs break-words">
            {errorDetails}
          </div>
        )}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {!errorDetails?.includes(".env") && (
            <button onClick={() => session?.user && fetchProfile(session.user.id)} className="btn-action">
              Erneut versuchen
            </button>
          )}
          <button onClick={() => supabase.auth.signOut()} className="btn-secondary">
            Abmelden
          </button>
        </div>
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
        
        <main className="flex-1 flex flex-col relative z-10 px-4 pb-28 pt-4 max-w-md mx-auto w-full overflow-y-auto">
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
              <h3 className="text-xl font-bold text-center text-[#2D264B] mb-4">Bereich gesperrt</h3>
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
                className="w-full mt-4 text-sm font-bold text-[var(--muted)] hover:text-[#2D264B] transition-colors"
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
