import React, { useState, useEffect, useCallback } from 'react';
import { 
  Camera, Link2, ArrowRight, Copy, Check, AlertCircle, Heart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ImageCropper from './ImageCropper';
import { useDialog } from './DialogProvider';

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { showAlert } = useDialog();
  const [step, setStep] = useState(1); // 1: Photo, 2: Partner
  const [userName, setUserName] = useState('');
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [myProfile, setMyProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const fetchMyProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, partner_id, partner_code, avatar_url, onboarding_completed')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (error) throw error;
        setMyProfile(data);
        if (data) {
          setUserName(data.display_name);
          if (data.avatar_url) setAvatarPreview(data.avatar_url);
        }
      }
    } catch (err) {
      console.error("Fehler beim Laden des Profils im Onboarding:", err);
    }
  }, []);

  useEffect(() => {
    fetchMyProfile();
  }, [fetchMyProfile]);

  const handleLinkPartner = async () => {
    if (!partnerCodeInput) return;
    setIsLinking(true);

    try {
      const { error } = await supabase.rpc('link_partners', { 
        partner_code_to_link: partnerCodeInput.trim().toUpperCase() 
      });

      if (error) throw error;

      onComplete();
    } catch (err: any) {
      showAlert("Fehler: " + (err.message || "Verknüpfung fehlgeschlagen."), "error");
    } finally {
      setIsLinking(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showAlert("Das Bild ist zu groß (max. 10 MB).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setSelectedImage(null);
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. Delete previous image if exists (clean storage)
      const { data: currentProfile } = await supabase.from('profiles').select('avatar_url').eq('id', session.user.id).single();
      if (currentProfile?.avatar_url) {
        const oldPath = currentProfile.avatar_url.split('/avatars/')[1];
        if (oldPath) await supabase.storage.from('avatars').remove([oldPath]);
      }

      const localUrl = URL.createObjectURL(croppedBlob);
      setAvatarPreview(localUrl);

      // 2. Upload new
      const fileName = `${session.user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      if (updateError) throw updateError;
      await fetchMyProfile();
    } catch (err: any) {
      showAlert("Fehler beim Upload: " + err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-4 animate-entrance relative">
      {selectedImage && (
        <ImageCropper 
          image={selectedImage} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setSelectedImage(null)} 
        />
      )}

      <header className="mb-10">
        <div className="quiz-prog-dots">
          {[1, 2].map((s) => (
            <div key={s} className={`quiz-dot ${s === step ? 'active' : (s < step ? 'done' : '')}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-center px-4">
            <div className="relative mx-auto w-32 flex flex-col items-center">
              <label className="cursor-pointer block relative h-32 w-32 mb-6 group">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={loading} />
                <div className={`w-32 h-32 rounded-[2.5rem] bg-white flex items-center justify-center border-2 border-white shadow-md overflow-hidden transition-all group-hover:scale-105 active:scale-95 ${loading ? 'opacity-50' : ''}`}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-purple-200" />
                  )}
                  {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-10">
                      <div className="w-6 h-6 border-4 border-[var(--secondary)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </label>
              <button 
                onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                disabled={loading}
                className="bg-white border-2 border-[var(--card-border)] px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--secondary)] active:scale-95 transition-all flex items-center gap-2 shadow-sm"
              >
                <Camera className="w-4 h-4" />
                {avatarPreview ? 'Foto ändern' : 'Foto wählen'}
              </button>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-black text-[#1F1939] tracking-tight">Hallo {userName}! ❤️</h2>
              <p className="text-[var(--text)] text-xs font-medium leading-relaxed opacity-80 max-w-[240px] mx-auto">
                Lass uns dein Profil vervollständigen. Möchtest du ein Foto hochladen?
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 text-center px-4">
            <div className="w-20 h-20 bg-white rounded-[2rem] border-2 border-white shadow-md flex items-center justify-center mx-auto text-[var(--secondary)]">
              <Link2 className="w-10 h-10" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-[#1F1939] tracking-tight">Der erste Schritt</h2>
              <p className="text-xs text-[var(--muted)] font-medium -mt-2">Verknüpfe dich jetzt mit deinem Bisou-Partner:</p>
              
              <div className="status-box p-6 space-y-4 text-left mt-6">
                <div>
                  <p className="text-[9px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] mb-2 px-1">Dein Code zum Teilen:</p>
                  <div className="flex items-center justify-between bg-purple-50/30 p-4 rounded-2xl border-2 border-dashed border-[var(--card-border)]">
                    <span className="font-mono font-black text-[var(--text-main)] tracking-[0.2em] text-lg">{myProfile?.partner_code || '...'}</span>
                    <button onClick={() => { navigator.clipboard.writeText(myProfile?.partner_code); showAlert("Code kopiert! ✨", "success"); }} className="p-2.5 bg-white border border-purple-100 rounded-xl active:scale-90 transition-all shadow-sm">
                      <Copy className="w-5 h-5 text-[var(--secondary)]" />
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-black text-[var(--secondary)] uppercase tracking-[0.2em] mb-2 px-1">Partner-Code eingeben:</p>
                  <input 
                    type="text" 
                    placeholder="CODE HIER EINGEBEN" 
                    className="w-full p-5 rounded-2xl border-2 border-[var(--card-border)] bg-white text-center font-mono font-black tracking-[0.2em] uppercase text-xl outline-none focus:border-[var(--secondary)] shadow-sm transition-all placeholder:text-purple-100 placeholder:font-sans placeholder:text-xs placeholder:tracking-widest"
                    value={partnerCodeInput}
                    onChange={(e) => setPartnerCodeInput(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <p className="text-[9px] font-bold text-[var(--muted)] uppercase tracking-widest flex items-center justify-center gap-1.5 opacity-60">
              <Heart className="w-3 h-3 fill-current" /> Gemeinsam mehr erleben
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4 pb-6 pt-4">
        {step === 1 ? (
          <button 
            disabled={loading}
            onClick={() => setStep(2)}
            className="btn-action py-5 text-lg font-black"
          >
            Weiter <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleLinkPartner} disabled={isLinking || !partnerCodeInput} className="btn-action py-5 text-lg font-black">
            {isLinking ? 'Wird verknüpft...' : 'Verknüpfen & Starten ❤️'}
          </button>
        )}
        
        {step === 2 && (
          <button onClick={onComplete} className="w-full text-[10px] font-black text-[var(--muted)] uppercase tracking-[0.2em] hover:text-[var(--text-main)] transition-colors py-2">
            Später verknüpfen
          </button>
        )}
      </div>
    </div>
  );
}
