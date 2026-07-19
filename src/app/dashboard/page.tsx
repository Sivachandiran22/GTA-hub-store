'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Download, 
  ShoppingBag, 
  HelpCircle, 
  User as UserIcon, 
  ExternalLink,
  PlusCircle,
  MessageCircle,
  Calendar
} from 'lucide-react';

interface DownloadItem {
  id: string;
  token: string;
  expiresAt: string;
  downloadsCount: number;
  product: { title: string; version: string; downloadSize: string; slug: string };
}

interface OrderItem {
  id: string;
  orderNumber: string;
  netAmount: number;
  paymentMethod: string;
  paymentIntentId?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  status: string;
}

interface SupportTicketType {
  id: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export default function UserDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<'downloads' | 'orders' | 'support'>('downloads');
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Real-time ticking interval for live countdowns and dynamic state transitions
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRemainingTimeStr = (expiresAtStr: string) => {
    const expiry = new Date(expiresAtStr);
    const diff = expiry.getTime() - now.getTime();
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return `${hours}h ${minutes}m ${seconds}s remaining`;
  };

  // New ticket form states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketError, setTicketError] = useState('');

  // Customer Edit Reference states
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingTxId, setEditingTxId] = useState('');
  const [submittingTxId, setSubmittingTxId] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && token) {
      const fetchDashboardData = async () => {
        setLoading(true);
        try {
          const dashboardRes = await fetch('/api/auth/dashboard-details', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const dashboardData = await dashboardRes.json();
          if (dashboardRes.ok) {
            setDownloads(dashboardData.downloads || []);
            setOrders(dashboardData.orders || []);
            setTickets(dashboardData.tickets || []);
          }
        } catch (err) {
          console.error('Failed to load dashboard telemetry', err);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [isAuthenticated, authLoading, token, router]);

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setTicketError('');
    setTicketSuccess(false);

    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: ticketSubject,
          message: ticketMessage
        })
      });

      const data = await res.json();
      if (res.ok) {
        setTicketSuccess(true);
        setTicketSubject('');
        setTicketMessage('');
        // Append ticket locally
        setTickets(prev => [data.ticket, ...prev]);
      } else {
        setTicketError(data.message || 'Failed to submit ticket');
      }
    } catch (err) {
      setTicketError('Connection error occurred');
    }
  };

  const handleUserUpdateTxId = async (orderId: string, transactionId: string) => {
    if (!transactionId.trim() || submittingTxId) return;
    setSubmittingTxId(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/user-update-txid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ transactionId })
      });
      const data = await res.json();
      if (res.ok) {
        setOrders(prev =>
          prev.map(o => (o.id === orderId ? { ...o, paymentIntentId: transactionId, status: data.status, rejectionReason: null } : o))
        );
        setEditingOrderId(null);
        alert('Your payment reference has been updated and resubmitted successfully! The operator will review it shortly.');
      } else {
        alert(data.message || 'Failed to update reference');
      }
    } catch (err) {
      console.error('Failed to update reference', err);
      alert('Connection error occurred');
    } finally {
      setSubmittingTxId(false);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-xs text-gray-500 uppercase tracking-widest">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent mb-4"></div>
        <div>Configuring account nodes...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Welcome Banner */}
      <div className="rounded-lg bg-brand-card border border-white/5 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-green/10 text-brand-green">
            <UserIcon className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-lg font-black text-white uppercase">{user?.fullName}</h1>
            <p className="text-xs text-gray-500">{user?.email} | Role: {user?.role}</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/5 text-xs font-bold uppercase tracking-wider gap-4">
        <button
          onClick={() => setActiveTab('downloads')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'downloads'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Downloads Library
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'orders'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Payment Registry
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`pb-3 border-b-2 transition-all ${
            activeTab === 'support'
              ? 'border-brand-green text-brand-green'
              : 'border-transparent text-gray-500 hover:text-white'
          }`}
        >
          Support Center
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'downloads' && (
        <div className="space-y-4">
          <h2 className="font-display text-sm font-bold uppercase text-white tracking-wider border-b border-white/5 pb-2 flex items-center space-x-2">
            <Download className="h-4 w-4 text-brand-green" />
            <span>Digital Product Library</span>
          </h2>
          
          {loading ? (
            <div className="text-center py-12 text-xs text-gray-500 uppercase tracking-widest animate-pulse">
              Aggregating files...
            </div>
          ) : downloads.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {downloads.map((item) => {
                const expired = now > new Date(item.expiresAt);
                const remainingStr = getRemainingTimeStr(item.expiresAt);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-lg bg-brand-card/60 border border-white/5 p-4 gap-4"
                  >
                    <div>
                      <h3 className="font-display font-bold text-sm text-white uppercase">
                        {item.product.title}
                      </h3>
                      <p className="text-[10px] text-gray-500 mt-1">
                        Version: {item.product.version} | Size: {item.product.downloadSize}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Expires: {new Date(item.expiresAt).toLocaleString()} ({expired ? 'Expired' : remainingStr})
                      </p>
                    </div>
                    
                    {expired ? (
                      <span className="rounded bg-white/5 border border-white/10 px-3 py-1 text-[10px] font-bold text-gray-500 uppercase select-none">
                        Link Expired
                      </span>
                    ) : (
                      <a
                        href={`/api/downloads/${item.token}`}
                        className="rounded bg-brand-green px-4 py-2 text-xs font-black uppercase text-black hover:bg-opacity-90 flex items-center space-x-1.5"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Get ZIP file</span>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic py-8 text-center bg-brand-card/25 border border-dashed border-white/10 rounded-lg">
              You haven't purchased any products yet or download keys are not active.
            </p>
          )}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="space-y-4">
          <h2 className="font-display text-sm font-bold uppercase text-white tracking-wider border-b border-white/5 pb-2 flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4 text-brand-green" />
            <span>Payment Registry & Orders</span>
          </h2>

          {loading ? (
            <div className="text-center py-12 text-xs text-gray-500 uppercase tracking-widest animate-pulse">
              Aggregating registry...
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg bg-brand-card/60 border border-white/5 p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-mono font-bold text-white text-sm">{o.orderNumber}</span>
                      <span className="text-[10px] text-gray-500 ml-2">({new Date(o.createdAt).toLocaleDateString()})</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-brand-green">${o.netAmount.toFixed(2)}</span>
                      <span className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                        o.status === 'COMPLETED'
                          ? 'bg-brand-green/10 border border-brand-green/20 text-brand-green'
                          : o.status === 'CANCELLED'
                          ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                          : 'bg-brand-orange/15 border border-brand-orange/20 text-brand-orange animate-pulse'
                      }`}>
                        {o.status}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-gray-400">
                    <p>Gateway: <strong className="text-white uppercase">{o.paymentMethod}</strong></p>
                    <div className="flex items-center space-x-2">
                      {o.paymentIntentId ? (
                        <p>Reference UTR: <strong className="font-mono text-brand-orange select-all">{o.paymentIntentId}</strong></p>
                      ) : (
                        <p className="text-brand-orange italic font-semibold">UTR ID Missing</p>
                      )}
                      {o.status !== 'COMPLETED' && (
                        <button
                          onClick={() => {
                            setEditingOrderId(o.id);
                            setEditingTxId(o.paymentIntentId || '');
                          }}
                          className="rounded bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 text-[9px] font-bold uppercase text-brand-green hover:bg-brand-green hover:text-black transition-all hover:scale-102"
                        >
                          Edit Reference
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Display rejection reason alert box if cancelled and reason exists */}
                  {o.status === 'CANCELLED' && o.rejectionReason && (
                    <div className="rounded border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400 space-y-1">
                      <p className="font-bold uppercase tracking-wider text-[9px] flex items-center space-x-1">
                        <span>⚠️ Payment Rejection Notice</span>
                      </p>
                      <p className="italic leading-relaxed">{o.rejectionReason}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic py-8 text-center bg-brand-card/25 border border-dashed border-white/10 rounded-lg">
              No payments logged in order history.
            </p>
          )}
        </div>
      )}

      {activeTab === 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Submit ticket form */}
          <div className="md:col-span-2 rounded-lg bg-brand-card/60 border border-white/5 p-6 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase text-white tracking-wider flex items-center space-x-1.5 border-b border-white/5 pb-2">
              <PlusCircle className="h-4 w-4 text-brand-green" />
              <span>Open Support Ticket</span>
            </h3>

            <form onSubmit={handleTicketSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Installation help, custom request"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-white focus:border-brand-green focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Message Description</label>
                <textarea
                  required
                  placeholder="Explain your issue in detail..."
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  className="w-full rounded bg-black/60 border border-white/10 p-3 text-white focus:border-brand-green focus:outline-none min-h-[100px]"
                />
              </div>

              {ticketError && (
                <p className="text-xs text-brand-orange font-bold uppercase tracking-wider">{ticketError}</p>
              )}
              {ticketSuccess && (
                <p className="text-xs text-brand-green font-bold uppercase tracking-wider">Ticket submitted successfully! We will get back to you shortly.</p>
              )}

              <button
                type="submit"
                className="rounded bg-brand-green px-5 py-2.5 text-xs font-black uppercase text-black tracking-wider hover:bg-opacity-95"
              >
                Submit Ticket
              </button>
            </form>
          </div>

          {/* Past tickets log */}
          <div className="space-y-4">
            <h3 className="font-display text-sm font-bold uppercase text-white tracking-wider flex items-center space-x-1.5 border-b border-white/5 pb-2">
              <MessageCircle className="h-4 w-4 text-brand-green" />
              <span>Past Tickets</span>
            </h3>

            {tickets.length > 0 ? (
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div key={t.id} className="rounded bg-brand-card/30 border border-white/5 p-3.5 space-y-1">
                    <p className="font-bold text-white text-xs truncate uppercase">{t.subject}</p>
                    <p className="text-[10px] text-gray-400 line-clamp-2">{t.message}</p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[9px] text-gray-500">{new Date(t.createdAt).toLocaleDateString()}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ${
                        t.status === 'RESOLVED'
                          ? 'bg-brand-green/10 text-brand-green'
                          : t.status === 'CLOSED'
                          ? 'bg-white/5 text-gray-500'
                          : 'bg-brand-orange/15 text-brand-orange animate-pulse'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic py-4 text-center">No past tickets found.</p>
            )}
          </div>
        </div>
      )}

      {/* Edit Reference Modal */}
      {editingOrderId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-lg border border-white/10 bg-brand-card p-6 space-y-4">
            <h3 className="font-display text-sm font-bold uppercase text-white tracking-wider">Update Transaction Reference</h3>
            <p className="text-xs text-gray-400">Enter your payment Reference Number (UTR / TxID / Receipt ID) so the operator can verify your payment.</p>
            
            <input
              type="text"
              value={editingTxId}
              onChange={(e) => setEditingTxId(e.target.value)}
              placeholder="e.g. 123456789012"
              className="w-full rounded bg-black/60 border border-white/10 px-3 py-2.5 text-xs text-white focus:border-brand-green focus:outline-none"
            />

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setEditingOrderId(null)}
                disabled={submittingTxId}
                className="rounded border border-white/10 px-4 py-2 text-xs font-bold uppercase text-gray-400 hover:bg-white/5 hover:text-white transition-all duration-200 disabled:opacity-30 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUserUpdateTxId(editingOrderId, editingTxId)}
                disabled={submittingTxId || !editingTxId.trim()}
                className="rounded bg-brand-green px-4 py-2 text-xs font-bold uppercase text-black hover:bg-opacity-80 hover:scale-102 hover:shadow-lg hover:shadow-brand-green/20 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none flex items-center justify-center space-x-1.5 cursor-pointer"
              >
                {submittingTxId ? (
                  <>
                    <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black border-t-transparent mr-1"></span>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Reference</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
