'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import FormattedPrice from './formatted-price';

interface ProductSlide {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnailUrl: string;
  shortDescription: string;
  isFree: boolean;
  category: { name: string; slug: string };
}

export default function FeaturedSlider({ products }: { products: ProductSlide[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % products.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [products.length]);

  if (!products || products.length === 0) return null;

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + products.length) % products.length);
  };

  return (
    <div className="relative group overflow-hidden rounded-xl border border-white/5 bg-brand-card/30 backdrop-blur-md h-[360px] md:h-[440px] w-full">
      {/* Slider Wrapper */}
      <div 
        className="flex h-full w-full transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {products.map((p) => (
          <div key={p.id} className="relative w-full h-full flex-shrink-0">
            {/* Background Image with blur effect */}
            <div 
              className="absolute inset-0 bg-cover bg-center scale-105 filter blur-sm opacity-20"
              style={{ backgroundImage: `url(${p.thumbnailUrl})` }}
            />
            {/* Direct Image element */}
            <div className="absolute inset-0 flex flex-col md:flex-row items-center justify-between p-6 md:p-10 gap-6 z-10">
              {/* Left Column: Details */}
              <div className="flex-1 space-y-4 text-left max-w-lg">
                <div className="inline-flex items-center space-x-2 rounded-full bg-brand-green/10 border border-brand-green/20 px-3 py-1 text-[10px] text-brand-green font-bold uppercase tracking-wider">
                  <Sparkles className="h-3 w-3" />
                  <span>Featured Release</span>
                </div>
                
                <h2 className="font-display text-2xl md:text-3xl font-black text-white uppercase tracking-wide leading-tight line-clamp-2">
                  {p.title}
                </h2>
                
                <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                  {p.shortDescription}
                </p>

                <div className="flex items-center space-x-4">
                  <span className="text-xs uppercase font-bold text-gray-500 tracking-wider">
                    Category: <strong className="text-white">{p.category?.name || 'Mods'}</strong>
                  </span>
                </div>

                <div className="pt-2 flex items-center space-x-6">
                  {/* Localized Price details */}
                  <div className="flex items-baseline space-x-2">
                    {p.isFree ? (
                      <span className="font-display text-xl md:text-2xl font-black text-brand-green uppercase">Free</span>
                    ) : p.salePrice !== null ? (
                      <>
                        <span className="font-display text-xl md:text-2xl font-black text-brand-green">
                          <FormattedPrice price={p.salePrice} />
                        </span>
                        <span className="text-xs text-gray-500 line-through">
                          <FormattedPrice price={p.price} />
                        </span>
                      </>
                    ) : (
                      <span className="font-display text-xl md:text-2xl font-black text-white">
                        <FormattedPrice price={p.price} />
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/product/${p.slug}`}
                    className="rounded bg-brand-green px-5 py-2.5 text-xs font-black uppercase text-black tracking-wider hover:bg-opacity-90 flex items-center space-x-1.5 transition-all shadow-md shadow-brand-green/10"
                  >
                    <span>Get Mod</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>

              {/* Right Column: Visual Thumbnail image */}
              <div className="flex-1 w-full max-w-[420px] aspect-video rounded-lg overflow-hidden border border-white/10 shadow-2xl relative">
                <img 
                  src={p.thumbnailUrl} 
                  alt={p.title} 
                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop';
                  }}
                />
              </div>
            </div>
            
            {/* Dark Radial shadow gradient cover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent md:bg-gradient-to-r md:from-black md:via-black/75 md:to-transparent -z-0" />
          </div>
        ))}
      </div>

      {/* Slide Navigation arrows (Visible only if has multiple products) */}
      {products.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 border border-white/5 text-gray-400 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-20"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 border border-white/5 text-gray-400 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100 z-20"
            aria-label="Next slide"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicator dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
            {products.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  current === idx ? 'w-4 bg-brand-green' : 'w-1.5 bg-white/30'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
