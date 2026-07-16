import React from 'react';

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4 px-4">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing ring */}
        <div className="h-12 w-12 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
        {/* Inner pulsing core */}
        <div className="absolute h-5 w-5 rounded-full bg-brand-green/10 animate-ping" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-brand-green animate-pulse">
        Configuring modifications...
      </p>
    </div>
  );
}
