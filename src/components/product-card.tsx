'use client';

import React from 'react';
import Link from 'next/link';
import { useCart, Product } from '@/context/CartContext';
import { Star, Download, ShoppingCart, Check, Heart, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product & {
    downloadsCount: number;
    rating: number;
    isFeatured: boolean;
    isFree: boolean;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isInCart } = useCart();
  const alreadyInCart = isInCart(product.id);

  const displayPrice = product.isFree ? 'Free' : `$${product.price.toFixed(2)}`;
  const displaySalePrice = product.salePrice !== null ? `$${product.salePrice.toFixed(2)}` : null;

  return (
    <div className="group relative flex flex-col rounded-lg bg-brand-card/80 border border-white/5 p-4 transition-all duration-300 hover:border-brand-green/20 hover:shadow-lg hover:shadow-brand-green-glow/5 hover:-translate-y-1">
      {/* Product Image & Badges */}
      <div className="relative aspect-video w-full overflow-hidden rounded bg-gray-900 mb-4">
        {/* Placeholder images fallback if real path is empty */}
        <img
          src={product.thumbnailUrl}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop';
          }}
        />

        {/* Floating Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1.5 z-10">
          {product.isFeatured && (
            <span className="rounded bg-brand-green px-2 py-0.5 text-[9px] font-bold text-black uppercase tracking-wider">
              Featured
            </span>
          )}
          {product.salePrice !== null && (
            <span className="rounded bg-brand-orange px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
              Sale
            </span>
          )}
          {product.isFree && (
            <span className="rounded bg-blue-500 px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider animate-pulse">
              Free
            </span>
          )}
        </div>

        {/* Quick View Cover Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Link
            href={`/product/${product.slug}`}
            className="flex items-center space-x-1.5 rounded-full bg-brand-green px-4 py-2 text-xs font-bold text-black transform scale-90 group-hover:scale-100 transition-transform duration-300"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View Details</span>
          </Link>
        </div>
      </div>

      {/* Info Details */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
            {product.category?.name || 'Asset'}
          </span>
          <span className="text-[8px] bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-brand-green font-bold uppercase tracking-wide">
            FiveM / SP
          </span>
        </div>
        
        <Link href={`/product/${product.slug}`} className="mt-1">
          <h3 className="font-display font-bold text-sm text-white group-hover:text-brand-green transition-colors line-clamp-1">
            {product.title}
          </h3>
        </Link>

        {/* Rating and Downloads */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <Star className="h-3.5 w-3.5 fill-brand-orange text-brand-orange" />
            <span className="font-semibold text-white">{product.rating.toFixed(1)}</span>
          </div>
          <div className="flex items-center space-x-1 text-[11px]">
            <Download className="h-3 w-3" />
            <span>{product.downloadsCount} DLs</span>
          </div>
        </div>

        {/* Price & Buy Actions */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-white/5">
          <div className="flex items-baseline space-x-1.5">
            {displaySalePrice ? (
              <>
                <span className="font-display text-sm font-bold text-brand-green">
                  {displaySalePrice}
                </span>
                <span className="text-[10px] text-gray-500 line-through">
                  {displayPrice}
                </span>
              </>
            ) : (
              <span className="font-display text-sm font-bold text-white">
                {displayPrice}
              </span>
            )}
          </div>

          <button
            onClick={() => addToCart(product)}
            disabled={alreadyInCart}
            className={`rounded-full p-2 transition-all duration-200 ${
              alreadyInCart
                ? 'bg-brand-green/20 text-brand-green'
                : 'bg-brand-card border border-white/10 text-gray-300 hover:bg-brand-green hover:text-black hover:border-transparent'
            }`}
            title={alreadyInCart ? 'Already in Cart' : 'Add to Cart'}
          >
            {alreadyInCart ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
