import React, { useState, useEffect, useCallback } from 'react';
import { 
  Camera, Link2, ArrowRight, Copy, Check, AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ImageCropper from './ImageCropper';

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
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
      console.error("Error fetching profile during onboarding:", err);
    }
  }, []);

  useEffect(() => {
    fetchMyProfile();
  }, [fetchMyProfile]);

  const handleLinkPartner = async () => {
    if (!partnerCodeInput) return;
    setIsLinking(true);

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
      if (!session) return;

      const { error: updateMeError } = await supabase
        .from('profiles')
        .update({ partner_id: partnerProfile.id })
        .eq('id', session.user.id);

      const { error: updatePartnerError } = await supabase
        .from('profiles')
        .update({ partner_id: session.user.id })
        .eq('id', partnerProfile.id);

      if (updateMeError || updatePartnerError) throw new Error("Verknüpfung fehlgeschlagen");

      onComplete();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLinking(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("Das Bild ist zu groß (max. 10 MB).");
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

      const localUrl = URL.createObjectURL(croppedBlob);
      setAvatarPreview(localUrl);

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
      alert("Fehler beim Upload: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col pt-8 animate-entrance relative h-full">
      {selectedImage && (
        <ImageCropper 
          image={selectedImage} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setSelectedImage(null)} 
        />
      )}

      <header className="mb-12">
        <div className="prog-dots">
          {[1, 2].map((s) => (
            <div key={s} className={`dot ${s === step ? 'active' : (s < step ? 'done' : '')}`} />
          ))}
        </div>
      </header>

      <div className="flex-1 flex flex-col">
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 text-center px-4">
            <div className="relative mx-auto w-40 flex flex-col items-center">
              <label className="cursor-pointer block relative h-40 w-40 mb-6 group">
                <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} disabled={loading} />
                <div className={`w-40 h-40 rounded-[3rem] bg-white flex items-center justify-center border-2 border-dashed border-purple-100 overflow-hidden shadow-sm transition-all group-hover:border-[var(--secondary)] ${loading ? 'opacity-50' : ''}`}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-10 h-10 text-purple-100" />
                  )}
                  {avatarPreview && !loading && (
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>
              </label>
              <button 
                onClick={() => (document.querySelector('input[type="file"]') as HTMLInputElement)?.click()}
                disabled={loading}
                className="bg-white border border-purple-100 px-6 py-2.5 rounded-2xl text-xs font-bold text-[var(--secondary)] shadow-sm active:scale-95 transition-all flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                {avatarPreview ? 'Foto ändern' : 'Foto wählen'}
              </button>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-[#2D264B]">Hi {userName}! ❤️</h2>
              <p className="text-[var(--text)] text-sm leading-relaxed opacity-70">
                Lass uns dein Profil vervollständigen.<br/>Möchtest du ein Foto hochladen?
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 text-center px-4">
            <div className="w-20 h-20 bg-purple-50 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-sm">
              <Link2 className="w-10 h-10 text-[var(--secondary)]" />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-[#2D264B]">Partner verknüpfen</h2>
              <div className="space-y-3 text-left">
                <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest px-1">Dein Code zum Teilen:</p>
                <div className="flex items-center justify-between bg-white p-5 rounded-[22px] border-2 border-dashed border-purple-100 shadow-sm">
                  <span className="font-mono font-bold text-[var(--secondary)] tracking-widest text-lg">{myProfile?.partner_code || '...'}</span>
                  <button onClick={() => { navigator.clipboard.writeText(myProfile?.partner_code); }} className="p-3 bg-purple-50 rounded-xl active:scale-90 transition-all">
                    <Copy className="w-5 h-5 text-[var(--secondary)]" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest px-1">Oder gib den Partner-Code ein:</p>
              <input 
                type="text" 
                placeholder="CB-XXXXXX" 
                className="w-full p-5 rounded-[22px] border-2 border-purple-100 bg-white text-center font-mono tracking-widest uppercase text-xl outline-none focus:border-[var(--secondary)] shadow-sm"
                value={partnerCodeInput}
                onChange={(e) => setPartnerCodeInput(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 pb-8 pt-4">
        {step === 1 ? (
          <button 
            disabled={loading}
            onClick={() => setStep(2)}
            className="btn-action"
          >
            {loading ? 'Lädt...' : 'Weiter'} <ArrowRight className="w-5 h-5" />
          </button>
        ) : (
          <button onClick={handleLinkPartner} disabled={isLinking || !partnerCodeInput} className="btn-action">
            {isLinking ? 'Verknüpfe...' : 'Verknüpfen & Starten ❤️'}
          </button>
        )}
        
        {step === 2 && (
          <button onClick={onComplete} className="w-full text-sm font-bold text-[var(--muted)] hover:text-[var(--text-main)] transition-colors py-2">
            Später verknüpfen
          </button>
        )}
      </div>
    </div>
  );
}
