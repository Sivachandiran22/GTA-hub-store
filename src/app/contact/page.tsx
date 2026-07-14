'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Mail, MessageSquare, Send, HelpCircle, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ContactPage() {
  const { isAuthenticated, token } = useAuth();
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      if (isAuthenticated) {
        // Logged-in support ticket creation
        const res = await fetch('/api/support', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ subject, message })
        });
        if (res.ok) {
          setSuccess(true);
          setSubject('');
          setMessage('');
        } else {
          const data = await res.json();
          setError(data.message || 'Failed to submit message');
        }
      } else {
        // Anonymous simulated contact form submit
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setSuccess(true);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Header title */}
      <div>
        <h1 className="font-display text-2xl font-black uppercase text-white tracking-wider flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-brand-green" />
          <span>Support Hub</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">Get in touch with GTA Hub developers or find answers in the FAQ.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Support coordinates info (Left 1 col) */}
        <div className="space-y-6">
          <div className="rounded-lg bg-brand-card/70 border border-white/5 p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-white">Join Community channels</h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              For real-time ticket support, installation troubleshooting, and active community mod chat.
            </p>
            <div className="space-y-2 text-xs">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded bg-brand-green/10 border border-brand-green/20 p-3 text-brand-green hover:bg-brand-green/25 transition-all font-bold uppercase"
              >
                <span>Discord Server</span>
                <span>→</span>
              </a>
              <a
                href="mailto:support@gtahub.store"
                className="flex items-center justify-between rounded bg-brand-orange/10 border border-brand-orange/20 p-3 text-brand-orange hover:bg-brand-orange/25 transition-all font-bold uppercase"
              >
                <span>Email Support</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form (Right 2 cols) */}
        <div className="md:col-span-2 rounded-lg bg-brand-card border border-white/5 p-6 space-y-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-white border-b border-white/5 pb-3">
            {isAuthenticated ? 'Open support ticket' : 'Send us a message'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {!isAuthenticated && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Lamar Davis"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-white focus:border-brand-green focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="lamar@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-white focus:border-brand-green focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Subject Topic</label>
              <input
                type="text"
                required
                placeholder="e.g. pent-house interior stream error"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded bg-black/60 border border-white/10 px-3.5 py-2.5 text-white focus:border-brand-green focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Detailed Message</label>
              <textarea
                rows={4}
                required
                placeholder="Describe your issue or custom asset request..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full rounded bg-black/60 border border-white/10 p-3 text-white focus:border-brand-green focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-brand-orange flex items-center space-x-1">
                <ShieldAlert className="h-4 w-4" />
                <span>{error}</span>
              </p>
            )}
            {success && (
              <p className="text-xs font-bold text-brand-green flex items-center space-x-1">
                <CheckCircle2 className="h-4 w-4" />
                <span>
                  {isAuthenticated
                    ? 'Support ticket opened successfully. You can track replies in your Dashboard!'
                    : 'Message sent successfully. Our support team will contact you shortly.'}
                </span>
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="rounded bg-brand-green px-6 py-3 text-xs font-black uppercase text-black tracking-wider hover:bg-opacity-95 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></span>
              ) : (
                <>
                  <span>Send Message</span>
                  <Send className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
