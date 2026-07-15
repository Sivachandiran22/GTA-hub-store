'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart, Product } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import FormattedPrice from '@/components/formatted-price';
import { 
  Star, 
  Download, 
  ShoppingCart, 
  Check, 
  ShieldCheck, 
  Cpu, 
  FileCode2, 
  Terminal, 
  Info,
  Calendar,
  Layers,
  ArrowLeft,
  Share2
} from 'lucide-react';

interface GalleryItem {
  id: string;
  imageUrl: string;
  mediaType: string;
}

interface ReviewWithUser {
  id: string;
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  adminReply: string | null;
  helpfulVotes: number;
  createdAt: string;
  user: { fullName: string };
}

interface ProductDetailsType extends Product {
  shortDescription: string;
  longDescription: string;
  downloadsCount: number;
  rating: number;
  isFeatured: boolean;
  isFree: boolean;
  requirements: string | null;
  installationGuide: string | null;
  compatibilityGta: string;
  compatibilityFivem: string;
  author: string;
  createdAt: string;
  gallery: GalleryItem[];
  tags: Array<{ id: string; tagName: string }>;
  reviews: ReviewWithUser[];
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const router = useRouter();
  const { slug } = use(params);
  const { addToCart, isInCart } = useCart();
  const { isAuthenticated, token } = useAuth();

  const [product, setProduct] = useState<ProductDetailsType | null>(null);
  const [related, setRelated] = useState<ProductDetailsType[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'description' | 'requirements' | 'installation'>('description');
  const [activeImage, setActiveImage] = useState<string>('');
  
  // Review form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${slug}`);
        const data = await res.json();
        
        if (res.ok && data.product) {
          setProduct(data.product);
          setActiveImage(data.product.thumbnailUrl);

          // Fetch related products in the same category
          const categorySlug = data.product.category.slug;
          const relatedRes = await fetch(`/api/products?category=${categorySlug}`);
          const relatedData = await relatedRes.json();
          if (relatedRes.ok) {
            // Filter out current product
            const filtered = (relatedData.products || []).filter(
              (p: any) => p.id !== data.product.id
            );
            setRelated(filtered.slice(0, 4));
          }
        } else {
          router.push('/shop');
        }
      } catch (err) {
        console.error('Failed to fetch details', err);
        router.push('/shop');
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [slug, router]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setReviewError('');
    setReviewSuccess(false);

    try {
      const res = await fetch(`/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product?.id,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccess(true);
        setReviewComment('');
        // Reload details to show review
        const refreshedRes = await fetch(`/api/products/${slug}`);
        const refreshedData = await refreshedRes.json();
        if (refreshedRes.ok) {
          setProduct(refreshedData.product);
        }
      } else {
        setReviewError(data.message || 'Failed to submit review');
      }
    } catch (err) {
      setReviewError('Error submitting review');
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product);
      router.push('/cart');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-xs text-gray-500 uppercase tracking-widest">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent mb-4"></div>
        <div>Loading product modules...</div>
      </div>
    );
  }

  if (!product) return null;

  const alreadyInCart = isInCart(product.id);
  const displayPrice = product.isFree ? 'Free' : `$${product.price.toFixed(2)}`;
  const displaySalePrice = product.salePrice !== null ? `$${product.salePrice.toFixed(2)}` : null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
      {/* Back button */}
      <div>
        <Link href="/shop" className="inline-flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white uppercase transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Catalog</span>
        </Link>
      </div>

      {/* Main product overview */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Gallery / Images (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black border border-white/5">
            <img
              src={activeImage}
              alt={product.title}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop';
              }}
            />
          </div>

          {/* Thumbnail selector */}
          {product.gallery && product.gallery.length > 0 && (
            <div className="flex space-x-3 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveImage(product.thumbnailUrl)}
                className={`relative h-16 w-28 flex-shrink-0 overflow-hidden rounded border transition-all ${
                  activeImage === product.thumbnailUrl ? 'border-brand-green' : 'border-white/5 hover:border-white/20'
                }`}
              >
                <img src={product.thumbnailUrl} alt="Thumbnail" className="h-full w-full object-cover" />
              </button>
              {product.gallery.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(img.imageUrl)}
                  className={`relative h-16 w-28 flex-shrink-0 overflow-hidden rounded border transition-all ${
                    activeImage === img.imageUrl ? 'border-brand-green' : 'border-white/5 hover:border-white/20'
                  }`}
                >
                  <img src={img.imageUrl} alt="Gallery Preview" className="h-full w-full object-cover" onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/products/gallery-default.jpg';
                  }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pricing / Purchasing panel (Right 1 col) */}
        <div className="rounded-lg bg-brand-card border border-white/5 p-6 space-y-6 self-start">
          <div>
            <span className="text-[10px] uppercase font-black text-brand-green tracking-widest">
              {product.category?.name}
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-black text-white uppercase mt-1 leading-tight">
              {product.title}
            </h1>
            <p className="text-[10px] text-gray-500 mt-1">Author: {product.author} | Version: {product.version}</p>
          </div>

          {/* Telemetries */}
          <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-4 text-xs">
            <div className="flex items-center space-x-2 text-gray-400">
              <Star className="h-4 w-4 fill-brand-orange text-brand-orange" />
              <div>
                <p className="font-bold text-white">{product.rating.toFixed(1)} / 5.0</p>
                <p className="text-[10px] text-gray-500">Rating ({product.reviews.length})</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-gray-400">
              <Download className="h-4 w-4 text-brand-green" />
              <div>
                <p className="font-bold text-white">{product.downloadsCount}</p>
                <p className="text-[10px] text-gray-500">Downloads</p>
              </div>
            </div>
          </div>

          {/* Price display */}
          <div className="flex items-baseline space-x-2">
            {product.isFree ? (
              <span className="font-display text-2xl font-black text-brand-green">
                Free
              </span>
            ) : product.salePrice !== null ? (
              <>
                <span className="font-display text-2xl font-black text-brand-green">
                  <FormattedPrice price={product.salePrice} />
                </span>
                <span className="text-xs text-gray-500 line-through">
                  <FormattedPrice price={product.price} />
                </span>
              </>
            ) : (
              <span className="font-display text-2xl font-black text-white">
                <FormattedPrice price={product.price} />
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <button
              onClick={handleBuyNow}
              className="w-full rounded bg-brand-green py-3 text-xs font-black uppercase text-black tracking-wider shadow-md hover:bg-opacity-90 transition-all"
            >
              Buy Now
            </button>
            <button
              onClick={() => addToCart(product)}
              disabled={alreadyInCart}
              className={`w-full rounded border py-3 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center space-x-2 ${
                alreadyInCart
                  ? 'border-brand-green/20 bg-brand-green/10 text-brand-green cursor-default'
                  : 'border-white/10 bg-transparent text-white hover:bg-white/5'
              }`}
            >
              {alreadyInCart ? (
                <>
                  <Check className="h-4 w-4" />
                  <span>Added to Cart</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span>Add to Cart</span>
                </>
              )}
            </button>
          </div>

          {/* Core Technical Specifications List */}
          <div className="rounded bg-black/40 p-4 space-y-2 text-[11px] text-gray-400">
            <div className="flex justify-between">
              <span>File Size:</span>
              <span className="text-white font-bold">{product.downloadSize}</span>
            </div>
            <div className="flex justify-between">
              <span>GTA Compatibility:</span>
              <span className="text-white font-bold">{product.compatibilityGta}</span>
            </div>
            <div className="flex justify-between">
              <span>FiveM Server build:</span>
              <span className="text-white font-bold">{product.compatibilityFivem}</span>
            </div>
            <div className="flex justify-between border-t border-white/5 pt-1.5 mt-1.5 text-[10px]">
              <span>Platform:</span>
              <span className="text-brand-green font-bold uppercase">FiveM & Single Player (SP)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs description / requirements / installation guide */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex border-b border-white/5 text-xs font-bold uppercase tracking-wider">
            {[
              { id: 'description', label: 'Description' },
              { id: 'requirements', label: 'Requirements' },
              { id: 'installation', label: 'Installation Guide' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 pr-6 transition-colors duration-200 border-b-2 -mb-[2px] ${
                  activeTab === tab.id
                    ? 'border-brand-green text-white'
                    : 'border-transparent text-gray-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-gray-400 leading-relaxed space-y-4">
            {activeTab === 'description' && (
              <div className="whitespace-pre-line">{product.longDescription}</div>
            )}
            {activeTab === 'requirements' && (
              <div className="whitespace-pre-line bg-black/30 border border-white/5 p-4 rounded text-gray-300">
                <Info className="h-4 w-4 text-brand-green mb-2 inline-block mr-1.5 align-text-bottom" />
                <span className="font-bold text-white uppercase text-[10px] tracking-wider">Asset System Requirements:</span>
                <p className="mt-2 text-xs">{product.requirements || 'No special frameworks required. Ready for single player OpenIV drop-in or standard FiveM servers.'}</p>
              </div>
            )}
            {activeTab === 'installation' && (
              <div className="whitespace-pre-line bg-brand-card border border-white/5 p-4 rounded text-gray-300 font-mono">
                {product.installationGuide || '1. Extract the downloaded ZIP file.\n2. Drag & drop the resources folder into your FiveM resource tree.\n3. Add `ensure [mod-name]` to your server.cfg.'}
              </div>
            )}
          </div>

          {/* Reviews section */}
          <div className="space-y-6 pt-6 border-t border-white/5">
            <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider">
              Verified Purchases Reviews ({product.reviews.length})
            </h3>

            {/* List of reviews */}
            <div className="space-y-4">
              {product.reviews.length > 0 ? (
                product.reviews.map((rev) => (
                  <div key={rev.id} className="rounded-lg bg-brand-card/40 border border-white/5 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-white uppercase">{rev.user.fullName}</span>
                        {rev.isVerifiedPurchase && (
                          <span className="ml-2 inline-flex items-center text-[9px] bg-brand-green/10 text-brand-green border border-brand-green/20 px-1.5 py-0.5 rounded font-bold uppercase">
                            <ShieldCheck className="h-3 w-3 mr-1" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-500">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Star count */}
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-sm ${i < rev.rating ? 'text-brand-orange' : 'text-gray-700'}`}>★</span>
                      ))}
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">{rev.comment}</p>

                    {/* Admin Reply */}
                    {rev.adminReply && (
                      <div className="ml-4 border-l-2 border-brand-orange bg-black/30 p-3 rounded text-[11px] text-gray-400">
                        <span className="font-bold text-brand-orange uppercase text-[9px] tracking-wider block mb-1">Developer Response:</span>
                        {rev.adminReply}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-500 italic">No reviews have been written for this product yet.</p>
              )}
            </div>

            {/* Post review form */}
            <div className="rounded-lg bg-brand-card border border-white/5 p-4 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Leave a Review</h4>
              {isAuthenticated ? (
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400">Rating:</span>
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(parseInt(e.target.value))}
                      className="rounded bg-black border border-white/10 px-2 py-1 text-xs text-white"
                    >
                      <option value="5">★★★★★ (5/5)</option>
                      <option value="4">★★★★☆ (4/5)</option>
                      <option value="3">★★★☆☆ (3/5)</option>
                      <option value="2">★★☆☆☆ (2/5)</option>
                      <option value="1">★☆☆☆☆ (1/5)</option>
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Write your comment..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    required
                    className="w-full rounded bg-black border border-white/10 p-3 text-xs text-white focus:border-brand-green focus:outline-none"
                  />
                  {reviewError && <p className="text-xs text-brand-orange font-bold">{reviewError}</p>}
                  {reviewSuccess && <p className="text-xs text-brand-green font-bold">Review submitted successfully!</p>}
                  <button
                    type="submit"
                    className="rounded bg-brand-green px-4 py-2 text-xs font-bold text-black uppercase hover:bg-opacity-95"
                  >
                    Post Review
                  </button>
                </form>
              ) : (
                <p className="text-xs text-gray-500 italic">
                  Please{' '}
                  <Link href="/login" className="text-brand-green hover:underline font-bold">
                    login
                  </Link>{' '}
                  to write a review.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Related products (Right 1 col in details view layout) */}
        <div className="space-y-6">
          <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
            Related Mod Packs
          </h3>
          <div className="flex flex-col gap-6">
            {related.length > 0 ? (
              related.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center space-x-3 rounded bg-brand-card/40 border border-white/5 p-3 hover:border-brand-green/10 transition-colors"
                >
                  <img
                    src={p.thumbnailUrl}
                    alt={p.title}
                    className="h-12 w-16 rounded object-cover flex-shrink-0 bg-gray-900"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&auto=format&fit=crop';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${p.slug}`}
                      className="block text-xs font-bold text-white hover:text-brand-green truncate"
                    >
                      {p.title}
                    </Link>
                    <span className="text-[10px] text-brand-green font-bold mt-0.5 block">
                      {p.isFree ? 'Free' : <FormattedPrice price={p.price} />}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 italic">No related mods found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
