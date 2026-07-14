'use client';

import React, { Suspense } from 'react';
import ShopContent from './shop-content';

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-20 text-center text-xs text-gray-500 uppercase tracking-widest">
          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent mb-4"></div>
          <div>Loading catalog modules...</div>
        </div>
      }
    >
      <ShopContent />
    </Suspense>
  );
}
