import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Copy, Heart, LogOut, Download, Check, AlertCircle } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface ProfileProps {
  partnerName: string | null;
  onLogout: () => void;
}

export default function Profile({ partnerName, onLogout }: ProfileProps) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();

    // iOS Detection
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [fetchProfile]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

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

      // Bidirectional linking
      const { error: linkError1 } = await supabase.from('profiles').update({ partner_id: partnerProfile.id }).eq('id', session.user.id);
      const { error: linkError2 } = await supabase.from('profiles').update({ partner_id: session.user.id }).eq('id', partnerProfile.id);

      if (linkError1 || linkError2) throw new Error("Verknüpfung fehlgeschlagen.");

      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLinking(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      await fetchProfile();
    } catch (err: any) {
      alert("Upload fehlgeschlagen: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !profile) return (
    <div className="flex-1 flex items-center justify-center p-8 text-center animate-pulse text-[#2D264B] font-bold">
      Profil lädt...
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-entrance">
      {selectedImage && (
        <ImageCropper 
          image={selectedImage} 
          onCropComplete={handleCropComplete} 
          onCancel={() => setSelectedImage(null)} 
        />
      )}

      <div className="flex-1 overflow-y-auto pb-12">
        <header className="flex items-center gap-6 mb-12">
          <label className="relative cursor-pointer group">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <div className="w-24 h-24 rounded-[2.5rem] bg-white border-2 border-purple-100 flex items-center justify-center overflow-hidden shadow-sm transition-all group-hover:border-[var(--secondary)]">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-purple-200" />
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
          </label>
          <div>
            <h2 className="text-3xl font-bold text-[#2D264B]">{profile?.display_name || 'User'}</h2>
            <p className="text-[var(--muted)] font-medium">Mein Profil</p>
          </div>
        </header>

        <div className="space-y-6">
          {(deferredPrompt || isIOS) && (
            <div className="bg-gradient-to-br from-[var(--secondary)] to-indigo-500 p-8 rounded-[2.5rem] text-white shadow-xl shadow-purple-200 relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-lg">App installieren ✨</h3>
                </div>
                {isIOS ? (
                  <p className="text-sm text-purple-50 opacity-90 leading-relaxed">
                    Tippe auf <span className="font-bold underline">Teilen</span> und dann auf <span className="font-bold underline">Zum Home-Bildschirm</span>.
                  </p>
                ) : (
                  <button 
                    onClick={handleInstallClick}
                    className="bg-white text-[var(--secondary)] px-8 py-3 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all"
                  >
                    Jetzt installieren
                  </button>
                )}
              </div>
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            </div>
          )}

          <div className="status-box p-8">
            <h3 className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.2em] mb-4">Mein Partner-Code</h3>
            <div className="flex items-center justify-between bg-purple-50/50 p-5 rounded-[22px] border-2 border-dashed border-purple-100">
              <span className="font-mono font-bold text-[var(--secondary)] tracking-widest text-xl">{profile?.partner_code || '...'}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(profile?.partner_code); }}
                className="p-3 bg-white rounded-xl shadow-sm text-[var(--secondary)] active:scale-90 transition-all"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="status-box p-8">
            <h3 className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.2em] mb-4">Verknüpfung</h3>
            {profile?.partner_id ? (
              <div className="flex items-center gap-4 text-[var(--accent-green)] bg-green-50 p-5 rounded-[22px] border border-green-100">
                <Heart className="w-5 h-5 fill-current" />
                <span className="font-bold">Verbunden mit {partnerName || 'Partner'}</span>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4 text-[var(--primary)] bg-red-50 p-5 rounded-[22px] border border-red-100">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-bold">Noch nicht verknüpft</span>
                </div>
                <div className="space-y-3">
                  <p className="text-xs font-bold text-[var(--muted)] px-1 uppercase tracking-wider">Code des Partners eingeben:</p>
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="CB-XXXXXX"
                      className="flex-1 p-5 rounded-[22px] border-2 border-purple-100 bg-white font-mono uppercase text-center outline-none focus:border-[var(--secondary)] text-lg"
                      value={partnerCodeInput}
                      onChange={(e) => setPartnerCodeInput(e.target.value)}
                    />
                    <button 
                      onClick={handleLinkPartner}
                      disabled={!partnerCodeInput || isLinking}
                      className="bg-[var(--secondary)] text-white px-8 rounded-[22px] font-bold shadow-lg shadow-purple-100 disabled:opacity-50"
                    >
                      {isLinking ? '...' : 'OK'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pb-32 pt-6">
        <button 
          onClick={onLogout}
          className="btn-secondary w-full border-red-50 text-red-400 flex items-center justify-center gap-3 hover:bg-red-50 hover:border-red-100"
        >
          <LogOut className="w-5 h-5" />
          Abmelden
        </button>
      </div>
    </div>
  );
}
