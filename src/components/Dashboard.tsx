import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GREETINGS, FALLBACK_QUESTIONS, Question } from '../constants/questions';
import { Users, Lock, Sparkles, AlertCircle, Camera, Heart as HeartIcon, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDailyKey, getTimeUntilReset } from '../lib/dateUtils';

interface DashboardProps {
  userName: string;
  userAvatar?: string;
  partnerName: string;
  partnerAvatar?: string | null;
  onStartQuestions: () => void;
}

export default function Dashboard({ userName, userAvatar, partnerName, partnerAvatar, onStartQuestions }: DashboardProps) {
  const [meAnswered, setMeAnswered] = useState(false);
  const [partnerAnswered, setPartnerAnswered] = useState(false);
  const [myAnswers, setMyAnswers] = useState<string[]>([]);
  const [partnerAnswers, setPartnerAnswers] = useState<string[] | null>(null);
  const [dailyQs, setDailyQs] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [hasPartner, setHasPartner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const navigate = useNavigate();
  const dayKey = getDailyKey();

  // Update countdown every second
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeUntilReset();
      setCountdown({ hours: remaining.hours, minutes: remaining.minutes, seconds: remaining.seconds });
      
      // If we hit exactly 0 (or new day key), refresh data
      if (remaining.totalSeconds === 0) {
        window.location.reload();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Daily stable greeting based on the date
  const greeting = React.useMemo(() => {
    const seed = new Date(dayKey).getDate() + new Date(dayKey).getMonth() + new Date(dayKey).getFullYear();
    return GREETINGS[seed % GREETINGS.length];
  }, [dayKey]);

  const loadDailyQuestions = useCallback(async () => {
    try {
      // 1. Check local DB
      const { data, error: fetchError } = await supabase
        .from('daily_questions')
        .select('questions')
        .eq('day_key', dayKey)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data?.questions) {
        const q = data.questions;
        setDailyQs([q.tot, q.ranking, q.text]);
      } else {
        // 2. Trigger Edge Function
        setGenerating(true);
        const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-daily-questions', {
          body: { dayKey }
        });
        
        if (!aiError && aiData?.questions) {
          const q = aiData.questions;
          setDailyQs([q.tot, q.ranking, q.text]);
        } else {
          console.warn("AI Generation failed, using fallbacks:", aiError);
          setDailyQs([
            FALLBACK_QUESTIONS.tot,
            FALLBACK_QUESTIONS.ranking,
            FALLBACK_QUESTIONS.text
          ]);
        }
      }
    } catch (err) {
      console.error("Error loading daily questions:", err);
      setDailyQs([
        FALLBACK_QUESTIONS.tot,
        FALLBACK_QUESTIONS.ranking,
        FALLBACK_QUESTIONS.text
      ]);
    } finally {
      setGenerating(false);
    }
  }, [dayKey]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const isLinked = !!profile?.partner_id;
      setHasPartner(isLinked);

      const userIds = [session.user.id];
      if (isLinked) userIds.push(profile.partner_id);

      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select('*')
        .in('user_id', userIds)
        .eq('day_key', dayKey);

      if (answersError) throw answersError;

      const me = answers?.find(a => a.user_id === session.user.id);
      const other = isLinked ? answers?.find(a => a.user_id === profile.partner_id) : null;

      if (me) {
        setMeAnswered(true);
        // Robust parsing of choices
        setMyAnswers(me.choice.split(" [")[0].split(" | "));
      }

      if (other) {
        setPartnerAnswered(true);
        setPartnerAnswers(other.choice.split(" [")[0].split(" | "));
      }

      await loadDailyQuestions();
    } catch (err: any) {
      console.error("Error loading dashboard data:", err);
      setError("Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [dayKey, loadDailyQuestions]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteMyOwn = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (window.confirm("Deine heutigen Antworten löschen und neu starten?")) {
      try {
        const { error: delError } = await supabase
          .from('answers')
          .delete()
          .eq('day_key', dayKey)
          .eq('user_id', session.user.id);
        
        if (delError) throw delError;
        window.location.reload();
      } catch (err) {
        alert("Fehler beim Löschen.");
      }
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col animate-entrance">
      {/* Header Avatars Skeleton */}
      <div className="flex items-center justify-between mb-8 pt-2 relative min-h-[64px]">
        <div className="w-24 h-8 rounded-xl skeleton" />
        <div className="absolute left-1/2 -translate-x-1/2 flex -space-x-4">
          <div className="w-16 h-16 rounded-[1.5rem] skeleton border-2 border-[#F8F7FF]" />
          <div className="w-16 h-16 rounded-[1.5rem] skeleton border-2 border-[#F8F7FF]" />
        </div>
        <div className="w-16 h-16" />
      </div>

      {/* Greeting Skeleton */}
      <div className="mb-6 space-y-2">
        <div className="w-32 h-7 rounded-xl skeleton" />
        <div className="w-48 h-7 rounded-xl skeleton" />
      </div>

      {/* Status Cards Skeleton */}
      <div className="space-y-4 mb-8">
        <div className="h-20 rounded-[28px] skeleton" />
        <div className="h-20 rounded-[28px] skeleton" />
      </div>

      {/* Button Skeleton */}
      <div className="mt-auto pb-3 pt-2">
        <div className="h-16 rounded-[22px] skeleton" />
      </div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="font-bold text-red-600">{error}</p>
      <button onClick={loadData} className="btn-secondary py-3 px-8 text-sm">Erneut versuchen</button>
    </div>
  );

  if (showComparison) {
    return (
      <div className="animate-entrance flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pb-12">
          <button 
            onClick={() => setShowComparison(false)}
            className="mb-6 text-xs font-bold text-[var(--secondary)] uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-2"
          >
            ← Zurück
          </button>
          
          <h2 className="text-3xl font-bold mb-8 text-[#1F1939]">Unsere Gedanken</h2>
          
          <div className="space-y-8">
            {dailyQs.map((q, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="text-[10px] font-bold text-[#8E89AA] uppercase tracking-wider mb-3 px-1">{q.q}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="res-bubble">
                    <b>ICH</b>
                    <span className="font-medium">{myAnswers[i] || '—'}</span>
                  </div>
                  <div className="res-bubble">
                    <b>{partnerName.toUpperCase()}</b>
                    <span className={`font-medium ${!partnerAnswered ? 'text-purple-200 italic' : ''}`}>
                      {partnerAnswered ? partnerAnswers?.[i] : 'Wartet...'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pb-3 pt-6">
          <button onClick={deleteMyOwn} className="btn-secondary w-full text-sm">
            Antworten korrigieren 📝
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-entrance flex flex-col flex-1">
      <div className="flex-1 flex flex-col">
        {/* Header Section with Left Branding and Centered Avatars */}
        <div className="flex items-center justify-between mb-8 pt-2 relative min-h-[64px]">
          <h1 className="text-3xl font-bold text-[var(--text-main)] tracking-tight select-none" style={{ fontFamily: 'Fraunces, serif' }}>
            Bisou
          </h1>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
            <div className="flex -space-x-4">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white border-2 border-white flex items-center justify-center overflow-hidden relative z-20">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-purple-200" />
                )}
              </div>
              <div className={`w-16 h-16 rounded-[1.5rem] border-2 border-white flex items-center justify-center overflow-hidden relative z-10 ${
                hasPartner ? 'bg-white' : 'bg-purple-50/50 border-dashed border-purple-200'
              }`}>
                {partnerAvatar ? (
                  <img src={partnerAvatar} alt={partnerName} className="w-full h-full object-cover" />
                ) : hasPartner ? (
                  <Camera className="w-6 h-6 text-purple-200" />
                ) : (
                  <Users className="w-6 h-6 text-purple-200" />
                )}
              </div>
            </div>
            
            {hasPartner && (
              <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center -mt-8 -ml-3 relative z-30">
                <HeartIcon className="w-3.5 h-3.5 text-[var(--primary)] fill-current" />
              </div>
            )}
          </div>

          {/* Spacer to balance the layout */}
          <div className="w-16 h-16" />
        </div>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1F1939] leading-tight">
            {greeting}<br/>
            <span className="text-[var(--secondary)] whitespace-nowrap">{userName}</span>! ❤️
          </h2>
        </div>
        
        {!hasPartner ? (
          <div className="status-box bg-white border-purple-100 flex flex-col items-center text-center p-8 mb-6">
            <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 text-[var(--secondary)]">
              <Users className="w-7 h-7" />
            </div>
            <p className="font-bold text-lg mb-2 text-[#1F1939]">Partner verknüpfen</p>
            <p className="text-sm text-[var(--text)] opacity-90 mb-6 leading-relaxed px-2">
              Verknüpfe dich mit deinem Lieblingsmenschen, um gemeinsam in den Tag zu starten.
            </p>
            <button 
              onClick={() => navigate('/profile')}
              className="btn-secondary py-3 px-6 text-sm"
            >
              Jetzt Code teilen ✨
            </button>
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            <div className="status-box flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${meAnswered ? 'bg-[var(--accent-green)]' : 'bg-[var(--primary)]'}`} />
                <span className="font-bold text-sm">Meine Antwort</span>
              </div>
              <span className={`status-pill scale-90 ${meAnswered ? 'pill-green' : 'pill-red'}`}>
                {meAnswered ? 'Fertig' : 'Offen'}
              </span>
            </div>
            
            <div className="status-box flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${partnerAnswered ? 'bg-[var(--accent-green)]' : 'bg-purple-100'}`} />
                <span className="font-bold whitespace-nowrap text-sm">{partnerName}</span>
              </div>
              <span className={`status-pill scale-90 ${partnerAnswered ? 'pill-green' : 'bg-purple-50 text-purple-200'}`}>
                {partnerAnswered ? 'Fertig' : 'Wartet'}
              </span>
            </div>

            <div className="status-box flex items-center justify-between p-4 bg-purple-50/30 border-dashed border-purple-100">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[var(--muted)]" />
                <span className="font-bold text-[10px] text-[var(--muted)] uppercase tracking-wider">Nächste Fragen in</span>
              </div>
              <span className="font-mono font-bold text-sm text-[var(--secondary)]">
                {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        {generating && (
          <div className="mb-6 flex items-center justify-center gap-2 text-[10px] font-bold text-[var(--secondary)] uppercase tracking-widest animate-pulse">
            <Sparkles className="w-3.5 h-3.5" /> KI generiert neue Fragen
          </div>
        )}
      </div>

      <div className="pb-3 pt-2">
        {hasPartner ? (
          <button 
            onClick={meAnswered ? () => setShowComparison(true) : onStartQuestions} 
            className="btn-action"
            disabled={generating}
          >
            {meAnswered ? "Zu unseren Gedanken ✨" : "Jetzt starten 🚀"}
          </button>
        ) : (
          <button 
            onClick={onStartQuestions}
            className="btn-action"
          >
            <Lock className="w-4 h-4" /> Start gesperrt
          </button>
        )}
      </div>
    </div>
  );
}
