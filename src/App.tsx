import React, { useState, useEffect } from 'react';
import { 
  Heart, ShieldAlert, Download, User, Camera, 
  Copy, Home, MessageCircle, LayoutGrid, Settings, Stars 
} from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowNotification(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#1a0f2b] text-white p-4 pb-24 font-['Poppins']">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pt-2">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg shadow-white/10">
          <Heart className="text-[#1a0f2b] w-6 h-6 fill-current" />
        </div>
        <div className="flex gap-3">
          <button className="p-2 bg-white/5 rounded-full backdrop-blur-md">
            <ShieldAlert className="w-6 h-6 text-white/70" />
          </button>
          <button className="p-2 bg-white/5 rounded-full backdrop-blur-md">
            <Download className="w-6 h-6 text-white/70" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="fade-in">
        <h1 className="text-4xl font-bold mb-2 tracking-tight">DuoSync</h1>
        <p className="text-white/50 mb-8 text-sm uppercase tracking-widest">Private Hobby Project</p>

        {/* Card */}
        <div className="bg-[#271a3c] rounded-[2.5rem] p-8 mb-6 relative overflow-hidden shadow-2xl border border-white/5">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <p className="text-white/40 text-xs mb-1 uppercase tracking-tighter">Current User</p>
                <h2 className="text-2xl font-semibold italic">bene.sync</h2>
              </div>
              <div className="bg-white/10 px-3 py-1 rounded-full backdrop-blur-md">
                <span className="text-[10px] font-bold text-white/90 uppercase tracking-widest">Beta</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-black/20 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-white/40" />
                  <span className="text-sm font-medium">Profile Sync</span>
                </div>
                <div className="w-10 h-5 bg-[#1a0f2b] rounded-full relative">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="bg-black/20 p-4 rounded-2xl flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-white/40" />
                  <span className="text-sm font-medium">Snap Protection</span>
                </div>
                <div className="w-10 h-5 bg-white/10 rounded-full relative">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white/30 rounded-full"></div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3">
              <button className="flex-1 bg-white text-[#1a0f2b] py-4 rounded-2xl font-bold text-sm active:scale-95 transition-transform">
                Open Sync-Cloud
              </button>
              <button className="p-4 bg-white/5 rounded-2xl border border-white/10 active:scale-95 transition-transform">
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#271a3c]/50 p-6 rounded-[2rem] border border-white/5">
            <p className="text-white/30 text-[10px] uppercase font-bold mb-2">Connected</p>
            <p className="text-xl font-semibold">24<span className="text-xs text-white/30 ml-1 font-normal text-[10px]">Active</span></p>
          </div>
          <div className="bg-[#271a3c]/50 p-6 rounded-[2rem] border border-white/5">
            <p className="text-white/30 text-[10px] uppercase font-bold mb-2">Security</p>
            <p className="text-xl font-semibold text-green-400">98%</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="fixed bottom-6 left-6 right-6 bg-[#271a3c]/80 backdrop-blur-xl border border-white/10 rounded-[2rem] p-2 flex justify-between items-center shadow-2xl z-50">
        <button onClick={() => setActiveTab('home')} className={`p-4 rounded-2xl transition-all ${activeTab === 'home' ? 'bg-white text-[#1a0f2b]' : 'text-white/40'}`}>
          <Home className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('chat')} className={`p-4 rounded-2xl transition-all ${activeTab === 'chat' ? 'bg-white text-[#1a0f2b]' : 'text-white/40'}`}>
          <MessageCircle className="w-6 h-6" />
        </button>
        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center border border-white/10">
          <LayoutGrid className="w-6 h-6 text-white/60" />
        </div>
        <button onClick={() => setActiveTab('stars')} className={`p-4 rounded-2xl transition-all ${activeTab === 'stars' ? 'bg-white text-[#1a0f2b]' : 'text-white/40'}`}>
          <Stars className="w-6 h-6" />
        </button>
        <button onClick={() => setActiveTab('settings')} className={`p-4 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-white text-[#1a0f2b]' : 'text-white/40'}`}>
          <Settings className="w-6 h-6" />
        </button>
      </nav>
    </div>
  );
}

export default App;
