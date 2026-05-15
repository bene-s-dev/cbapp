import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Camera, Link2, Sparkles, 
  ArrowRight, Download, Share, PlusSquare, Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [userName, setUserName] = useState('');
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSOverlay, setShowIOSOverlay] = useState(false);

  useEffect(() => {
    fetchMyProfile();
    
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
    setIsStandalone(standalone);

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const fetchMyProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setMyProfile(data);
      if (data) setUserName(data.display_name);
    }
  };

  const handleLinkPartner = async () => {
    if (!partnerCodeInput) return;
    setLoading(true);

    try {
      // 1. Partner finden
      const { data: partnerProfile, error: findError } = await supabase
        .from('profiles')
        .select('id')
        .eq('partner_code', partnerCodeInput.trim().toUpperCase())
        .single();

      if (findError || !partnerProfile) {
        alert("Code nicht gefunden! ❌");
        return;
      }

      // 2. Eigenes Profil aktualisieren
      const { data: { session } } = await supabase.auth.getSession();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ partner_id: partnerProfile.id })
        .eq('id', session?.user.id);

      if (updateError) throw updateError;

      alert("Erfolgreich verknüpft! ❤️");
      onComplete();
    } catch (err: any) {
      alert("Fehler: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSOverlay(true);
    } else if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setStep(3);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-12 animate-in fade-in duration-500 relative">
      {showIOSOverlay && (
        <div 
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 px-4 pb-8"
          onClick={() => setShowIOSOverlay(false)}
        >
          <div className="w-full max-w-md bg-white rounded-[3rem] p-8 pb-10 space-y-8 animate-in slide-in-from-bottom-10 duration-500 shadow-2xl relative">
            <div className="w-12 h-1.5 bg-[#f1f2f6] rounded-full mx-auto mb-4" />
            <div className="space-y-2 text-center">
              <h3 className="text-2xl font-bold text-[var(--text)]">App installieren</h3>
              <p className="text-[var(--muted)] text-sm">Folge diesen Schritten in deinem Safari-Browser:</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-[var(--light-bg)] border border-[#eee]">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <Share className="w-6 h-6 text-[var(--secondary)]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text)] text-sm">1. Tippe auf 'Teilen'</p>
                  <p className="text-[11px] text-[var(--muted)]">In der Browser-Leiste unten</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-[var(--light-bg)] border border-[#eee]">
                <div className="p-3 bg-white rounded-2xl shadow-sm">
                  <PlusSquare className="w-6 h-6 text-[var(--secondary)]" />
                </div>
                <div>
                  <p className="font-bold text-[var(--text)] text-sm">2. 'Zum Home-Bildschirm'</p>
                  <p className="text-[11px] text-[var(--muted)]">Runterscrollen und hinzufügen</p>
                </div>
              </div>
            </div>

            <button onClick={() => setShowIOSOverlay(false)} className="btn-action">Verstanden</button>
          </div>
        </div>
      )}

      <header>
        <div className="prog-dots">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`dot ${s === step ? 'active' : (s < step ? 'done' : '')}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 rounded-[2.5rem] bg-[var(--light-bg)] inline-block">
              <ShieldCheck className="w-12 h-12 text-[var(--secondary)]" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-[var(--text)]">Datenschutz</h2>
              <p className="text-[var(--muted)] leading-relaxed">
                Deine Daten werden sicher in Supabase gespeichert. Wir nutzen sie nur für eure gemeinsamen Momente. ❤️
              </p>
            </div>
            <label className="flex items-center gap-4 p-6 rounded-[28px] border-2 border-[#eee] bg-[var(--light-bg)]">
              <input 
                type="checkbox" 
                className="w-6 h-6 rounded-lg accent-[var(--secondary)]"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
              />
              <span className="text-sm font-medium text-[var(--text)]">Ich akzeptiere die Bedingungen. ❤️</span>
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 rounded-[2.5rem] bg-[var(--light-bg)] inline-block">
              <Download className="w-12 h-12 text-[var(--secondary)]" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-[var(--text)]">App installieren</h2>
              <p className="text-[var(--muted)]">Für das beste Erlebnis, installiere CB-App auf deinem Home-Bildschirm.</p>
            </div>

            {((deferredPrompt || isIOS) && !isStandalone) && (
              <button onClick={handleInstall} className="btn-action">Jetzt installieren ✨</button>
            )}
            
            <button onClick={() => setStep(3)} className="text-[var(--secondary)] text-sm font-bold w-full hover:underline transition-all">
              Im Webbrowser fortfahren
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-center">
            <div className="relative mx-auto w-32 h-32">
              <div className="w-32 h-32 rounded-[2.5rem] bg-[var(--light-bg)] flex items-center justify-center border-2 border-dashed border-[#eee]">
                <Camera className="w-8 h-8 text-[#ccc]" />
              </div>
              <div className="absolute -bottom-2 -right-2 p-3 bg-[var(--secondary)] rounded-2xl shadow-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-[var(--text)]">Hallo {userName}!</h2>
            <p className="text-[var(--muted)]">Dein Profil ist bereit. Jetzt fehlt nur noch dein Partner.</p>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 rounded-[2.5rem] bg-[var(--light-bg)] inline-block">
              <Link2 className="w-12 h-12 text-[var(--secondary)]" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-[var(--text)]">Partner verknüpfen</h2>
              <p className="text-[var(--muted)] text-sm">Dein Code zum Teilen:</p>
              <div className="flex items-center justify-between bg-[var(--light-bg)] p-4 rounded-2xl border-2 border-dashed border-[var(--secondary)]">
                <span className="font-mono font-bold text-[var(--secondary)] tracking-widest">{myProfile?.partner_code || 'Wird geladen...'}</span>
                <button onClick={() => { navigator.clipboard.writeText(myProfile?.partner_code); alert("Code kopiert!"); }} className="p-2 hover:bg-white rounded-xl transition-colors">
                  <Copy className="w-5 h-5 text-[var(--secondary)]" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[var(--muted)] text-sm">Oder gib den Code deines Partners ein:</p>
              <input 
                type="text" 
                placeholder="CB-XXXXXX" 
                className="w-full p-5 rounded-[20px] border-2 border-[#eee] text-center font-mono tracking-widest uppercase text-[1.1rem]"
                value={partnerCodeInput}
                onChange={(e) => setPartnerCodeInput(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {step === 4 ? (
          <button onClick={handleLinkPartner} disabled={loading || !partnerCodeInput} className="btn-action flex items-center justify-center gap-2">
            {loading ? 'Verknüpfe...' : 'Verknüpfen & Starten ❤️'}
          </button>
        ) : (
          <button 
            disabled={step === 1 && !privacyAccepted}
            onClick={() => setStep(step + 1)}
            className="btn-action flex items-center justify-center gap-2"
          >
            Weiter <ArrowRight className="w-5 h-5" />
          </button>
        )}
        
        {step === 4 && (
          <button onClick={onComplete} className="w-full text-[var(--muted)] text-sm font-medium hover:underline">
            Später verknüpfen
          </button>
        )}
      </div>
    </div>
  );
}
