import React, { useState, useRef } from 'react';
import { 
  User, Bell, Shield, LogOut, ChevronRight, 
  Heart, Camera, Edit2, Link, Unlink, ExternalLink 
} from 'lucide-react';

/**
 * Erweiterte Profile-Komponente: Verwaltung von Profilbildern, Partner-Verknüpfungen und Branding.
 */
export default function Profile({ onLogout }: { onLogout: () => void }) {
  // State für den eigenen Namen und den Partner-Namen
  const [userName, setUserName] = useState('Lana');
  const [partnerName, setPartnerName] = useState('Ben');
  const [isEditingName, setIsEditingName] = useState(false);
  
  // State für das Profilbild (Base64 oder URL)
  const [profileImage, setProfileImage] = useState('https://api.dicebear.com/7.x/avataaars/svg?seed=Lana');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Eigener Partner-Code (Simulation einer Supabase ID / Random String)
  const [ownPartnerCode] = useState('DUO-X7-Q9-Z2');
  const [isConnected, setIsConnected] = useState(true);

  // Funktion zum Auslösen des File-Pickers
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // Funktion zum Verarbeiten des Bild-Uploads
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        // HIER: Supabase-Logik zum Speichern des Bildes (z.B. Storage oder Profile-Table)
        console.log("Bild für Supabase bereit:", base64String.substring(0, 50) + "...");
      };
      reader.readAsDataURL(file);
    }
  };

  // Funktion zum Speichern des Namens
  const saveNameChange = () => {
    setIsEditingName(false);
    // HIER: Supabase-Logik zum Update des Namens
    console.log("Name in Supabase aktualisiert:", userName);
  };

  // Funktion zum Entkoppeln des Partners
  const handleUnlink = () => {
    if (window.confirm("Möchtest du die Verknüpfung wirklich löschen?")) {
      setIsConnected(false);
      setPartnerName('');
      // HIER: Supabase-Logik: partner_id auf NULL setzen
      console.log("Partner-Verknüpfung in Supabase gelöscht");
    }
  };

  return (
    <div className="flex-1 flex flex-col py-8 view-enter">
      
      {/* 1. PROFIL-HEADER & FOTO-HANDLING */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative group cursor-pointer" onClick={handleImageClick}>
          {/* Das Profilbild in einer hochwertigen Glaskarte */}
          <div className="w-28 h-28 rounded-[2.5rem] glass-card p-1 border-purple-200 overflow-hidden shadow-2xl">
            <img 
              src={profileImage} 
              className="w-full h-full object-cover rounded-[2rem] bg-purple-50 transition-transform group-hover:scale-105"
              alt="Profilfoto"
            />
          </div>
          {/* Kamera-Overlay zum Hochladen */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-8 h-8 text-white" />
          </div>
          {/* Versteckter File-Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleImageUpload} 
          />
        </div>

        {/* Namens-Anzeige & Editier-Funktion */}
        <div className="mt-4 flex flex-col items-center gap-1">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={userName} 
                onChange={(e) => setUserName(e.target.value)}
                className="input-field h-10 w-40 text-center"
                autoFocus
              />
              <button onClick={saveNameChange} className="p-2 bg-green-500 text-white rounded-xl">OK</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-[#1E1B4B]">{userName}</h2>
              <button onClick={() => setIsEditingName(true)} className="text-purple-300 hover:text-[#A855F7]">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Partner-Anzeige */}
          {isConnected ? (
            <p className="text-purple-400 text-sm font-medium flex items-center gap-2">
              <Heart className="w-3 h-3 fill-current" /> Verbunden mit {partnerName || 'deinem Partner'}
            </p>
          ) : (
            <p className="text-red-400 text-sm font-medium">Nicht verknüpft</p>
          )}
        </div>
      </div>

      {/* 2. PARTNER-VERBINDUNGS-LOGIK */}
      <div className="glass-card p-6 border-purple-100 bg-white/40 mb-6">
        <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-3">Dein Partner-Code</p>
        <div className="flex items-center justify-between bg-purple-50 p-4 rounded-2xl border border-purple-100">
          <span className="font-mono font-bold text-[#A855F7] tracking-widest">{ownPartnerCode}</span>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(ownPartnerCode);
              alert("Code kopiert!");
            }}
            className="p-2 hover:bg-purple-100 rounded-xl transition-colors"
          >
            <Link className="w-5 h-5 text-[#A855F7]" />
          </button>
        </div>
        <p className="mt-3 text-[11px] text-purple-400">Teile diesen Code mit deinem Partner, um eure Profile zu synchronisieren.</p>
      </div>

      {/* 3. EINSTELLUNGEN & STEUERUNG */}
      <div className="space-y-3">
        <button className="w-full glass-card p-4 flex items-center justify-between border-purple-50 hover:bg-white/60 transition-all">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Bell className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-bold text-[#1E1B4B]">Benachrichtigungen</span>
          </div>
          <ChevronRight className="w-5 h-5 text-purple-200" />
        </button>

        {/* Entkoppeln-Funktion */}
        {isConnected && (
          <button 
            onClick={handleUnlink}
            className="w-full glass-card p-4 flex items-center justify-between border-red-50 hover:bg-red-50/30 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-red-50 rounded-xl">
                <Unlink className="w-5 h-5 text-red-500" />
              </div>
              <span className="font-bold text-red-500">Partner trennen</span>
            </div>
          </button>
        )}
      </div>

      {/* 4. FOOTER, BRANDING & SPENDEN */}
      <div className="mt-auto pt-10 pb-4 space-y-6 text-center">
        {/* Spenden-Button */}
        <button className="btn-pill bg-[#A855F7] text-white w-full gap-2 shadow-lg hover:scale-[1.02] transition-transform">
          <Heart className="w-5 h-5 fill-current" />
          Jetzt spenden
          <ExternalLink className="w-4 h-4 opacity-50" />
        </button>

        {/* Branding & Version */}
        <div className="space-y-1">
          <p className="text-[#1E1B4B] text-xs font-bold opacity-40">
            App programmiert von bene it 2026
          </p>
          <p className="text-purple-300 text-[10px] font-bold uppercase tracking-[0.2em]">
            Version 1 LG 2026
          </p>
        </div>

        {/* Logout */}
        <button 
          onClick={onLogout}
          className="inline-flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-widest hover:text-red-500 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Abmelden
        </button>
      </div>
    </div>
  );
}
