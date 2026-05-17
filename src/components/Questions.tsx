import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FALLBACK_QUESTIONS, Question } from '../constants/questions';
import Sortable from 'sortablejs';
import { ChevronRight, Heart, Sparkles } from 'lucide-react';

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
  
  // Local state for ranking options to ensure SortableJS works correctly
  const [rankingOptions, setRankingOptions] = useState<string[]>([]);
  
  const sortableRef = useRef<HTMLDivElement>(null);
  const sortableInstance = useRef<Sortable | null>(null);

  const dayKey = new Date().toISOString().split('T')[0];

  const loadDailyQuestions = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('daily_questions')
        .select('questions')
        .eq('day_key', dayKey)
        .maybeSingle();

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

  useEffect(() => {
    loadDailyQuestions();
  }, [loadDailyQuestions]);

  // Sync local ranking options when step changes or questions load
  useEffect(() => {
    if (dailyQs[step]?.o.length > 2) {
      setRankingOptions([...dailyQs[step].o]);
    }
  }, [step, dailyQs]);

  useEffect(() => {
    if (rankingOptions.length > 0 && sortableRef.current) {
      if (sortableInstance.current) sortableInstance.current.destroy();
      
      sortableInstance.current = new Sortable(sortableRef.current, {
        animation: 250,
        ghostClass: 'sortable-ghost',
        dragClass: 'sortable-drag',
        forceFallback: true,
        fallbackTolerance: 3,
        onEnd: (evt) => {
          const newOrder = [...rankingOptions];
          const [movedItem] = newOrder.splice(evt.oldIndex!, 1);
          newOrder.splice(evt.newIndex!, 0, movedItem);
          setRankingOptions(newOrder);
        }
      });
    }
    return () => {
      if (sortableInstance.current) sortableInstance.current.destroy();
    };
  }, [rankingOptions]);

  const submit = async (finalResults: string[]) => {
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const signature = dailyQs.map(q => `[${q.q}]`).join("");
      const finalChoice = finalResults.join(" | ") + " " + signature;

      const { error } = await supabase.from('answers').insert([{ 
        user_id: session.user.id, 
        choice: finalChoice, 
        day_key: dayKey 
      }]);
      
      if (error) throw error;
      onComplete();
    } catch (err) {
      alert("Fehler beim Speichern!");
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    const q = dailyQs[step];
    let val = '';

    if (q.o.length === 2) {
      val = selectedTot || '';
    } else if (q.o.length > 2) {
      val = rankingOptions.join(" > ");
    } else {
      val = textVal.trim();
    }

    if (!val) return;

    const newResults = [...results, val];
    setResults(newResults);

    if (step < 2) {
      setStep(step + 1);
      setSelectedTot(null);
      setTextVal('');
      setRankingOptions([]); // Reset for next potential ranking
    } else {
      submit(newResults);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-8 text-center animate-pulse text-[#2D264B] font-bold">
      Fragen laden...
    </div>
  );

  const q = dailyQs[step];
  const isLastStep = step === 2;
  const canContinue = (q.o.length === 2 && selectedTot) || (q.o.length > 2) || (q.o.length === 0 && textVal.trim().length > 0);

  return (
    <div className="flex flex-col h-full animate-entrance">
      <div className="flex-1 overflow-y-auto">
        <header className="mb-10">
          <div className="prog-dots">
            {[0, 1, 2].map(i => (
              <div key={i} className={`dot ${i === step ? 'active' : (i < step ? 'done' : '')}`}></div>
            ))}
          </div>
        </header>
        
        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="info-hint mb-8">
            <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{q.h}</span>
          </div>
          
          <h2 className="text-3xl font-bold mb-10 text-[#2D264B] leading-tight">
            {q.q}
          </h2>

          <div id="quiz-input" className="space-y-4 pb-20">
            {q.o.length === 2 && (
              <div className="tot-grid">
                {q.o.map((o, i) => (
                  <button 
                    key={i} 
                    className={`tot-box ${selectedTot === o ? 'selected' : ''}`}
                    onClick={() => setSelectedTot(o)}
                  >
                    {o}
                  </button>
                ))}
              </div>
            )}

            {q.o.length > 2 && (
              <div ref={sortableRef} className="space-y-3">
                {rankingOptions.map((o, i) => (
                  <div key={o} className="rank-card">
                    <span className="rank-tag">{i + 1}</span>
                    <span className="rank-card-text font-bold">{o}</span>
                  </div>
                ))}
              </div>
            )}

            {q.o.length === 0 && (
              <textarea 
                className="textarea-custom"
                placeholder="Deine Antwort hier..."
                value={textVal}
                onChange={(e) => setTextVal(e.target.value)}
                autoFocus
              />
            )}
          </div>
        </div>
      </div>

      <div className="pb-6 pt-4 bg-gradient-to-t from-[#F8F7FF] via-[#F8F7FF] to-transparent sticky bottom-0">
        <button 
          onClick={handleNext}
          disabled={!canContinue || isSubmitting}
          className="btn-action"
        >
          {isSubmitting ? 'Wird geteilt...' : (isLastStep ? (
            <span className="flex items-center gap-2">Teilen <Heart className="w-5 h-5 fill-current" /></span>
          ) : (
            <span className="flex items-center gap-2">Weiter <ChevronRight className="w-5 h-5" /></span>
          ))}
        </button>
      </div>
    </div>
  );
}
