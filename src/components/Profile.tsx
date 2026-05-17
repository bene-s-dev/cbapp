import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Camera, Copy, Link2, LogOut, Heart, Download } from 'lucide-react';
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

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    
    setProfile(data);
    setLoading(false);
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
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

      // Bidirectional linking
      await supabase.from('profiles').update({ partner_id: partnerProfile.id }).eq('id', session.user.id);
      await supabase.from('profiles').update({ partner_id: session.user.id }).eq('id', partnerProfile.id);

      alert("Erfolgreich verknüpft! ❤️");
      window.location.reload();
    } catch (err: any) {
      alert("Fehler: " + err.message);
    } finally {
      setLoading(false);
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

      const fileName = `${session.user.id}/${Math.random()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { contentType: 'image/jpeg', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', session.user.id);

      await fetchProfile();
    } catch (err: any) {
      alert("Fehler beim Upload: " + err.message);
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center p-8 text-center animate-pulse text-[#2D264B] font-bold">
      Lädt...
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
        <div className="flex items-center gap-6 mb-10">
          <label className="relative cursor-pointer group">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            <div className="w-24 h-24 rounded-[2.5rem] bg-white border-2 border-purple-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:border-[var(--secondary)] transition-all">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-8 h-8 text-purple-200" />
              )}
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-[2.5rem]">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
          </label>
          <div>
            <h2 className="text-2xl font-bold text-[#2D264B]">{profile?.display_name || 'User'}</h2>
            <p className="text-[var(--muted)] text-sm">Mein Profil</p>
          </div>
        </div>

        <div className="space-y-6">
          {(deferredPrompt || isIOS) && (
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden mb-2">
              <div className="flex items-start gap-4 relative z-10">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-1 text-white">Bisou App installieren ✨</h3>
                  {isIOS ? (
                    <p className="text-sm text-purple-50 opacity-90 leading-relaxed">
                      Tippe auf das <span className="font-bold underline">Teilen-Icon</span> (Viereck mit Pfeil) und wähle <span className="font-bold underline">"Zum Home-Bildschirm"</span>.
                    </p>
                  ) : (
                    <button 
                      onClick={handleInstallClick}
                      className="mt-2 bg-white text-purple-600 px-6 py-2 rounded-xl font-bold text-sm shadow-sm hover:scale-105 transition-all"
                    >
                      Installieren ✨
                    </button>
                  )}
                </div>
              </div>
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            </div>
          )}

          <div className="bg-white p-6 rounded-[2rem] border border-[#edf2f7] shadow-sm">
            <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Mein Partner-Code</h3>
            <div className="flex items-center justify-between bg-purple-50/50 p-4 rounded-2xl border-2 border-dashed border-purple-100">
              <span className="font-mono font-bold text-[var(--secondary)] tracking-widest text-lg">{profile?.partner_code}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(profile?.partner_code); alert("Kopiert!"); }}
                className="p-2 bg-white rounded-xl shadow-sm text-[var(--secondary)] hover:scale-105 transition-all"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-[#edf2f7] shadow-sm">
            <h3 className="text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-4">Status</h3>
            {profile?.partner_id ? (
              <div className="flex items-center gap-4 text-green-600 bg-green-50 p-4 rounded-2xl">
                <Heart className="w-5 h-5 fill-current" />
                <span className="font-bold text-sm">Verbunden mit {partnerName || 'deinem Partner'}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-[var(--primary)] bg-red-50 p-4 rounded-2xl">
                  <Heart className="w-5 h-5" />
                  <span className="font-bold text-sm">Noch nicht verknüpft</span>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-[var(--muted)] mb-3 px-1">Gib hier den Code deines Partners ein:</p>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="CB-XXXXXX"
                      className="flex-1 p-4 rounded-xl border-2 border-purple-100 bg-white font-mono uppercase text-center outline-none focus:border-[var(--secondary)]"
                      value={partnerCodeInput}
                      onChange={(e) => setPartnerCodeInput(e.target.value)}
                    />
                    <button 
                      onClick={handleLinkPartner}
                      disabled={!partnerCodeInput}
                      className="bg-[var(--secondary)] text-white px-6 rounded-xl font-bold text-sm disabled:opacity-50"
                    >
                      OK
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="pb-32 pt-4">
        <button 
          onClick={onLogout}
          className="btn-secondary w-full py-5 flex items-center justify-center gap-3 text-red-500 border-red-100 hover:bg-red-50 transition-all font-bold"
        >
          <LogOut className="w-5 h-5" />
          Abmelden
        </button>
      </div>
    </div>
  );
}
