'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { CreditCard, Tag, ShieldCheck, Gamepad2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, coupon, clearCart, subtotal, discountAmount, taxAmount, total } = useCart();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('United States');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  
  const [paymentMethod, setPaymentMethod] = useState('STRIPE');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Success states
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    orderNumber: string;
    netAmount: number;
    downloads: Array<{ title: string; token: string }>;
  } | null>(null);

  // Populate form fields with user credentials if available
  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
    }
  }, [user]);

  // Protect page
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/checkout');
    }
  }, [isAuthenticated, authLoading, router]);

  // Redirect if cart is empty and order is not yet successful
  useEffect(() => {
    if (cart.length === 0 && !orderSuccess) {
      router.push('/cart');
    }
  }, [cart, orderSuccess, router]);

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productIdList: cart.map((item) => item.product.id),
          couponCode: coupon?.code || null,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (res.ok && data.orderNumber) {
        setSuccessDetails(data);
        setOrderSuccess(true);
        clearCart();
        
        // Trigger confetti burst
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#00ff87', '#ff5f00', '#ffffff'],
        });
      } else {
        setError(data.message || 'Checkout failed. Please try again.');
      }
    } catch (err) {
      setError('A connection error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || (!isAuthenticated && !orderSuccess)) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-xs text-gray-500 uppercase tracking-widest">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent mb-4"></div>
        <div>Verifying security protocols...</div>
      </div>
    );
  }

  if (orderSuccess && successDetails) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-8 relative overflow-hidden">
        {/* Confetti effect containers */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(0,255,135,0.05),transparent)]" />
        
        <div className="rounded-2xl bg-brand-card/90 border border-brand-green/30 p-8 backdrop-blur-md space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-black uppercase text-white tracking-wider">
              Purchase Complete!
            </h1>
            <p className="text-xs text-gray-400">Your order has been paid. Digital assets are ready to use.</p>
          </div>

          {/* Receipt telemetry */}
          <div className="rounded bg-black/50 border border-white/5 p-4 text-xs text-gray-400 space-y-2.5 text-left font-mono">
            <div className="flex justify-between border-b border-white/5 pb-2 text-[10px] text-gray-500">
              <span>Receipt details:</span>
            </div>
            <div className="flex justify-between">
              <span>Order ID:</span>
              <span className="text-white font-bold">{successDetails.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid Amount:</span>
              <span className="text-brand-green font-bold">${successDetails.netAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Status:</span>
              <span className="text-brand-green uppercase font-bold">Instant Download</span>
            </div>
          </div>

          {/* Downloads links list */}
          <div className="space-y-3 text-left">
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Your Digital Assets:</span>
            <div className="space-y-2">
              {successDetails.downloads.map((dl, idx) => (
                <div key={idx} className="flex items-center justify-between rounded bg-white/5 border border-white/5 px-3 py-2.5 text-xs">
                  <span className="text-white font-bold truncate max-w-[280px]">{dl.title}</span>
                  <a
                    href={`/api/downloads/${dl.token}`}
                    className="rounded bg-brand-green px-3 py-1 text-[10px] font-black uppercase text-black hover:bg-opacity-90 transition-colors"
                  >
                    Download ZIP
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
            <Link
              href="/dashboard"
              className="rounded bg-brand-orange py-3 text-xs font-black uppercase text-white tracking-wider hover:bg-opacity-95 transition-all"
            >
              Account Dashboard
            </Link>
            <Link
              href="/shop"
              className="rounded border border-white/10 bg-transparent py-3 text-xs font-black uppercase text-gray-300 hover:bg-white/5 transition-all"
            >
              Keep Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      <div>
        <Link href="/cart" className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white uppercase transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Shopping Cart</span>
        </Link>
        <h1 className="font-display text-2xl font-black uppercase text-white tracking-wider mt-4">
          Checkout Modules
        </h1>
        <p className="text-xs text-gray-500 mt-1">Provide payment details to process digital delivery</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Billing details form (Left 2 cols) */}
        <form onSubmit={handleCheckoutSubmit} className="lg:col-span-2 space-y-6">
          <div className="rounded-lg bg-brand-card/75 border border-white/5 p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center space-x-2 border-b border-white/5 pb-3">
              <CreditCard className="h-4 w-4 text-brand-green" />
              <span>Payment Details (Simulated Sandbox)</span>
            </h2>

            {/* Form details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Cardholder Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-brand-green focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-brand-green focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Gateway</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'STRIPE', name: 'Credit Card' },
                  { id: 'PAYPAL', name: 'PayPal' },
                  { id: 'UPI', name: 'Razorpay / UPI' },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`rounded border p-3 text-center transition-all ${
                      paymentMethod === method.id
                        ? 'border-brand-green bg-brand-green/10 text-brand-green font-bold'
                        : 'border-white/5 bg-black/30 text-gray-400 hover:border-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider">{method.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Card Form (Visible if Stripe selected) */}
            {paymentMethod === 'STRIPE' && (
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Card Number</label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-brand-green focus:outline-none font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Expiration Date</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-brand-green focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">CVC Code</label>
                    <input
                      type="text"
                      required
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="123"
                      className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-brand-green focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Order review side summary (Right 1 col) */}
        <div className="rounded-lg bg-brand-card border border-white/5 p-6 space-y-6 self-start">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-white border-b border-white/5 pb-3">
            Review Order
          </h2>

          <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
            {cart.map((item) => (
              <div key={item.product.id} className="flex justify-between items-center text-xs">
                <span className="text-gray-300 font-bold truncate max-w-[150px]">{item.product.title}</span>
                <span className="text-white font-semibold">
                  ${(item.product.salePrice !== null ? item.product.salePrice : item.product.price).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing calculations details */}
          <div className="space-y-2 text-xs text-gray-400 border-t border-white/5 pt-4">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span className="text-white">${subtotal.toFixed(2)}</span>
            </div>
            {coupon && (
              <div className="flex justify-between text-brand-green font-semibold">
                <span>Coupon Discount ({coupon.code}):</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Sales Tax (8%):</span>
              <span className="text-white">${taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-white/5 text-sm font-black">
              <span className="text-white">Amount Due:</span>
              <span className="text-brand-green">${total.toFixed(2)}</span>
            </div>
          </div>

          {error && <p className="text-xs font-bold text-brand-orange">{error}</p>}

          <button
            onClick={handleCheckoutSubmit}
            disabled={submitting}
            className="w-full rounded bg-brand-green py-3.5 text-xs font-black uppercase text-black tracking-wider shadow-md hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center justify-center space-x-1.5"
          >
            {submitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></span>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Authorize Payment</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
