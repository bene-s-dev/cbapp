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
          const tags = document.querySelectorAll('.rank-tag');
          tags.forEach((tag, idx) => {
            (tag as HTMLElement).innerText = (idx + 1).toString();
          });
        }
      });
    }
    return () => {
      if (sortableInstance.current) sortableInstance.current.destroy();
    };
  }, [step, dailyQs]);

  const loadDailyQuestions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: allMyAnswers } = await supabase
      .from('answers')
      .select('choice')
      .eq('user_id', session.user.id);
    
    const usedTexts = allMyAnswers ? allMyAnswers.map(a => a.choice) : [];
    const filterPool = (p: Question[]) => p.filter(q => !usedTexts.some(used => used.includes(q.q)));

    const availableTot = filterPool(POOL.tot);
    const availableRanking = filterPool(POOL.ranking);
    const availableText = filterPool(POOL.text);

    if (availableTot.length === 0 || availableRanking.length === 0 || availableText.length === 0) {
      alert("Keine weiteren Fragen verfügbar! ❤️");
      onComplete();
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
    setLoading(false);
  };

  const handleNext = () => {
    const q = dailyQs[step];
    let val = '';

    if (q.o.length === 2) {
      val = selectedTot || '';
    } else if (q.o.length > 2) {
      const cards = document.querySelectorAll('.rank-card span:last-child');
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

  if (loading) return <div className="p-8 text-center animate-pulse">Fragen werden geladen...</div>;

  const q = dailyQs[step];

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="prog-dots">
        {[0, 1, 2].map(i => (
          <div key={i} className={`dot ${i === step ? 'active' : (i < step ? 'done' : '')}`}></div>
        ))}
      </div>
      
      <div className="info-hint">
        <span>💡</span> <span>{q.h}</span>
      </div>
      
      <h2 className="text-2xl font-bold mb-6">{q.q}</h2>

      <div id="quiz-input">
        {q.o.length === 2 && (
          <div className="tot-grid">
            {q.o.map((o, i) => (
              <div 
                key={i} 
                className={`tot-box ${selectedTot === o ? 'selected' : ''}`}
                onClick={() => setSelectedTot(o)}
              >
                {o}
              </div>
            ))}
          </div>
        )}

        {q.o.length > 2 && (
          <div ref={sortableRef}>
            {q.o.map((o, i) => (
              <div key={i} className="rank-card">
                <span className="rank-tag">{i + 1}</span>
                <span>{o}</span>
              </div>
            ))}
          </div>
        )}

        {q.o.length === 0 && (
          <textarea 
            className="textarea-custom"
            placeholder="Deine Gedanken..."
            value={textVal}
            onChange={(e) => setTextVal(e.target.value)}
          />
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white border-t border-[#f1f2f6] max-w-md mx-auto z-30">
        <button 
          onClick={handleNext}
          className="btn-action"
        >
          {step < 2 ? "Weiter ✨" : "Teilen ❤️"}
        </button>
      </div>
    </div>
  );
}
