import React, { useState, useEffect } from 'react';
import { 
  Camera, Link2, ArrowRight, Copy, Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1); // 1: Photo, 2: Partner
  const [userName, setUserName] = useState('');
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
      if (data) {
        setUserName(data.display_name);
        if (data.avatar_url) setAvatarPreview(data.avatar_url);
      }
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
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error: updateMeError } = await supabase
        .from('profiles')
        .update({ partner_id: partnerProfile.id })
        .eq('id', session.user.id);

      const { error: updatePartnerError } = await supabase
        .from('profiles')
        .update({ partner_id: session.user.id })
        .eq('id', partnerProfile.id);

      if (updateMeError || updatePartnerError) {
        throw new Error("Verknüpfung fehlgeschlagen");
      }

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
      alert("Das Bild ist zu groß (max. 5 MB).");
      return;
    }

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Show local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);

      // 2. Upload to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // 3. Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // 4. Update profile
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      await fetchMyProfile();
    } catch (err: any) {
      alert("Fehler beim Upload: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between pt-12 animate-in fade-in duration-500 relative">
      <header>
        <div className="prog-dots">
          {[1, 2].map((s) => (
            <div key={s} className={`dot ${s === step ? 'active' : (s < step ? 'done' : '')}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-center px-4">
            <div className="relative mx-auto w-32 flex flex-col items-center">
              <label className="cursor-pointer block relative h-32 w-32 mb-3 group">
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={loading} />
                <div className={`w-32 h-32 rounded-[2.5rem] bg-white flex items-center justify-center border-2 border-dashed border-purple-100 overflow-hidden shadow-sm transition-all group-hover:border-[var(--secondary)] ${loading ? 'opacity-50' : ''}`}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-purple-200" />
                  )}
                  {avatarPreview && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Check className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
              </label>
              <button 
                onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                disabled={loading}
                className="bg-white border border-purple-100 px-4 py-2 rounded-xl text-[11px] font-bold text-[var(--secondary)] shadow-sm hover:bg-purple-50 transition-colors flex items-center gap-1.5"
              >
                <Camera className="w-3 h-3" />
                {avatarPreview ? 'Foto ändern' : 'Foto wählen'}
              </button>
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-main)]">Hallo {userName}! ❤️</h2>
            <p className="text-[var(--text)] text-sm leading-relaxed">
              Dein Profil ist fast bereit. <br/>Möchtest du noch ein Bild von dir hochladen?
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-center px-4">
            <div className="p-6 rounded-[2.5rem] bg-white border border-purple-50 inline-block shadow-sm">
              <Link2 className="w-12 h-12 text-[var(--secondary)]" />
            </div>
            
            <div className="space-y-4 text-left">
              <h2 className="text-3xl font-bold text-[var(--text-main)] text-center">Partner verknüpfen</h2>
              <p className="text-[var(--text)] text-sm">Dein Code zum Teilen:</p>
              <div className="flex items-center justify-between bg-white p-4 rounded-2xl border-2 border-dashed border-purple-200 shadow-sm">
                <span className="font-mono font-bold text-[var(--secondary)] tracking-widest">{myProfile?.partner_code || '...'}</span>
                <button onClick={() => { navigator.clipboard.writeText(myProfile?.partner_code); alert("Code kopiert!"); }} className="p-2 hover:bg-purple-50 rounded-xl transition-colors">
                  <Copy className="w-5 h-5 text-[var(--secondary)]" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-[var(--text)] text-sm">Oder gib den Code deines Partners ein:</p>
              <input 
                type="text" 
                placeholder="CB-XXXXXX" 
                className="w-full p-5 rounded-[20px] border-2 border-purple-100 bg-white text-center font-mono tracking-widest uppercase text-[1.1rem] outline-none focus:border-[var(--secondary)] shadow-sm"
                value={partnerCodeInput}
                onChange={(e) => setPartnerCodeInput(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 pb-4">
        {step === 1 ? (
          <button 
            disabled={loading}
            onClick={() => setStep(2)}
            className="btn-action flex items-center justify-center gap-2"
          >
            {loading ? 'Lädt...' : 'Weiter'} <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleLinkPartner} disabled={loading || !partnerCodeInput} className="btn-action flex items-center justify-center gap-2">
            {loading ? 'Verknüpfe...' : 'Verknüpfen & Starten ❤️'}
          </button>
        )}
        
        {step === 2 && (
          <button onClick={onComplete} className="w-full text-[var(--muted)] text-sm font-medium hover:underline">
            Später verknüpfen
          </button>
        )}
      </div>
    </div>
  );
}
