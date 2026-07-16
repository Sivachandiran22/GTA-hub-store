'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, X, Send } from 'lucide-react';

interface Message {
  id: string;
  isAdmin: boolean;
  message: string;
  createdAt: string;
}

export default function ChatWidget() {
  const { token, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch messages from backend
  const fetchMessages = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/chat', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch chat messages:', err);
    }
  };

  // Load chat on opening
  useEffect(() => {
    if (isOpen && isAuthenticated && token) {
      fetchMessages();
      
      // Start polling for new admin replies every 5 seconds
      pollingRef.current = setInterval(fetchMessages, 5000);
    } else {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [isOpen, isAuthenticated, token]);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !token || loading) return;

    const messageText = inputText.trim();
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: messageText })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, data.message]);
      } else {
        alert(data.message || 'Failed to send message');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setLoading(false);
    }
  };

  // Hide completely for unauthenticated visitors
  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-brand-green text-black shadow-lg shadow-brand-green/20 hover:scale-105 hover:shadow-brand-green/40 transition-all cursor-pointer"
        aria-label="Toggle Live Chat"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6 animate-pulse-glow" />}
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[60] w-[340px] sm:w-[380px] h-[480px] rounded-lg border border-white/10 bg-brand-card/95 backdrop-blur-md shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200">
          {/* Header */}
          <div className="bg-black/40 px-4 py-3.5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-green"></span>
              </span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">Live Operator Help</h4>
                <p className="text-[9px] text-gray-500 mt-0.5">Chat history kept for 30 days</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Message Thread Log */}
          <div className="flex-grow overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent">
            {messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.isAdmin ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded px-3.5 py-2 text-xs leading-relaxed ${
                      msg.isAdmin
                        ? 'bg-white/5 text-gray-300 border border-white/5'
                        : 'bg-brand-green text-black font-medium'
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
              <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-2">
                <MessageSquare className="h-8 w-8 text-gray-600 animate-pulse" />
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Start a Conversation</p>
                <p className="text-[10px] text-gray-500 leading-relaxed max-w-[200px]">
                  Send a message below and an administrator will get back to you shortly.
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <form onSubmit={handleSendMessage} className="p-3 bg-black/20 border-t border-white/5 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message..."
              className="flex-grow rounded bg-black/60 border border-white/10 px-3.5 py-2 text-xs text-white focus:border-brand-green focus:outline-none"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="rounded bg-brand-green px-3.5 text-black hover:bg-opacity-90 disabled:opacity-50 transition-colors flex items-center justify-center cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
