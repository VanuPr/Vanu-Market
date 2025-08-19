
"use client";

import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs, orderBy, query } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function AddProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [newProduct, setNewProduct] = useState({ 
      name: '', 
      category: '', 
      mrp: '',
      price: '', 
      image: '',
      imageHover: '',
      image2: '',
      image3: '',
      description: '',
      ingredients: '',
      productInfo: '',
      productType: 'vegetarian',
      stock: '0',
      minOrderQty: '1',
      status: 'Active',
      featured: false,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageHoverFile, setImageHoverFile] = useState<File | null>(null);
  const [image2File, setImage2File] = useState<File | null>(null);
  const [image3File, setImage3File] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const categoriesSnapshot = await getDocs(query(collection(db, 'categories'), orderBy('name')));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(categoriesData);
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error fetching categories' });
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, [toast]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (e.target.files && e.target.files[0]) {
      setter(e.target.files[0]);
    }
  };

  const uploadImage = async (file: File, name: string): Promise<string> => {
    const storageRef = ref(storage, `products/${Date.now()}_${name}`);
    const uploadResult = await uploadBytes(storageRef, file);
    return getDownloadURL(uploadResult.ref);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.category || !newProduct.price || !newProduct.mrp || !newProduct.description) {
        toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all required fields." });
        return;
    }
    if (!imageFile && !newProduct.image) {
        toast({ variant: "destructive", title: "Missing Main Image", description: "Please upload an image or provide an image URL for the main image." });
        return;
    }
    setIsLoading(true);

    try {
        let imageUrl = newProduct.image;
        if (imageFile) imageUrl = await uploadImage(imageFile, imageFile.name);

        let imageHoverUrl = newProduct.imageHover;
        if (imageHoverFile) imageHoverUrl = await uploadImage(imageHoverFile, `${imageHoverFile.name}_hover`);
        
        let imageUrl2 = newProduct.image2;
        if (image2File) imageUrl2 = await uploadImage(image2File, `${image2File.name}_2`);

        let imageUrl3 = newProduct.image3;
        if (image3File) imageUrl3 = await uploadImage(image3File, `${image3File.name}_3`);

        const categoryName = categories.find(c => c.slug === newProduct.category)?.name || newProduct.category;

        const productData = {
            ...newProduct,
            categoryName,
            image: imageUrl,
            imageHover: imageHoverUrl,
            image2: imageUrl2,
            image3: imageUrl3,
            price: Number(newProduct.price),
            mrp: Number(newProduct.mrp),
            stock: Number(newProduct.stock),
            minOrderQty: Number(newProduct.minOrderQty) || 1,
            createdAt: serverTimestamp()
        };
        await addDoc(collection(db, "products"), productData);
        
        toast({ title: "Product added", description: "The new product has been added successfully." });
        router.push('/admin/products');
    } catch (error) {
        console.error("Error adding product: ", error);
        toast({ variant: "destructive", title: "Error adding product", description: "There was a problem saving the product." });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div>
        <h1 className="text-3xl font-bold mb-6">Add a New Product</h1>
        <form onSubmit={handleAddProduct}>
            <Card>
                <CardHeader>
                    <CardTitle>Product Details</CardTitle>
                    <CardDescription>
                        Fill in the details below to add a new product to your store.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} required disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="category">Category</Label>
                                <Select value={newProduct.category} onValueChange={(value) => setNewProduct({...newProduct, category: value})} disabled={isLoading || loadingCategories}>
                                    <SelectTrigger>
                                        <SelectValue placeholder={loadingCategories ? 'Loading...' : 'Select a category'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categories.map(cat => (
                                            <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="grid gap-2">
                                    <Label htmlFor="mrp">MRP (Actual Price in ₹)</Label>
                                    <Input id="mrp" type="number" value={newProduct.mrp} onChange={(e) => setNewProduct({...newProduct, mrp: e.target.value})} required disabled={isLoading}/>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Selling Price (₹)</Label>
                                    <Input id="price" type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} required disabled={isLoading}/>
                                </div>
                            </div>
                             <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="stock">Stock Quantity</Label>
                                    <Input id="stock" type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} required disabled={isLoading}/>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="minOrderQty">Min. Order Qty</Label>
                                    <Input id="minOrderQty" type="number" value={newProduct.minOrderQty} onChange={(e) => setNewProduct({...newProduct, minOrderQty: e.target.value})} required disabled={isLoading} min="1"/>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={newProduct.status} onValueChange={(value) => setNewProduct({...newProduct, status: value})} disabled={isLoading}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Draft">Draft</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex items-center space-x-2 pt-6">
                                    <Switch id="featured" checked={newProduct.featured} onCheckedChange={(checked) => setNewProduct({...newProduct, featured: checked})} />
                                    <Label htmlFor="featured">Featured Product</Label>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="productType">Product Type</Label>
                                <Select value={newProduct.productType} onValueChange={(value) => setNewProduct({...newProduct, productType: value})} disabled={isLoading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="vegetarian">Vegetarian</SelectItem>
                                        <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                                        <SelectItem value="vegan">Vegan</SelectItem>
                                        <SelectItem value="uses_dead_animals">Uses Dead Animals</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="imageUpload">Upload Main Image</Label>
                                <Input id="imageUpload" type="file" onChange={(e) => handleFileChange(e, setImageFile)} disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="image">Or Main Image URL</Label>
                                <Input id="image" value={newProduct.image} onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} disabled={isLoading || !!imageFile} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="imageHoverUpload">Upload Hover Image</Label>
                                <Input id="imageHoverUpload" type="file" onChange={(e) => handleFileChange(e, setImageHoverFile)} disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="imageHover">Or Hover Image URL</Label>
                                <Input id="imageHover" value={newProduct.imageHover} onChange={(e) => setNewProduct({...newProduct, imageHover: e.target.value})} disabled={isLoading || !!imageHoverFile} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="image2Upload">Upload Image 2</Label>
                                <Input id="image2Upload" type="file" onChange={(e) => handleFileChange(e, setImage2File)} disabled={isLoading} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="image2">Or Image 2 URL</Label>
                                <Input id="image2" value={newProduct.image2} onChange={(e) => setNewProduct({...newProduct, image2: e.target.value})} disabled={isLoading || !!image2File} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="image3Upload">Upload Image 3</Label>
                                <Input id="image3Upload" type="file" onChange={(e) => handleFileChange(e, setImage3File)} disabled={isLoading} />
                            </div>
                             <div className="grid gap-2">
                                <Label htmlFor="image3">Or Image 3 URL</Label>
                                <Input id="image3" value={newProduct.image3} onChange={(e) => setNewProduct({...newProduct, image3: e.target.value})} disabled={isLoading || !!image3File} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={newProduct.description} onChange={(e) => setNewProduct({...newProduct, description: e.target.value})} required rows={4} disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="ingredients">Ingredients</Label>
                                <Textarea id="ingredients" value={newProduct.ingredients} onChange={(e) => setNewProduct({...newProduct, ingredients: e.target.value})} rows={4} disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="productInfo">Product Info</Label>
                                <Textarea id="productInfo" value={newProduct.productInfo} onChange={(e) => setNewProduct({...newProduct, productInfo: e.target.value})} rows={4} disabled={isLoading} />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="mt-6 flex justify-end">
                <Button type="submit" disabled={isLoading || loadingCategories}>
                    {isLoading || loadingCategories ? <Loader2 className="mr-2 animate-spin"/> : null}
                    {isLoading ? 'Saving...' : 'Save Product'}
                </Button>
            </div>
        </form>
    </div>
  );
}
