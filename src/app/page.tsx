import React from 'react';
import Link from 'next/link';
import prisma from '@/lib/db';
import ProductCard from '@/components/product-card';
import FeaturedSlider from '@/components/featured-slider';
import { 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Gift, 
  FileText, 
  HelpCircle, 
  Cpu, 
  ShieldCheck, 
  Zap, 
  Users,
  Box,
  Home,
  Shirt,
  Car,
  Code
} from 'lucide-react';

const CATEGORY_THEMES: Record<string, { icon: any; gradient: string; border: string; textColor: string; glowColor: string }> = {
  props: {
    icon: Box,
    gradient: 'from-blue-500/10 to-indigo-500/5 hover:from-blue-500/20 hover:to-indigo-500/10',
    border: 'border-blue-500/10 hover:border-blue-500/30',
    textColor: 'text-blue-400 group-hover:text-blue-200',
    glowColor: 'bg-blue-500/25'
  },
  'free-downloads': {
    icon: Gift,
    gradient: 'from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/20 hover:to-teal-500/10',
    border: 'border-emerald-500/10 hover:border-emerald-500/30',
    textColor: 'text-emerald-400 group-hover:text-emerald-200',
    glowColor: 'bg-emerald-500/25'
  },
  free: {
    icon: Gift,
    gradient: 'from-emerald-500/10 to-teal-500/5 hover:from-emerald-500/20 hover:to-teal-500/10',
    border: 'border-emerald-500/10 hover:border-emerald-500/30',
    textColor: 'text-emerald-400 group-hover:text-emerald-200',
    glowColor: 'bg-emerald-500/25'
  },
  mlo: {
    icon: Home,
    gradient: 'from-amber-500/10 to-orange-500/5 hover:from-amber-500/20 hover:to-orange-500/10',
    border: 'border-amber-500/10 hover:border-amber-500/30',
    textColor: 'text-amber-400 group-hover:text-amber-200',
    glowColor: 'bg-amber-500/25'
  },
  clothing: {
    icon: Shirt,
    gradient: 'from-purple-500/10 to-pink-500/5 hover:from-purple-500/20 hover:to-purple-500/10',
    border: 'border-purple-500/10 hover:border-purple-500/30',
    textColor: 'text-purple-400 group-hover:text-purple-200',
    glowColor: 'bg-purple-500/25'
  },
  clothes: {
    icon: Shirt,
    gradient: 'from-purple-500/10 to-pink-500/5 hover:from-purple-500/20 hover:to-purple-500/10',
    border: 'border-purple-500/10 hover:border-purple-500/30',
    textColor: 'text-purple-400 group-hover:text-purple-200',
    glowColor: 'bg-purple-500/25'
  },
  vehicles: {
    icon: Car,
    gradient: 'from-red-500/10 to-rose-500/5 hover:from-red-500/20 hover:to-rose-500/10',
    border: 'border-red-500/10 hover:border-red-500/30',
    textColor: 'text-red-400 group-hover:text-red-200',
    glowColor: 'bg-red-500/25'
  },
  cars: {
    icon: Car,
    gradient: 'from-red-500/10 to-rose-500/5 hover:from-red-500/20 hover:to-rose-500/10',
    border: 'border-red-500/10 hover:border-red-500/30',
    textColor: 'text-red-400 group-hover:text-red-200',
    glowColor: 'bg-red-500/25'
  },
  scripts: {
    icon: Code,
    gradient: 'from-cyan-500/10 to-blue-500/5 hover:from-cyan-500/20 hover:to-blue-500/10',
    border: 'border-cyan-500/10 hover:border-cyan-500/30',
    textColor: 'text-cyan-400 group-hover:text-cyan-200',
    glowColor: 'bg-cyan-500/25'
  },
  peds: {
    icon: Users,
    gradient: 'from-indigo-500/10 to-violet-500/5 hover:from-indigo-500/20 hover:to-violet-500/10',
    border: 'border-indigo-500/10 hover:border-indigo-500/30',
    textColor: 'text-indigo-400 group-hover:text-indigo-200',
    glowColor: 'bg-indigo-500/25'
  },
  ped: {
    icon: Users,
    gradient: 'from-indigo-500/10 to-violet-500/5 hover:from-indigo-500/20 hover:to-violet-500/10',
    border: 'border-indigo-500/10 hover:border-indigo-500/30',
    textColor: 'text-indigo-400 group-hover:text-indigo-200',
    glowColor: 'bg-indigo-500/25'
  }
};

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch homepage datasets concurrently in parallel
  const [
    productsStats,
    uniqueBuyers,
    categories,
    featuredProducts,
    latestProducts,
    saleProducts,
    allProducts,
    reviews
  ] = await Promise.all([
    prisma.product.aggregate({
      _sum: { downloadsCount: true },
      _count: { id: true }
    }),
    prisma.order.groupBy({
      by: ['userId'],
      where: { status: 'COMPLETED' }
    }),
    prisma.category.findMany({
      take: 6,
      include: {
        _count: {
          select: { products: true }
        }
      }
    }),
    prisma.product.findMany({
      where: { isFeatured: true, isVisible: true },
      take: 4,
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    }),
    prisma.product.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: 'desc' },
      take: 4,
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    }),
    prisma.product.findMany({
      where: { salePrice: { not: null }, isVisible: true },
      take: 4,
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    }),
    prisma.product.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: 'desc' },
      take: 12,
      include: {
        category: {
          select: { name: true, slug: true }
        }
      }
    }),
    prisma.review.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true } },
        product: { select: { title: true } }
      }
    })
  ]);

  const totalDownloads = productsStats._sum.downloadsCount || 0;
  const totalProducts = productsStats._count.id || 0;
  const satisfiedBuyers = uniqueBuyers.length;

  // FAQ List
  const faqs = [
    {
      q: 'How do I download my purchased files?',
      a: 'After completing checkout, you will receive an instant redirect to your dashboard. Under the "Downloads" tab, you will find expirable links to fetch your ZIP files.'
    },

    {
      q: 'Can I get a refund if the mod does not work?',
      a: 'Since we sell digital assets, all sales are final. However, we offer 24/7 support via email and Discord to help you troubleshoot installation and get the mod running.'
    },
    {
      q: 'Is it legal to use these custom mods?',
      a: 'Our modifications are custom creations and do not contain copyrighted assets from Rockstar Games or Take-Two. They are safe to use in single-player or private FiveM servers.'
    }
  ];

  return (
    <div className="space-y-12 pb-20 pt-6">
      {/* 1. Hero Info Banner (Temporarily Hidden)
      <section className="relative overflow-hidden pt-2 pb-2">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(0,255,135,0.08),transparent)]" />
        
        <div className="absolute right-1/4 top-1/3 h-72 w-72 rounded-full bg-brand-green/5 blur-3xl animate-pulse-glow" />
        <div className="absolute left-1/4 bottom-1/3 h-64 w-64 rounded-full bg-brand-orange/5 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 text-left">
          <div className="inline-flex items-center space-x-2 rounded-full bg-brand-card/60 border border-white/5 px-3 py-1 mb-3 text-[9px] text-brand-green font-medium">
            <Sparkles className="h-3 w-3" />
            <span>Next-Gen GTA Marketplace</span>
          </div>

          <h1 className="font-display text-2xl font-extrabold tracking-tight text-white sm:text-3xl uppercase">
            GTA <span className="text-brand-green neon-glow-green">HUB</span> STORE
          </h1>
          <p className="mt-1 font-display text-xs md:text-sm font-semibold tracking-wide text-gray-400">
            Premium GTA Mods Marketplace
          </p>
          <p className="mt-1 max-w-lg text-[10px] text-gray-500 leading-relaxed">
            High-quality Peds, Props, MLOs, Buildings, Vehicles, Scripts and more. All assets are 100% compatible with both FiveM and Single Player (SP).
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              href="/shop"
              className="rounded bg-brand-green px-4 py-2 text-[10px] font-black uppercase text-black tracking-wider shadow-md hover:bg-opacity-90 hover:scale-102 transition-all"
            >
              Browse Mods
            </Link>
            <Link
              href="/shop?sort=newest"
              className="rounded bg-brand-card border border-white/10 px-4 py-2 text-[10px] font-black uppercase text-white tracking-wider hover:bg-white/5 transition-colors"
            >
              Latest Uploads
            </Link>
            <Link
              href="/shop?type=free"
              className="rounded bg-brand-orange/10 border border-brand-orange/20 px-4 py-2 text-[10px] font-black uppercase text-brand-orange tracking-wider hover:bg-brand-orange/20 transition-all"
            >
              Free Downloads
            </Link>
          </div>
        </div>
      </section>
      */}

      {/* 2. Slidable Featured Hero Panel */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FeaturedSlider products={featuredProducts} />
      </section>

      {/* 2.5. More Featured Releases */}
      {featuredProducts.length > 1 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl md:text-2xl font-extrabold uppercase text-white tracking-wide">
                More Featured Releases
              </h2>
              <p className="text-xs text-gray-500 mt-1">Handpicked top performance mods from our catalog</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.slice(1).map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </section>
      )}

      {/* 2.7. All Assets Showcase Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-extrabold uppercase text-white tracking-wide">
              All Assets
            </h2>
            <p className="text-xs text-gray-500 mt-1">Browse our entire collection of high-quality modifications</p>
          </div>
          <Link href="/shop" className="text-xs font-bold text-brand-green hover:underline flex items-center space-x-1">
            <span>View All Products</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {allProducts.map((p) => (
            <ProductCard key={p.id} product={p as any} />
          ))}
        </div>
      </section>

      {/* 3. Featured Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-extrabold uppercase text-white tracking-wide">
              Featured Categories
            </h2>
            <p className="text-xs text-gray-500 mt-1">Explore specialized digital assets for GTA</p>
          </div>
          <Link href="/shop" className="text-xs font-bold text-brand-green hover:underline flex items-center space-x-1">
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => {
            const theme = CATEGORY_THEMES[cat.slug] || {
              icon: HelpCircle,
              gradient: 'from-gray-500/10 to-slate-500/5 hover:from-gray-500/20 hover:to-slate-500/10',
              border: 'border-white/5 hover:border-white/20',
              textColor: 'text-gray-400 group-hover:text-white',
              glowColor: 'bg-white/5'
            };
            const IconComponent = theme.icon;

            return (
              <Link
                key={cat.id}
                href={`/shop?category=${cat.slug}`}
                className={`group relative overflow-hidden rounded-xl bg-gradient-to-br ${theme.gradient} border ${theme.border} p-5 text-center transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-black/50`}
              >
                {/* Background overlay */}
                <div className="absolute inset-0 bg-black/55 group-hover:bg-black/30 transition-colors -z-10" />

                {/* Themed Icon Box */}
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-black/50 border border-white/10 group-hover:border-transparent transition-all duration-300 mb-3.5 relative shadow-inner shadow-black/80">
                  <IconComponent className={`h-6 w-6 ${theme.textColor} group-hover:scale-115 transition-all duration-300 z-10`} />
                  
                  {/* Glowing background inside icon box */}
                  <div className={`absolute inset-0 rounded-lg ${theme.glowColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm -z-0`} />
                </div>

                <h3 className="font-display font-black text-xs uppercase tracking-wider text-white transition-colors">
                  {cat.name}
                </h3>
                
                <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1.5">
                  {cat._count?.products || 0} {cat._count?.products === 1 ? 'Mod' : 'Mods'}
                </p>
              </Link>
            );
          })}
        </div>
      </section>


      {/* 4. Stats Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total Downloads', value: totalDownloads.toString(), icon: Zap, color: 'text-brand-green' },
            { label: 'Active Mods', value: totalProducts.toString(), icon: Cpu, color: 'text-brand-green' },
            { label: 'Satisfied Buyers', value: satisfiedBuyers.toString(), icon: Users, color: 'text-brand-orange' },
            { label: 'Secure Delivery', value: '100%', icon: ShieldCheck, color: 'text-brand-orange' },
          ].map((stat, idx) => (
            <div key={idx} className="rounded-lg bg-brand-card/50 border border-white/5 p-6 text-center backdrop-blur-sm">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white/5 mb-3">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="font-display text-2xl font-black text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Flash Sales / Sale Items */}
      {saleProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="flex h-2 w-2 rounded-full bg-brand-orange animate-ping" />
              <div>
                <h2 className="font-display text-xl md:text-2xl font-extrabold uppercase text-white tracking-wide flex items-center space-x-2">
                  <span>Flash Sales</span>
                  <span className="text-xs font-sans tracking-normal bg-brand-orange px-2 py-0.5 rounded text-white lowercase">limited offers</span>
                </h2>
                <p className="text-xs text-gray-500 mt-1">Huge discounts on premium assets</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {saleProducts.map((p) => (
              <ProductCard key={p.id} product={p as any} />
            ))}
          </div>
        </section>
      )}

      {/* 6. Free Downloads Banner */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl bg-gradient-to-r from-brand-card to-[#1a1a24] border border-white/5 overflow-hidden p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-brand-green/5 blur-3xl" />
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center space-x-1.5 rounded bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              <Gift className="h-3.5 w-3.5" />
              <span>Zero Cost</span>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-black text-white uppercase">
              Free Downloads Library
            </h2>
            <p className="text-xs text-gray-400 leading-relaxed">
              Test out our asset quality before committing! Browse our collection of free vehicles, handling configs, clothing items, and props to optimize your game.
            </p>
          </div>
          <Link
            href="/shop?type=free"
            className="rounded bg-brand-orange px-6 py-3 text-xs font-black uppercase text-white tracking-wider shadow-md hover:bg-opacity-95 hover:scale-102 transition-all flex items-center space-x-1"
          >
            <span>Access Library</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* 7. Reviews Section */}
      {reviews.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="font-display text-xl md:text-2xl font-extrabold uppercase text-white tracking-wide">
              Verified Customer Reviews
            </h2>
            <p className="text-xs text-gray-500">What gaming server administrators say about us</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-lg bg-brand-card/60 border border-white/5 p-6 space-y-4 backdrop-blur-sm">
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${i < r.rating ? 'text-brand-orange' : 'text-gray-700'}`}>★</span>
                  ))}
                </div>
                <p className="text-xs italic text-gray-400 leading-relaxed">"{r.comment}"</p>
                <div className="pt-2 border-t border-white/5 flex justify-between items-center text-[10px]">
                  <div>
                    <p className="font-display font-bold text-white uppercase">{r.user?.fullName || 'Verified Buyer'}</p>
                    <p className="text-brand-green mt-0.5">{r.product?.title || 'GTA Mod'}</p>
                  </div>
                  {r.isVerifiedPurchase && (
                    <span className="text-brand-orange font-bold uppercase tracking-wider">Verified Buyer</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 8. Frequently Asked Questions */}
      <section id="faq" className="mx-auto max-w-4xl px-4 sm:px-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-display text-xl md:text-2xl font-extrabold uppercase text-white tracking-wide flex items-center justify-center space-x-2">
            <HelpCircle className="h-5 w-5 text-brand-green" />
            <span>Frequently Asked Questions</span>
          </h2>
          <p className="text-xs text-gray-500">Quick answers about payments, deliveries, and licensing</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <details
              key={idx}
              className="group rounded-lg bg-brand-card/40 border border-white/5 p-4 transition-all duration-200 open:border-brand-green/20 open:bg-brand-card/80"
            >
              <summary className="flex cursor-pointer items-center justify-between text-xs font-bold text-white uppercase select-none list-none">
                <span>{faq.q}</span>
                <span className="transition-transform duration-200 group-open:rotate-180 text-brand-green">
                  ▼
                </span>
              </summary>
              <p className="mt-3 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-3">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* 9. Blog preview link */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 text-center">
        <div className="rounded-lg bg-brand-card/20 border border-white/5 p-6 inline-flex items-center space-x-4 text-xs">
          <FileText className="h-4 w-4 text-brand-green" />
          <span className="text-gray-400">Need help setting up vehicles or FiveM resources?</span>
          <Link href="/blog" className="text-brand-green font-bold hover:underline flex items-center space-x-1">
            <span>Read installation tutorials</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </section>
    </div>
  );
}
