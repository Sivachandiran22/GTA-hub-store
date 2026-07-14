'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  ShieldAlert, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Package, 
  PlusCircle, 
  BarChart3, 
  Eye, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

interface TelemetrySummary {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
}

interface RecentOrderType {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  status: string;
  date: string;
}

interface TopProductType {
  id: string;
  title: string;
  downloads: number;
  price: number;
  category: string;
}

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, token, loading: authLoading } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'add-product'>('analytics');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TelemetrySummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderType[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductType[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Add Product Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formShortDesc, setFormShortDesc] = useState('');
  const [formLongDesc, setFormLongDesc] = useState('');
  const [formPrice, setFormPrice] = useState('19.99');
  const [formSalePrice, setFormSalePrice] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formThumbnail, setFormThumbnail] = useState('/images/products/vehicle-default.jpg');
  const [formVersion, setFormVersion] = useState('1.0.0');
  const [formSize, setFormSize] = useState('45 MB');
  const [formRequirements, setFormRequirements] = useState('');
  const [formGuide, setFormGuide] = useState('');
  const [formZip, setFormZip] = useState('/assets/new_product.zip');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsFree, setFormIsFree] = useState(false);

  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');

  // Fetch admin telemetry
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && isAdmin && token) {
      const fetchAdminData = async () => {
        setLoading(true);
        try {
          // Fetch analytics
          const res = await fetch('/api/admin/analytics', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setSummary(data.summary);
            setRecentOrders(data.recentOrders || []);
            setTopProducts(data.topProducts || []);
          }

          // Fetch categories to populate dropdown
          const catRes = await fetch('/api/products');
          const catData = await catRes.json();
          if (catRes.ok) {
            setCategories(catData.categories || []);
            if (catData.categories && catData.categories.length > 0) {
              setFormCategory(catData.categories[0].id);
            }
          }
        } catch (err) {
          console.error('Failed to load admin telemetry', err);
        } finally {
          setLoading(false);
        }
      };

      fetchAdminData();
    }
  }, [isAuthenticated, isAdmin, authLoading, token, router]);

  // Autofill slug on title change
  const handleTitleChange = (val: string) => {
    setFormTitle(val);
    setFormSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formIsFree) setFormPrice('0.00');
    setFormError('');
    setFormSuccess(false);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle,
          slug: formSlug,
          shortDescription: formShortDesc,
          longDescription: formLongDesc,
          price: parseFloat(formPrice),
          salePrice: formSalePrice ? parseFloat(formSalePrice) : null,
          categoryId: formCategory,
          thumbnailUrl: formThumbnail,
          version: formVersion,
          downloadSize: formSize,
          requirements: formRequirements,
          installationGuide: formGuide,
          isFeatured: formIsFeatured,
          isFree: formIsFree,
          zipUrl: formZip
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFormSuccess(true);
        // Reset form fields
        setFormTitle('');
        setFormSlug('');
        setFormShortDesc('');
        setFormLongDesc('');
        setFormPrice('19.99');
        setFormSalePrice('');
        setFormRequirements('');
        setFormGuide('');
        
        // Refresh summary count
        if (summary) {
          setSummary({
            ...summary,
            totalProducts: summary.totalProducts + 1
          });
        }
      } else {
        setFormError(data.message || 'Failed to create product');
      }
    } catch (err) {
      setFormError('Connection error occurred');
    }
  };

  if (authLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-xs text-gray-500 uppercase tracking-widest">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent mb-4"></div>
        <div>Verifying operator authority...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header banner */}
      <div className="rounded-lg bg-brand-card/90 border border-brand-green/20 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-lg font-black text-white uppercase">Control Center</h1>
            <p className="text-xs text-gray-500">Marketplace management consoles, analytics telemetry, and content uploads</p>
          </div>
        </div>

        {/* Console Nav buttons */}
        <div className="flex space-x-3 text-xs font-bold uppercase tracking-wide">
          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`rounded px-4 py-2 transition-all ${
              activeSubTab === 'analytics'
                ? 'bg-brand-green text-black'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Analytics Console
          </button>
          <button
            onClick={() => setActiveSubTab('add-product')}
            className={`rounded px-4 py-2 transition-all ${
              activeSubTab === 'add-product'
                ? 'bg-brand-green text-black'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Upload Mod Asset
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500 uppercase tracking-widest animate-pulse">
          Retrieving server registry...
        </div>
      ) : (
        <>
          {/* Analytics Sub Tab */}
          {activeSubTab === 'analytics' && summary && (
            <div className="space-y-8">
              {/* Telemetry Widgets Grid */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {[
                  { label: 'Total Revenue', value: `$${summary.totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-brand-green' },
                  { label: 'Completed Orders', value: summary.totalOrders, icon: ShoppingBag, color: 'text-brand-green' },
                  { label: 'Enlisted Clients', value: summary.totalCustomers, icon: Users, color: 'text-brand-orange' },
                  { label: 'Mod Catalog Items', value: summary.totalProducts, icon: Package, color: 'text-brand-orange' },
                ].map((widget, idx) => (
                  <div key={idx} className="rounded-lg bg-brand-card border border-white/5 p-6 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">{widget.label}</span>
                      <widget.icon className={`h-4 w-4 ${widget.color}`} />
                    </div>
                    <p className="font-display text-2xl font-black text-white">{widget.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Recent Orders log */}
                <div className="lg:col-span-2 space-y-4">
                  <h2 className="font-display text-xs font-bold uppercase text-white tracking-widest border-b border-white/5 pb-2">
                    Recent Orders Registry
                  </h2>

                  {recentOrders.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-white/5 bg-brand-card/45 text-xs">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-white/5 bg-black/40 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            <th className="p-4">Receipt</th>
                            <th className="p-4">Customer</th>
                            <th className="p-4">Net Sum</th>
                            <th className="p-4">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                          {recentOrders.map((o) => (
                            <tr key={o.id} className="hover:bg-white/5">
                              <td className="p-4 font-mono font-bold text-white uppercase">{o.orderNumber}</td>
                              <td className="p-4">
                                <p className="font-bold">{o.customerName}</p>
                                <p className="text-[10px] text-gray-500 mt-0.5">{o.customerEmail}</p>
                              </td>
                              <td className="p-4 text-brand-green font-bold">${o.amount.toFixed(2)}</td>
                              <td className="p-4">{new Date(o.date).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic">No orders logged in registry yet.</p>
                  )}
                </div>

                {/* Popular products list */}
                <div className="space-y-4">
                  <h2 className="font-display text-xs font-bold uppercase text-white tracking-widest border-b border-white/5 pb-2">
                    Best Performing Assets
                  </h2>

                  <div className="flex flex-col gap-4">
                    {topProducts.map((p) => (
                      <div key={p.id} className="flex justify-between items-center rounded bg-brand-card/50 border border-white/5 p-4 text-xs">
                        <div className="min-w-0 pr-2">
                          <p className="font-bold text-white truncate">{p.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{p.category} | ${p.price.toFixed(2)}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-display font-black text-brand-green">{p.downloads} DLs</p>
                          <p className="text-[9px] text-gray-500 mt-0.5 uppercase tracking-wider">Downloads</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Product Sub Tab */}
          {activeSubTab === 'add-product' && (
            <div className="rounded-lg bg-brand-card border border-white/5 p-6 max-w-3xl mx-auto space-y-6">
              <h2 className="font-display text-sm font-bold uppercase text-white tracking-wider flex items-center space-x-1.5 border-b border-white/5 pb-3">
                <PlusCircle className="h-4 w-4 text-brand-green" />
                <span>Upload Mod Asset to Database</span>
              </h2>

              <form onSubmit={handleCreateProductSubmit} className="space-y-4 text-xs">
                {/* Product Name & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Mod Display Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mercedes Benz AMG G63 v2"
                      value={formTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">URL Slug (Auto Generated)</label>
                    <input
                      type="text"
                      required
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Short and Long Description */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Short Summary description</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief 1-sentence sales pitch..."
                    value={formShortDesc}
                    onChange={(e) => setFormShortDesc(e.target.value)}
                    className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-gray-400">Long Description (Markdown/HTML supported)</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Enter features, characteristics, customizable parts..."
                    value={formLongDesc}
                    onChange={(e) => setFormLongDesc(e.target.value)}
                    className="w-full rounded bg-black/60 border border-white/10 p-3 text-white focus:border-brand-green focus:outline-none"
                  />
                </div>

                {/* Price and Sale Price */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Price ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      disabled={formIsFree}
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Sale price ($ USD, Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Leave blank if no discount"
                      value={formSalePrice}
                      onChange={(e) => setFormSalePrice(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>

                  {/* Category Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Asset Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Toggles (Featured, Free) */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-black/40 rounded border border-white/5">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsFeatured}
                      onChange={(e) => setFormIsFeatured(e.target.checked)}
                      className="h-4 w-4 rounded border-white/10 bg-black checked:bg-brand-green text-brand-green focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Feature on Homepage</span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formIsFree}
                      onChange={(e) => setFormIsFree(e.target.checked)}
                      className="h-4 w-4 rounded border-white/10 bg-black checked:bg-brand-green text-brand-green focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Free Download Item</span>
                  </label>
                </div>

                {/* Requirements & Installation Guides */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">System / Mod Requirements</label>
                    <input
                      type="text"
                      placeholder="e.g. OpenIV, FiveM server build 2372"
                      value={formRequirements}
                      onChange={(e) => setFormRequirements(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Installation Guide Instructions</label>
                    <textarea
                      rows={2}
                      placeholder="1. Drop files to dlcpacks... 2. Add line to dlclist.xml..."
                      value={formGuide}
                      onChange={(e) => setFormGuide(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 p-3 text-white focus:border-brand-green focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Metadata details (Thumbnail, Size, ZIP path) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Thumbnail Cover Image Path</label>
                    <input
                      type="text"
                      required
                      value={formThumbnail}
                      onChange={(e) => setFormThumbnail(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Download ZIP Size</label>
                    <input
                      type="text"
                      required
                      value={formSize}
                      onChange={(e) => setFormSize(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Zip asset Path (stored locally/S3)</label>
                    <input
                      type="text"
                      required
                      value={formZip}
                      onChange={(e) => setFormZip(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {formError && (
                  <p className="text-xs font-bold text-brand-orange flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{formError}</span>
                  </p>
                )}
                {formSuccess && (
                  <p className="text-xs font-bold text-brand-green flex items-center space-x-1">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Product catalog record created and published successfully!</span>
                  </p>
                )}

                <button
                  type="submit"
                  className="rounded bg-brand-green px-6 py-3 text-xs font-black uppercase text-black tracking-wider shadow-md hover:bg-opacity-95"
                >
                  Publish Mod to Store
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
}
