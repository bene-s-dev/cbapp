import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, ArrowRight, Mail, AlertCircle, Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: (isNew?: boolean) => void;
  initialMode?: AuthMode;
}

type AuthMode = 'login' | 'register' | 'forgot';

export default function Login({ onLogin, initialMode = 'login' }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [regStep, setRegStep] = useState(1); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [isKuss, setIsKuss] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showImpressumModal, setShowImpressumModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsKuss(true);
    }, 1500);
    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleRegisterFinal = async () => {
    if (!privacyAccepted) return;
    setLoading(true);
    setMessage(null);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { display_name: displayName.trim() }
        }
      });
      if (signUpError) throw signUpError;
      if (data.session) {
        onLogin(true);
      } else {
        setMessage({ type: 'success', text: 'Bestätigungslink wurde versendet! ✨ Bitte schau in dein Postfach.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Registrierung fehlgeschlagen.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (mode === 'login') {
      setLoading(true);
      try {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
        onLogin(false);
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot') {
      setLoading(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Reset-Link wurde gesendet!' });
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen w-full max-w-md mx-auto animate-entrance px-4 py-12 relative overflow-hidden">
      
      <div className="relative z-10 w-full flex-1 flex flex-col items-center">
        {mode === 'login' && (
          <div className="text-center mb-12 select-none w-full">
            <h1 className="text-7xl font-bold text-[var(--text-main)] mb-8 tracking-tight" style={{ fontFamily: 'Fraunces, serif' }}>
              Bisou
            </h1>
            
            <div className="text-[var(--text)] text-xl font-extrabold flex items-center justify-center select-none w-full" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              <div className="flex items-baseline justify-center">
                <span className="whitespace-nowrap">Jeden Tag ein&nbsp;</span>
                
                <span className="inline-grid transition-[grid-template-columns] duration-1000 ease-in-out text-[var(--primary)]" 
                      style={{ gridTemplateColumns: isKuss ? '0fr 1fr' : '1fr 0fr' }}>
                  <span className="overflow-hidden whitespace-nowrap transition-all duration-1000 px-[1px]" 
                        style={{ 
                          opacity: isKuss ? 0 : 1, 
                          filter: isKuss ? 'blur(4px)' : 'none'
                        }}>
                    bisschen
                  </span>
                  <span className="overflow-hidden whitespace-nowrap transition-all duration-1000 px-[1px]" 
                        style={{ 
                          opacity: isKuss ? 1 : 0, 
                          filter: isKuss ? 'none' : 'blur(4px)'
                        }}>
                    Küsschen
                  </span>
                </span>

                <span className="whitespace-nowrap">&nbsp;näher.</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="w-full">
          {message && (
            <div className={`p-4 rounded-[22px] text-sm font-bold mb-6 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 ${
              message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
            }`}>
              {message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : <Mail className="w-5 h-5 flex-shrink-0" />}
              <p>{message.text}</p>
            </div>
          )}

          {mode === 'login' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <input type="email" className="input-base" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <input type="password" className="input-base" placeholder="Passwort" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              <button type="submit" disabled={loading} className="btn-action w-full mt-2">
                {loading ? 'Lädt...' : 'Einloggen ✨'}
              </button>
              <button type="button" onClick={() => setMode('register')} className="btn-secondary w-full">Konto erstellen</button>
            </form>
          )}

          {mode === 'forgot' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {message?.type === 'success' ? (
                <div className="text-center py-4">
                  <button type="button" onClick={() => { setMode('login'); setMessage(null); }} className="btn-action">Zum Login</button>
                </div>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-[var(--text-main)] mb-2">Passwort vergessen</h2>
                    <p className="text-sm text-[var(--text)] opacity-70">Wir senden dir einen Link zum Zurücksetzen.</p>
                  </div>
                  <input type="email" className="input-base" placeholder="Deine E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <button type="submit" disabled={loading} className="btn-action">{loading ? 'Sende...' : 'Link senden ✨'}</button>
                  <button type="button" onClick={() => setMode('login')} className="w-full text-sm font-bold text-[var(--muted)] hover:text-[var(--text-main)] transition-colors">Zurück zum Login</button>
                </>
              )}
            </form>
          )}

          {mode === 'register' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              {regStep === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-[var(--text-main)] mb-2">Willkommen! ✨</h2>
                  </div>
                  <div className="space-y-3">
                    <input type="text" className="input-base" placeholder="Dein Vorname" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
                    <input type="email" className="input-base" placeholder="E-Mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <input type="password" className="input-base" placeholder="Passwort (min. 6 Zeichen)" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                  <button disabled={!email || password.length < 6 || !displayName} onClick={() => setRegStep(2)} className="btn-action">Weiter <ArrowRight className="w-5 h-5" /></button>
                  <button type="button" onClick={() => setMode('login')} className="w-full text-sm font-bold text-[var(--muted)] hover:text-[var(--text-main)] transition-colors">Bereits ein Konto? Login</button>
                </div>
              )}
              {regStep === 2 && (
                <div className="space-y-8 text-center">
                  {message?.type === 'success' ? (
                    <div className="space-y-6">
                      <div className="w-20 h-20 bg-green-50 rounded-[2.5rem] flex items-center justify-center mx-auto"><Mail className="w-10 h-10 text-green-500" /></div>
                      <div><h2 className="text-2xl font-bold mb-2">Fast geschafft!</h2><p className="text-sm text-[var(--text)] leading-relaxed">Bestätige bitte deine E-Mail <b>{email}</b>.</p></div>
                      <button onClick={() => { setMode('login'); setMessage(null); }} className="btn-action">Zum Login</button>
                    </div>
                  ) : (
                    <>
                      <div className="w-20 h-20 bg-purple-50 rounded-[2.5rem] flex items-center justify-center mx-auto"><ShieldCheck className="w-10 h-10 text-[var(--secondary)]" /></div>
                      <div>
                        <h2 className="text-3xl font-bold text-[var(--text-main)] mb-2">Datenschutz</h2>
                        <p className="text-sm text-[var(--text)] leading-relaxed opacity-70 px-4">
                          Die Verarbeitung von Daten durch diese Anwendung erfolgt ausschließlich für persönliche oder familiäre Zwecke. Sie fällt daher gemäß Art. 2 Abs. 2 lit. c DSGVO unter das sogenannte Haushaltsprivileg, weshalb die Bestimmungen der DSGVO keine Anwendung finden.
                        </p>
                      </div>
                      <label className="flex items-center gap-4 p-6 rounded-[28px] border-2 border-purple-50 bg-white cursor-pointer hover:border-[var(--secondary)] transition-all">
                        <input type="checkbox" className="w-6 h-6 rounded-lg accent-[var(--secondary)]" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} />
                        <span className="text-sm font-bold text-[var(--text)] text-left">Ich habe die Datenschutzhinweise gelesen.</span>
                      </label>
                      <div className="space-y-3">
                        <button disabled={!privacyAccepted || loading} onClick={handleRegisterFinal} className="btn-action">{loading ? 'Wird erstellt...' : 'Konto erstellen ✨'}</button>
                        <button onClick={() => setRegStep(1)} className="w-full text-sm font-bold text-[var(--muted)] hover:text-[var(--text-main)]">Zurück</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Global Forgot Password Link */}
          {mode !== 'forgot' && !(mode === 'register' && regStep === 2 && message?.type === 'success') && (
            <div className="text-center pt-8">
              <button 
                type="button" 
                onClick={() => {
                  setMode('forgot');
                  setMessage(null);
                }} 
                className="text-[var(--muted)] text-sm font-bold hover:text-[var(--text-main)] transition-colors"
              >
                Passwort vergessen?
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-auto pt-12 pb-2 text-center">
          <p className="text-[10px] font-bold text-[var(--muted)] opacity-50">
            Bisou-App v.01<br />
            <a 
              href="https://github.com/bene-s-dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-[var(--secondary)] transition-colors"
            >
              Benedikt S.
            </a> &copy; 2026          </p>
          <div className="flex justify-center gap-4 mt-2">
            <button 
              onClick={() => setShowPrivacyModal(true)}
              className="text-[10px] font-bold text-[var(--muted)] opacity-50 underline"
            >
              Datenschutz
            </button>
            <button 
              onClick={() => setShowImpressumModal(true)}
              className="text-[10px] font-bold text-[var(--muted)] opacity-50 underline"
            >
              Impressum
            </button>
          </div>
        </footer>
      </div>

      {/* Privacy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#2D264B]/40 backdrop-blur-sm" onClick={() => setShowPrivacyModal(false)} />
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative z-10 animate-entrance border border-purple-100 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <ShieldCheck className="w-8 h-8 text-[var(--secondary)]" />
            </div>
            <h3 className="text-xl font-bold text-[#2D264B] mb-4">Datenschutz</h3>
            <p className="text-sm text-[#4A4468] leading-relaxed mb-8">
              Die Verarbeitung von Daten durch diese Anwendung erfolgt ausschließlich für persönliche oder familiäre Zwecke. Sie fällt daher gemäß Art. 2 Abs. 2 lit. c DSGVO unter das sogenannte Haushaltsprivileg, weshalb die Bestimmungen der DSGVO keine Anwendung finden.<br /><br />
              <i className="opacity-80">Dein Bene</i>
            </p>
            <button 
              onClick={() => setShowPrivacyModal(false)}
              className="btn-action"
            >
              Schließen
            </button>
          </div>
        </div>
      )}

      {/* Impressum Modal */}
      {showImpressumModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-[#2D264B]/40 backdrop-blur-sm" onClick={() => setShowImpressumModal(false)} />
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md relative z-10 animate-entrance border border-purple-100 text-center">
            <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <span className="text-3xl font-bold text-[var(--secondary)]">§</span>
            </div>
            <h3 className="text-xl font-bold text-[#2D264B] mb-4">Impressum</h3>
            <p className="text-sm text-[#4A4468] leading-relaxed mb-8 font-medium">
              Made with ❤️ in Freiburg
            </p>
            <button 
              onClick={() => setShowImpressumModal(false)}
              className="btn-action"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
