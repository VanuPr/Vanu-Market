
"use client"

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { useLanguage } from "@/context/language-context";
import { Heart, ShoppingCart, Eye, PackageX, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { staggeredItemVariants } from "./motion-wrapper";

interface Product {
  id: string; 
  name: string;
  price: number;
  mrp?: number;
  image: string;
  imageHover?: string;
  aiHint?: string;
  category?: string;
  featured?: boolean;
  stock?: number;
  minOrderQty?: number;
}

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const { addToCart } = useCart();
    const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
    const { translations } = useLanguage();
    const t = translations.home;

    const isOutOfStock = product.stock !== undefined && product.stock <= 0;

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault(); 
        if (isOutOfStock) return;
        const cartProduct = {
            ...product,
            price: product.price,
        };
        const quantityToAdd = product.minOrderQty && product.minOrderQty > 0 ? product.minOrderQty : 1;
        addToCart(cartProduct, quantityToAdd);
    };

    const handleWishlistToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        if(isInWishlist(product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    }
    
    const displayPrice = `₹${product.price.toFixed(2)}`;
    const displayMrp = product.mrp && product.mrp > product.price ? `₹${product.mrp.toFixed(2)}` : null;
    const discount = product.mrp && product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
    const isWishlisted = isInWishlist(product.id);


    return (
      <motion.div variants={staggeredItemVariants} className="group relative overflow-hidden rounded-lg bg-card border shadow-sm transition-all duration-300 hover:shadow-xl md:hover:-translate-y-1">
             <Link href={`/product/${product.id}`} className="absolute inset-0 z-10" aria-label={`View details for ${product.name}`}>
                <span className="sr-only">View Details</span>
            </Link>
            <div className="relative w-full aspect-[4/5] overflow-hidden">
                <Image 
                    src={product.image} 
                    alt={product.name} 
                    layout="fill" 
                    objectFit="cover" 
                    className={cn("transition-transform duration-500 ease-in-out md:group-hover:scale-105", isOutOfStock && "grayscale")}
                    data-ai-hint={product.aiHint}
                />
                {discount > 0 && !isOutOfStock && (
                    <Badge variant="destructive" className="absolute top-3 left-3 z-20">
                        {discount}% OFF
                    </Badge>
                )}
                 {isOutOfStock && (
                    <Badge variant="secondary" className="absolute top-3 left-3 z-20 text-destructive border-destructive">
                        Out of Stock
                    </Badge>
                )}
                 <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/60 to-transparent md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-2 right-2 flex flex-col gap-2 z-20">
                         <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={handleWishlistToggle} className="z-20 h-8 w-8 flex items-center justify-center rounded-full bg-background/80 hover:bg-background shadow-md">
                            <Heart className={cn("h-4 w-4 text-foreground", isWishlisted && "fill-destructive text-destructive")} />
                        </motion.button>
                         <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="z-20 h-8 w-8 flex items-center justify-center rounded-full bg-background/80 hover:bg-background shadow-md">
                           <Link href={`/product/${product.id}`} className="w-full h-full flex items-center justify-center">
                               <Eye className="h-4 w-4 text-foreground" />
                           </Link>
                        </motion.button>
                    </div>
                </div>
            </div>
            <div className="p-4 text-center">
                <h3 className="text-base font-semibold text-foreground truncate">{product.name}</h3>
                <div className="mt-1 flex items-baseline justify-center gap-2">
                    <p className="text-lg font-bold text-primary">{displayPrice}</p>
                    {displayMrp && <p className="text-sm text-muted-foreground line-through">{displayMrp}</p>}
                </div>
                 <Button size="sm" className="w-full mt-3 z-20 relative text-sm" onClick={handleAddToCart} disabled={isOutOfStock}>
                    {isOutOfStock ? <><PackageX className="mr-2 h-4 w-4"/> Out of Stock</> : <><Plus className="mr-2 h-4 w-4"/> {t.addToCart}</>}
                </Button>
            </div>
        </motion.div>
    );
}
