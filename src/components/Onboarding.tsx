import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Camera, Link2, Sparkles, 
  ArrowRight, Download, Share, PlusSquare 
} from 'lucide-react';

/**
 * Onboarding-Komponente: Führt den Nutzer durch die Ersteinrichtung.
 * Beinhaltet Datenschutz, PWA-Installation, Profil-Setup und Partner-Link.
 */
export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  // Aktueller Schritt im Onboarding-Prozess (1 bis 4)
  const [step, setStep] = useState(1);
  // Status der Datenschutz-Akzeptanz
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  // Nutzername für das Profil
  const [userName, setUserName] = useState('');
  // PWA Installations-Event (für Android/Chrome)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  // Erkennt, ob der Nutzer ein iOS-Gerät verwendet
  const [isIOS, setIsIOS] = useState(false);

  // Initialisierung: PWA-Event abfangen und Plattform erkennen
  useEffect(() => {
    // Event für Android/Chrome Installation
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Einfache iOS-Erkennung
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(ios);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Funktion zum Auslösen der PWA-Installation (Android)
  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') setDeferredPrompt(null);
      setStep(step + 1); // Weiter zum nächsten Schritt
    } else {
      setStep(step + 1); // Falls kein Prompt da ist, einfach weiter
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-12 view-enter">
      {/* Fortschrittsanzeige (Drei Punkte oben) */}
      <header>
        <div className="flex gap-3 mb-12">
          {[1, 2, 3, 4].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                s <= step ? 'bg-[#A855F7]' : 'bg-purple-100'
              }`} 
            />
          ))}
        </div>
      </header>

      {/* SCHRITT 1: DATENSCHUTZ */}
      {step === 1 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 rounded-[2.5rem] bg-purple-50 inline-block">
            <ShieldCheck className="w-12 h-12 text-[#A855F7]" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#1E1B4B]">Datenschutz</h2>
            <p className="text-purple-400 leading-relaxed">
              Die Verarbeitung von Daten durch diese Anwendung erfolgt ausschließlich für persönliche oder familiäre Zwecke. Sie fällt daher gemäß Art. 2 Abs. 2 lit. c DSGVO unter das sogenannte Haushaltsprivileg, weshalb die Bestimmungen der DSGVO keine Anwendung finden.

            </p>
          </div>
          {/* Checkbox für die Akzeptanz */}
          <label className="flex items-center gap-4 p-6 glass-card border-purple-100">
            <input 
              type="checkbox" 
              className="w-6 h-6 rounded-lg accent-[#A855F7]"
              checked={privacyAccepted}
              onChange={(e) => setPrivacyAccepted(e.target.checked)}
            />
            <span className="text-sm font-medium text-[#1E1B4B]">Ich weiß, dass du dir Mühe gibst, meine Daten zu schützen.</span>
          </label>
        </div>
      )}

      {/* SCHRITT 2: PWA INSTALLATION */}
      {step === 2 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 rounded-[2.5rem] bg-purple-50 inline-block">
            <Download className="w-12 h-12 text-[#A855F7]" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#1E1B4B]">App installieren</h2>
            <p className="text-purple-400">Für das beste Erlebnis, installiere DuoSync auf deinem Home-Bildschirm.</p>
          </div>

          {isIOS ? (
            // iOS Anleitung (da iOS kein automatisches Prompt unterstützt)
            <div className="p-6 glass-card border-purple-100 space-y-4 bg-white/40">
              <p className="text-sm font-bold text-[#1E1B4B] flex items-center gap-2">
                <Share className="w-4 h-4 text-[#A855F7]" /> 1. Drücke auf 'Teilen'
              </p>
              <p className="text-sm font-bold text-[#1E1B4B] flex items-center gap-2">
                <PlusSquare className="w-4 h-4 text-[#A855F7]" /> 2. 'Zum Home-Bildschirm'
              </p>
            </div>
          ) : (
            // Android/Chrome Button
            <button onClick={handleInstall} className="btn-pill btn-secondary w-full gap-3">
              <Download className="w-5 h-5" />
              Jetzt installieren
            </button>
          )}
          
          <button onClick={() => setStep(3)} className="text-purple-300 text-sm font-bold w-full">
            Im Webbrowser fortfahren
          </button>
        </div>
      )}

      {/* SCHRITT 3: PROFIL SETUP */}
      {step === 3 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="relative mx-auto w-32 h-32">
            <div className="w-32 h-32 rounded-[2.5rem] bg-purple-50 flex items-center justify-center border-2 border-dashed border-purple-200">
              <Camera className="w-8 h-8 text-purple-200" />
            </div>
            <div className="absolute -bottom-2 -right-2 p-3 bg-[#A855F7] rounded-2xl shadow-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-black text-[#1E1B4B]">Dein Profil</h2>
            <p className="text-purple-400">Wie soll dein Partner dich nennen?</p>
            <input 
              type="text" 
              placeholder="Dein Name" 
              className="input-field text-center"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* SCHRITT 4: PARTNER LINK */}
      {step === 4 && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-6 rounded-[2.5rem] bg-purple-50 inline-block">
            <Link2 className="w-12 h-12 text-[#A855F7]" />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#1E1B4B]">Partner Link</h2>
            <p className="text-purple-400">Gib den Code deines Partners ein, um euch zu verbinden.</p>
            <input 
              type="text" 
              placeholder="X7-Q9-Z2" 
              className="input-field text-center font-mono tracking-widest uppercase"
            />
          </div>
        </div>
      )}

      {/* Navigations-Button unten */}
      <button 
        disabled={step === 1 && !privacyAccepted}
        onClick={() => {
          if (step < 4) setStep(step + 1);
          else onComplete();
        }}
        className="btn-pill btn-primary w-full gap-2"
      >
        {step === 4 ? 'Loslegen' : 'Weiter'}
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
