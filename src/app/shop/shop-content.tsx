'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/product-card';
import { Search, SlidersHorizontal, Check, RefreshCw, X, Sparkles } from 'lucide-react';

interface CategoryWithCount {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

interface ProductType {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnailUrl: string;
  downloadsCount: number;
  rating: number;
  isFeatured: boolean;
  isFree: boolean;
  category: { name: string; slug: string };
}

export default function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL query state
  const activeCategory = searchParams.get('category') || 'all';
  const activeSearch = searchParams.get('search') || '';
  const activeType = searchParams.get('type') || 'all'; // all, free, paid
  const activeSort = searchParams.get('sort') || 'newest';
  const activeMinPrice = searchParams.get('minPrice') || '';
  const activeMaxPrice = searchParams.get('maxPrice') || '';
  const activeGame = searchParams.get('game') || 'GTA5';

  // Local component state
  const [products, setProducts] = useState<ProductType[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  // Local filter form states
  const [searchInput, setSearchInput] = useState(activeSearch);
  const [minPriceInput, setMinPriceInput] = useState(activeMinPrice);
  const [maxPriceInput, setMaxPriceInput] = useState(activeMaxPrice);

  // Update input states when URL parameters change
  useEffect(() => {
    setSearchInput(activeSearch);
    setMinPriceInput(activeMinPrice);
    setMaxPriceInput(activeMaxPrice);
  }, [activeSearch, activeMinPrice, activeMaxPrice]);

  // Fetch catalog on URL query change
  useEffect(() => {
    const fetchCatalog = async () => {
      setLoading(true);
      try {
        const queryParts = [];
        if (activeGame && activeGame !== 'all') queryParts.push(`game=${activeGame}`);
        if (activeCategory && activeCategory !== 'all') queryParts.push(`category=${activeCategory}`);
        if (activeSearch) queryParts.push(`search=${encodeURIComponent(activeSearch)}`);
        if (activeType && activeType !== 'all') queryParts.push(`type=${activeType}`);
        if (activeSort) queryParts.push(`sort=${activeSort}`);
        if (activeMinPrice) queryParts.push(`minPrice=${activeMinPrice}`);
        if (activeMaxPrice) queryParts.push(`maxPrice=${activeMaxPrice}`);

        const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
        const res = await fetch(`/api/products${queryString}`);
        const data = await res.json();
        
        if (res.ok) {
          setProducts(data.products || []);
          setCategories(data.categories || []);
        }
      } catch (err) {
        console.error('Failed to load shop items', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalog();
  }, [activeCategory, activeSearch, activeType, activeSort, activeMinPrice, activeMaxPrice, activeGame]);

  const updateQueries = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(newParams).forEach(([key, val]) => {
      if (val === null || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    router.push(`/shop?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueries({ search: searchInput || null });
  };

  const handlePriceApply = (e: React.FormEvent) => {
    e.preventDefault();
    updateQueries({
      minPrice: minPriceInput || null,
      maxPrice: maxPriceInput || null,
    });
  };

  const resetFilters = () => {
    setSearchInput('');
    setMinPriceInput('');
    setMaxPriceInput('');
    router.push('/shop');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-6 mb-8 gap-4">
        <div>
          <h1 className="font-display text-2xl font-black uppercase text-white tracking-wider">
            Modifications Catalog
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Browse through {products.length} premium digital mods and configurations
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-3 self-end md:self-auto">
          <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">Sort By:</span>
          <select
            value={activeSort}
            onChange={(e) => updateQueries({ sort: e.target.value })}
            className="rounded bg-brand-card border border-white/10 px-3 py-1.5 text-xs text-white focus:border-brand-green focus:outline-none"
          >
            <option value="newest">Newest Uploads</option>
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Game Tabs */}
      <div className="flex border-b border-white/5 mb-8 text-xs font-bold uppercase tracking-wider gap-6">
        {[
          { id: 'GTA5', label: 'GTA V Mods', href: '/shop?game=GTA5' },
          { id: 'GTA6', label: 'GTA VI Mods', href: '/shop?game=GTA6' },
          { id: '3D_MODEL', label: '3D Models', href: '/shop?game=3D_MODEL' }
        ].map((tab) => {
          const isActive = activeGame === tab.id;
          const isComingSoon = tab.id === 'GTA6';
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={`pb-3 transition-colors duration-200 border-b-2 -mb-[2px] flex items-center space-x-1.5 ${
                isActive
                  ? 'border-brand-green text-brand-green font-black'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <span>{tab.label}</span>
              {isComingSoon && (
                <span className="rounded bg-brand-orange/20 border border-brand-orange/30 px-1.5 py-0.5 text-[8px] text-brand-orange">
                  soon
                </span>
              )}
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Sidebar Filters */}
        <div className="space-y-6 lg:col-span-1">
          {/* Active Filters list / Reset */}
          <div className="rounded-lg bg-brand-card/30 border border-white/5 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-white tracking-wide flex items-center space-x-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5 text-brand-green" />
                <span>Filters</span>
              </span>
              <button
                onClick={resetFilters}
                className="text-[10px] uppercase font-bold text-brand-orange hover:underline flex items-center space-x-1"
              >
                <X className="h-3 w-3" />
                <span>Clear All</span>
              </button>
            </div>
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search catalog..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full rounded bg-brand-card border border-white/10 pl-10 pr-4 py-2.5 text-xs text-white focus:border-brand-green focus:outline-none"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </form>

          {/* Category Filter */}
          {activeGame !== '3D_MODEL' && (
            <div className="rounded-lg bg-brand-card/30 border border-white/5 p-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">Categories</h3>
              <div className="flex flex-col space-y-1.5 text-xs">
                <button
                  onClick={() => updateQueries({ category: 'all' })}
                  className={`text-left px-2 py-1.5 rounded transition-all flex items-center justify-between ${
                    activeCategory === 'all'
                      ? 'bg-brand-green/10 text-brand-green font-bold border-l-2 border-brand-green'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span>All Assets</span>
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => updateQueries({ category: cat.slug })}
                    className={`text-left px-2 py-1.5 rounded transition-all flex items-center justify-between ${
                      activeCategory === cat.slug
                        ? 'bg-brand-green/10 text-brand-green font-bold border-l-2 border-brand-green'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-[10px] text-gray-500">({cat._count.products})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type Filter */}
          <div className="rounded-lg bg-brand-card/30 border border-white/5 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">License Type</h3>
            <div className="grid grid-cols-3 gap-1 rounded bg-black/40 p-1 text-center text-xs">
              {[
                { name: 'All', value: 'all' },
                { name: 'Paid', value: 'paid' },
                { name: 'Free', value: 'free' },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateQueries({ type: type.value })}
                  className={`rounded py-1 text-[11px] font-bold uppercase transition-all ${
                    activeType === type.value
                      ? 'bg-brand-green text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="rounded-lg bg-brand-card/30 border border-white/5 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Price Limit</h3>
            <form onSubmit={handlePriceApply} className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  placeholder="Min ($)"
                  value={minPriceInput}
                  onChange={(e) => setMinPriceInput(e.target.value)}
                  className="w-full rounded bg-brand-card border border-white/10 px-2.5 py-2 text-xs text-white focus:border-brand-green focus:outline-none"
                />
                <span className="text-gray-500 text-xs">—</span>
                <input
                  type="number"
                  placeholder="Max ($)"
                  value={maxPriceInput}
                  onChange={(e) => setMaxPriceInput(e.target.value)}
                  className="w-full rounded bg-brand-card border border-white/10 px-2.5 py-2 text-xs text-white focus:border-brand-green focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded bg-brand-orange py-2 text-xs font-bold uppercase text-white hover:bg-opacity-90 transition-all flex items-center justify-center space-x-1"
              >
                <span>Apply Range</span>
              </button>
            </form>
          </div>
        </div>

        {/* Catalog Grid */}
        <div className="lg:col-span-3">
          {activeGame === 'GTA6' ? (
            <div className="rounded-lg border border-dashed border-brand-orange/20 py-24 text-center bg-brand-card/40 backdrop-blur-sm">
              <Sparkles className="mx-auto h-12 w-12 text-brand-orange mb-4 animate-pulse" />
              <h2 className="font-display text-lg font-black uppercase text-white tracking-widest">GTA VI Mods Catalog</h2>
              <span className="mt-2 inline-block rounded bg-brand-orange/15 border border-brand-orange/30 px-3 py-1 text-[10px] font-bold text-brand-orange uppercase tracking-wider animate-bounce">
                Coming Soon (Fall 2026)
              </span>
              <p className="text-xs text-gray-500 mt-3 max-w-sm mx-auto leading-relaxed">
                Our development team is currently prepping high-fidelity vehicle shells, custom peds, and script packages compiled for the next chapter of Los Santos. Stay tuned!
              </p>
            </div>
          ) : loading ? (
            /* Loading skeletons */
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse rounded-lg bg-brand-card/50 border border-white/5 p-4 space-y-4">
                  <div className="aspect-video w-full rounded bg-gray-800" />
                  <div className="h-4 w-1/4 rounded bg-gray-800" />
                  <div className="h-6 w-3/4 rounded bg-gray-800" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-4 w-1/3 rounded bg-gray-800" />
                    <div className="h-8 w-8 rounded-full bg-gray-800" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard key={p.id} product={p as any} />
              ))}
            </div>
          ) : (
            /* Empty state */
            <div className="rounded-lg border border-dashed border-white/10 py-16 text-center">
              <RefreshCw className="mx-auto h-10 w-10 text-gray-500 mb-4 animate-spin-slow" />
              <p className="text-sm font-bold text-white uppercase tracking-wide">No mods found</p>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
                We couldn't find any products matching your filters. Try resetting the criteria or exploring general categories.
              </p>
              <button
                onClick={resetFilters}
                className="mt-4 rounded bg-brand-green px-4 py-2 text-xs font-bold text-black uppercase"
              >
                Reset Catalog
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
