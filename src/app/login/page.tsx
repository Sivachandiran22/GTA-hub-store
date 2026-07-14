'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Gamepad2, Mail, Lock, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      router.push('/dashboard');
    } else {
      setError(res.error || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute right-1/4 top-1/4 h-64 w-64 rounded-full bg-brand-green/5 blur-3xl animate-pulse-glow" />
      <div className="absolute left-1/4 bottom-1/4 h-60 w-60 rounded-full bg-brand-orange/5 blur-3xl animate-pulse-glow" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-md space-y-8 rounded-lg bg-brand-card/85 border border-white/5 p-8 backdrop-blur-md relative z-10">
        {/* Header title */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center space-x-2">
            <Gamepad2 className="h-8 w-8 text-brand-green" />
            <span className="font-display text-xl font-black uppercase text-white tracking-wider">
              GTA<span className="text-brand-green">HUB</span>
            </span>
          </Link>
          <h2 className="font-display text-lg font-bold text-white uppercase tracking-wide">
            Welcome Back
          </h2>
          <p className="text-xs text-gray-500">Sign in to access your digital downloads and dashboard</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1">
              <Mail className="h-3 w-3 text-brand-green" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. franklin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-brand-green focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-1">
              <Lock className="h-3 w-3 text-brand-green" />
              <span>Secret Password</span>
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-brand-green focus:outline-none"
            />
          </div>

          {error && <p className="text-xs font-bold text-brand-orange">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-brand-green py-3 text-xs font-black uppercase text-black tracking-wider shadow-md shadow-brand-green/10 hover:bg-opacity-90 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </form>

        {/* Redirect links */}
        <p className="text-center text-xs text-gray-400">
          New client?{' '}
          <Link href="/register" className="text-brand-green hover:underline font-bold">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
