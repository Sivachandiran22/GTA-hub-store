'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider, useCart } from '@/context/CartContext';
import CursorGlow from '@/components/visual/cursor-glow';
import Particles from '@/components/visual/particles';
import { 
  ShoppingBag, 
  User, 
  Search, 
  Heart, 
  LogOut, 
  Menu, 
  X, 
  ChevronDown, 
  Shield, 
  Gamepad2, 
  Mail, 
  Send,
  MessageSquare
} from 'lucide-react';

function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { cartCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
    }
  };

  const isLinkActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      const params = new URLSearchParams(query);
      const gameParam = params.get('game');
      return pathname === path && searchParams.get('game') === gameParam;
    }
    return pathname === href;
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'GTA 5', href: '/shop?game=GTA5' },
    { name: 'GTA 6', href: '/shop?game=GTA6' },
    { name: '3D Models', href: '/shop?game=3D_MODEL' },
    { name: 'Blog', href: '/blog' },
    { name: 'Support', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-brand-bg/70 backdrop-blur-md transition-all duration-300">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <Gamepad2 className="h-8 w-8 text-brand-green transition-transform duration-300 group-hover:rotate-12" />
          <span className="font-display text-xl font-black tracking-wider uppercase">
            GTA<span className="text-brand-green">HUB</span>
            <span className="text-xs ml-1 px-1 bg-brand-orange text-white rounded font-sans tracking-normal lowercase font-normal">store</span>
          </span>
        </Link>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => {
            const isActive = isLinkActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`text-sm font-medium tracking-wide uppercase transition-colors duration-200 hover:text-brand-green ${
                  isActive ? 'text-brand-green border-b-2 border-brand-green pb-1 mt-0.5' : 'text-gray-400'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4">
          {/* Search Toggle */}
          <div className="relative">
            {searchOpen ? (
              <form onSubmit={handleSearchSubmit} className="flex items-center">
                <input
                  type="text"
                  placeholder="Search mods..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 md:w-56 rounded-full bg-brand-card border border-white/10 px-4 py-1.5 text-xs text-white focus:border-brand-green focus:outline-none"
                  autoFocus
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="absolute right-3 text-gray-400 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="text-gray-400 hover:text-white transition-colors p-1"
                aria-label="Search mods"
              >
                <Search className="h-5 w-5" />
              </button>
            )}
          </div>

          {/* Cart Icon */}
          <Link href="/cart" className="relative text-gray-400 hover:text-white transition-colors p-1" aria-label="Shopping Cart">
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-orange text-[9px] font-bold text-white animate-bounce">
                {cartCount}
              </span>
            )}
          </Link>

          {/* User Auth Profile / Dropdown */}
          <div className="hidden sm:block">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center space-x-1 rounded-md bg-brand-green/10 border border-brand-green/20 px-2.5 py-1 text-xs text-brand-green hover:bg-brand-green/20 transition-all font-semibold uppercase"
                  >
                    <Shield className="h-3 w-3" />
                    <span>Admin</span>
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className="text-xs text-gray-400 hover:text-white font-medium hover:underline flex items-center space-x-1"
                >
                  <User className="h-4 w-4" />
                  <span className="max-w-[100px] truncate">{user?.fullName.split(' ')[0]}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-gray-400 hover:text-brand-orange transition-colors p-1"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-gray-400 hover:text-white uppercase transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded bg-brand-green px-3.5 py-1.5 text-xs font-bold text-black uppercase transition-all hover:bg-opacity-80 shadow-md shadow-brand-green/20"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-white/5 bg-brand-bg px-4 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-sm font-semibold uppercase text-gray-300 hover:text-brand-green"
            >
              {link.name}
            </Link>
          ))}
          {/* User Auth Section (Mobile) */}
          <div className="border-t border-white/5 pt-4">
            {isAuthenticated ? (
              <div className="space-y-3">
                <div className="text-sm text-gray-400">
                  Logged in as <span className="text-white font-bold">{user?.fullName}</span>
                </div>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex w-full items-center justify-center space-x-2 rounded bg-brand-green/10 border border-brand-green/20 py-2 text-sm font-semibold text-brand-green"
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Dashboard</span>
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center space-x-2 rounded bg-brand-card border border-white/10 py-2 text-sm font-semibold text-white"
                >
                  <User className="h-4 w-4" />
                  <span>My Account Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center justify-center space-x-2 rounded bg-brand-orange/10 border border-brand-orange/20 py-2 text-sm font-semibold text-brand-orange"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center rounded border border-white/10 py-2 text-sm font-bold text-white uppercase"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center rounded bg-brand-green py-2 text-sm font-bold text-black uppercase"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  return (
    <footer className="z-10 mt-auto border-t border-white/5 bg-brand-bg px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Logo & About */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <Gamepad2 className="h-7 w-7 text-brand-green" />
              <span className="font-display text-lg font-black tracking-wider uppercase">
                GTA<span className="text-brand-green">HUB</span>
              </span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Premium marketplace for GTA modifications, high fidelity character skins, customized props, FiveM scripts, and optimized inner maps. Elevate your server to AAA standard.
            </p>
            {/* Social media connections */}
            <div className="flex space-x-3 pt-2">
              <a
                href="https://discord.gg"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded bg-brand-card border border-white/5 text-gray-400 hover:text-brand-green hover:border-brand-green transition-all"
              >
                <MessageSquare className="h-4 w-4" />
              </a>
              <a
                href="mailto:support@gtahub.store"
                className="flex h-8 w-8 items-center justify-center rounded bg-brand-card border border-white/5 text-gray-400 hover:text-brand-green hover:border-brand-green transition-all"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-white mb-4">Marketplace</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/shop" className="text-gray-400 hover:text-white transition-colors">All Products</Link>
              </li>
              <li>
                <Link href="/shop?category=peds" className="text-gray-400 hover:text-white transition-colors">Peds Models</Link>
              </li>
              <li>
                <Link href="/shop?category=mlo" className="text-gray-400 hover:text-white transition-colors">MLO Interiors</Link>
              </li>
              <li>
                <Link href="/shop?category=scripts" className="text-gray-400 hover:text-white transition-colors">FiveM Scripts</Link>
              </li>
              <li>
                <Link href="/shop?type=free" className="text-gray-400 hover:text-white transition-colors">Free Downloads</Link>
              </li>
            </ul>
          </div>

          {/* Legal / Info */}
          <div>
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-white mb-4">Support</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Form</Link>
              </li>
              <li>
                <Link href="/contact#faq" className="text-gray-400 hover:text-white transition-colors">Frequently Asked Qs</Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white transition-colors">Tutorials & Guides</Link>
              </li>
              <li>
                <span className="text-gray-500">Terms of Service</span>
              </li>
            </ul>
          </div>

          {/* Newsletter subscription */}
          <div className="space-y-4">
            <h4 className="font-display text-xs font-bold uppercase tracking-widest text-white">Newsletter</h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Subscribe to receive updates about new mod releases, scripts, and limited-time coupons.
            </p>
            <form onSubmit={handleSubscribe} className="flex max-w-sm items-center relative">
              <input
                type="email"
                placeholder="Your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
                className="w-full rounded bg-brand-card border border-white/10 px-3.5 py-2 text-xs text-white focus:border-brand-green focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 bottom-1 rounded bg-brand-green px-3 text-black hover:bg-opacity-90 transition-colors"
                aria-label="Subscribe"
              >
                <Send className="h-3 w-3" />
              </button>
            </form>
            {newsletterSubscribed && (
              <p className="text-[11px] text-brand-green">
                Thanks! You have been successfully subscribed.
              </p>
            )}
          </div>
        </div>

        {/* Trademark Disclaimer */}
        <div className="mt-8 border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-500">
          <p>© {new Date().getFullYear()} GTA Hub Store. All rights reserved.</p>
          <p className="mt-2 sm:mt-0 max-w-md text-center sm:text-right leading-relaxed">
            Disclaimer: We are not affiliated with, authorized, or endorsed by Rockstar Games, Take-Two Interactive, or FiveM. All assets are custom creations.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <CartProvider>
        {/* Theme FX */}
        <CursorGlow />
        <Particles />
        
        {/* Page Structure */}
        <div className="relative z-10 flex min-h-screen flex-col bg-brand-bg text-gray-200 bg-grid-pattern">
          <React.Suspense fallback={<div className="h-16 border-b border-white/5 bg-brand-bg/70" />}>
            <Navigation />
          </React.Suspense>
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}
