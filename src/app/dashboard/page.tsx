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

  // New ticket form states
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSuccess, setTicketSuccess] = useState(false);
  const [ticketError, setTicketError] = useState('');

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
          // 1. Fetch user orders
          const ordersRes = await fetch('/api/orders/user', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Note: since we haven't written user-specific subroutes, we can write inline fetches 
          // or run custom database queries. Let's create user-specific API fetches.
          // Alternatively, we can fetch all orders and filter client-side, or create a quick unified endpoint.
          // Let's create `/api/auth/dashboard` on the backend which returns everything in one query!
          // That is a much cleaner way to aggregate client dashboard data!
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

  if (authLoading || !isAuthenticated) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center text-xs text-gray-500 uppercase tracking-widest">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-green border-t-transparent mb-4"></div>
        <div>Configuring account nodes...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
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

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Navigation Sidebar */}
        <div className="space-y-2 lg:col-span-1">
          {[
            { id: 'downloads', label: 'My Downloads', icon: Download },
            { id: 'orders', label: 'Order History', icon: ShoppingBag },
            { id: 'support', label: 'Support Tickets', icon: HelpCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-3 py-2.5 rounded text-xs font-bold uppercase transition-all flex items-center space-x-2.5 ${
                  activeTab === tab.id
                    ? 'bg-brand-green/10 text-brand-green border-l-2 border-brand-green'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-12 text-xs text-gray-500 uppercase tracking-widest animate-pulse">
              Aggregating files...
            </div>
          ) : (
            <>
              {/* Downloads Tab */}
              {activeTab === 'downloads' && (
                <div className="space-y-4">
                  <h2 className="font-display text-sm font-bold uppercase text-white tracking-wider border-b border-white/5 pb-2">
                    Digital Product Library
                  </h2>
                  
                  {downloads.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {downloads.map((item) => {
                        const expired = new Date() > new Date(item.expiresAt);
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
                              <p className="text-[10px] text-gray-500 mt-0.5">
                                Expires: {new Date(item.expiresAt).toLocaleString()}
                              </p>
                            </div>
                            
                            {expired ? (
                              <span className="rounded bg-brand-orange/10 border border-brand-orange/20 px-3 py-1 text-[10px] font-bold text-brand-orange uppercase">
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
                    <p className="text-xs text-gray-500 italic py-6">
                      You haven't purchased any products yet or download keys are not active.
                    </p>
                  )}
                </div>
              )}

              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  <h2 className="font-display text-sm font-bold uppercase text-white tracking-wider border-b border-white/5 pb-2">
                    Order Transactions history
                  </h2>

                  {orders.length > 0 ? (
                    <div className="overflow-x-auto rounded-lg border border-white/5 bg-brand-card/45 text-xs">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="border-b border-white/5 bg-black/40 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            <th className="p-4">Order Number</th>
                            <th className="p-4">Date</th>
                            <th className="p-4">Gateway</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-gray-300">
                          {orders.map((o) => (
                            <tr key={o.id} className="hover:bg-white/5">
                              <td className="p-4 font-mono font-bold text-white uppercase">{o.orderNumber}</td>
                              <td className="p-4">{new Date(o.createdAt).toLocaleDateString()}</td>
                              <td className="p-4 font-mono">{o.paymentMethod}</td>
                              <td className="p-4 text-brand-green font-bold">${o.netAmount.toFixed(2)}</td>
                              <td className="p-4">
                                <span className="rounded bg-brand-green/10 border border-brand-green/20 px-2 py-0.5 text-[10px] font-bold text-brand-green uppercase">
                                  {o.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 italic py-6">No order transaction receipts found.</p>
                  )}
                </div>
              )}

              {/* Support Tickets Tab */}
              {activeTab === 'support' && (
                <div className="space-y-6">
                  <h2 className="font-display text-sm font-bold uppercase text-white tracking-wider border-b border-white/5 pb-2">
                    Helpdesk Support tickets
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Submit ticket form */}
                    <div className="rounded-lg bg-brand-card border border-white/5 p-4 space-y-4 self-start">
                      <h3 className="text-xs font-bold uppercase text-white tracking-wide flex items-center space-x-1.5">
                        <PlusCircle className="h-4 w-4 text-brand-green" />
                        <span>Open New Ticket</span>
                      </h3>

                      <form onSubmit={handleTicketSubmit} className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Subject Topic</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. pent-house interior stream error"
                            value={ticketSubject}
                            onChange={(e) => setTicketSubject(e.target.value)}
                            className="w-full rounded bg-black/60 border border-white/10 px-3 py-2 text-xs text-white focus:border-brand-green focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold uppercase text-gray-400">Detailed Message</label>
                          <textarea
                            rows={3}
                            required
                            placeholder="Describe your issue with FiveM setup..."
                            value={ticketMessage}
                            onChange={(e) => setTicketMessage(e.target.value)}
                            className="w-full rounded bg-black/60 border border-white/10 p-3 text-xs text-white focus:border-brand-green focus:outline-none"
                          />
                        </div>

                        {ticketError && <p className="text-xs font-bold text-brand-orange">{ticketError}</p>}
                        {ticketSuccess && <p className="text-xs font-bold text-brand-green">Ticket submitted successfully!</p>}

                        <button
                          type="submit"
                          className="rounded bg-brand-green px-4 py-2 text-xs font-bold text-black uppercase hover:bg-opacity-95"
                        >
                          Submit Ticket
                        </button>
                      </form>
                    </div>

                    {/* Past tickets list */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold uppercase text-white tracking-wide flex items-center space-x-1.5">
                        <MessageCircle className="h-4 w-4 text-brand-orange" />
                        <span>Support History</span>
                      </h3>

                      {tickets.length > 0 ? (
                        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                          {tickets.map((t) => (
                            <div key={t.id} className="rounded bg-brand-card/45 border border-white/5 p-3 text-xs">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-white truncate max-w-[180px]">{t.subject}</span>
                                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                                  t.status === 'OPEN'
                                    ? 'bg-brand-orange/10 text-brand-orange border border-brand-orange/20'
                                    : 'bg-brand-green/10 text-brand-green border border-brand-green/20'
                                }`}>
                                  {t.status}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">{t.message}</p>
                              <span className="text-[10px] text-gray-500 mt-2 block">
                                {new Date(t.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">No tickets have been filed yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
