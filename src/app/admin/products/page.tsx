
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  categoryName?: string;
  image: string;
  stock: number;
  status: 'Active' | 'Draft';
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const { toast } = useToast();

  const fetchProductsAndCategories = async () => {
    setLoading(true);
    try {
      const productsSnapshot = await getDocs(collection(db, 'products'));
      const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);

      const categoriesSnapshot = await getDocs(query(collection(db, 'categories'), orderBy('name')));
      const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(categoriesData);

    } catch(error) {
       toast({ variant: "destructive", title: "Error fetching data", description: "Could not fetch data from the database." });
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter(product => {
        if (statusFilter === 'All') return true;
        return product.status === statusFilter;
      })
      .filter(product => {
        if (categoryFilter === 'All') return true;
        return product.category === categoryFilter;
      })
      .filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm, statusFilter, categoryFilter]);


  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
        try {
            await deleteDoc(doc(db, "products", id));
            setProducts(products.filter(p => p.id !== id));
            toast({ title: "Product deleted", description: "The product has been removed." });
        } catch (error) {
            console.error("Error deleting product: ", error);
            toast({ variant: "destructive", title: "Error deleting product" });
        }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">Product Dashboard</h1>
        <div className="flex items-center gap-2 flex-1 min-w-[250px] sm:min-w-auto sm:max-w-md">
            <Input 
                placeholder="Search products..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter Category" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Categories</SelectItem>
                    {categories.map(cat => <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <Link href="/admin/add-product">
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Product
            </Button>
        </Link>
      </div>
      
        <Card>
            <CardHeader>
                <CardTitle>All Products ({filteredProducts.length})</CardTitle>
                <CardDescription>View, edit, and delete products from your store.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-lg text-muted-foreground mb-4">
                            {searchTerm || statusFilter !== 'All' || categoryFilter !== 'All' ? `No products found for your criteria.` : "No products found."}
                        </p>
                        { !searchTerm && (
                            <Link href="/admin/add-product">
                                <Button>Add your first product</Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProducts.map((product) => (
                        <TableRow key={product.id} className={cn(product.status === 'Draft' && 'bg-muted/50')}>
                            <TableCell>
                            <Image src={product.image || 'https://placehold.co/40x40.png'} alt={product.name} width={40} height={40} className="rounded-md object-cover" />
                            </TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>{product.categoryName || product.category}</TableCell>
                            <TableCell>₹{product.price}</TableCell>
                            <TableCell>{product.stock}</TableCell>
                            <TableCell>
                                <Badge variant={product.status === 'Active' ? 'default' : 'secondary'}>
                                    {product.status}
                                </Badge>
                            </TableCell>
                            <TableCell className="flex gap-2">
                            <Link href={`/admin/edit-product/${product.id}`} passHref>
                              <Button variant="outline" size="icon">
                                  <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button variant="destructive" size="icon" onClick={() => handleDelete(product.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
