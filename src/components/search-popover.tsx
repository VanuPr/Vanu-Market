"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
    id: string;
    name: string;
    price: number;
    image: string;
    status: 'Active' | 'Draft';
}

export function SearchPopover() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (open && products.length === 0) {
            const fetchProducts = async () => {
                setLoading(true);
                try {
                    const q = query(collection(db, 'products'), where('status', '==', 'Active'));
                    const querySnapshot = await getDocs(q);
                    const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
                    setProducts(productsData);
                } catch (error) {
                    console.error("Error fetching products for search:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchProducts();
        }
    }, [open, products.length]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return [];
        return products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [products, searchTerm]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button size="icon" variant="ghost">
                    <Search className="h-5 w-5" />
                    <span className="sr-only">Search Products</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-screen max-w-md p-0" align="end">
                <div className="p-4 grid gap-4">
                    <h4 className="font-medium leading-none">Search Products</h4>
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="What are you looking for?"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                    <ScrollArea className="h-72">
                        <div className="space-y-2 pr-2">
                            {loading && !searchTerm && (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="h-6 w-6 animate-spin" />
                                </div>
                            )}
                            {searchTerm && filteredProducts.length > 0 ? (
                                filteredProducts.map(product => (
                                    <Link 
                                        href={`/product/${product.id}`} 
                                        key={product.id} 
                                        className="flex items-center gap-4 hover:bg-accent p-2 rounded-md"
                                        onClick={() => setOpen(false)}
                                    >
                                        <Image src={product.image} alt={product.name} width={48} height={48} className="rounded-md object-cover"/>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{product.name}</p>
                                            <p className="text-sm text-primary">₹{product.price.toFixed(2)}</p>
                                        </div>
                                    </Link>
                                ))
                            ) : searchTerm ? (
                                <p className="text-center text-sm text-muted-foreground pt-4">No products found for "{searchTerm}".</p>
                            ) : (
                                <p className="text-center text-sm text-muted-foreground pt-4">Start typing to see results.</p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <div className="p-2 border-t">
                    <Button 
                        asChild 
                        variant="ghost" 
                        className="w-full justify-center"
                        onClick={() => setOpen(false)}
                    >
                        <Link href="/products">View All Products</Link>
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
