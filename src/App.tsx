return (
  <div className="h-screen w-screen overflow-hidden relative text-white select-none bg-[#0f0a1a]">
    <div className="bg-aura" />

    {/* pt-4 zusätzlich zu safe-top für einen eleganten Abstand */}
    <main className="h-full flex flex-col safe-top pt-4 pb-32 px-6 max-w-md mx-auto relative z-10">
      
      {view === 'dashboard' && (
        <div className="flex-1 flex flex-col space-y-8 animate-in fade-in duration-500">
          <header className="flex justify-between items-center">
            <h2 className="text-3xl font-black italic tracking-tight">Hey {userName || 'Ff'}</h2>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-purple-500/40 border border-purple-500/30 overflow-hidden p-1">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userName || 'Ff'}`} className="rounded-xl" />
            </div>
          </header>
          
          {/* Rest deines Dashboards... */}
