
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Loader2, Minus, Plus, Heart, Share2, Leaf, Drumstick, PackageX, ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/context/language-context';

interface Product {
  id: string;
  name: string;
  price: number;
  mrp: number;
  category: string;
  image: string;
  imageHover?: string;
  image2?: string;
  image3?: string;
  description: string;
  ingredients: string;
  productInfo: string;
  stock?: number;
  minOrderQty?: number;
  productType: 'vegetarian' | 'non-vegetarian' | 'vegan' | 'uses_dead_animals';
}

export default function ProductDetailPage() {
  const params = useParams();
  const { id } = params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const { toast } = useToast();
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { translations } = useLanguage();
  const t = translations.productDetailPage;

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docRef = doc(db, 'products', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const productData = { id: docSnap.id, ...docSnap.data() } as Product;
          setProduct(productData);
          setMainImage(productData.image);
          setQuantity(productData.minOrderQty || 1);
        } else {
          toast({ variant: 'destructive', title: 'Product not found' });
        }
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching product' });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, toast]);
  
  const handleAddToCart = () => {
    if (product) {
      const cartProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        quantity: quantity,
        stock: product.stock
      };
      addToCart(cartProduct, quantity);
    }
  };

  const handleWishlistToggle = () => {
      if (!product) return;
      if (isInWishlist(product.id)) {
          removeFromWishlist(product.id);
      } else {
          addToWishlist(product);
      }
  }

  const productTypeInfo = {
    vegetarian: {
        icon: <Leaf className="w-5 h-5 text-green-600" />,
        text: t.vegetarian,
        className: 'text-green-600'
    },
    'non-vegetarian': {
        icon: <Drumstick className="w-5 h-5 text-red-600" />,
        text: t['non-vegetarian'],
        className: 'text-red-600'
    },
    vegan: {
        icon: <Leaf className="w-5 h-5 text-green-500" />,
        text: t.vegan,
        className: 'text-green-500'
    },
    uses_dead_animals: {
        icon: <Drumstick className="w-5 h-5 text-gray-500" />,
        text: t.uses_dead_animals,
        className: 'text-gray-600'
    }
  }

  const thumbnailImages = useMemo(() => {
    if (!product) return [];
    return [
      product.image,
      product.imageHover,
      product.image2,
      product.image3,
    ].filter((img): img is string => !!img && typeof img === 'string' && img.length > 0);
  }, [product]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <p>Product not found.</p>
      </div>
    );
  }
  
  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const currentTypeInfo = productTypeInfo[product.productType || 'vegetarian'];
  const discount = product.mrp && product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
  const isWishlisted = isInWishlist(product.id);
  const minQty = product.minOrderQty || 1;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-12 md:py-20">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
            
            {/* Image Gallery */}
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square w-full overflow-hidden rounded-lg border">
                <Image src={mainImage} alt={product.name} layout="fill" objectFit="cover" className="transition-opacity duration-300" />
                 {discount > 0 && !isOutOfStock && (
                    <Badge variant="destructive" className="absolute top-3 left-3 text-base">
                        {discount}% OFF
                    </Badge>
                )}
                 {isOutOfStock && (
                    <Badge variant="secondary" className="absolute top-3 left-3 text-destructive border-destructive">
                        Out of Stock
                    </Badge>
                )}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {thumbnailImages.map((img, index) => (
                    <div 
                        key={index} 
                        className={`relative aspect-square w-full overflow-hidden rounded-md border-2 ${mainImage === img ? 'border-primary' : 'border-transparent'} cursor-pointer`}
                        onClick={() => setMainImage(img)}
                    >
                        <Image src={img} alt={`${product.name} thumbnail ${index + 1}`} layout="fill" objectFit="cover" />
                    </div>
                ))}
              </div>
            </div>

            {/* Product Details */}
            <div className="flex flex-col gap-4">
              <h1 className="text-3xl lg:text-4xl font-headline font-bold">{product.name}</h1>
              
               <div className={cn("flex items-center gap-2", currentTypeInfo.className)}>
                 {currentTypeInfo.icon}
                 <span className="text-sm font-medium">{currentTypeInfo.text}</span>
               </div>
              
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-primary">₹{product.price.toFixed(2)}</span>
                {product.mrp > product.price && (
                    <span className="text-xl text-muted-foreground line-through">₹{product.mrp.toFixed(2)}</span>
                )}
              </div>
              
              <div className="flex items-center gap-4">
                <span className="font-medium">{t.quantity}:</span>
                <div className="flex items-center gap-2 rounded-md border">
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(q => Math.max(minQty, q - 1))} disabled={isOutOfStock}>
                        <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{quantity}</span>
                    <Button variant="ghost" size="icon" onClick={() => setQuantity(q => q + 1)} disabled={isOutOfStock}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                 {minQty > 1 && <span className="text-xs text-muted-foreground">Min. Qty: {minQty}</span>}
              </div>

              <div className="grid sm:grid-cols-1 gap-4">
                <Button size="lg" onClick={handleAddToCart} disabled={isOutOfStock}>
                  {isOutOfStock ? <PackageX className="mr-2" /> : <ShoppingCart className="mr-2" />}
                  {isOutOfStock ? "Out of Stock" : t.addToCart}
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={handleWishlistToggle}>
                      <Heart className={cn("h-5 w-5", isWishlisted && "fill-destructive text-destructive")} />
                  </Button>
                  <Button variant="ghost" size="icon" className="rounded-full">
                      <Share2 className="h-5 w-5" />
                  </Button>
              </div>
              
              <Accordion type="single" collapsible className="w-full" defaultValue="description">
                <AccordionItem value="description">
                  <AccordionTrigger>{t.description}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{product.description}</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="ingredients">
                  <AccordionTrigger>{t.ingredients}</AccordionTrigger>
                  <AccordionContent>
                     <p className="text-muted-foreground">{product.ingredients || t.noIngredients}</p>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="product-info">
                  <AccordionTrigger>{t.productInfo}</AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{product.productInfo || t.noInfo}</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
