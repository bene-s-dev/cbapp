import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GREETINGS, POOL, Question } from '../constants/questions';

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
  const [greeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [showComparison, setShowComparison] = useState(false);

  const dayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // 1. Profil laden, um partner_id zu finden
    const { data: profile } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', session.user.id)
      .single();

    // 2. Antworten für heute laden (eigene und partner)
    const userIds = [session.user.id];
    if (profile?.partner_id) userIds.push(profile.partner_id);

    const { data: answers } = await supabase
      .from('answers')
      .select('*')
      .in('user_id', userIds)
      .eq('day_key', dayKey);

    const me = answers?.find(a => a.user_id === session.user.id);
    const other = profile?.partner_id ? answers?.find(a => a.user_id === profile.partner_id) : null;

    if (me) {
      setMeAnswered(true);
      setMyAnswers(me.choice.split(" [")[0].split(" | "));
      setShowComparison(true);
    }

    if (other) {
      setPartnerAnswered(true);
      setPartnerAnswers(other.choice.split(" [")[0].split(" | "));
    }

    await loadDailyQuestions(session.user.id);
    setLoading(false);
  };

  const loadDailyQuestions = async (userId: string) => {
    const { data: allMyAnswers } = await supabase
      .from('answers')
      .select('choice')
      .eq('user_id', userId);
    
    const usedTexts = allMyAnswers ? allMyAnswers.map(a => a.choice) : [];
    const filterPool = (p: Question[]) => p.filter(q => !usedTexts.some(used => used.includes(q.q)));

    const availableTot = filterPool(POOL.tot);
    const availableRanking = filterPool(POOL.ranking);
    const availableText = filterPool(POOL.text);

    if (availableTot.length === 0 || availableRanking.length === 0 || availableText.length === 0) {
      return;
    }

    const seed = parseInt(dayKey.replace(/-/g, ''));
    const shuffle = (array: any[]) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };
    const getSeeded = (arr: any[], s: number) => arr[s % arr.length];

    setDailyQs([
      getSeeded(shuffle(availableTot), seed),
      getSeeded(shuffle(availableRanking), seed),
      getSeeded(shuffle(availableText), seed)
    ]);
  };

  const deleteMyOwn = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    if (window.confirm("Antworten löschen?")) {
      await supabase
        .from('answers')
        .delete()
        .eq('day_key', dayKey)
        .eq('user_id', session.user.id);
      window.location.reload();
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse">Lädt...</div>;

  if (showComparison) {
    return (
      <div className="animate-in fade-in duration-500 pb-20">
        <h2 className="text-3xl font-bold mb-6">Unsere Antworten</h2>
        {dailyQs.map((q, i) => (
          <div key={i} className="mb-6">
            <div className="text-[0.75rem] font-bold text-[var(--muted)] uppercase mb-2.5">{q.q}</div>
            <div className="tot-grid">
              <div className="res-bubble bg-[#f1f0ff]">
                <b>ICH</b>
                {myAnswers[i] || ''}
              </div>
              <div className="res-bubble" style={{ background: partnerAnswered ? '#e3faf3' : '#fff1f1' }}>
                <b>{partnerName.toUpperCase()}</b>
                {partnerAnswered ? partnerAnswers?.[i] : '⌛ Wartet noch...'}
              </div>
            </div>
          </div>
        ))}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-[#f1f2f6] max-w-md mx-auto z-30">
          <button onClick={deleteMyOwn} className="btn-action">
            Gedanken korrigieren 📝
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <h2 className="text-3xl font-bold mb-2">{greeting}{userName}! ❤️</h2>
      <div className="status-box">
        <div className="flex justify-between items-center mb-5">
          <span>Meine Antwort:</span>
          <span className={`status-pill ${meAnswered ? 'pill-green' : 'pill-red'}`}>
            {meAnswered ? 'Fertig ✅' : 'Noch offen'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>{partnerName}:</span>
          <span className={`status-pill ${partnerAnswered ? 'pill-green' : 'pill-red'}`}>
            {partnerAnswered ? 'Fertig ✅' : 'Offen'}
          </span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-[#f1f2f6] max-w-md mx-auto z-30">
        <button 
          onClick={meAnswered ? () => setShowComparison(true) : onStartQuestions} 
          className="btn-action"
        >
          {meAnswered ? "Zu unseren Gedanken ✨" : "Jetzt starten 🚀"}
        </button>
      </div>
    </div>
  );
}
