
"use client"

import React from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { ProductCard } from "@/components/product-card";
import { useState, useEffect } from "react";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { staggeredListVariants, staggeredItemVariants } from '@/components/motion-wrapper';
import { HeroSlideshow } from "@/components/hero-slideshow";

interface Product {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  imageHover?: string;
  aiHint?: string;
  category?: string;
  categoryName?: string;
  featured?: boolean;
  status: 'Active' | 'Draft';
}

export default function Home() {
  const { translations } = useLanguage();
  const t = translations.home; 
  
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setLoading(true);
      try {
        const productsQuery = query(collection(db, 'products'), where('status', '==', 'Active'), where('featured', '==', true), limit(8));
        const productsSnapshot = await getDocs(productsQuery);
        const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchFeaturedProducts();
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Full-screen Hero Slideshow */}
        <section className="h-screen w-full relative">
            <HeroSlideshow />
        </section>

        {/* Featured Products Section */}
        <section id="featured-products" className="py-16 md:py-24 bg-background">
            <div className="container mx-auto px-4 md:px-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
                <div>
                  <h2 className="text-3xl font-bold font-headline tracking-tight">Featured Products</h2>
                  <p className="mt-2 text-muted-foreground">Hand-picked selections for our B2B partners.</p>
                </div>
                <Link href="/products" className="mt-4 md:mt-0">
                    <Button variant="outline">View All Products <ArrowRight className="ml-2"/></Button>
                </Link>
              </div>
               <motion.div 
                    variants={staggeredListVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.1 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <motion.div key={i} variants={staggeredItemVariants}>
                          <div className="space-y-2">
                              <div className="h-64 w-full bg-muted rounded-lg animate-pulse"></div>
                              <div className="h-6 w-3/4 bg-muted rounded animate-pulse"></div>
                              <div className="h-4 w-1/2 bg-muted rounded animate-pulse"></div>
                          </div>
                      </motion.div>
                    ))
                  ) : (
                    products.map(product => 
                      <motion.div key={product.id} variants={staggeredItemVariants}>
                        <ProductCard product={product} />
                      </motion.div>
                    )
                  )}
              </motion.div>
            </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
