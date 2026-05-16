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

    const { data: profile } = await supabase
      .from('profiles')
      .select('partner_id')
      .eq('id', session.user.id)
      .single();

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
    }

    if (other) {
      setPartnerAnswered(true);
      setPartnerAnswers(other.choice.split(" [")[0].split(" | "));
    }

    loadDailyQuestions();
    setLoading(false);
  };

  const loadDailyQuestions = () => {
    const seed = parseInt(dayKey.replace(/-/g, ''));
    const getSeeded = (arr: any[], s: number) => arr[s % arr.length];

    setDailyQs([
      getSeeded(POOL.tot, seed),
      getSeeded(POOL.ranking, seed),
      getSeeded(POOL.text, seed)
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

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-8 text-center animate-pulse text-[#2D264B] font-bold">
      Lädt...
    </div>
  );

  if (showComparison) {
    return (
      <div className="animate-entrance flex flex-col h-full">
        <div className="flex-1 overflow-y-auto pb-12">
          <button 
            onClick={() => setShowComparison(false)}
            className="mb-4 text-xs font-bold text-[#A29BFE] uppercase tracking-widest hover:underline"
          >
            ← Zurück zur Übersicht
          </button>
          <h2 className="text-3xl font-bold mb-6 text-[#2D264B]">Unsere Antworten</h2>
          {dailyQs.map((q, i) => (
            <div key={i} className="mb-6">
              <div className="text-[0.75rem] font-bold text-[#8E89AA] uppercase mb-2.5">{q.q}</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="res-bubble bg-white border-[#edf2f7] text-[#4A4468] p-4 rounded-2xl shadow-sm">
                  <b className="text-[#A29BFE] block text-[10px] mb-1">ICH</b>
                  {myAnswers[i] || ''}
                </div>
                <div className="res-bubble bg-white border-[#edf2f7] text-[#4A4468] p-4 rounded-2xl shadow-sm">
                  <b className="text-[#FF8A8A] block text-[10px] mb-1">{(partnerName || 'Partner').toUpperCase()}</b>
                  {partnerAnswered ? partnerAnswers?.[i] : '⌛ Wartet...'}
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pb-32 pt-4">
          <button onClick={deleteMyOwn} className="btn-secondary w-full py-4 text-sm bg-white border-[#edf2f7] text-[#4A4468] shadow-sm">
            Gedanken korrigieren 📝
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-entrance flex flex-col h-full">
      <h2 className="text-3xl font-bold mb-2 text-[#2D264B]">{greeting}{userName}! ❤️</h2>
      <div className="status-box bg-white border-[#edf2f7] text-[#4A4468] p-6 rounded-[28px] mb-8 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <span>Meine Antwort:</span>
          <span className={`status-pill ${meAnswered ? 'pill-green' : 'pill-red'}`}>
            {meAnswered ? 'Fertig ✅' : 'Noch offen'}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span>{partnerName || 'Partner'}:</span>
          <span className={`status-pill ${partnerAnswered ? 'pill-green' : 'pill-red'}`}>
            {partnerAnswered ? 'Fertig ✅' : 'Offen'}
          </span>
        </div>
      </div>

      <div className="mt-auto pb-32">
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
