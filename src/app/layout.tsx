
"use client";

import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from '@/context/language-context';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { AppBody } from './app-body';
import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Script from 'next/script';
import Image from 'next/image';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

function SiteLoader() {
  return (
    <div className="loader-container">
      <div className="loader-logo">
        <Image 
          src="https://raw.githubusercontent.com/akm12109/assets_vanu/main/logo.png" 
          alt="Vanu Marketplace Logo" 
          width={120} 
          height={120} 
        />
      </div>
      <p className="loader-text">Switching to Vanu Marketplace...</p>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteSettings, setSiteSettings] = useState({ status: 'live' });
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const settingsRef = doc(db, "siteSettings", "lockState");
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setSiteSettings({ status: docSnap.data().websiteStatus || 'live' });
      }
      // Delay to show loader, increased for animation
      setTimeout(() => setLoading(false), 2500); 
    }, (error) => {
      console.error("Failed to load site settings, proceeding anyway.", error);
      setTimeout(() => setLoading(false), 2500);
    });
    return () => unsubscribe();
  }, []);

  const isExempted = 
    pathname.startsWith('/admin') || 
    pathname.startsWith('/dev') || 
    pathname.startsWith('/maintenance') ||
    pathname === '/employee-login' || 
    pathname === '/customer-login' ||
    pathname === '/register' ||
    pathname === '/forgot-password';

  if (!loading && siteSettings.status !== 'live' && !isExempted) {
    router.push(`/maintenance?status=${siteSettings.status}`);
    return (
       <html lang="en" className="scroll-smooth">
         <head>
          <title>Site Unavailable</title>
        </head>
        <body>
           <div className="flex min-h-screen flex-col items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary"/>
                <p className="mt-2 text-muted-foreground">Redirecting...</p>
           </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className={`${inter.variable} scroll-smooth`}>
      <head>
        <title>Vanu Marketplace</title>
        <meta name="description" content="Vanu Marketplace - The future of B2B for organic agricultural products." />
        <link rel="icon" href="https://raw.githubusercontent.com/akm12109/assets_vanu/main/logo.png" sizes="any" />
      </head>
      <LanguageProvider>
        <CartProvider>
          <WishlistProvider>
            <AppBody>
              {loading && <SiteLoader />}
              <div className={`transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}>
                {children}
              </div>
              <Toaster />
            </AppBody>
          </WishlistProvider>
        </CartProvider>
      </LanguageProvider>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
    </html>
  );
}
