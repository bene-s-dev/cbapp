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
  // Status, ob die App bereits installiert ist
  const [isStandalone, setIsStandalone] = useState(false);
  // Status für das iOS-Installations-Overlay
  const [showIOSOverlay, setShowIOSOverlay] = useState(false);

  // Initialisierung: PWA-Event abfangen und Plattform erkennen
  useEffect(() => {
    // Event für Android/Chrome Installation
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    // Prüfen, ob bereits installiert
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // iOS-Erkennung (iPhone/iPad/iPod)
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Automatisches Überspringen von Schritt 2, wenn bereits installiert
  useEffect(() => {
    if (step === 2 && isStandalone) {
      setStep(3);
    }
  }, [step, isStandalone]);

  // Funktion zum Auslösen der PWA-Installation
  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSOverlay(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setStep(3); // Direkt weiter zum Profil-Setup
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-12 view-enter relative">
      {/* iOS Installation Overlay */}
      {showIOSOverlay && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 px-4 pb-8"
          onClick={() => setShowIOSOverlay(false)}
        >
          <div 
            className="w-full max-w-md bg-white rounded-[3rem] p-8 pb-10 space-y-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-purple-100 rounded-full mx-auto mb-4" />
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-black text-[#1E1B4B]">App installieren</h3>
              <p className="text-purple-400 text-sm">Folge diesen Schritten in deinem Safari-Browser:</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-purple-50/50 border border-purple-100">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <Share className="w-6 h-6 text-[#A855F7]" />
                </div>
                <div>
                  <p className="font-bold text-[#1E1B4B] text-sm">1. Tippe auf 'Teilen'</p>
                  <p className="text-[11px] text-purple-400">In der Browser-Leiste unten</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-purple-50/50 border border-purple-100">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <PlusSquare className="w-6 h-6 text-[#A855F7]" />
                </div>
                <div>
                  <p className="font-bold text-[#1E1B4B] text-sm">2. 'Zum Home-Bildschirm'</p>
                  <p className="text-[11px] text-purple-400">Runterscrollen und hinzufügen</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => setShowIOSOverlay(false)}
              className="btn-pill btn-primary w-full py-4 text-sm font-bold"
            >
              Verstanden
            </button>
          </div>
        </div>
      )}

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

<<<<<<< HEAD
      <div className="flex-1 flex flex-col justify-center">
        {/* SCHRITT 1: DATENSCHUTZ */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 rounded-[2.5rem] bg-purple-50 inline-block">
              <ShieldCheck className="w-12 h-12 text-[#A855F7]" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black text-[#1E1B4B]">Datenschutz</h2>
              <p className="text-purple-400 leading-relaxed">
                Deine Privatsphäre ist uns wichtig. Alle Daten werden Ende-zu-Ende verschlüsselt und nur für euch beide synchronisiert.
=======
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
>>>>>>> 54c9c9fdfed654d6b9cf007b73388e20afb68fe4
              </p>
            </div>
            <label className="flex items-center gap-4 p-6 glass-card border-purple-100">
              <input 
                type="checkbox" 
                className="w-6 h-6 rounded-lg accent-[#A855F7]"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
              />
              <span className="text-sm font-medium text-[#1E1B4B]">Ich akzeptiere die Bestimmungen</span>
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

            {/* Der Button wird nur angezeigt, wenn installierbar (Android Prompt da) ODER iOS Safari */}
            {((deferredPrompt || isIOS) && !isStandalone) && (
              <button 
                onClick={handleInstall} 
                className="btn-pill btn-secondary w-full gap-3 shadow-lg shadow-purple-200/50"
              >
                <Download className="w-5 h-5" />
                Jetzt installieren
              </button>
            )}
            
            <button onClick={() => setStep(3)} className="text-purple-300 text-sm font-bold w-full hover:text-purple-400 transition-colors">
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
      </div>

      {/* Navigations-Button unten */}
      <button 
        disabled={step === 1 && !privacyAccepted}
        onClick={() => {
          if (step < 4) setStep(step + 1);
          else onComplete();
        }}
        className="btn-pill btn-primary w-full gap-2 mt-8"
      >
        {step === 4 ? 'Loslegen' : 'Weiter'}
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
}
