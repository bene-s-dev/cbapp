import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { GREETINGS, Question } from '../constants/questions';
import { Users, Lock, Heart as HeartIcon, Clock, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDailyKey, getTimeUntilReset } from '../lib/dateUtils';
import { useDialog } from './DialogProvider';

interface DashboardProps {
  userName: string;
  userAvatar?: string;
  partnerName: string;
  partnerAvatar?: string | null;
  partnerId?: string | null;
  dashboardData: any;
  onStartQuestions: () => void;
}

export default function Dashboard({ 
  userName, 
  userAvatar, 
  partnerName, 
  partnerAvatar, 
  partnerId, 
  dashboardData,
  onStartQuestions 
}: DashboardProps) {
  const { showAlert, showConfirm } = useDialog();
  const [showComparison, setShowComparison] = useState(false);
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

  const greeting = useMemo(() => {
    const seed = new Date(dayKey).getDate() + new Date(dayKey).getMonth() + new Date(dayKey).getFullYear();
    return GREETINGS[seed % GREETINGS.length];
  }, [dayKey]);

  const { meAnswered, partnerAnswered, myAnswers, partnerAnswers, dailyQs } = useMemo(() => {
    if (!dashboardData) return { meAnswered: false, partnerAnswered: false, myAnswers: [], partnerAnswers: [], dailyQs: [] };
    const { answers, questions } = dashboardData;
    const me = answers.find((a: any) => a.user_id !== partnerId);
    const other = partnerId ? answers.find((a: any) => a.user_id === partnerId) : null;
    return {
      meAnswered: !!me,
      partnerAnswered: !!other,
      myAnswers: me ? me.choice.split(" [")[0].split(" | ") : [],
      partnerAnswers: other ? other.choice.split(" [")[0].split(" | ") : null,
      dailyQs: questions as Question[]
    };
  }, [dashboardData, partnerId]);

  const deleteMyOwn = async () => {
    showConfirm(
      "Möchtest du deine heutigen Antworten wirklich löschen und neu starten?",
      async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          await supabase.from('answers').delete().eq('day_key', dayKey).eq('user_id', user.id);
        } catch (err) {
          showAlert("Fehler beim Löschen der Antworten.", "error");
        }
      },
      { title: "Antworten löschen", confirmLabel: "Ja, löschen", cancelLabel: "Abbrechen" }
    );
  };

  if (!dashboardData) return (
    <div className="flex-1 flex flex-col animate-entrance">
      <div className="relative h-[110px] mb-8">
        <div className="absolute left-1/2 -translate-x-1/2 flex -space-x-6">
          <div className="w-20 h-20 rounded-[2rem] skeleton border-2 border-white" />
          <div className="w-20 h-20 rounded-[2rem] skeleton border-2 border-white" />
        </div>
      </div>
      <div className="mb-6 space-y-2">
        <div className="w-32 h-7 rounded-xl skeleton" />
        <div className="w-48 h-7 rounded-xl skeleton" />
      </div>
      <div className="space-y-4 mb-8">
        <div className="h-20 rounded-[24px] skeleton" />
        <div className="h-20 rounded-[24px] skeleton" />
      </div>
      <div className="mt-auto pb-6 pt-2"><div className="h-16 rounded-[22px] skeleton" /></div>
    </div>
  );

  if (showComparison) {
    return (
      <div className="animate-entrance flex flex-col h-full overflow-visible">
        <div className="flex-1 overflow-visible flex flex-col">
          <button onClick={() => setShowComparison(false)} className="mb-8 text-[10px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] flex items-center gap-2 group">
            <span className="group-active:-translate-x-1 transition-transform">←</span> Zurück zum Dashboard
          </button>
          <h2 className="text-3xl font-black mb-8 text-[#1F1939] tracking-tight">Unsere Gedanken</h2>
          <div className="space-y-8 flex-1 overflow-visible">
            {dailyQs.map((q, i) => (
              <div key={i} className="animate-in fade-in slide-in-from-bottom-2">
                <div className="text-[10px] font-black text-[#8E89AA] uppercase tracking-[0.2em] mb-3 px-1">{q.q}</div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="res-bubble p-5 border-2 border-[var(--card-border)] rounded-[2rem] bg-white shadow-sm">
                    <b className="text-[9px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] mb-2 block">ICH</b>
                    <span className="font-bold text-xs text-[var(--text-main)] leading-relaxed">{myAnswers[i] || '—'}</span>
                  </div>
                  <div className={`res-bubble p-5 border-2 border-[var(--card-border)] rounded-[2rem] bg-white shadow-sm ${!partnerAnswered ? 'bg-purple-50/20 border-dashed opacity-60' : ''}`}>
                    <b className="text-[9px] font-black text-[#8E89AA] uppercase tracking-[0.2em] mb-2 block">{partnerName.toUpperCase()}</b>
                    <span className={`font-bold text-xs text-[var(--text-main)] leading-relaxed ${!partnerAnswered ? 'text-purple-200 italic' : ''}`}>
                      {partnerAnswered ? partnerAnswers?.[i] : 'Wartet...'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="pb-6 pt-6">
          <button onClick={deleteMyOwn} className="btn-secondary w-full text-xs font-black uppercase tracking-widest py-4 border-2 border-[var(--card-border)]">
            Antworten korrigieren 📝
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-entrance flex flex-col flex-1 overflow-visible">
      <div className="flex-1 flex flex-col">
        {/* Avatars Section */}
        <div className="relative h-[110px] mb-10 pointer-events-none">
          <div className="absolute left-1/2 -translate-x-1/2 flex items-start pointer-events-auto mt-4">
            {/* Partner Avatar & Name (Left & Front) */}
            <div className="flex flex-col items-center relative z-20">
              <div className={`w-20 h-20 rounded-[2.2rem] border-2 border-white flex items-center justify-center overflow-hidden shadow-md ${hasPartner ? 'bg-white' : 'bg-purple-50/50 border-dashed border-purple-200'}`}>
                {partnerAvatar ? (<img src={partnerAvatar} alt="P" className="w-full h-full object-cover" />) : hasPartner ? (<Users className="w-8 h-8 text-purple-200" />) : (<Users className="w-8 h-8 text-purple-200" />)}
              </div>
              <span className="text-[10px] font-black text-[var(--muted)] mt-2 uppercase tracking-[0.2em] max-w-[80px] truncate text-center">
                {hasPartner ? partnerName.split(' ')[0] : 'Partner'}
              </span>
            </div>

            {/* My Avatar & Name (Right & Back) */}
            <div className="flex flex-col items-center relative z-10 -ml-6">
              <div className="w-20 h-20 rounded-[2.2rem] bg-white border-2 border-white flex items-center justify-center overflow-hidden shadow-md">
                {userAvatar ? (<img src={userAvatar} alt="U" className="w-full h-full object-cover" />) : (<Users className="w-8 h-8 text-purple-200" />)}
              </div>
              <span className="text-[10px] font-black text-[var(--muted)] mt-2 uppercase tracking-[0.2em] max-w-[80px] truncate text-center">
                {userName.split(' ')[0]}
              </span>
            </div>

            {/* Floating Heart */}
            {hasPartner && (
              <div className="absolute left-1/2 -translate-x-1/2 top-12 z-30 shadow-md border-2 border-white w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
                <HeartIcon className="w-4 h-4 text-[var(--primary)] fill-current" />
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-black text-[#1F1939] leading-tight tracking-tight">
            {greeting} <span className="text-[var(--secondary)]">{userName}</span>! ❤️
          </h2>
        </div>
        
        {!hasPartner ? (
          <div className="status-box flex flex-col items-center text-center p-6 mb-2">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-3 text-[var(--secondary)] border border-purple-100"><Users className="w-6 h-6" /></div>
            <p className="font-black text-base mb-1 text-[var(--text-main)]">Der erste Schritt</p>
            <p className="text-[10px] text-[var(--muted)] font-medium mb-4 leading-relaxed px-4">Verknüpfe dich jetzt mit deinem Bisou-Partner:</p>
            <button onClick={() => navigate('/profile')} className="btn-action py-2.5 px-6 text-[10px] font-black uppercase tracking-widest w-auto shadow-sm">Bisou-Partner verbinden</button>
          </div>
        ) : (
          <div className="status-box p-4 mb-2 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`status-dot ${meAnswered ? 'status-green' : 'status-red'}`} />
                  <span className="font-black text-xs text-[var(--text-main)] uppercase tracking-wide">Meine Antwort</span>
                </div>
                <span className={`px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-wider border-2 ${meAnswered ? 'bg-green-50 text-[var(--accent-green)] border-green-100' : 'bg-red-50 text-[var(--primary)] border-red-100'}`}>
                  {meAnswered ? 'Fertig' : 'Offen'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`status-dot ${partnerAnswered ? 'status-green' : 'status-orange'}`} />
                  <span className="font-black text-xs text-[var(--text-main)] uppercase tracking-wide">{partnerName}</span>
                </div>
                <span className={`px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-wider border-2 ${partnerAnswered ? 'bg-green-50 text-[var(--accent-green)] border-green-100' : 'bg-orange-50 text-orange-500 border-orange-100'}`}>
                  {partnerAnswered ? 'Fertig' : 'Wartet'}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-purple-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[var(--muted)]" />
                <span className="text-[9px] font-black text-[var(--muted)] uppercase tracking-widest">Neue Fragen in:</span>
              </div>
              <span className="font-mono font-black text-xs text-[var(--secondary)] tracking-widest">
                {String(countdown.hours).padStart(2, '0')}:{String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
        )}

        <p className="text-[8px] font-black text-center text-[var(--muted)] flex items-center justify-center gap-1.5 uppercase tracking-[0.2em] opacity-50 mt-0.5">
          <Sparkles className="w-2.5 h-2.5" /> Fragen generiert von Gemini
        </p>
      </div>

      <div className="pb-3 pt-0">
        <button onClick={onStartQuestions} className="btn-action py-4 font-black text-base">
          {meAnswered ? "Antworten ansehen ✨" : (hasPartner ? "Jetzt starten 🚀" : <><Lock className="w-4 h-4" /> Start gesperrt</>)}
        </button>
      </div>
    </div>
  );
}
