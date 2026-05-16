import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Camera, Link2, Sparkles, 
  ArrowRight, Copy
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [userName, setUserName] = useState('');
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyProfile();
  }, []);

  const fetchMyProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
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
      const { data: partnerProfile, error: findError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .eq('partner_code', partnerCodeInput.trim().toUpperCase())
        .single();

      if (findError || !partnerProfile) {
        alert("Code nicht gefunden! ❌");
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          partner_id: partnerProfile.id
        })
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Das Bild ist zu groß. Bitte wähle ein Bild unter 5 MB aus.");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      fetchMyProfile();
    } catch (err: any) {
      alert("Fehler beim Upload: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-12 animate-in fade-in duration-500 relative">
      <header>
        <div className="prog-dots">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`dot ${s === step ? 'active' : (s < step ? 'done' : '')}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 rounded-[2.5rem] bg-white border border-purple-50 inline-block">
              <ShieldCheck className="w-12 h-12 text-[var(--secondary)]" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-[var(--text-main)]">Datenschutz</h2>
              <p className="text-[var(--text)] leading-relaxed">
                Deine Daten werden sicher in Supabase verschlüsselt. Wir haben keinen Zugriff auf eure privaten Nachrichten oder Fotos. Alles bleibt unter euch. ❤️
              </p>
            </div>
            <label className="flex items-center gap-4 p-6 rounded-[28px] border-2 border-purple-50 bg-white shadow-sm">
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
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-center">
            <div className="relative mx-auto w-32 flex flex-col items-center">
              <label className="cursor-pointer block relative h-32 w-full mb-3">
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                <div className="w-32 h-32 rounded-[2.5rem] bg-white flex items-center justify-center border-2 border-dashed border-purple-100 overflow-hidden shadow-sm">
                  {myProfile?.avatar_url ? (
                    <img src={myProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-purple-200" />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 p-3 bg-[var(--secondary)] rounded-2xl shadow-xl">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </label>
              <p className="text-[10px] text-[var(--muted)] font-medium">max. 5 MB</p>
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-main)]">Hallo {userName}!</h2>
            <p className="text-[var(--text)]">Dein Profil ist bereit. Jetzt fehlt nur noch dein Partner.</p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="p-6 rounded-[2.5rem] bg-white border border-purple-50 inline-block">
              <Link2 className="w-12 h-12 text-[var(--secondary)]" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-[var(--text-main)]">Partner verknüpfen</h2>
              <p className="text-[var(--text)] text-sm">Dein Code zum Teilen:</p>
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-dashed border-purple-200">
                <span className="font-mono font-bold text-[var(--secondary)] tracking-widest">{myProfile?.partner_code || 'Wird geladen...'}</span>
                <button onClick={() => { navigator.clipboard.writeText(myProfile?.partner_code); alert("Code kopiert!"); }} className="p-2 hover:bg-purple-50 rounded-xl transition-colors">
                  <Copy className="w-5 h-5 text-[var(--secondary)]" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-[var(--text)] text-sm">Oder gib den Code deines Partners ein:</p>
              <input 
                type="text" 
                placeholder="CB-XXXXXX" 
                className="w-full p-5 rounded-[20px] border-2 border-purple-100 bg-white text-center font-mono tracking-widest uppercase text-[1.1rem] outline-none focus:border-[var(--secondary)]"
                value={partnerCodeInput}
                onChange={(e) => setPartnerCodeInput(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        {step === 3 ? (
          <button onClick={handleLinkPartner} disabled={loading || !partnerCodeInput} className="btn-action flex items-center justify-center gap-2">
            {loading ? 'Verknüpfe...' : 'Verknüpfen & Starten ❤️'}
          </button>
        ) : (
          <button 
            disabled={(step === 1 && !privacyAccepted) || (step === 2 && loading)}
            onClick={() => setStep(step + 1)}
            className="btn-action flex items-center justify-center gap-2"
          >
            {loading ? 'Lädt...' : 'Weiter'} <ArrowRight className="w-5 h-5" />
          </button>
        )}
        
        {step === 3 && (
          <button onClick={onComplete} className="w-full text-[var(--muted)] text-sm font-medium hover:underline">
            Später verknüpfen
          </button>
        )}
      </div>
    </div>
  );
}
