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
  
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [refNo, setRefNo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Success states
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    orderNumber: string;
    netAmount: number;
    status: string;
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
          paymentIntentId: refNo || null,
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
    const isPending = successDetails.status === 'PENDING';
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_60%_60%_at_50%_-10%,rgba(0,255,135,0.05),transparent)]" />
        
        <div className="rounded-2xl bg-brand-card/90 border border-brand-green/30 p-8 backdrop-blur-md space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-black uppercase text-white tracking-wider">
              {isPending ? 'Payment Awaiting Verification!' : 'Purchase Complete!'}
            </h1>
            <p className="text-xs text-gray-400">
              {isPending 
                ? 'Your order reference has been submitted. Our team will verify the payment shortly.' 
                : 'Your order has been paid. Digital assets are ready to use.'}
            </p>
          </div>

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
              <span>Verification Status:</span>
              <span className={`${isPending ? 'text-brand-orange animate-pulse' : 'text-brand-green'} uppercase font-bold`}>
                {isPending ? 'Pending Approval (5-15 mins)' : 'Instant Download'}
              </span>
            </div>
          </div>

          {/* Downloads links list (Only if paid/instantly completed) */}
          {!isPending && successDetails.downloads && successDetails.downloads.length > 0 ? (
            <div className="space-y-3 text-left">
              <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Your Digital Assets:</span>
              <div className="space-y-2">
                {successDetails.downloads.map((dl: any, idx) => (
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
          ) : isPending ? (
            <div className="rounded bg-brand-orange/10 border border-brand-orange/20 p-4 text-xs text-brand-orange text-left leading-relaxed">
              💡 **Next Steps**: We will review the submitted payment reference. Once confirmed, you will find your assets directly under the **Digital Product Library** inside your Account Dashboard. You can close this window now.
            </div>
          ) : null}

          <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
            <Link
              href="/dashboard"
              className="rounded bg-brand-orange py-3 text-xs font-black uppercase text-white tracking-wider hover:bg-opacity-95 transition-all flex items-center justify-center"
            >
              Account Dashboard
            </Link>
            <Link
              href="/shop"
              className="rounded border border-white/10 bg-transparent py-3 text-xs font-black uppercase text-gray-300 hover:bg-white/5 transition-all flex items-center justify-center"
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
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Select Payment Method</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { id: 'UPI', name: 'UPI (India)' },
                  { id: 'USDT', name: 'USDT / Binance (Intl)' },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method.id);
                      setRefNo('');
                    }}
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

            {/* UPI QR Payment Detail Block */}
            {paymentMethod === 'UPI' && (
              <div className="space-y-5 pt-3 border-t border-white/5">
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-brand-green/5 border border-brand-green/10 rounded-lg p-4">
                  {/* Simulated QR block */}
                  <div className="flex-shrink-0 flex h-28 w-28 flex-col items-center justify-center rounded bg-white p-2">
                    <div className="h-24 w-24 bg-[radial-gradient(square_8%_8%_at_0px_0px,#000_60%,transparent_0)] bg-[size:10px_10px]" style={{ backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #000 75%), linear-gradient(-45deg, transparent 75%, #000 75%)', backgroundSize: '8px 8px' }} />
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-white uppercase">Scan QR to pay via UPI</p>
                    <p className="text-gray-400 font-mono">UPI ID: <span className="text-brand-green font-bold">admin@gtahub.store</span></p>
                    <p className="text-gray-400 font-mono">Name: <span className="text-white">GTA HUB STORE</span></p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Please open GPay, PhonePe, Paytm, or BHIM, scan the QR code (or enter the UPI ID), and transfer the exact due amount.</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-orange flex items-center space-x-1">
                    <span>12-Digit UPI UTR Reference Number (Required)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 340918721642"
                    pattern="[0-9]{12}"
                    title="Please enter the exact 12-digit numeric UPI Transaction UTR ID"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-brand-orange focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Provide the UTR reference number from your receipt to automate confirmation matching.</p>
                </div>
              </div>
            )}

            {/* USDT QR Payment Detail Block */}
            {paymentMethod === 'USDT' && (
              <div className="space-y-5 pt-3 border-t border-white/5">
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-brand-orange/5 border border-brand-orange/10 rounded-lg p-4">
                  {/* Simulated Crypto QR block */}
                  <div className="flex-shrink-0 flex h-28 w-28 flex-col items-center justify-center rounded bg-white p-2">
                    <div className="h-24 w-24 bg-[radial-gradient(square_8%_8%_at_0px_0px,#000_60%,transparent_0)] bg-[size:10px_10px]" style={{ backgroundImage: 'linear-gradient(45deg, #ff5f00 25%, transparent 25%), linear-gradient(-45deg, #000 25%, transparent 25%)', backgroundSize: '6px 6px' }} />
                  </div>
                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-white uppercase">USDT wallet transfer (TRC-20)</p>
                    <p className="text-gray-400 font-mono text-[10px]">TRC20: <span className="text-brand-orange font-bold break-all">TY3gNzX1mK81aH2bS5g8xLp91fQ2Z91mK</span></p>
                    <p className="text-gray-400 font-mono">Binance Pay ID: <span className="text-white font-bold">827184209</span></p>
                    <p className="text-[10px] text-gray-500 leading-relaxed">Ensure you transfer via Tron Network (TRC20) or use Binance Pay. Transfer the exact USD equivalent to avoid delays.</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-brand-orange flex items-center space-x-1">
                    <span>USDT Blockchain TxID / Binance Pay Ref ID (Required)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 7f98e102f... or Binance Pay transaction code"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value.trim())}
                    className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-brand-orange focus:outline-none font-mono"
                  />
                  <p className="text-[10px] text-gray-500 mt-1">Provide the Transaction Hash (TxID) or Binance Pay receipt code to verify your transfer.</p>
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
