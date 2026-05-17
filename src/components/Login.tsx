import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, ArrowRight, Mail } from 'lucide-react';

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

  useEffect(() => {
    // Animation triggers only once after 2.5 seconds
    const timer = setTimeout(() => {
      setIsKuss(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleRegisterFinal = async () => {
    setLoading(true);
    setMessage(null);
    console.log("🚀 Starte Registrierung für:", email);
    
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email: email.trim(), 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            display_name: displayName.trim(),
          }
        }
      });
      
      if (signUpError) {
        console.error("❌ Supabase SignUp Error:", signUpError);
        if (signUpError.message.includes('rate limit')) {
          throw new Error("Zu viele Versuche. Bitte warte eine Stunde (Supabase Limit).");
        }
        throw signUpError;
      }
      
      console.log("✅ SignUp erfolgreich, Antwort:", data);

      if (data.session) {
        onLogin(true);
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Registrierung-Link wurde versendet! ✨ Bitte schau in dein Postfach (und Spam).' 
        });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ein Fehler ist aufgetreten.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        setMessage({ type: 'error', text: error.message });
        setLoading(false);
      } else {
        onLogin(false);
      }
    } else if (mode === 'forgot') {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Reset-Link wurde gesendet!' });
      }
      setLoading(false);
    }
  };

  const renderMorphingWord = (word: string, active: boolean) => {
    return (
      <span 
        className={`transition-all duration-1000 ease-in-out flex items-center justify-center ${
          active 
            ? 'opacity-100 relative' 
            : 'opacity-0 absolute inset-0 scale-95 blur-[1px]'
        } text-[var(--primary)] whitespace-nowrap`}
      >
        {word.split('').map((char, i) => (
          <span 
            key={i}
            style={{ 
              transitionDelay: active ? `${i * 35}ms` : '0ms',
            }}
            className="inline-block transition-all duration-1000 ease-in-out"
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 animate-in fade-in duration-700">
      
      {/* Name und Slogan nur im Login-Modus anzeigen */}
      {mode === 'login' && (
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-7xl font-bold text-[var(--text-main)] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
            Bisou
          </h1>
          <div className="text-[var(--text)] text-xl font-bold flex items-center justify-center relative h-8 transition-all duration-1000 ease-in-out" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="flex-shrink-0 transition-all duration-1000 ease-in-out">Jeden Tag ein&nbsp;</span>
            
            <div className="relative inline-flex items-center justify-center transition-all duration-1000 ease-in-out">
               <div className="relative inline-flex items-center justify-center transition-all duration-1000 ease-in-out">
                 {renderMorphingWord("Biss", !isKuss)}
                 {renderMorphingWord("Küss", isKuss)}
               </div>
               <span className="text-[var(--primary)] whitespace-nowrap transition-all duration-1000 ease-in-out">chen</span>
            </div>
            
            <span className="flex-shrink-0 transition-all duration-1000 ease-in-out">&nbsp;näher.</span>
          </div>
        </div>
      )}
      
      <div className="w-full max-w-sm">
        {message && message.type === 'error' && (
          <div className="p-4 rounded-2xl text-sm font-medium mb-4 bg-red-100 text-red-700">
            {message.text}
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <input
                type="email"
                className="input-base"
                placeholder="E-Mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                className="input-base"
                placeholder="Passwort"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-action w-full">
              {loading ? 'Lädt...' : 'Einloggen ✨'}
            </button>
            <button type="button" onClick={() => setMode('register')} className="btn-secondary w-full">
              Neu hier? Registrieren
            </button>
            <div className="text-center pt-2">
              <button type="button" onClick={() => setMode('forgot')} className="text-[var(--muted)] text-sm font-medium hover:text-[var(--text-main)] underline underline-offset-4 decoration-1">
                Passwort vergessen?
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {message && message.type === 'success' && (
              <div className="p-6 rounded-[2rem] bg-green-50 text-green-700 text-center mb-4 border border-green-100">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-bold mb-2">Email versendet!</p>
                <p className="text-sm opacity-80">{message.text}</p>
                <button type="button" onClick={() => { setMode('login'); setMessage(null); }} className="mt-6 text-sm font-bold underline underline-offset-4 decoration-1">Zum Login</button>
              </div>
            )}
            
            {(!message || message.type === 'error') && (
              <>
                <h2 className="text-2xl font-bold text-center mb-6 text-[var(--text-main)]">Passwort vergessen</h2>
                <input
                  type="email"
                  className="input-base"
                  placeholder="Deine E-Mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button type="submit" disabled={loading} className="btn-action w-full">
                  {loading ? 'Lädt...' : 'Link senden ✨'}
                </button>
                <div className="text-center pt-2">
                  <button type="button" onClick={() => setMode('login')} className="text-[var(--muted)] text-sm font-medium hover:text-[var(--text-main)] underline underline-offset-4 decoration-1">
                    Zurück zum Login
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {mode === 'register' && (
          <div className="animate-entrance">
            {regStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center mb-6 text-[var(--text-main)]">Account erstellen</h2>
                <input
                  type="text"
                  className="input-base text-center"
                  placeholder="Dein Vorname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                />
                <input
                  type="email"
                  className="input-base"
                  placeholder="E-Mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  type="password"
                  className="input-base"
                  placeholder="Passwort (min. 6 Zeichen)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  disabled={!email || password.length < 6 || !displayName}
                  onClick={() => setRegStep(2)} 
                  className="btn-action w-full flex items-center justify-center gap-2"
                >
                  Weiter <ArrowRight className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-[var(--muted)] text-sm font-medium py-2 underline underline-offset-4 decoration-1">
                  Bereits ein Konto? Login
                </button>
              </div>
            )}

            {regStep === 2 && (
              <div className="space-y-6">
                {message && message.type === 'success' ? (
                  <div className="p-6 rounded-[2rem] bg-green-50 text-green-700 text-center animate-entrance border border-green-100">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Mail className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-xl font-bold mb-2 text-green-800">Fast geschafft! ✨</h2>
                    <p className="text-sm leading-relaxed opacity-90">
                      Wir haben eine Bestätigungsmail an <br/><b>{email}</b> geschickt.
                    </p>
                    <p className="text-xs mt-4 opacity-70">
                      Bitte schau auch in deinem <b>Spam-Ordner</b> nach.
                    </p>
                    <button 
                      onClick={() => { setMode('login'); setMessage(null); }}
                      className="mt-8 text-sm font-bold text-green-700 underline underline-offset-4 decoration-1"
                    >
                      Zurück zum Login
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-[2rem] bg-white border border-purple-50 inline-block">
                      <ShieldCheck className="w-10 h-10 text-[var(--secondary)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-[var(--text-main)]">Datenschutz</h2>
                    <p className="text-[var(--text)] text-sm leading-relaxed">
                      Die Verarbeitung von Daten durch diese Anwendung erfolgt ausschließlich für persönliche oder familiäre Zwecke. Sie fällt daher gemäß Art. 2 Abs. 2 lit. c DSGVO unter das sogenannte Haushaltsprivileg, weshalb die Bestimmungen der DSGVO keine Anwendung finden.
                    </p>
                    <label className="flex items-center gap-4 p-5 rounded-[22px] border-2 border-purple-50 bg-white">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 rounded accent-[var(--secondary)]"
                        checked={privacyAccepted}
                        onChange={(e) => setPrivacyAccepted(e.target.checked)}
                      />
                      <span className="text-sm font-medium text-[var(--text)]">Ich akzeptiere die Bedingungen.</span>
                    </label>
                    <button 
                      disabled={!privacyAccepted || loading}
                      onClick={handleRegisterFinal} 
                      className="btn-action w-full flex items-center justify-center gap-2"
                    >
                      {loading ? 'Lädt...' : 'Registrierung abschließen ✨'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
