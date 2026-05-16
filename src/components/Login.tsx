import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ShieldCheck, ArrowRight, Camera, Sparkles } from 'lucide-react';

interface LoginProps {
  onLogin: (isNew?: boolean) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [regStep, setRegStep] = useState(1); // 1: Auth, 2: Privacy, 3: Name
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [isKuss, setIsKuss] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsKuss(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleRegisterFinal = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      // Sign up with user metadata so the database trigger can catch it
      const { data, error: signUpError } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            display_name: displayName,
            avatar_url: avatarUrl // This will be null initially if uploaded later
          }
        }
      });
      
      if (signUpError) throw signUpError;
      
      if (data.session) {
        // User is logged in immediately (Confirm Email is OFF)
        onLogin(true);
      } else {
        // Email confirmation is required (Confirm Email is ON)
        setMessage({ 
          type: 'success', 
          text: 'Registrierung fast fertig! ✨ Bitte klicke auf den Bestätigungslink in deiner E-Mail.' 
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
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: 'error', text: error.message });
        setLoading(false);
      } else {
        onLogin(false);
      }
    } else if (mode === 'forgot') {
      setLoading(true);
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Reset-Link wurde gesendet!' });
      }
      setLoading(false);
    }
  };

  const word1 = "Bisschen";
  const word2 = "Küsschen";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-6 animate-in fade-in duration-700">
      
      <div className="text-center mb-12">
        <h1 className="text-7xl font-bold text-[var(--text-main)] mb-2" style={{ fontFamily: 'Fraunces, serif' }}>
          Bisou
        </h1>
        <div className="text-[var(--text)] text-lg font-bold flex items-center justify-center h-8 relative overflow-hidden" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          <span>Jeden Tag ein&nbsp;</span>
          <div className="relative inline-flex items-center justify-center min-w-[80px] h-full transition-all duration-700 ease-in-out">
            <span 
              className={`absolute transition-all duration-700 ease-in-out ${isKuss ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'} text-[var(--primary)]`}
            >
              Bisschen
            </span>
            <span 
              className={`absolute transition-all duration-700 ease-in-out ${isKuss ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} text-[var(--primary)]`}
            >
              Küsschen
            </span>
          </div>
          <span>&nbsp;näher.</span>
        </div>
      </div>
      
      <div className="w-full max-w-sm">
        {message && (
          <div className={`p-4 rounded-2xl text-sm font-medium mb-4 ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
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
              <button type="button" onClick={() => setMode('forgot')} className="text-[var(--muted)] text-sm font-medium hover:text-[var(--text-main)] underline underline-offset-4">
                Passwort vergessen?
              </button>
            </div>
          </form>
        )}

        {mode === 'forgot' && (
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <button type="button" onClick={() => setMode('login')} className="text-[var(--muted)] text-sm font-medium hover:text-[var(--text-main)] underline underline-offset-4">
                Zurück zum Login
              </button>
            </div>
          </form>
        )}

        {mode === 'register' && (
          <div className="animate-entrance">
            {regStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-center mb-6 text-[var(--text-main)]">Account erstellen</h2>
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
                  disabled={!email || password.length < 6}
                  onClick={() => setRegStep(2)} 
                  className="btn-action w-full flex items-center justify-center gap-2"
                >
                  Weiter <ArrowRight className="w-5 h-5" />
                </button>
                <button type="button" onClick={() => setMode('login')} className="w-full text-[var(--muted)] text-sm font-medium py-2">
                  Bereits ein Konto? Login
                </button>
              </div>
            )}

            {regStep === 2 && (
              <div className="space-y-6">
                <div className="p-4 rounded-[2rem] bg-white border border-purple-50 inline-block">
                  <ShieldCheck className="w-10 h-10 text-[var(--secondary)]" />
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">Datenschutz</h2>
                <p className="text-[var(--text)] text-sm leading-relaxed">
                  Deine Daten werden sicher verschlüsselt. Wir haben keinen Zugriff auf eure privaten Nachrichten. ❤️
                </p>
                <label className="flex items-center gap-4 p-5 rounded-[22px] border-2 border-purple-50 bg-white">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded accent-[var(--secondary)]"
                    checked={privacyAccepted}
                    onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  />
                  <span className="text-sm font-medium text-[var(--text)]">Ich akzeptiere die Bedingungen. ❤️</span>
                </label>
                <button 
                  disabled={!privacyAccepted}
                  onClick={() => setRegStep(3)} 
                  className="btn-action w-full flex items-center justify-center gap-2"
                >
                  Weiter <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {regStep === 3 && (
              <div className="space-y-6 text-center">
                <div className="relative mx-auto w-24">
                  <div className="w-24 h-24 rounded-[2rem] bg-white flex items-center justify-center border-2 border-dashed border-purple-100 overflow-hidden shadow-sm">
                    <Camera className="w-6 h-6 text-purple-200" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-2 bg-[var(--secondary)] rounded-xl shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-[var(--text-main)]">Wie heißt du?</h2>
                <input
                  type="text"
                  className="input-base text-center"
                  placeholder="Dein Vorname"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                />
                <p className="text-[var(--muted)] text-xs">Foto kannst du später im Profil hochladen.</p>
                <button 
                  disabled={!displayName || loading}
                  onClick={handleRegisterFinal} 
                  className="btn-action w-full"
                >
                  {loading ? 'Lädt...' : 'Registrierung abschließen ✨'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
