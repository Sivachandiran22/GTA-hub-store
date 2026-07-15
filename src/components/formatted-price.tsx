'use client';

import { useEffect, useState } from 'react';

export default function FormattedPrice({ price }: { price: number }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Server render/hydration matching fallback
  if (!mounted) {
    return <span>${price.toFixed(2)}</span>;
  }

  const isIndia =
    Intl.DateTimeFormat().resolvedOptions().timeZone === 'Asia/Kolkata' ||
    navigator.language === 'en-IN' ||
    (navigator.languages && navigator.languages.includes('en-IN'));

  if (isIndia) {
    const inrAmount = Math.round(price * 83);
    return <span>₹{inrAmount.toLocaleString('en-IN')}</span>;
  }

  return <span>${price.toFixed(2)}</span>;
}
