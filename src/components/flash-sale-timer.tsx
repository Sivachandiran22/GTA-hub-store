'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Clock } from 'lucide-react';

export default function FlashSaleTimer() {
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 59, seconds: 59 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      
      // Calculate target: next midnight
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      
      const diff = midnight.getTime() - now.getTime();
      
      if (diff <= 0) {
        return { hours: 23, minutes: 59, seconds: 59 };
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      return { hours, minutes, seconds };
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Tick every second
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => {
    return num.toString().padStart(2, '0');
  };

  return (
    <div className="inline-flex items-center space-x-3 rounded bg-brand-orange/10 border border-brand-orange/20 px-4 py-2 text-xs font-bold text-brand-orange select-none animate-pulse-glow shadow-md shadow-brand-orange/5">
      <Flame className="h-4 w-4 text-brand-orange animate-bounce" />
      <span className="uppercase tracking-wider text-[10px] font-black">Flash Sale Ends In:</span>
      
      <div className="flex items-center space-x-1.5 font-mono text-sm font-black text-white bg-black/40 px-2.5 py-0.5 rounded border border-white/5">
        <span>{formatNumber(timeLeft.hours)}</span>
        <span className="text-brand-orange animate-pulse">:</span>
        <span>{formatNumber(timeLeft.minutes)}</span>
        <span className="text-brand-orange animate-pulse">:</span>
        <span>{formatNumber(timeLeft.seconds)}</span>
      </div>
      
      <Clock className="h-3.5 w-3.5 text-gray-500 hidden sm:block" />
    </div>
  );
}
