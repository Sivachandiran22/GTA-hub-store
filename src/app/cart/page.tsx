'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { Trash2, ArrowRight, Tag, X, ShoppingBag } from 'lucide-react';
import FormattedPrice from '@/components/formatted-price';

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    removeFromCart,
    coupon,
    couponError,
    applyCoupon,
    removeCoupon,
    subtotal,
    discountAmount,
    taxAmount,
    total,
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApplyCouponSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setApplying(true);
    const success = await applyCoupon(couponInput.trim());
    setApplying(false);
    if (success) {
      setCouponInput('');
    }
  };

  const handleProceed = () => {
    router.push('/checkout');
  };

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-card border border-white/5 mb-6 text-gray-500">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="font-display text-xl font-bold uppercase text-white tracking-wide">
          Your Shopping Cart is Empty
        </h1>
        <p className="text-xs text-gray-500 mt-2 max-w-sm mx-auto leading-relaxed">
          Looks like you haven't added any mods to your cart yet. Explore our premium store to discover amazing assets.
        </p>
        <Link
          href="/shop"
          className="mt-6 inline-block rounded bg-brand-green px-6 py-3 text-xs font-black uppercase text-black tracking-wider shadow-md hover:bg-opacity-95"
        >
          Browse Mods Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl font-black uppercase text-white tracking-wider">
          Shopping Cart
        </h1>
        <p className="text-xs text-gray-500 mt-1">Review your selected digital products before checkout</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Cart items list (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const price = item.product.salePrice !== null ? item.product.salePrice : item.product.price;
            return (
              <div
                key={item.product.id}
                className="flex items-center space-x-4 rounded-lg bg-brand-card/70 border border-white/5 p-4"
              >
                <img
                  src={item.product.thumbnailUrl}
                  alt={item.product.title}
                  className="h-16 w-24 rounded object-cover flex-shrink-0 bg-gray-900"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&auto=format&fit=crop';
                  }}
                />
                
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold text-gray-500">
                    {item.product.category?.name}
                  </span>
                  <Link
                    href={`/product/${item.product.slug}`}
                    className="block text-xs font-bold text-white hover:text-brand-green truncate mt-0.5"
                  >
                    {item.product.title}
                  </Link>
                  {item.product.downloadSize && (
                    <span className="text-[10px] text-gray-500 mt-0.5 block">Size: {item.product.downloadSize}</span>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-xs font-bold text-white"><FormattedPrice price={price} /></span>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-gray-500 hover:text-brand-orange transition-colors p-1"
                    title="Remove from cart"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary panel (Right 1 col) */}
        <div className="rounded-lg bg-brand-card border border-white/5 p-6 space-y-6 self-start">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white border-b border-white/5 pb-3">
            Order Summary
          </h2>

          {/* Pricing calculations */}
          <div className="space-y-2 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-white"><FormattedPrice price={subtotal} /></span>
            </div>

            {coupon && (
              <div className="flex justify-between text-brand-green font-semibold">
                <span className="flex items-center">
                  <Tag className="h-3 w-3 mr-1" />
                  <span>Promo Code ({coupon.code}):</span>
                </span>
                <span>-<FormattedPrice price={discountAmount} /></span>
              </div>
            )}

            <div className="flex justify-between">
              <span>Sales Tax (8%):</span>
              <span className="text-white"><FormattedPrice price={taxAmount} /></span>
            </div>

            <div className="flex justify-between border-t border-white/5 pt-3 text-sm font-bold">
              <span className="text-white">Total:</span>
              <span className="text-brand-green"><FormattedPrice price={total} /></span>
            </div>
          </div>

          {/* Coupon input form */}
          <div className="pt-2 border-t border-white/5">
            {coupon ? (
              <div className="flex items-center justify-between rounded bg-brand-green/10 border border-brand-green/20 px-3 py-2 text-xs text-brand-green">
                <div className="flex items-center space-x-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  <span>Promo Applied: <strong className="uppercase">{coupon.code}</strong></span>
                </div>
                <button onClick={removeCoupon} className="text-brand-orange hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCouponSubmit} className="flex relative">
                <input
                  type="text"
                  placeholder="Coupon code (e.g. GTA20)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-xs text-white focus:border-brand-green focus:outline-none uppercase"
                />
                <button
                  type="submit"
                  disabled={applying}
                  className="absolute right-1 top-1 bottom-1 rounded bg-brand-green px-3 text-[10px] font-bold text-black uppercase hover:bg-opacity-90 disabled:opacity-50"
                >
                  Apply
                </button>
              </form>
            )}
            {couponError && <p className="text-[10px] text-brand-orange font-semibold mt-1.5">{couponError}</p>}
          </div>

          {/* Proceed button */}
          <button
            onClick={handleProceed}
            className="w-full rounded bg-brand-green py-3 text-xs font-black uppercase text-black tracking-wider shadow-md hover:bg-opacity-90 flex items-center justify-center space-x-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
