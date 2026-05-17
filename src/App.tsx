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
import { getDailyKey } from './lib/dateUtils';
import { FALLBACK_QUESTIONS } from './constants/questions';

// Separate Layout component to prevent remounting on navigation
function AppLayout({ 
  children, 
  profile, 
  partnerProfile,
  showLockedModal,
  setShowLockedModal 
}: { 
  children: React.ReactNode; 
  profile: any; 
  partnerProfile: any;
  showLockedModal: boolean;
  setShowLockedModal: (val: boolean) => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  if (!profile.onboarding_completed && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  const isProfile = location.pathname === '/profile';

  return (
    <div className="h-[100svh] w-screen overflow-hidden relative text-[#1F1939] select-none bg-[#F8F7FF] flex flex-col">
      <div className="bg-aura" />
      
      {profile.onboarding_completed && isProfile && (
        <header className="px-4 z-20 absolute left-0 right-0 top-0 max-w-md mx-auto w-full pointer-events-none" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
          <div className="flex items-start justify-between min-h-[40px]">
            <h1 className="text-2xl font-semibold text-[var(--text-main)] tracking-tight select-none pointer-events-auto" style={{ fontFamily: 'Fraunces, serif' }}>
              Bisou
            </h1>
            <div className="w-10 h-10" />
          </div>
        </header>
      )}

      <main 
        className="flex-1 flex flex-col relative z-10 px-4 pb-32 max-w-md mx-auto w-full overflow-visible"
        style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}
      >
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

      {showLockedModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#2D264B]/40 backdrop-blur-sm" onClick={() => setShowLockedModal(false)} />
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative z-10 animate-entrance border border-purple-100 text-center">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <Lock className="w-8 h-8 text-[var(--primary)]" />
            </div>
            <h3 className="text-xl font-bold text-[#1F1939] mb-4">Bereich gesperrt</h3>
            <p className="text-sm text-[#4A4468] leading-relaxed mb-8">
              Du kannst den Fragenbereich<br />nur mit einem <span className="font-bold text-[var(--secondary)]">Bisou-Partner</span> öffnen.<br /><br />✨ Verknüpfe dich dazu im Profil-Tab.
            </p>
            <button onClick={() => { setShowLockedModal(false); navigate('/profile'); }} className="btn-action">Zum Profil ✨</button>
            <button onClick={() => setShowLockedModal(false)} className="w-full mt-4 text-sm font-bold text-[var(--muted)] hover:text-[#1F1939] transition-colors">Schließen</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [partnerProfile, setPartnerProfile] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [showLockedModal, setShowLockedModal] = useState(false);

  const navigate = useNavigate();
  const dayKey = getDailyKey();

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const [profileRes, questionsRes] = await Promise.all([
        supabase.from('profiles').select('*, partner:partner_id(id, display_name, avatar_url)').eq('id', userId).maybeSingle(),
        supabase.from('daily_questions').select('questions').eq('day_key', dayKey).maybeSingle()
      ]);

      if (profileRes.error) throw profileRes.error;
      const data = profileRes.data;

      if (!data) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const newProfile = {
            id: userId,
            display_name: user.user_metadata?.display_name || 'Nutzer',
            partner_code: 'CB-' + userId.substring(0, 6).toUpperCase(),
            onboarding_completed: false
          };
          const { data: inserted } = await supabase.from('profiles').insert([newProfile]).select().maybeSingle();
          if (inserted) setProfile(inserted);
        }
      } else {
        setProfile(data);
        if (data.partner) setPartnerProfile(data.partner);

        const userIds = [userId];
        if (data.partner_id) userIds.push(data.partner_id);

        const { data: answers } = await supabase.from('answers').select('*').in('user_id', userIds).eq('day_key', dayKey);
        
        const qData = questionsRes.data?.questions;
        const currentQs = qData ? [qData.tot, qData.ranking, qData.text] : [FALLBACK_QUESTIONS.tot, FALLBACK_QUESTIONS.ranking, FALLBACK_QUESTIONS.text];

        setDashboardData({
          answers: answers || [],
          questions: currentQs
        });
      }
    } catch (e: any) {
      console.error("Profil-Fehler:", e);
    } finally {
      setLoading(false);
    }
  }, [dayKey]);

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const { data: { session: s }, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) {
          if (s) {
            setSession(s);
            fetchProfile(s.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Auth-Initialisierungsfehler:", err);
        if (mounted) setLoading(false);
      }
    }
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!mounted) return;
      setSession(s);
      if (s) fetchProfile(s.user.id);
      else {
        setProfile(null);
        setPartnerProfile(null);
        setDashboardData(null);
        setLoading(false);
      }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setPartnerProfile(null);
      setDashboardData(null);
      navigate('/signin', { replace: true });
    } catch (err) {
      console.error("Logout-Fehler:", err);
      window.location.href = '/signin';
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    if (session) {
      setLoading(true); 
      await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', session.user.id);
      await fetchProfile(session.user.id);
      navigate('/dashboard');
    }
  };

  if (loading && !profile) return <LoadingSkeleton />;

  return (
    <Routes>
      <Route path="/signin" element={session && profile ? <Navigate to="/" replace /> : <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto px-4"><div className="bg-aura" /><Login onLogin={() => setLoading(true)} initialMode="login" /></div>} />
      <Route path="/signup" element={session && profile ? <Navigate to="/" replace /> : <div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto px-4"><div className="bg-aura" /><Login onLogin={() => setLoading(true)} initialMode="register" /></div>} />
      <Route path="/reset-password" element={<div className="h-screen w-screen relative bg-[#F8F7FF] overflow-y-auto pt-12 px-4"><div className="bg-aura" /><ResetPassword onComplete={() => navigate('/signin')} /></div>} />
      
      {session && profile ? (
        <Route path="*" element={
          <AppLayout profile={profile} partnerProfile={partnerProfile} showLockedModal={showLockedModal} setShowLockedModal={setShowLockedModal}>
            <Routes>
              <Route path="/onboarding" element={<Onboarding onComplete={handleOnboardingComplete} />} />
              <Route path="/dashboard" element={<Dashboard 
                userName={profile.display_name} 
                userAvatar={profile.avatar_url} 
                partnerName={partnerProfile?.display_name || 'Partner'} 
                partnerAvatar={partnerProfile?.avatar_url}
                partnerId={profile.partner_id}
                dashboardData={dashboardData}
                onStartQuestions={() => {
                  if (!profile.partner_id) setShowLockedModal(true);
                  else navigate('/questions');
                }} 
              />} />
              <Route path="/questions" element={profile.partner_id ? <Questions userName={profile.display_name} onComplete={() => window.location.reload()} /> : <Navigate to="/dashboard" replace />} />
              <Route path="/profile" element={<Profile profile={profile} partnerProfile={partnerProfile} onLogout={handleLogout} />} />
              <Route path="/" element={profile.onboarding_completed ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />} />
            </Routes>
          </AppLayout>
        } />
      ) : (
        <Route path="*" element={!loading ? <Navigate to="/signin" replace /> : <LoadingSkeleton />} />
      )}
    </Routes>
  );
}
