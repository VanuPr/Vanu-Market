
"use client";

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  imageHover?: string;
  aiHint?: string;
}

interface WishlistContextType {
  wishlist: Product[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  wishlistCount: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // You can also persist wishlist to localStorage here
  }, [wishlist]);

  const addToWishlist = (product: Product) => {
    setWishlist((prevWishlist) => {
      if (prevWishlist.find(item => item.id === product.id)) {
        return prevWishlist; // Already in wishlist
      }
      return [...prevWishlist, product];
    });
    toast({
        title: "Added to wishlist",
        description: `${product.name} has been added to your wishlist.`,
    })
  };

  const removeFromWishlist = (productId: string) => {
    setWishlist((prevWishlist) => prevWishlist.filter((item) => item.id !== productId));
     toast({
        title: "Removed from wishlist",
        description: `The item has been removed from your wishlist.`,
    })
  };
  
  const isInWishlist = (productId: string) => {
      return wishlist.some(item => item.id === productId);
  }

  const wishlistCount = wishlist.length;

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, wishlistCount }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
