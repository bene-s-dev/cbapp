import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { POOL, Question } from '../constants/questions';
import Sortable from 'sortablejs';
import confetti from 'canvas-confetti';

interface QuestionsProps {
  userName: string;
  onComplete: () => void;
}

export default function Questions({ userName, onComplete }: QuestionsProps) {
  const [step, setStep] = useState(0);
  const [dailyQs, setDailyQs] = useState<Question[]>([]);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTot, setSelectedTot] = useState<string | null>(null);
  const [textVal, setTextVal] = useState('');
  const sortableRef = useRef<HTMLDivElement>(null);
  const sortableInstance = useRef<Sortable | null>(null);

  const dayKey = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadDailyQuestions();
  }, []);

  useEffect(() => {
    if (dailyQs[step]?.o.length > 2 && sortableRef.current) {
      if (sortableInstance.current) sortableInstance.current.destroy();
      sortableInstance.current = new Sortable(sortableRef.current, {
        animation: 300,
        ghostClass: 'sortable-ghost',
        forceFallback: true,
        fallbackTolerance: 3,
        onEnd: () => {
          updateRankingNumbers();
        }
      });
    }
    return () => {
      if (sortableInstance.current) sortableInstance.current.destroy();
    };
  }, [step, dailyQs]);

  const updateRankingNumbers = () => {
    const tags = document.querySelectorAll('.rank-tag');
    tags.forEach((tag, idx) => {
      (tag as HTMLElement).innerText = (idx + 1).toString();
    });
  };

  const loadDailyQuestions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const seed = parseInt(dayKey.replace(/-/g, ''));
    const getSeeded = (arr: any[], s: number) => arr[s % arr.length];

    setDailyQs([
      getSeeded(POOL.tot, seed),
      getSeeded(POOL.ranking, seed),
      getSeeded(POOL.text, seed)
    ]);
    setLoading(false);
  };

  const handleNext = () => {
    const q = dailyQs[step];
    let val = '';

    if (q.o.length === 2) {
      val = selectedTot || '';
    } else if (q.o.length > 2) {
      const cards = document.querySelectorAll('.rank-card-text');
      val = Array.from(cards).map(s => (s as HTMLElement).innerText).join(" > ");
    } else {
      val = textVal.trim();
    }

    if (!val) {
      alert("Antwort fehlt! ❤️");
      return;
    }

    const newResults = [...results, val];
    setResults(newResults);

    if (step < 2) {
      setStep(step + 1);
      setSelectedTot(null);
      setTextVal('');
    } else {
      submit(newResults);
    }
  };

  const submit = async (finalResults: string[]) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const signature = dailyQs.map(q => `[${q.q}]`).join("");
    const finalChoice = finalResults.join(" | ") + " " + signature;

    const { error } = await supabase.from('answers').insert([{ 
      user_id: session.user.id, 
      choice: finalChoice, 
      day_key: dayKey 
    }]);
    
    if (error) {
      alert("Fehler beim Speichern!");
    } else { 
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); 
      onComplete();
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-8 text-center animate-pulse text-[#2D264B] font-bold">
      Fragen werden geladen...
    </div>
  );

  const q = dailyQs[step];

  return (
    <div className="flex flex-col h-full animate-entrance">
      <div className="flex-1 overflow-y-auto">
        <div className="prog-dots mb-8">
          {[0, 1, 2].map(i => (
            <div key={i} className={`dot ${i === step ? 'active' : (i < step ? 'done' : '')}`}></div>
          ))}
        </div>
        
        <div className="info-hint mb-6 bg-purple-50 text-[var(--secondary)] border-purple-100">
          <span>💡</span> <span className="text-sm">{q.h}</span>
        </div>
        
        <h2 className="text-3xl font-bold mb-8 text-[#2D264B]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{q.q}</h2>

        <div id="quiz-input" className="space-y-4 pb-12">
          {q.o.length === 2 && (
            <div className="tot-grid">
              {q.o.map((o, i) => (
                <div 
                  key={i} 
                  className={`tot-box bg-white border-[#edf2f7] text-[#4A4468] ${selectedTot === o ? 'selected !bg-[var(--primary)] !text-white !border-[var(--primary)]' : ''} shadow-sm`}
                  onClick={() => setSelectedTot(o)}
                >
                  {o}
                </div>
              ))}
            </div>
          )}

          {q.o.length > 2 && (
            <div ref={sortableRef} className="space-y-3">
              {q.o.map((o, i) => (
                <div key={i} className="rank-card bg-white border-[#edf2f7] text-[#4A4468] shadow-sm">
                  <span className="rank-tag bg-[var(--secondary)] text-white">{i + 1}</span>
                  <span className="rank-card-text font-bold">{o}</span>
                </div>
              ))}
            </div>
          )}

          {q.o.length === 0 && (
            <textarea 
              className="textarea-custom text-[#4A4468] bg-white border-[#edf2f7] shadow-sm placeholder:text-gray-300"
              placeholder="Deine Gedanken..."
              value={textVal}
              onChange={(e) => setTextVal(e.target.value)}
              autoFocus
            />
          )}
        </div>
      </div>

      <div className="pb-4 pt-4 mt-auto">
        <button 
          onClick={handleNext}
          className="btn-action w-full"
        >
          {step < 2 ? "Weiter ✨" : "Teilen ❤️"}
        </button>
      </div>
    </div>
  );
}
