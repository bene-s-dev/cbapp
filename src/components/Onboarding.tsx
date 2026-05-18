import React, { useState, useEffect, useCallback } from 'react';
import { 
  Camera, ArrowRight
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import ImageCropper from './ImageCropper';
import { useDialog } from './DialogProvider';

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const { showAlert } = useDialog();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const fetchMyProfile = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .eq('id', session.user.id)
          .maybeSingle();
        
        if (error) throw error;
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
          <div className="quiz-dot active" />
        </div>
      </header>

      <div className="flex-1 flex flex-col">
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
      </div>

      <div className="space-y-4 pb-6 pt-4">
        <button 
          disabled={loading}
          onClick={onComplete}
          className="btn-action py-5 text-lg font-black"
        >
          Fertig & Starten ✨ <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
