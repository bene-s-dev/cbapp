import React from 'react';

export default function LoadingSkeleton() {
  return (
    <div className="h-screen w-screen flex flex-col bg-[#F8F7FF] px-4 animate-entrance overflow-hidden">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        {/* Header Skeleton */}
        <header className="flex items-center justify-between mb-8 mt-8">
          <div className="flex flex-col gap-2">
            <div className="w-32 h-6 rounded-xl skeleton" />
            <div className="w-24 h-4 rounded-lg skeleton opacity-60" />
          </div>
          <div className="w-12 h-12 rounded-2xl skeleton" />
        </header>

        {/* Main Content Skeleton */}
        <div className="flex-1 flex flex-col gap-6">
          {/* Large Card Skeleton */}
          <div className="h-48 rounded-[2rem] skeleton" />
          
          {/* Grid Skeletons */}
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 rounded-[2rem] skeleton" />
            <div className="h-32 rounded-[2rem] skeleton" />
          </div>

          {/* List Skeleton */}
          <div className="space-y-4">
            <div className="h-16 rounded-[1.5rem] skeleton opacity-80" />
            <div className="h-16 rounded-[1.5rem] skeleton opacity-60" />
          </div>
        </div>

        {/* Bottom Nav Skeleton */}
        <div className="fixed bottom-8 left-4 right-4 h-20 bg-white/50 backdrop-blur-md rounded-[2.5rem] border border-white/20 flex items-center justify-around px-2 max-w-md mx-auto">
          <div className="w-10 h-10 rounded-2xl skeleton opacity-40" />
          <div className="w-10 h-10 rounded-2xl skeleton opacity-40" />
          <div className="w-10 h-10 rounded-2xl skeleton opacity-40" />
        </div>
      </div>
    </div>
  );
}
