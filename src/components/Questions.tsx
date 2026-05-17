import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FALLBACK_QUESTIONS, Question } from '../constants/questions';
import Sortable from 'sortablejs';
import { ChevronRight, Heart, Sparkles } from 'lucide-react';
import { getDailyKey } from '../lib/dateUtils';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rankingOptions, setRankingOptions] = useState<string[]>([]);
  
  const sortableRef = useRef<HTMLDivElement>(null);
  const sortableInstance = useRef<Sortable | null>(null);
  const dayKey = getDailyKey();

  const loadDailyQuestions = useCallback(async () => {
    try {
      const { data } = await supabase.from('daily_questions').select('questions').eq('day_key', dayKey).maybeSingle();
      if (data?.questions) {
        const q = data.questions;
        setDailyQs([q.tot, q.ranking, q.text]);
      } else {
        setDailyQs([FALLBACK_QUESTIONS.tot, FALLBACK_QUESTIONS.ranking, FALLBACK_QUESTIONS.text]);
      }
    } catch (error) {
      setDailyQs([FALLBACK_QUESTIONS.tot, FALLBACK_QUESTIONS.ranking, FALLBACK_QUESTIONS.text]);
    } finally {
      setLoading(false);
    }
  }, [dayKey]);

  useEffect(() => { loadDailyQuestions(); }, [loadDailyQuestions]);

  useEffect(() => {
    if (dailyQs[step]?.o.length > 2) setRankingOptions([...dailyQs[step].o]);
  }, [step, dailyQs]);

  useEffect(() => {
    if (rankingOptions.length > 0 && sortableRef.current) {
      if (sortableInstance.current) sortableInstance.current.destroy();
      sortableInstance.current = new Sortable(sortableRef.current, {
        animation: 250, ghostClass: 'sortable-ghost', forceFallback: true, fallbackTolerance: 3,
        onEnd: (evt) => {
          if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
          setRankingOptions(prev => {
            const newOrder = [...prev];
            const [movedItem] = newOrder.splice(evt.oldIndex!, 1);
            newOrder.splice(evt.newIndex!, 0, movedItem);
            return newOrder;
          });
        }
      });
    }
    return () => { if (sortableInstance.current) sortableInstance.current.destroy(); };
  }, [rankingOptions.length]);

  const submit = async (finalResults: string[]) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const signature = dailyQs.map(q => `[${q.q}]`).join("");
      const finalChoice = finalResults.join(" | ") + " " + signature;
      const { error } = await supabase.from('answers').insert([{ user_id: session.user.id, choice: finalChoice, day_key: dayKey }]);
      if (error) throw error;
      onComplete();
    } catch (err) {
      alert("Ein Fehler ist aufgetreten beim Senden.");
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    const q = dailyQs[step];
    let val = '';
    if (q.o.length === 2) val = selectedTot || '';
    else if (q.o.length > 2) val = rankingOptions.join(" > ");
    else val = textVal.trim();

    if (!val) return;
    const newResults = [...results, val];
    setResults(newResults);
    if (step < 2) {
      setStep(step + 1);
      setSelectedTot(null);
      setTextVal('');
      setRankingOptions([]);
    } else submit(newResults);
  };

  if (loading) return (
    <div className="flex-1 flex flex-col animate-entrance">
      <header className="mb-6"><div className="prog-dots">{[0, 1, 2].map(i => (<div key={i} className="w-8 h-1 rounded-full skeleton"></div>))}</div></header>
      <div className="space-y-4">
        <div className="h-8 rounded-xl skeleton" />
        <div className="h-16 rounded-xl skeleton" />
        <div className="space-y-2">
          <div className="h-20 rounded-[24px] skeleton" />
          <div className="h-20 rounded-[24px] skeleton" />
        </div>
      </div>
      <div className="mt-auto pb-4"><div className="h-14 rounded-[22px] skeleton" /></div>
    </div>
  );

  const q = dailyQs[step];
  const isLastStep = step === 2;
  const canContinue = (q.o.length === 2 && selectedTot) || (q.o.length > 2) || (q.o.length === 0 && textVal.trim().length > 0);

  return (
    <div className="flex flex-col flex-1 animate-entrance overflow-hidden h-full">
      <div className="flex-1 overflow-hidden">
        <header className="mb-3">
          <div className="prog-dots">
            {[0, 1, 2].map(i => (<div key={i} className={`dot ${i === step ? 'active' : (i < step ? 'done' : '')}`}></div>))}
          </div>
        </header>
        
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 overflow-hidden">
          <div className="info-hint mb-3 py-2.5">
            <Sparkles className="w-3 h-3 flex-shrink-0" />
            <span className="text-[10px]">{q.h}</span>
          </div>
          
          <h2 className="text-xl font-bold mb-4 text-[#2D264B] leading-tight line-clamp-3">
            {q.q}
          </h2>

          <div id="quiz-input" className="space-y-2 pb-2">
            {q.o.length === 2 && (
              <div className="tot-grid">
                {q.o.map((o, i) => (
                  <button 
                    key={i} 
                    className={`tot-box py-5 text-sm ${selectedTot === o ? 'selected' : ''}`}
                    onClick={() => setSelectedTot(o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}

            {q.o.length > 2 && (
              <div ref={sortableRef} className="space-y-2">
                {rankingOptions.map((o, i) => (
                  <div key={o} className="rank-card py-2.5">
                    <span className="rank-tag w-6 h-6 text-[11px]">{i + 1}</span>
                    <span className="font-bold text-sm text-[var(--text-main)] line-clamp-1">{o}</span>
                  </div>
                ))}
              </div>
            )}

            {q.o.length === 0 && (
              <textarea 
                className="textarea-custom h-24 p-4 text-sm font-bold"
                placeholder="Deine Antwort hier..."
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                autoFocus
              />
            )}
          </div>
        </div>
      </div>

      <div className="pb-4 pt-2">
        <button onClick={handleNext} disabled={!canContinue || isSubmitting} className="btn-action py-3.5">
          {isSubmitting ? 'Wird geteilt...' : (isLastStep ? (
            <span className="flex items-center gap-2 text-sm">Teilen <Heart className="w-4 h-4 fill-current" /></span>
          ) : (
            <span className="flex items-center gap-2 text-sm">Weiter <ChevronRight className="w-4 h-4" /></span>
          ))}
        </button>
      </div>
    </div>
  );
}
