'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Calendar, User, BookOpen } from 'lucide-react';

interface BlogPostType {
  id: string;
  title: string;
  slug: string;
  content: string;
  author: string;
  category: string;
  imageUrl: string | null;
  publishedAt: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPostType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await fetch('/api/blogs');
        const data = await res.json();
        if (res.ok) {
          setPosts(data.posts || []);
        }
      } catch (err) {
        console.error('Failed to fetch blog posts', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header title */}
      <div>
        <h1 className="font-display text-2xl font-black uppercase text-white tracking-wider flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-brand-green" />
          <span>Guides & Tutorials</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Learn how to install peds, configure handling physics, and optimize your FiveM servers.
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-500 uppercase tracking-widest animate-pulse">
          Loading tutorials...
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <article
              key={post.id}
              className="flex flex-col rounded-lg bg-brand-card/70 border border-white/5 overflow-hidden group hover:border-brand-green/20 transition-all duration-300"
            >
              {/* Cover image */}
              <div className="aspect-video w-full overflow-hidden bg-gray-900 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                <img
                  src={post.imageUrl || ''}
                  alt={post.title}
                  className="h-full w-full object-cover group-hover:scale-102 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&auto=format&fit=crop';
                  }}
                />
                <span className="absolute bottom-4 left-4 rounded bg-brand-orange px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider z-20">
                  {post.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 text-[10px] text-gray-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{new Date(post.publishedAt).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <User className="h-3.5 w-3.5" />
                      <span>{post.author}</span>
                    </span>
                  </div>
                  <h2 className="font-display text-base font-bold text-white group-hover:text-brand-green transition-colors leading-snug">
                    {post.title}
                  </h2>
                  <p className="text-xs text-gray-400 leading-relaxed line-clamp-3">
                    {post.content}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5">
                  <span className="text-xs font-bold text-brand-green group-hover:underline flex items-center space-x-1 cursor-pointer">
                    <span>Read Tutorial</span>
                    <span>→</span>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 italic py-12 text-center">No tutorials posted yet.</p>
      )}
    </div>
  );
}
