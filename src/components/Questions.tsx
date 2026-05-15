import React, { useState } from 'react';
import { MessageCircle, Send, ArrowLeft, Heart, Sparkles, CheckCircle2 } from 'lucide-react';

/**
 * Questions-Komponente: Der Ort für die täglichen Beziehungsfragen.
 * Mit multi-step Flow, Zurück-Funktion und Antwort-Vergleich.
 */

const MOCK_QUESTIONS = [
  { id: 1, text: "Was war der schönste Moment, den wir heute gemeinsam geteilt haben?" },
  { id: 2, text: "Welche Eigenschaft schätzt du heute besonders an deinem Partner?" },
  { id: 3, text: "Worauf freust du dich am meisten in eurer gemeinsamen Zukunft?" }
];

// Simulation von Supabase-Daten (Antworten des Partners)
const MOCK_PARTNER_ANSWERS: Record<number, string> = {
  1: "Als wir heute Morgen zusammen gelacht haben.",
  2: "Deine unglaublich positive Art, die mich immer aufheitert.",
  3: "Unseren ersten gemeinsamen Roadtrip im Sommer."
};

export default function Questions() {
  const [currentStep, setCurrentStep] = useState(0); // 0 bis MOCK_QUESTIONS.length - 1
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  
  // Partner-Status (Simulation)
  const isConnected = true; 
  const partnerName = "Ben";

  const handleNext = () => {
    if (currentStep < MOCK_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Finales Speichern simulieren
      setIsFinished(true);
      setShowComparison(true);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentQuestion = MOCK_QUESTIONS[currentStep];

  // ANSICHT 1: FRAGEN-FLOW
  if (!showComparison) {
    return (
      <div className="flex-1 flex flex-col py-8 animate-in fade-in slide-in-from-right-4 duration-500">
        {/* Header mit Fortschritt und Zurück-Button */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`p-3 rounded-2xl bg-white border border-purple-100 text-purple-300 transition-all ${currentStep === 0 ? 'opacity-0 pointer-events-none' : 'hover:text-[#A855F7]'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex gap-1.5">
            {MOCK_QUESTIONS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-[#A855F7] w-10' : 'bg-purple-100'}`} 
              />
            ))}
          </div>

          <div className="w-11" /> {/* Spacer */}
        </div>

        {/* Titel-Bereich */}
        <div className="mb-8">
          <h2 className="text-3xl font-black text-[#1E1B4B]">Frage {currentStep + 1}</h2>
          <p className="text-purple-400">Schritt {currentStep + 1} von {MOCK_QUESTIONS.length}</p>
        </div>

        {/* Die aktuelle Frage */}
        <div className="glass-card p-8 bg-white/40 border-purple-100 mb-6 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-[#A855F7]" />
            <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">Heutige Frage</span>
          </div>
          <h3 className="text-xl font-bold leading-tight text-[#1E1B4B]">
            {currentQuestion.text}
          </h3>
          <Heart className="absolute -right-4 -bottom-4 w-20 h-20 text-[#A855F7]/5 -rotate-12" />
        </div>

        {/* Eingabebereich */}
        <div className="space-y-4 flex-1">
          <textarea 
            placeholder="Deine Gedanken..."
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
            className="w-full h-40 p-6 glass-card bg-white border-purple-100 outline-none focus:border-[#A855F7] transition-all resize-none text-[#1E1B4B] placeholder:text-purple-200"
          />
          
          <button 
            disabled={!answers[currentQuestion.id]?.trim()}
            onClick={handleNext} 
            className="btn-pill btn-primary w-full gap-2 shadow-xl shadow-purple-500/20"
          >
            {currentStep === MOCK_QUESTIONS.length - 1 ? 'Abschließen' : 'Nächste Frage'}
            {currentStep === MOCK_QUESTIONS.length - 1 ? <CheckCircle2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  }

  // ANSICHT 2: ANTWORT-VERGLEICH
  return (
    <div className="flex-1 flex flex-col py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-8">
        <div className="inline-block p-4 bg-purple-50 rounded-[2rem] mb-4">
          <Sparkles className="w-10 h-10 text-[#A855F7]" />
        </div>
        <h2 className="text-3xl font-black text-[#1E1B4B]">Eure Antworten</h2>
        <p className="text-purple-400">Das habt ihr heute geteilt.</p>
      </div>

      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 glass-card border-red-100 bg-red-50/10 text-center">
          <Heart className="w-12 h-12 text-red-300 mb-4" />
          <p className="text-red-500 font-bold">Keine Partner-Verbindung</p>
          <p className="text-sm text-red-400">Verknüpfe dich in deinem Profil, um Antworten zu vergleichen.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-6 overflow-y-auto pb-10 custom-scrollbar">
          {MOCK_QUESTIONS.map((q) => (
            <div key={q.id} className="space-y-3">
              <div className="px-2">
                <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest">{q.text}</p>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {/* Deine Antwort */}
                <div className="glass-card p-5 bg-white border-purple-100 relative">
                  <span className="absolute -top-2 -left-2 px-3 py-1 bg-[#A855F7] text-white text-[9px] font-black rounded-lg shadow-lg uppercase">Ich</span>
                  <p className="text-sm text-[#1E1B4B] leading-relaxed italic">"{answers[q.id]}"</p>
                </div>
                
                {/* Partners Antwort */}
                <div className="glass-card p-5 bg-purple-50/50 border-purple-200 relative">
                  <span className="absolute -top-2 -left-2 px-3 py-1 bg-white border border-purple-100 text-[#A855F7] text-[9px] font-black rounded-lg shadow-md uppercase">{partnerName}</span>
                  <p className="text-sm text-[#1E1B4B] leading-relaxed italic">"{MOCK_PARTNER_ANSWERS[q.id]}"</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <button 
        onClick={() => {
          setShowComparison(false);
          setCurrentStep(0);
          setAnswers({});
          setIsFinished(false);
        }}
        className="btn-pill btn-secondary w-full mt-4"
      >
        Fertig für heute
      </button>
    </div>
  );
}
