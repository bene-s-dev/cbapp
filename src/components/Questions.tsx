import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { FALLBACK_QUESTIONS, Question } from '../constants/questions';
import Sortable from 'sortablejs';
import { ChevronRight, Heart, Sparkles, MessageCircle, ListOrdered, ArrowRightLeft, RefreshCcw, AlertCircle, XCircle } from 'lucide-react';
import { getDailyKey } from '../lib/dateUtils';
import { useDialog } from './DialogProvider';

interface QuestionsProps {
  userName: string;
  partnerName: string;
  partnerId?: string | null;
  onComplete: () => void;
}

export default function Questions({ userName, partnerName, partnerId, onComplete }: QuestionsProps) {
  const { showAlert, showConfirm } = useDialog();
  // --- STATE ---
  const [step, setStep] = useState<number>(0); 
  const [dailyQs, setDailyQs] = useState<Question[]>([FALLBACK_QUESTIONS.tot, FALLBACK_QUESTIONS.ranking, FALLBACK_QUESTIONS.text]);
  const [myResults, setMyResults] = useState<string[]>([]);
  const [partnerResults, setPartnerResults] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTot, setSelectedTot] = useState<string | null>(null);
  const [textVal, setTextVal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rankingOptions, setRankingOptions] = useState<string[]>([]);
  const [internalError, setInternalError] = useState<string | null>(null);
  
  const sortableRef = useRef<HTMLDivElement>(null);
  const sortableInstance = useRef<Sortable | null>(null);
  const dayKey = getDailyKey();
  const MAX_TEXT_LENGTH = 100;

  // --- SAFE SPLIT HELPER ---
  const safeSplit = (val: any, delimiter: string) => {
    if (!val) return [];
    try {
      return String(val).split(delimiter);
    } catch (e) {
      return [];
    }
  };

  // --- DATA LOADING ---
  const loadData = useCallback(async (forceRefresh = false) => {
    try {
      if (!forceRefresh) setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Fetch Questions
      const { data: qData } = await supabase.from('daily_questions').select('questions').eq('day_key', dayKey).maybeSingle();
      if (qData?.questions) {
        const q = qData.questions;
        if (q.tot && q.ranking && q.text) {
          setDailyQs([q.tot, q.ranking, q.text]);
        }
      }

      // 2. Fetch Answers
      const userIds = [session.user.id];
      if (partnerId) userIds.push(partnerId);
      const { data: answers } = await supabase.from('answers').select('*').in('user_id', userIds).eq('day_key', dayKey);
      
      if (answers) {
        const myAnsObj = answers.find(a => a.user_id === session.user.id);
        const pAnsObj = partnerId ? answers.find(a => a.user_id === partnerId) : null;

        if (myAnsObj) {
          const mainPart = String(myAnsObj.choice || '').split(" [")[0];
          const parts = safeSplit(mainPart, " | ");
          if (parts.length >= 3) {
            setMyResults(parts);
            setStep(3);
          }
        } else if (!forceRefresh) {
          setStep(0);
          setMyResults([]);
        }

        if (pAnsObj) {
          const pMainPart = String(pAnsObj.choice || '').split(" [")[0];
          setPartnerResults(safeSplit(pMainPart, " | "));
        }
      }
    } catch (e) {
      console.error("loadData error:", e);
    } finally {
      setLoading(false);
    }
  }, [dayKey, partnerId]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- RANKING INITIALIZATION ---
  useEffect(() => {
    if (step === 1 && dailyQs[1] && rankingOptions.length === 0) {
      setRankingOptions([...(dailyQs[1].o || [])]);
    }
  }, [step, dailyQs, rankingOptions.length]);

  // --- SORTABLE CLEANUP ---
  useEffect(() => {
    if (step === 1 && rankingOptions.length > 0 && sortableRef.current) {
      try {
        if (sortableInstance.current) sortableInstance.current.destroy();
        sortableInstance.current = new Sortable(sortableRef.current, {
          animation: 250, ghostClass: 'bg-purple-50',
          onEnd: (evt) => {
            if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
            setRankingOptions(prev => {
              const list = [...prev];
              const [moved] = list.splice(evt.oldIndex!, 1);
              list.splice(evt.newIndex!, 0, moved);
              return list;
            });
          }
        });
      } catch (e) { console.error("Sortable error:", e); }
    }
    return () => { if (sortableInstance.current) { try { sortableInstance.current.destroy(); } catch(e){} } };
  }, [step, rankingOptions.length]);

  // --- SUBMISSION ---
  const handleSubmit = async (finalResults: string[]) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");
      
      const sig = dailyQs.map(q => `[${q.q}]`).join("");
      const choiceStr = finalResults.join(" | ") + " " + sig;
      
      // Delete old answers for this user
      await supabase.from('answers').delete().eq('user_id', session.user.id).neq('day_key', dayKey);
      
      const { error } = await supabase.from('answers').insert([{ user_id: session.user.id, choice: choiceStr, day_key: dayKey }]);
      if (error && error.code !== '23505') throw error;
      
      setMyResults(finalResults);
      setStep(3);
      // Delayed notification to parent to prevent sync render issues
      setTimeout(() => onComplete(), 200);
    } catch (err: any) {
      console.error("Submit error:", err);
      showAlert("Speichern fehlgeschlagen.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = () => {
    try {
      if (step >= 3) return;
      let val = '';
      if (step === 0) val = selectedTot || '';
      else if (step === 1) val = rankingOptions.join(" > ");
      else if (step === 2) val = textVal.trim();
      if (!val) return;
      
      const nextResults = [...myResults, val];
      if (step < 2) {
        setMyResults(nextResults);
        setStep(prev => prev + 1);
        setSelectedTot(null);
        setTextVal('');
        setRankingOptions([]);
      } else {
        setMyResults(nextResults);
        handleSubmit(nextResults);
      }
    } catch (e: any) {
      setInternalError(e.message);
    }
  };

  const resetQuiz = async () => {
    showConfirm(
      "Möchtest du heute wirklich neu starten? Deine bisherigen Antworten werden gelöscht.",
      async () => {
        try {
          setLoading(true);
          const { data: { session } } = await supabase.auth.getSession();
          if (session) await supabase.from('answers').delete().eq('day_key', dayKey).eq('user_id', session.user.id);
          
          setMyResults([]);
          setStep(0);
          setPartnerResults(null);
          setSelectedTot(null);
          setTextVal('');
          setRankingOptions([]);
          setIsSubmitting(false);
          
          setTimeout(() => onComplete(), 200);
          await loadData(true);
        } catch (e) {
          setLoading(false);
        }
      },
      { title: "Quiz neu starten", confirmLabel: "Ja, Neustart", cancelLabel: "Abbrechen" }
    );
  };

  // --- RENDER RECOVERY ---
  if (internalError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-sm font-bold text-[#1F1939]">Fehler: {internalError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-xs font-black text-[var(--secondary)] uppercase px-6 py-3 border-2 border-purple-100 rounded-full">Neu laden</button>
      </div>
    );
  }

  if (loading && step !== 3) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-purple-100 border-t-[var(--secondary)] rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- MAIN RENDER ---
  try {
    const q = dailyQs[step < 3 ? step : 0] || FALLBACK_QUESTIONS.tot;

    return (
      <div className="flex flex-col flex-1 h-full overflow-hidden animate-entrance">
        {step < 3 ? (
          // --- QUIZ VIEW ---
          <div className="flex flex-col flex-1 h-full overflow-hidden">
            <header className="mb-4">
              <div className="quiz-prog-dots">
                {[0, 1, 2].map(i => (<div key={i} className={`quiz-dot ${i === step ? 'active' : (i < step ? 'done' : '')}`}></div>))}
              </div>
            </header>
            <div className="flex-1 overflow-y-auto pr-1 flex flex-col min-h-0">
              <div className="info-hint mb-4 py-3 shrink-0 rounded-[1.5rem] border-purple-50 bg-white">
                <Sparkles className="w-3.5 h-3.5 flex-shrink-0 text-[var(--secondary)]" />
                <span className="text-[11px] font-bold text-[#5A5478]">{q.h}</span>
              </div>
              <h2 className="text-[1.35rem] font-bold mb-6 text-[#1F1939] leading-[1.25] shrink-0 tracking-tight">{q.q}</h2>
              <div className="flex-1 flex flex-col min-h-0 pb-4">
                {step === 0 && (
                  <div className="flex flex-col gap-3">
                    {(q.o || []).map((o, i) => (
                      <button key={i} className={`p-6 rounded-[2rem] border-2 text-sm font-bold min-h-[80px] flex items-center justify-center transition-all ${selectedTot === o ? 'border-[var(--secondary)] bg-purple-50 text-[var(--secondary)]' : 'bg-white border-purple-50 text-[#4A4468]'}`} onClick={() => setSelectedTot(o)}>{o}</button>
                    ))}
                  </div>
                )}
                {step === 1 && (
                  <div ref={sortableRef} className="flex flex-col gap-3">
                    {rankingOptions.map((o, i) => (
                      <div key={o} className="bg-white border-2 border-purple-50 p-4 rounded-[1.75rem] flex items-center gap-4 cursor-grab shadow-sm">
                        <span className="w-7 h-7 rounded-full bg-purple-50 text-[var(--secondary)] flex items-center justify-center text-[11px] font-black">{i + 1}</span>
                        <span className="font-bold text-[13px] text-[#2D264B] leading-snug line-clamp-2">{o}</span>
                      </div>
                    ))}
                  </div>
                )}
                {step === 2 && (
                  <div className="flex-1 flex flex-col gap-2">
                    <textarea 
                      className="w-full flex-1 min-h-[160px] p-6 rounded-[2rem] border-2 border-purple-50 bg-white text-sm font-bold leading-relaxed resize-none focus:border-[var(--secondary)] outline-none text-[#2D264B]" 
                      placeholder="Deine Gedanken hier..." 
                      value={textVal} 
                      onChange={(e) => setTextVal(e.target.value)} 
                      maxLength={MAX_TEXT_LENGTH}
                      autoFocus 
                    />
                    <div className="flex justify-end px-4">
                      <span className={`text-[10px] font-black tracking-widest uppercase ${textVal.length >= MAX_TEXT_LENGTH ? 'text-red-400' : 'text-[#8E89AA]'}`}>
                        {textVal.length} / {MAX_TEXT_LENGTH}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="pb-6 pt-4">
              <button onClick={handleNext} disabled={isSubmitting || !((step === 0 && selectedTot) || (step === 1 && rankingOptions.length > 0) || (step === 2 && textVal.trim().length > 0))} className="btn-action py-4 shadow-lg disabled:opacity-40">
                {isSubmitting ? 'Wird geteilt...' : (step === 2 ? 'Abschließen' : 'Weiter')}
              </button>
            </div>
          </div>
        ) : (
          // --- RESULTS VIEW ---
          <div className="flex flex-col flex-1 h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-1 pb-4">
              <div className="flex items-center justify-between mb-6 bg-purple-50/50 p-4 rounded-[2rem] border border-purple-100">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[var(--secondary)]" />
                  <div>
                    <h3 className="font-bold text-[#2D264B] text-xs">Unsere Gedanken</h3>
                    <p className="text-[9px] text-[#8E89AA] font-medium tracking-tight">{partnerResults ? 'Ihr habt beide geantwortet! ✨' : `${partnerName} antwortet noch...`}</p>
                  </div>
                </div>
                <button onClick={resetQuiz} className="flex items-center gap-2 py-2.5 px-4 bg-white rounded-2xl border border-purple-100 shadow-sm active:scale-90 transition-all">
                  <RefreshCcw className="w-3.5 h-3.5 text-[var(--secondary)]" />
                  <span className="text-[10px] font-bold text-[var(--secondary)] uppercase tracking-wider">Neu starten</span>
                </button>
              </div>
              <div className="space-y-8 pb-10">
                {dailyQs.map((question, i) => {
                  const m = myResults[i] || "—";
                  const p = partnerResults?.[i];
                  return (
                    <div key={i} className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: `${i * 150}ms` }}>
                      <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="w-6 h-6 rounded-lg bg-white border border-purple-50 flex items-center justify-center">
                          {i === 0 && <ArrowRightLeft className="w-3 h-3 text-[var(--secondary)]" />}
                          {i === 1 && <ListOrdered className="w-3 h-3 text-[var(--secondary)]" />}
                          {i === 2 && <MessageCircle className="w-3 h-3 text-[var(--secondary)]" />}
                        </div>
                        <span className="text-[10px] font-bold text-[#8E89AA] uppercase tracking-wider">{question?.q || "Frage"}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="res-bubble p-4 min-h-[110px] flex flex-col rounded-[2rem]">
                          <span className="text-[8px] font-black text-[var(--secondary)] mb-2 uppercase tracking-widest">ICH</span>
                          <p className="text-[11px] font-bold text-[#2D264B] leading-relaxed break-words">
                            {i === 1 ? safeSplit(m, " > ").map((it, idx) => (<span key={idx} className="block">{idx + 1}. {it}</span>)) : m}
                          </p>
                        </div>
                        <div className={`res-bubble p-4 min-h-[110px] flex flex-col rounded-[2rem] ${!p ? 'bg-purple-50/30 border-dashed opacity-60' : ''}`}>
                          <span className="text-[8px] font-black text-[#8E89AA] mb-2 uppercase tracking-widest">{partnerName.toUpperCase()}</span>
                          {p ? (
                            <p className="text-[11px] font-bold text-[#2D264B] leading-relaxed break-words">
                              {i === 1 ? safeSplit(p, " > ").map((it, idx) => (<span key={idx} className="block">{idx + 1}. {it}</span>)) : p}
                            </p>
                          ) : <p className="text-[10px] font-bold text-purple-300 italic">Noch offen...</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  } catch (e: any) {
    setInternalError(e.message);
    return null;
  }
}
