import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { GREETINGS, FALLBACK_QUESTIONS, Question } from '../constants/questions';
import { Users, Lock, Sparkles, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardProps {
  userName: string;
  partnerName: string;
  onStartQuestions: () => void;
}

export default function Dashboard({ userName, partnerName, onStartQuestions }: DashboardProps) {
  const [meAnswered, setMeAnswered] = useState(false);
  const [partnerAnswered, setPartnerAnswered] = useState(false);
  const [myAnswers, setMyAnswers] = useState<string[]>([]);
  const [partnerAnswers, setPartnerAnswers] = useState<string[] | null>(null);
  const [dailyQs, setDailyQs] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [showComparison, setShowComparison] = useState(false);
  const [hasPartner, setHasPartner] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const dayKey = new Date().toISOString().split('T')[0];

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
        const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-daily-questions');
        
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
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse text-[#2D264B]">
      <div className="w-12 h-12 bg-purple-50 rounded-2xl mb-4" />
      <p className="font-bold">Lädt...</p>
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
          
          <h2 className="text-3xl font-bold mb-8 text-[#2D264B]">Unsere Gedanken</h2>
          
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
                    <b>{(partnerName || 'Partner').toUpperCase()}</b>
                    <span className={`font-medium ${!partnerAnswered ? 'text-purple-200 italic' : ''}`}>
                      {partnerAnswered ? partnerAnswers?.[i] : 'Wartet...'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="pb-32 pt-6">
          <button onClick={deleteMyOwn} className="btn-secondary w-full text-sm">
            Antworten korrigieren 📝
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-entrance flex flex-col h-full">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-[#2D264B] leading-tight">
          {greeting}<br/>
          <span className="text-[var(--secondary)]">{userName}</span>! ❤️
        </h2>
      </div>
      
      {!hasPartner ? (
        <div className="status-box bg-purple-50/50 border-purple-100 flex flex-col items-center text-center p-8">
          <div className="w-14 h-14 bg-white rounded-3xl flex items-center justify-center mb-5 shadow-sm text-[var(--secondary)]">
            <Users className="w-7 h-7" />
          </div>
          <p className="font-bold text-lg mb-2 text-[#2D264B]">Partner verknüpfen</p>
          <p className="text-sm text-[var(--text)] opacity-80 mb-6 leading-relaxed">
            Verknüpfe dich mit deinem Lieblingsmenschen, um gemeinsam in den Tag zu starten.
          </p>
          <button 
            onClick={() => navigate('/profile')}
            className="text-sm font-bold text-[var(--secondary)] underline underline-offset-4 decoration-2"
          >
            Jetzt Code teilen
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="status-box flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${meAnswered ? 'bg-[var(--accent-green)] shadow-[0_0_10px_rgba(0,184,148,0.4)]' : 'bg-[var(--primary)] shadow-[0_0_10px_rgba(255,138,138,0.4)]'}`} />
              <span className="font-bold">Meine Antwort</span>
            </div>
            <span className={`status-pill ${meAnswered ? 'pill-green' : 'pill-red'}`}>
              {meAnswered ? 'Fertig' : 'Offen'}
            </span>
          </div>
          
          <div className="status-box flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${partnerAnswered ? 'bg-[var(--accent-green)] shadow-[0_0_10px_rgba(0,184,148,0.4)]' : 'bg-purple-100'}`} />
              <span className="font-bold">{partnerName || 'Partner'}</span>
            </div>
            <span className={`status-pill ${partnerAnswered ? 'pill-green' : 'bg-purple-50 text-purple-200'}`}>
              {partnerAnswered ? 'Fertig' : 'Wartet'}
            </span>
          </div>
        </div>
      )}

      {generating && (
        <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-[var(--secondary)] uppercase tracking-widest animate-pulse">
          <Sparkles className="w-4 h-4" /> KI generiert neue Fragen
        </div>
      )}

      <div className="mt-auto pb-4">
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
            disabled
            className="btn-action opacity-50 cursor-not-allowed"
          >
            <Lock className="w-4 h-4" /> Start gesperrt
          </button>
        )}
      </div>
    </div>
  );
}
