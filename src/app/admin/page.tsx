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
  AlertCircle,
  MessageSquare,
  Send
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
  paymentMethod?: string;
  paymentIntentId?: string | null;
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

  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'add-product' | 'manage-products' | 'chat-console'>('analytics');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<TelemetrySummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrderType[]>([]);
  const [topProducts, setTopProducts] = useState<TopProductType[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  // Manage Products State
  const [manageProductsList, setManageProductsList] = useState<any[]>([]);
  const [manageLoading, setManageLoading] = useState(false);

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
  const [formGuide, setFormGuide] = useState('All installation instructions are given in the mod zip folder.');
  const [formZip, setFormZip] = useState('');
  const [formIsFeatured, setFormIsFeatured] = useState(false);
  const [formIsFree, setFormIsFree] = useState(false);
  const [formGame, setFormGame] = useState('GTA5');

  // File upload state variables
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const [zipUploading, setZipUploading] = useState(false);

  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  const [editingSlug, setEditingSlug] = useState<string | null>(null);

  // Order management states
  const [denyingOrderId, setDenyingOrderId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Your transaction ID is invalid. Please check and submit the correct payment reference.');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingTxId, setEditingTxId] = useState('');

  // Live Chat Console states
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatListLoading, setChatListLoading] = useState(false);

  const fetchConversations = async () => {
    if (!token) return;
    setChatListLoading(true);
    try {
      const res = await fetch('/api/admin/chat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setChatListLoading(false);
    }
  };

  const fetchChatMessages = async (userId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/chat/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch chat messages:', err);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedUserId || !token) return;
    const text = replyText.trim();
    setReplyText('');
    try {
      const res = await fetch(`/api/admin/chat/${selectedUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, data.message]);
        
        // Update sidebar snippet
        setConversations(prev =>
          prev.map(c =>
            c.userId === selectedUserId
              ? { ...c, lastMessage: text, lastMessageTime: new Date().toISOString(), isAdminSender: true }
              : c
          )
        );
      } else {
        alert(data.message || 'Failed to send reply');
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    }
  };

  // Poll active chat thread log
  useEffect(() => {
    let interval: any;
    if (activeSubTab === 'chat-console' && selectedUserId && token) {
      fetchChatMessages(selectedUserId);
      interval = setInterval(() => {
        fetchChatMessages(selectedUserId);
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSubTab, selectedUserId, token]);

  // Load chat conversations list
  useEffect(() => {
    if (activeSubTab === 'chat-console' && token) {
      fetchConversations();
    }
  }, [activeSubTab, token]);

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

  const handleStartEditProduct = (p: any) => {
    setFormTitle(p.title);
    setFormSlug(p.slug);
    setFormShortDesc(p.shortDescription || '');
    setFormLongDesc(p.longDescription || '');
    setFormPrice(p.price.toString());
    setFormSalePrice(p.salePrice ? p.salePrice.toString() : '');
    setFormCategory(p.categoryId);
    setFormThumbnail(p.thumbnailUrl || '/images/products/vehicle-default.jpg');
    setFormVersion(p.version || '1.0.0');
    setFormSize(p.downloadSize || '45 MB');
    setFormRequirements(p.requirements || '');
    setFormGuide(p.installationGuide || '');
    setFormIsFeatured(p.isFeatured || false);
    setFormIsFree(p.isFree || false);
    setFormGame(p.game || 'GTA5');
    setFormZip(p.zipUrl || '');
    
    setEditingSlug(p.slug);
    setActiveSubTab('add-product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditOrDiscardDraft = () => {
    setEditingSlug(null);
    setFormTitle('');
    setFormSlug('');
    setFormShortDesc('');
    setFormLongDesc('');
    setFormPrice('19.99');
    setFormSalePrice('');
    setFormRequirements('');
    setFormGuide('All installation instructions are given in the mod zip folder.');
    setFormZip('');
    setFormThumbnail('/images/products/vehicle-default.jpg');
    setFormVersion('1.0.0');
    setFormSize('45 MB');
    setFormIsFeatured(false);
    setFormIsFree(false);
    setFormGame('GTA5');
    
    localStorage.removeItem('gta_hub_admin_draft');
    setFormSuccess(false);
    setFormError('');
    setActiveSubTab('manage-products');
  };

  const handleCreateProductSubmit = async (e: React.FormEvent, makeVisible: boolean) => {
    e.preventDefault();
    const targetPrice = formIsFree ? 0 : parseFloat(formPrice);
    if (formIsFree) setFormPrice('0.00');
    setFormError('');
    setFormSuccess(false);

    try {
      const url = editingSlug ? `/api/products/${editingSlug}` : '/api/products';
      const method = editingSlug ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formTitle,
          slug: formSlug,
          shortDescription: formShortDesc,
          longDescription: formLongDesc,
          price: targetPrice,
          salePrice: formSalePrice ? parseFloat(formSalePrice) : null,
          categoryId: formCategory,
          thumbnailUrl: formThumbnail,
          version: formVersion,
          downloadSize: formSize,
          requirements: formRequirements || null,
          installationGuide: formGuide || null,
          isFeatured: formIsFeatured,
          isFree: formIsFree,
          game: formGame,
          zipUrl: formZip,
          isVisible: makeVisible
        })
      });

      const data = await res.json();
      if (res.ok) {
        setFormSuccess(true);
        if (editingSlug) {
          setEditingSlug(null);
        } else {
          localStorage.removeItem('gta_hub_admin_draft');
        }

        // Reset form fields
        setFormTitle('');
        setFormSlug('');
        setFormShortDesc('');
        setFormLongDesc('');
        setFormPrice('19.99');
        setFormSalePrice('');
        setFormRequirements('');
        setFormGuide('All installation instructions are given in the mod zip folder.');
        setFormZip('');
        setFormThumbnail('/images/products/vehicle-default.jpg');
        setFormVersion('1.0.0');
        setFormSize('45 MB');
        setFormIsFeatured(false);
        setFormIsFree(false);
        setFormGame('GTA5');
        
        // Refresh catalog lists
        const catRes = await fetch('/api/products');
        const catData = await catRes.json();
        if (catRes.ok) {
          setCategories(catData.categories || []);
        }
        
        const prodRes = await fetch('/api/products?showHidden=true');
        const prodData = await prodRes.json();
        if (prodRes.ok) {
          setManageProductsList(prodData.products || []);
        }

        const anaRes = await fetch('/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const anaData = await anaRes.json();
        if (anaRes.ok) {
          setSummary(anaData.summary);
          setRecentOrders(anaData.recentOrders || []);
          setTopProducts(anaData.topProducts || []);
        }

        if (method === 'PATCH') {
          setTimeout(() => {
            setActiveSubTab('manage-products');
            setFormSuccess(false);
          }, 1500);
        }
      } else {
        setFormError(data.message || 'Action failed');
      }
    } catch (err) {
      setFormError('Connection error occurred');
    }
  };

  const fetchManageProducts = async () => {
    setManageLoading(true);
    try {
      const res = await fetch('/api/products?showHidden=true');
      const data = await res.json();
      if (res.ok) {
        setManageProductsList(data.products || []);
      }
    } catch (err) {
      console.error('Failed to load products for management', err);
    } finally {
      setManageLoading(false);
    }
  };

  const handleToggleVisibility = async (slug: string, currentVal: boolean) => {
    try {
      const res = await fetch(`/api/products/${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isVisible: !currentVal })
      });
      if (res.ok) {
        setManageProductsList(prev =>
          prev.map(p => (p.slug === slug ? { ...p, isVisible: !currentVal } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle product visibility', err);
    }
  };

  const handleToggleFeatured = async (slug: string, currentVal: boolean) => {
    try {
      const res = await fetch(`/api/products/${slug}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isFeatured: !currentVal })
      });
      if (res.ok) {
        setManageProductsList(prev =>
          prev.map(p => (p.slug === slug ? { ...p, isFeatured: !currentVal } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle product featured status', err);
    }
  };

  const handleDeleteProduct = async (slug: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this product? This will remove all associated downloads and reviews.')) return;
    try {
      const res = await fetch(`/api/products/${slug}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setManageProductsList(prev => prev.filter(p => p.slug !== slug));
        if (summary) {
          setSummary({
            ...summary,
            totalProducts: Math.max(0, summary.totalProducts - 1)
          });
        }
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete product');
      }
    } catch (err) {
      console.error('Failed to delete product', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'thumbnail' | 'zip') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert and compress thumbnail to Base64 client-side
    if (type === 'thumbnail') {
      setThumbnailUploading(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Resize width to maximum 800px
          const scale = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Export as JPEG with 70% quality (greatly reduces size to ~50-80KB to prevent Payload Too Large errors)
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setFormThumbnail(compressedBase64);
          } else {
            setFormThumbnail(event.target?.result as string);
          }
          setThumbnailUploading(false);
        };
        img.onerror = () => {
          alert('Failed to process image file');
          setThumbnailUploading(false);
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setThumbnailUploading(false);
      };
      reader.readAsDataURL(file);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    setZipUploading(true);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setFormZip(data.url);
        setFormSize(data.size);
      } else {
        alert('Server file write is disabled in production (Vercel). Please host your mod ZIP on cloud storage (Google Drive, Discord, Dropbox, Supabase) and paste the URL directly into the field instead.');
      }
    } catch (err) {
      console.error('Failed to upload file', err);
      alert('Local ZIP upload is only supported in local development. For production (Vercel), please host your mod ZIP file on a cloud storage provider (like Google Drive, Supabase, or Discord) and paste the download link directly into the input field.');
    } finally {
      setZipUploading(false);
    }
  };

  const handleApproveOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to approve this payment? This will mark the order as COMPLETED and instantly issue download links to the customer.')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setRecentOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, status: 'COMPLETED' } : o))
        );
        alert('Order successfully approved! Downloads are now active for the user.');
        
        const refreshRes = await fetch('/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          setSummary(refreshData.summary);
        }
      } else {
        alert(data.message || 'Failed to approve order');
      }
    } catch (err) {
      console.error('Failed to approve order', err);
      alert('Connection error occurred');
    }
  };

  const handleDenyOrder = async (orderId: string, reason: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      if (res.ok) {
        setRecentOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, status: 'CANCELLED', rejectionReason: reason } : o))
        );
        setDenyingOrderId(null);
        alert('Order has been rejected/denied. The customer has been notified with your reason.');
        
        const refreshRes = await fetch('/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          setSummary(refreshData.summary);
        }
      } else {
        alert(data.message || 'Failed to reject order');
      }
    } catch (err) {
      console.error('Failed to reject order', err);
      alert('Connection error occurred');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this order? This will mark the order as CANCELLED.')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason: 'Order cancelled by Administrator' })
      });
      const data = await res.json();
      if (res.ok) {
        setRecentOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, status: 'CANCELLED', rejectionReason: 'Order cancelled by Administrator' } : o))
        );
        alert('Order successfully cancelled.');
        
        const refreshRes = await fetch('/api/admin/analytics', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok) {
          setSummary(refreshData.summary);
        }
      } else {
        alert(data.message || 'Failed to cancel order');
      }
    } catch (err) {
      console.error('Failed to cancel order', err);
      alert('Connection error occurred');
    }
  };

  const handleUpdateOrderTxId = async (orderId: string, transactionId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/update-txid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId })
      });
      const data = await res.json();
      if (res.ok) {
        setRecentOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, paymentIntentId: transactionId } : o))
        );
        setEditingOrderId(null);
        alert('Transaction Reference (UTR/TxID) updated successfully!');
      } else {
        alert(data.message || 'Failed to update transaction ID');
      }
    } catch (err) {
      console.error('Failed to update transaction ID', err);
      alert('Connection error occurred');
    }
  };

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('gta_hub_admin_draft');
      if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        if (draft.title) setFormTitle(draft.title);
        if (draft.slug) setFormSlug(draft.slug);
        if (draft.shortDesc) setFormShortDesc(draft.shortDesc);
        if (draft.longDesc) setFormLongDesc(draft.longDesc);
        if (draft.price) setFormPrice(draft.price);
        if (draft.salePrice !== undefined) setFormSalePrice(draft.salePrice);
        if (draft.category) setFormCategory(draft.category);
        if (draft.thumbnail) setFormThumbnail(draft.thumbnail);
        if (draft.version) setFormVersion(draft.version);
        if (draft.size) setFormSize(draft.size);
        if (draft.requirements) setFormRequirements(draft.requirements);
        if (draft.guide) setFormGuide(draft.guide);
        if (draft.zip) setFormZip(draft.zip);
        if (draft.isFeatured !== undefined) setFormIsFeatured(draft.isFeatured);
        if (draft.isFree !== undefined) setFormIsFree(draft.isFree);
        if (draft.game) setFormGame(draft.game);
      }
    } catch (err) {
      console.error('Failed to restore draft from localStorage', err);
    }
  }, []);

  // Auto-save draft on form field changes
  useEffect(() => {
    if (formTitle || formShortDesc || formLongDesc || formZip || formThumbnail !== '/images/products/vehicle-default.jpg') {
      const draft = {
        title: formTitle,
        slug: formSlug,
        shortDesc: formShortDesc,
        longDesc: formLongDesc,
        price: formPrice,
        salePrice: formSalePrice,
        category: formCategory,
        thumbnail: formThumbnail,
        version: formVersion,
        size: formSize,
        requirements: formRequirements,
        guide: formGuide,
        zip: formZip,
        isFeatured: formIsFeatured,
        isFree: formIsFree,
        game: formGame
      };
      localStorage.setItem('gta_hub_admin_draft', JSON.stringify(draft));
    }
  }, [
    formTitle, formSlug, formShortDesc, formLongDesc, formPrice, formSalePrice,
    formCategory, formThumbnail, formVersion, formSize, formRequirements, formGuide,
    formZip, formIsFeatured, formIsFree, formGame
  ]);

  // Auto-fetch file size when the ZIP URL is updated (e.g. pasted Google Drive / Dropbox link)
  useEffect(() => {
    if (!formZip) return;
    if (formZip.startsWith('http://') || formZip.startsWith('https://')) {
      const fetchSize = async () => {
        try {
          const res = await fetch(`/api/admin/fetch-size?url=${encodeURIComponent(formZip)}`);
          const data = await res.json();
          if (res.ok) {
            if (data.size) {
              setFormSize(data.size);
            }
            setFormError('');
          } else {
            setFormError(data.error || 'The secure file link could not be validated. Make sure the file sharing is public!');
          }
        } catch (err) {
          console.error('Failed to auto-fetch file size', err);
        }
      };
      fetchSize();
    }
  }, [formZip]);

  const handleClearDraft = () => {
    if (window.confirm('Are you sure you want to discard your draft and start over?')) {
      localStorage.removeItem('gta_hub_admin_draft');
      setFormTitle('');
      setFormSlug('');
      setFormShortDesc('');
      setFormLongDesc('');
      setFormPrice('19.99');
      setFormSalePrice('');
      setFormRequirements('');
      setFormGuide('All installation instructions are given in the mod zip folder.');
      setFormZip('');
      setFormThumbnail('/images/products/vehicle-default.jpg');
      setFormVersion('1.0.0');
      setFormSize('45 MB');
      setFormIsFeatured(false);
      setFormIsFree(false);
      setFormGame('GTA5');
    }
  };

  useEffect(() => {
    if (activeSubTab === 'manage-products' && token) {
      fetchManageProducts();
    }
  }, [activeSubTab, token]);

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
          <button
            onClick={() => setActiveSubTab('manage-products')}
            className={`rounded px-4 py-2 transition-all ${
              activeSubTab === 'manage-products'
                ? 'bg-brand-green text-black'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Manage Products
          </button>
          <button
            onClick={() => setActiveSubTab('chat-console')}
            className={`rounded px-4 py-2 transition-all ${
              activeSubTab === 'chat-console'
                ? 'bg-brand-green text-black'
                : 'bg-white/5 text-gray-400 hover:text-white'
            }`}
          >
            Chat Console
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
                            <th className="p-4">Gateway & Reference</th>
                            <th className="p-4">Status</th>
                            <th className="p-4 text-right">Actions</th>
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
                              <td className="p-4">
                                <p className="font-bold text-white text-xs uppercase">{o.paymentMethod || 'STRIPE'}</p>
                                {o.paymentIntentId && (
                                  <p className="font-mono text-[11px] text-brand-orange mt-1 select-all font-semibold tracking-wider">{o.paymentIntentId}</p>
                                )}
                              </td>
                              <td className="p-4">
                                <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                                  o.status === 'COMPLETED'
                                    ? 'bg-brand-green/10 border border-brand-green/20 text-brand-green'
                                    : o.status === 'CANCELLED'
                                    ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                                    : 'bg-brand-orange/15 border border-brand-orange/25 text-brand-orange animate-pulse'
                                }`}>
                                  {o.status}
                                </span>
                              </td>
                              <td className="p-4 text-right flex flex-wrap gap-1.5 justify-end items-center">
                                {o.status === 'PENDING' ? (
                                  <>
                                    <button
                                      onClick={() => handleApproveOrder(o.id)}
                                      className="rounded bg-brand-green px-2 py-1 text-[9px] font-bold uppercase text-black hover:bg-opacity-90 transition-all hover:scale-102"
                                    >
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => {
                                        setDenyingOrderId(o.id);
                                        setRejectionReason('Your transaction ID is invalid. Please check and submit the correct payment reference.');
                                      }}
                                      className="rounded bg-brand-orange/15 border border-brand-orange/30 px-2 py-1 text-[9px] font-bold uppercase text-brand-orange hover:bg-brand-orange hover:text-white transition-all hover:scale-102"
                                    >
                                      Deny
                                    </button>
                                    <button
                                      onClick={() => {
                                        setEditingOrderId(o.id);
                                        setEditingTxId(o.paymentIntentId || '');
                                      }}
                                      className="rounded bg-white/5 border border-white/10 px-2 py-1 text-[9px] font-bold uppercase text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:scale-102"
                                    >
                                      Edit ID
                                    </button>
                                    <button
                                      onClick={() => handleCancelOrder(o.id)}
                                      className="rounded bg-red-500/10 border border-red-500/20 px-2 py-1 text-[9px] font-bold uppercase text-red-400 hover:bg-red-600 hover:text-white transition-all hover:scale-102"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : o.status === 'CANCELLED' ? (
                                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Cancelled / Denied</span>
                                ) : (
                                  <span className="text-[10px] text-gray-600 font-bold uppercase">Issued</span>
                                )}
                              </td>
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
                <span>{editingSlug ? `Edit Modification: ${formTitle}` : 'Upload Mod Asset to Database'}</span>
              </h2>

              <form onSubmit={(e) => handleCreateProductSubmit(e, true)} className="space-y-4 text-xs">
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

                {/* Price, Category, and Segment */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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

                  {/* Game Segment Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Game Segment</label>
                    <select
                      value={formGame}
                      onChange={(e) => setFormGame(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none"
                    >
                      <option value="GTA5">GTA V Mods</option>
                      <option value="3D_MODEL">3D Models</option>
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
                {/* Metadata details (Thumbnail, Size, ZIP path) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Thumbnail Cover Image</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        required
                        placeholder="/images/products/vehicle-default.jpg"
                        value={formThumbnail}
                        onChange={(e) => setFormThumbnail(e.target.value)}
                        className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-[11px] text-white focus:border-brand-green focus:outline-none font-mono"
                      />
                      <label className="rounded bg-brand-green px-3 py-2.5 text-[10px] font-bold text-black uppercase cursor-pointer hover:bg-opacity-90 flex-shrink-0 flex items-center justify-center min-w-[70px]">
                        {thumbnailUploading ? '...' : 'Browse'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={thumbnailUploading}
                          onChange={(e) => handleFileUpload(e, 'thumbnail')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Download ZIP Size (Calculated)</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 45 MB"
                      value={formSize}
                      onChange={(e) => setFormSize(e.target.value)}
                      className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-gray-400">Secure ZIP File</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        required
                        placeholder="private_uploads/..."
                        value={formZip}
                        onChange={(e) => setFormZip(e.target.value)}
                        className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-[11px] text-white focus:border-brand-green focus:outline-none font-mono"
                      />
                      <label className="rounded bg-brand-green px-3 py-2.5 text-[10px] font-bold text-black uppercase cursor-pointer hover:bg-opacity-90 flex-shrink-0 flex items-center justify-center min-w-[70px]">
                        {zipUploading ? '...' : 'Browse'}
                        <input
                          type="file"
                          accept=".zip"
                          disabled={zipUploading}
                          onChange={(e) => handleFileUpload(e, 'zip')}
                          className="hidden"
                        />
                      </label>
                    </div>
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

                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    type="submit"
                    className="rounded bg-brand-green px-6 py-3 text-xs font-black uppercase text-black tracking-wider shadow-md hover:bg-opacity-95"
                  >
                    {editingSlug ? 'Update & Publish' : 'Publish Mod to Store'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCreateProductSubmit(e, false)}
                    className="rounded bg-brand-orange px-6 py-3 text-xs font-black uppercase text-white tracking-wider shadow-md hover:bg-opacity-95"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEditOrDiscardDraft}
                    className="rounded border border-white/10 bg-transparent px-6 py-3 text-xs font-black uppercase text-gray-400 hover:bg-white/5"
                  >
                    {editingSlug ? 'Cancel Edit' : 'Discard Draft'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Manage Products Sub Tab */}
          {activeSubTab === 'manage-products' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h2 className="font-display text-sm font-bold uppercase text-white tracking-wider flex items-center space-x-1.5">
                  <Package className="h-4 w-4 text-brand-green" />
                  <span>Manage Catalog Modifications</span>
                </h2>
                <button
                  onClick={fetchManageProducts}
                  className="rounded bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-all uppercase font-bold"
                >
                  Refresh Catalog
                </button>
              </div>

              {manageLoading ? (
                <div className="text-center py-12 text-xs text-gray-500 uppercase tracking-widest animate-pulse">
                  Querying database...
                </div>
              ) : manageProductsList.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-white/5 bg-brand-card/45 text-xs">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-black/40 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="p-4">Asset Title</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Game Segment</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Featured</th>
                        <th className="p-4">Visible</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-gray-300">
                      {manageProductsList.map((p) => (
                        <tr key={p.id} className="hover:bg-white/5">
                          <td className="p-4">
                            <p className="font-bold text-white">{p.title}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{p.slug}</p>
                          </td>
                          <td className="p-4 uppercase font-bold text-gray-400 text-[10px]">
                            {p.category?.name || 'Unassigned'}
                          </td>
                          <td className="p-4 font-bold text-[10px]">
                            <span className={`px-1.5 py-0.5 rounded ${
                              p.game === '3D_MODEL'
                                ? 'bg-brand-orange/15 text-brand-orange border border-brand-orange/20'
                                : 'bg-brand-green/15 text-brand-green border border-brand-green/20'
                            }`}>
                              {p.game === '3D_MODEL' ? '3D Model' : 'GTA Mod'}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-white">
                            {p.isFree ? 'FREE' : `$${p.price.toFixed(2)}`}
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleFeatured(p.slug, p.isFeatured)}
                              className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase transition-all duration-200 ${
                                p.isFeatured
                                  ? 'bg-brand-orange/15 border border-brand-orange/30 text-brand-orange hover:bg-brand-orange hover:text-white hover:scale-105 hover:shadow-md hover:shadow-brand-orange/20'
                                  : 'bg-white/5 border border-transparent text-gray-500 hover:bg-white/10 hover:text-white hover:scale-105'
                              }`}
                            >
                              {p.isFeatured ? 'Featured' : 'Standard'}
                            </button>
                          </td>
                          <td className="p-4">
                            <button
                              onClick={() => handleToggleVisibility(p.slug, p.isVisible)}
                              className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase transition-all duration-200 ${
                                p.isVisible
                                  ? 'bg-brand-green/15 border border-brand-green/30 text-brand-green hover:bg-brand-green hover:text-black hover:scale-105 hover:shadow-md hover:shadow-brand-green/20'
                                  : 'bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500 hover:text-white hover:scale-105 hover:shadow-md hover:shadow-red-500/20'
                              }`}
                            >
                              {p.isVisible ? 'Visible' : 'Hidden'}
                            </button>
                          </td>
                          <td className="p-4 text-right flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleStartEditProduct(p)}
                              className="rounded bg-brand-green/10 border border-brand-green/20 px-3 py-1.5 text-[10px] font-bold uppercase text-brand-green hover:bg-brand-green hover:text-black hover:border-transparent hover:scale-105 hover:shadow-md hover:shadow-brand-green/20 transition-all duration-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p.slug)}
                              className="rounded bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-[10px] font-bold uppercase text-red-400 hover:bg-red-600 hover:text-white hover:border-transparent hover:scale-105 hover:shadow-md hover:shadow-red-500/20 transition-all duration-200"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic py-8 text-center bg-brand-card/25 rounded border border-white/5">
                  No products registered in the database yet.
                </p>
              )}
            </div>
          )}

          {/* Chat Console Sub Tab */}
          {activeSubTab === 'chat-console' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
              {/* Sidebar: Conversation List */}
              <div className="rounded-lg bg-brand-card border border-white/5 p-4 flex flex-col h-full overflow-hidden">
                <h3 className="font-display text-xs font-bold uppercase text-white tracking-widest border-b border-white/5 pb-3 flex items-center space-x-1.5">
                  <MessageSquare className="h-4 w-4 text-brand-green" />
                  <span>Client Conversations</span>
                </h3>
                
                <div className="flex-grow overflow-y-auto mt-4 space-y-2 scrollbar-thin scrollbar-thumb-white/5">
                  {chatListLoading ? (
                    <div className="text-center py-8 text-xs text-gray-500 uppercase tracking-widest animate-pulse">
                      Syncing messages...
                    </div>
                  ) : conversations.length > 0 ? (
                    conversations.map((c) => (
                      <button
                        key={c.userId}
                        onClick={() => setSelectedUserId(c.userId)}
                        className={`w-full rounded p-3 text-left transition-all border text-xs flex flex-col space-y-1.5 ${
                          selectedUserId === c.userId
                            ? 'bg-brand-green/10 border-brand-green/30 text-white'
                            : 'bg-black/25 border-white/5 text-gray-300 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold uppercase truncate max-w-[120px]">{c.fullName}</span>
                          <span className="text-[9px] text-gray-500">
                            {new Date(c.lastMessageTime).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 truncate leading-relaxed italic">
                          {c.isAdminSender ? 'You: ' : ''}{c.lastMessage}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-gray-500 italic py-8 text-center">No active chats in the database.</p>
                  )}
                </div>
              </div>

              {/* Main Panel: Conversation Window */}
              <div className="md:col-span-2 rounded-lg bg-brand-card border border-white/5 flex flex-col h-full overflow-hidden">
                {selectedUserId ? (
                  <>
                    {/* Active Chat Header */}
                    {(() => {
                      const activeConv = conversations.find(c => c.userId === selectedUserId);
                      return (
                        <div className="bg-black/45 px-6 py-3.5 border-b border-white/5 flex justify-between items-center">
                          <div>
                            <h3 className="font-display font-bold text-white text-xs uppercase">
                              {activeConv?.fullName || 'Client Thread'}
                            </h3>
                            <p className="text-[10px] text-gray-500 mt-0.5">{activeConv?.email}</p>
                          </div>
                          <span className="text-[9px] text-brand-green font-bold uppercase tracking-wider">Connected</span>
                        </div>
                      );
                    })()}

                    {/* Chat Messages Log */}
                    <div className="flex-grow overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
                      {chatMessages.length > 0 ? (
                        chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${msg.isAdmin ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className={`max-w-[75%] rounded px-3.5 py-2 text-xs leading-relaxed ${
                                msg.isAdmin
                                  ? 'bg-brand-green text-black font-medium'
                                  : 'bg-white/5 text-gray-300 border border-white/5'
                              }`}
                            >
                              {msg.message}
                            </div>
                            <span className="text-[8px] text-gray-600 mt-1 px-1">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-gray-500 italic py-12 text-center">No messages logged in this thread.</p>
                      )}
                    </div>

                    {/* Chat Input Footer */}
                    <form onSubmit={handleSendReply} className="p-4 bg-black/25 border-t border-white/5 flex gap-3">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type reply to client..."
                        className="flex-grow rounded bg-black/60 border border-white/10 px-4 py-2.5 text-xs text-white focus:border-brand-green focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className="rounded bg-brand-green px-5 text-black hover:bg-opacity-95 disabled:opacity-50 transition-colors flex items-center justify-center font-bold text-xs uppercase cursor-pointer space-x-1.5"
                      >
                        <Send className="h-3.5 w-3.5" />
                        <span>Send</span>
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 space-y-2">
                    <MessageSquare className="h-10 w-10 text-gray-600 animate-bounce" />
                    <h3 className="font-display font-bold text-gray-500 uppercase text-xs tracking-wider">No Selected Thread</h3>
                    <p className="text-[10px] text-gray-500 max-w-[240px] leading-relaxed">
                      Select a customer conversation from the list to read history and send immediate responses.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modals for Rejection & TxID editing */}
      {denyingOrderId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-brand-card p-6 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase text-white tracking-wider">Deny / Reject Order</h3>
            <p className="text-xs text-gray-400">Specify the rejection reason. The customer will see this message in their dashboard.</p>
            
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Your transaction ID is invalid. Please contact support."
              className="w-full rounded bg-black/60 border border-white/10 p-3 text-xs text-white focus:border-brand-orange focus:outline-none min-h-[80px]"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setDenyingOrderId(null)}
                className="rounded border border-white/10 px-4 py-2 text-xs font-bold uppercase text-gray-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDenyOrder(denyingOrderId, rejectionReason)}
                className="rounded bg-brand-orange px-4 py-2 text-xs font-bold uppercase text-white hover:bg-opacity-95"
              >
                Confirm Deny
              </button>
            </div>
          </div>
        </div>
      )}

      {editingOrderId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-brand-card p-6 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase text-white tracking-wider">Edit Transaction ID</h3>
            <p className="text-xs text-gray-400">Enter the corrected Transaction Reference (UTR/TxID) for this manual payment.</p>
            
            <input
              type="text"
              value={editingTxId}
              onChange={(e) => setEditingTxId(e.target.value)}
              placeholder="Enter new transaction ID"
              className="w-full rounded bg-black/60 border border-white/10 px-3 py-2 text-xs text-white focus:border-brand-green focus:outline-none"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setEditingOrderId(null)}
                className="rounded border border-white/10 px-4 py-2 text-xs font-bold uppercase text-gray-400 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateOrderTxId(editingOrderId, editingTxId)}
                className="rounded bg-brand-green px-4 py-2 text-xs font-bold uppercase text-black hover:bg-opacity-95"
              >
                Save Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
