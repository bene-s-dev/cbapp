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
  partnerId?: string | null;
  onStartQuestions: () => void;
}

export default function Dashboard({ userName, userAvatar, partnerName, partnerAvatar, partnerId, onStartQuestions }: DashboardProps) {
  const [meAnswered, setMeAnswered] = useState(false);
  const [partnerAnswered, setPartnerAnswered] = useState(false);
  const [myAnswers, setMyAnswers] = useState<string[]>([]);
  const [partnerAnswers, setPartnerAnswers] = useState<string[] | null>(null);
  const [dailyQs, setDailyQs] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComparison, setShowComparison] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  const navigate = useNavigate();
  const dayKey = getDailyKey();
  const hasPartner = !!partnerId;

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeUntilReset();
      setCountdown({ hours: remaining.hours, minutes: remaining.minutes, seconds: remaining.seconds });
      if (remaining.totalSeconds === 0) window.location.reload();
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = React.useMemo(() => {
    const seed = new Date(dayKey).getDate() + new Date(dayKey).getMonth() + new Date(dayKey).getFullYear();
    return GREETINGS[seed % GREETINGS.length];
  }, [dayKey]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const userIds = [session.user.id];
      if (partnerId) userIds.push(partnerId);

      const [answersRes, questionsRes] = await Promise.all([
        supabase.from('answers').select('*').in('user_id', userIds).eq('day_key', dayKey),
        supabase.from('daily_questions').select('questions').eq('day_key', dayKey).maybeSingle()
      ]);

      if (answersRes.error) throw answersRes.error;
      const answers = answersRes.data;
      const me = answers?.find(a => a.user_id === session.user.id);
      const other = partnerId ? answers?.find(a => a.user_id === partnerId) : null;

      if (me) {
        setMeAnswered(true);
        setMyAnswers(me.choice.split(" [")[0].split(" | "));
      }
      if (other) {
        setPartnerAnswered(true);
        setPartnerAnswers(other.choice.split(" [")[0].split(" | "));
      }
      if (questionsRes.data?.questions) {
        const q = questionsRes.data.questions;
        setDailyQs([q.tot, q.ranking, q.text]);
      } else {
        setDailyQs([FALLBACK_QUESTIONS.tot, FALLBACK_QUESTIONS.ranking, FALLBACK_QUESTIONS.text]);
      }
    } catch (err: any) {
      console.error("Dashboard Error:", err);
      setError("Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [dayKey, partnerId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const deleteMyOwn = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    if (window.confirm("Deine heutigen Antworten löschen und neu starten?")) {
      try {
        await supabase.from('answers').delete().eq('day_key', dayKey).eq('user_id', session.user.id);
        window.location.reload();
      } catch (err) {
        alert("Fehler beim Löschen der Antworten.");
      }
    }
  };

  if (loading) return (
    <div className="flex-1 flex flex-col animate-entrance">
      <div className="flex items-center justify-between mb-8 pt-1 relative min-h-[48px]">
        <div className="w-24 h-8 rounded-xl skeleton" />
        <div className="absolute left-1/2 -translate-x-1/2 flex -space-x-4">
          <div className="w-16 h-16 rounded-[1.5rem] skeleton border-2 border-[#F8F7FF]" />
          <div className="w-16 h-16 rounded-[1.5rem] skeleton border-2 border-[#F8F7FF]" />
        </div>
        <div className="w-12 h-12" />
      </div>
      <div className="mb-6 space-y-2">
        <div className="w-32 h-7 rounded-xl skeleton" />
        <div className="w-48 h-7 rounded-xl skeleton" />
      </div>
      <div className="space-y-4 mb-8">
        <div className="h-20 rounded-[28px] skeleton" />
        <div className="h-20 rounded-[28px] skeleton" />
      </div>
      <div className="mt-auto pb-6 pt-2"><div className="h-16 rounded-[22px] skeleton" /></div>
    </div>
  );

  if (error) return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" /><p className="font-bold text-red-600">{error}</p>
      <button onClick={loadData} className="btn-secondary py-3 px-8 text-sm">Erneut versuchen</button>
    </div>
  );

  if (showComparison) {
    return (
      <div className="animate-entrance flex flex-col h-full">
        <div className="flex-1 overflow-hidden flex flex-col">
          <button onClick={() => setShowComparison(false)} className="mb-6 text-xs font-bold text-[var(--secondary)] uppercase tracking-widest flex items-center gap-2">← Zurück</button>
          <h2 className="text-2xl font-bold mb-6 text-[#1F1939]">Unsere Gedanken</h2>
          <div className="space-y-6 flex-1">
            {dailyQs.map((q, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[9px] font-bold text-[#8E89AA] uppercase tracking-wider mb-2 px-1">{q.q}</div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="res-bubble p-4"><b>ICH</b><span className="font-medium text-xs">{myAnswers[i] || '—'}</span></div>
                  <div className="res-bubble p-4"><b>{partnerName.toUpperCase()}</b><span className={`font-medium text-xs ${!partnerAnswered ? 'text-purple-200 italic' : ''}`}>{partnerAnswered ? partnerAnswers?.[i] : 'Wartet...'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pb-6 pt-4"><button onClick={deleteMyOwn} className="btn-secondary w-full text-xs">Antworten korrigieren 📝</button></div>
      </div>
    );
  }

  return (
    <div className="animate-entrance flex flex-col flex-1 overflow-visible">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8 pt-1 relative min-h-[82px]">
          <h1 className="text-2xl font-bold text-[var(--text-main)] tracking-tight select-none" style={{ fontFamily: 'Fraunces, serif' }}>Bisou</h1>
          
          <div className="absolute left-1/2 -translate-x-1/2 flex items-start">
            {/* My Avatar & Name */}
            <div className="flex flex-col items-center relative z-20">
              <div className="w-16 h-16 rounded-[1.5rem] bg-white border-2 border-white flex items-center justify-center overflow-hidden shadow-sm">
                {userAvatar ? (<img src={userAvatar} alt="U" className="w-full h-full object-cover" />) : (<Camera className="w-6 h-6 text-purple-200" />)}
              </div>
              <span className="text-[8px] font-bold text-[var(--muted)] mt-1.5 uppercase tracking-[0.15em] max-w-[64px] truncate text-center">
                {userName.split(' ')[0]}
              </span>
            </div>

            {/* Partner Avatar & Name */}
            <div className="flex flex-col items-center relative z-10 -ml-4">
              <div className={`w-16 h-16 rounded-[1.5rem] border-2 border-white flex items-center justify-center overflow-hidden shadow-sm ${hasPartner ? 'bg-white' : 'bg-purple-50/50 border-dashed border-purple-200'}`}>
                {partnerAvatar ? (<img src={partnerAvatar} alt="P" className="w-full h-full object-cover" />) : hasPartner ? (<Camera className="w-6 h-6 text-purple-200" />) : (<Users className="w-6 h-6 text-purple-200" />)}
              </div>
              <span className="text-[8px] font-bold text-[var(--muted)] mt-1.5 uppercase tracking-[0.15em] max-w-[64px] truncate text-center">
                {hasPartner ? partnerName.split(' ')[0] : 'Partner'}
              </span>
            </div>

            {/* Floating Heart */}
            {hasPartner && (
              <div className="absolute left-1/2 -translate-x-1/2 top-10 z-30 shadow-sm border border-white w-6 h-6 rounded-full bg-red-50 flex items-center justify-center">
                <HeartIcon className="w-3 h-3 text-[var(--primary)] fill-current" />
              </div>
            )}
          </div>
          
          <div className="w-12 h-12" />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-bold text-[#1F1939] leading-tight">{greeting}<br/><span className="text-[var(--secondary)] whitespace-nowrap">{userName}</span>! ❤️</h2>
        </div>
        
        {!hasPartner ? (
          <div className="status-box flex flex-col items-center text-center p-6 mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-3 text-[var(--secondary)]">
              <Users className="w-6 h-6" />
            </div>
            <p className="font-bold text-base mb-1 text-[var(--text-main)]">Der erste Schritt</p>
            <p className="text-xs text-[var(--text)] opacity-90 mb-4 leading-relaxed px-2">
              Verknüpfe dich jetzt mit deinem Bisou-Partner:
            </p>
            <button 
              onClick={() => navigate('/profile')}
              className="btn-secondary py-2.5 px-6 text-xs w-auto shadow-sm"
            >
              Jetzt Code teilen ✨
            </button>
          </div>
        ) : (
          <div className="space-y-2 mb-4">
            <div className="status-box flex-row items-center justify-between p-3.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${meAnswered ? 'bg-[var(--accent-green)]' : 'bg-[var(--primary)]'}`} />
                <span className="font-bold text-xs text-[var(--text-main)]">Meine Antwort</span>
              </div>
              <span className={`status-pill scale-75 ${meAnswered ? 'pill-green' : 'pill-red'}`}>
                {meAnswered ? 'Fertig' : 'Offen'}
              </span>
            </div>

            <div className="status-box flex-row items-center justify-between p-3.5">
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${partnerAnswered ? 'bg-[var(--accent-green)]' : 'bg-purple-200'}`} />
                <span className="font-bold whitespace-nowrap text-xs text-[var(--text-main)]">{partnerName}</span>
              </div>
              <span className={`status-pill scale-75 ${partnerAnswered ? 'pill-green' : 'bg-purple-50 text-purple-300 border border-purple-100'}`}>
                {partnerAnswered ? 'Fertig' : 'Wartet'}
              </span>
            </div>

            <div className="status-box flex-row items-center justify-between p-3.5 bg-purple-50/30 border-dashed">
              <div className="flex items-center gap-2.5">
                <Clock className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span className="font-bold text-[9px] text-[var(--muted)] uppercase tracking-wider">Nächste Fragen</span>
              </div>
              <span className="font-mono font-bold text-xs text-[var(--secondary)]">
                {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

      </div>

      <div className="pb-6 pt-1">
        <button onClick={meAnswered ? () => setShowComparison(true) : onStartQuestions} className="btn-action">
          {meAnswered ? "Zu unseren Gedanken ✨" : (hasPartner ? "Jetzt starten 🚀" : <><Lock className="w-4 h-4" /> Start gesperrt</>)}
        </button>
      </div>
    </div>
  );
}
