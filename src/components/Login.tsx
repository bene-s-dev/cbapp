import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, ArrowRight, Mail, AlertCircle } from 'lucide-react';

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
    const timer = setTimeout(() => {
      setIsKuss(true);
    }, 2500);
    return () => clearTimeout(timer);
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

  const MorphingWord = ({ word, active }: { word: string, active: boolean }) => (
    <span 
      className={`transition-all duration-700 ease-in-out inline-flex overflow-hidden ${
        active 
          ? 'max-w-[100px] opacity-100 blur-0' 
          : 'max-w-0 opacity-0 blur-sm pointer-events-none'
      } text-[var(--primary)]`}
    >
      {word}
    </span>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full max-w-sm mx-auto animate-entrance">
      
      {mode === 'login' && (
        <div className="text-center mb-16 animate-in fade-in slide-in-from-top-4 duration-1000">
          <h1 className="text-7xl font-bold text-[var(--text-main)] mb-4" style={{ fontFamily: 'Fraunces, serif' }}>
            Bisou
          </h1>
          <div className="text-[var(--text)] text-xl font-bold flex items-center justify-center transition-all duration-500" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            <span className="whitespace-nowrap">Jeden Tag ein&nbsp;</span>
            <div className="flex items-center">
              <MorphingWord word="Biss" active={!isKuss} />
              <MorphingWord word="Küss" active={isKuss} />
              <span className="text-[var(--primary)]">chen</span>
            </div>
            <span className="whitespace-nowrap">&nbsp;näher.</span>
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
            <div className="text-center pt-2">
              <button type="button" onClick={() => setMode('forgot')} className="text-[var(--muted)] text-sm font-bold hover:text-[var(--text-main)] transition-colors">Passwort vergessen?</button>
            </div>
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
                  <p className="text-sm text-[var(--text)] opacity-70">Lass uns dein Konto erstellen.</p>
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
                    <div><h2 className="text-3xl font-bold text-[var(--text-main)] mb-2">Datenschutz</h2><p className="text-sm text-[var(--text)] leading-relaxed opacity-70">Deine Daten werden nur für den persönlichen Gebrauch innerhalb der App verarbeitet.</p></div>
                    <label className="flex items-center gap-4 p-6 rounded-[28px] border-2 border-purple-50 bg-white cursor-pointer hover:border-[var(--secondary)] transition-all">
                      <input type="checkbox" className="w-6 h-6 rounded-lg accent-[var(--secondary)]" checked={privacyAccepted} onChange={(e) => setPrivacyAccepted(e.target.checked)} />
                      <span className="text-sm font-bold text-[var(--text)] text-left">Ich akzeptiere die Bedingungen.</span>
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
      </div>
    </div>
  );
}
