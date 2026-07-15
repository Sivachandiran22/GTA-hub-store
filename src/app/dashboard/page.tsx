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
                    <span className="rounded bg-red-500/10 border border-red-500/25 px-3 py-1 text-[10px] font-bold text-red-400 uppercase select-none">
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
    </div>
  );
}
