'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Product {
  id: string;
  title: string;
  slug: string;
  price: number;
  salePrice: number | null;
  thumbnailUrl: string;
  category: { name: string; slug: string };
  downloadSize?: string;
  version?: string;
}

interface CartItem {
  product: Product;
}

interface Coupon {
  code: string;
  discountPercentage: number;
}

interface CartContextType {
  cart: CartItem[];
  coupon: Coupon | null;
  couponError: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  cartCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage
  useEffect(() => {
    const storedCart = localStorage.getItem('gta_hub_cart');
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (e) {
        console.error('Failed to parse cart data', e);
      }
    }
    const storedCoupon = localStorage.getItem('gta_hub_coupon');
    if (storedCoupon) {
      try {
        setCoupon(JSON.parse(storedCoupon));
      } catch (e) {
        console.error('Failed to parse coupon data', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('gta_hub_cart', JSON.stringify(cart));
    }
  }, [cart, isLoaded]);

  // Save coupon to localStorage
  useEffect(() => {
    if (isLoaded) {
      if (coupon) {
        localStorage.setItem('gta_hub_coupon', JSON.stringify(coupon));
      } else {
        localStorage.removeItem('gta_hub_coupon');
      }
    }
  }, [coupon, isLoaded]);

  const addToCart = (product: Product) => {
    if (!isInCart(product.id)) {
      setCart((prev) => [...prev, { product }]);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCoupon(null);
  };

  const isInCart = (productId: string) => {
    return cart.some((item) => item.product.id === productId);
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    setCouponError(null);
    try {
      const res = await fetch(`/api/coupons/validate?code=${code}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setCoupon({
          code: data.code,
          discountPercentage: data.discountPercentage,
        });
        return true;
      } else {
        setCouponError(data.message || 'Invalid coupon code');
        return false;
      }
    } catch (err) {
      setCouponError('Error validating coupon');
      return false;
    }
  };

  const removeCoupon = () => {
    setCoupon(null);
    setCouponError(null);
  };

  const cartCount = cart.length;

  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.salePrice !== null ? item.product.salePrice : item.product.price;
    return sum + price;
  }, 0);

  const discountAmount = coupon ? (subtotal * coupon.discountPercentage) / 100 : 0;
  const taxAmount = (subtotal - discountAmount) * 0.08; // 8% sales tax simulation
  const total = subtotal - discountAmount + taxAmount;

  return (
    <CartContext.Provider
      value={{
        cart,
        coupon,
        couponError,
        applyCoupon,
        removeCoupon,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        cartCount,
        subtotal,
        discountAmount,
        taxAmount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
