
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, getDoc, updateDoc, serverTimestamp, collection, query, getDocs, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductData {
    name: string;
    category: string; // This will be the slug
    categoryName?: string;
    mrp: string | number;
    price: string | number;
    stock: string | number;
    minOrderQty?: string | number;
    status: 'Active' | 'Draft';
    featured: boolean;
    image: string;
    imageHover: string;
    image2?: string;
    image3?: string;
    description: string;
    ingredients: string;
    productInfo: string;
    productType: string;
}

export default function EditProductPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const [product, setProduct] = useState<ProductData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageHoverFile, setImageHoverFile] = useState<File | null>(null);
  const [image2File, setImage2File] = useState<File | null>(null);
  const [image3File, setImage3File] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  useEffect(() => {
    if (!id) return;

    const fetchProductAndCategories = async () => {
      setIsFetching(true);
      try {
        // Fetch categories
        const categoriesSnapshot = await getDocs(query(collection(db, 'categories'), orderBy('name')));
        const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
        setCategories(categoriesData);

        // Fetch product
        const docRef = doc(db, 'products', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProduct(docSnap.data() as ProductData);
        } else {
          toast({ variant: 'destructive', title: 'Product not found' });
          router.push('/admin/products');
        }
      } catch (error) {
        console.error("Error fetching data: ", error);
        toast({ variant: 'destructive', title: 'Error fetching data' });
      } finally {
        setIsFetching(false);
      }
    };

    fetchProductAndCategories();
  }, [id, router, toast]);

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

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!product.name || !product.category || !product.price || !product.mrp || !product.description) {
      toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all required fields." });
      return;
    }
    setIsLoading(true);

    try {
      let imageUrl = product.image;
      if (imageFile) imageUrl = await uploadImage(imageFile, imageFile.name);

      let imageHoverUrl = product.imageHover;
      if (imageHoverFile) imageHoverUrl = await uploadImage(imageHoverFile, `${imageHoverFile.name}_hover`);

      let imageUrl2 = product.image2;
      if (image2File) imageUrl2 = await uploadImage(image2File, `${image2File.name}_2`);

      let imageUrl3 = product.image3;
      if (image3File) imageUrl3 = await uploadImage(image3File, `${image3File.name}_3`);

      const productRef = doc(db, "products", id as string);
      
      const categoryName = categories.find(c => c.slug === product.category)?.name || product.category;

      const updatedData = {
        ...product,
        categoryName,
        image: imageUrl,
        imageHover: imageHoverUrl,
        image2: imageUrl2,
        image3: imageUrl3,
        price: Number(product.price),
        mrp: Number(product.mrp),
        stock: Number(product.stock),
        minOrderQty: Number(product.minOrderQty) || 1,
        updatedAt: serverTimestamp()
      };
      await updateDoc(productRef, updatedData);

      toast({ title: "Product updated", description: "The product has been updated successfully." });
      router.push('/admin/products');
    } catch (error) {
      console.error("Error updating product: ", error);
      toast({ variant: "destructive", title: "Error updating product", description: "There was a problem saving the product." });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching || !product) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Edit Product</h1>
      <form onSubmit={handleUpdateProduct}>
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
            <CardDescription>
              Update the details for this product.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={product.name || ''} onChange={(e) => setProduct({ ...product, name: e.target.value })} required disabled={isLoading} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={product.category} onValueChange={(value) => setProduct({ ...product, category: value })} disabled={isLoading}>
                      <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
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
                    <Input id="mrp" type="number" value={product.mrp || ''} onChange={(e) => setProduct({ ...product, mrp: e.target.value })} required disabled={isLoading} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Selling Price (₹)</Label>
                    <Input id="price" type="number" value={product.price || ''} onChange={(e) => setProduct({ ...product, price: e.target.value })} required disabled={isLoading} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="stock">Stock Quantity</Label>
                        <Input id="stock" type="number" value={product.stock || 0} onChange={(e) => setProduct({...product, stock: e.target.value})} required disabled={isLoading}/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="minOrderQty">Min. Order Qty</Label>
                        <Input id="minOrderQty" type="number" value={product.minOrderQty || 1} onChange={(e) => setProduct({...product, minOrderQty: e.target.value})} required disabled={isLoading} min="1"/>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={product.status} onValueChange={(value) => setProduct({ ...product, status: value as 'Active' | 'Draft' })} disabled={isLoading}>
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
                        <Switch id="featured" checked={product.featured} onCheckedChange={(checked) => setProduct({...product, featured: checked})} />
                        <Label htmlFor="featured">Featured Product</Label>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="productType">Product Type</Label>
                    <Select value={product.productType || 'vegetarian'} onValueChange={(value) => setProduct({ ...product, productType: value })} disabled={isLoading}>
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
                    <Label htmlFor="imageUpload">Upload New Main Image</Label>
                    <Input id="imageUpload" type="file" onChange={(e) => handleFileChange(e, setImageFile)} disabled={isLoading} />
                    {product.image && !imageFile && <img src={product.image} alt="Current main" className="mt-2 h-20 w-20 rounded-md object-cover"/>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="image">Or Update Main Image URL</Label>
                    <Input id="image" value={product.image || ''} onChange={(e) => setProduct({ ...product, image: e.target.value })} disabled={isLoading || !!imageFile} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="imageHoverUpload">Upload New Hover Image</Label>
                    <Input id="imageHoverUpload" type="file" onChange={(e) => handleFileChange(e, setImageHoverFile)} disabled={isLoading} />
                    {product.imageHover && !imageHoverFile && <img src={product.imageHover} alt="Current hover" className="mt-2 h-20 w-20 rounded-md object-cover"/>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="imageHover">Or Update Hover Image URL</Label>
                    <Input id="imageHover" value={product.imageHover || ''} onChange={(e) => setProduct({ ...product, imageHover: e.target.value })} disabled={isLoading || !!imageHoverFile} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="image2Upload">Upload New Image 2</Label>
                    <Input id="image2Upload" type="file" onChange={(e) => handleFileChange(e, setImage2File)} disabled={isLoading} />
                    {product.image2 && !image2File && <img src={product.image2} alt="Current image 2" className="mt-2 h-20 w-20 rounded-md object-cover"/>}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="image2">Or Update Image 2 URL</Label>
                    <Input id="image2" value={product.image2 || ''} onChange={(e) => setProduct({ ...product, image2: e.target.value })} disabled={isLoading || !!image2File} />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="image3Upload">Upload New Image 3</Label>
                    <Input id="image3Upload" type="file" onChange={(e) => handleFileChange(e, setImage3File)} disabled={isLoading} />
                    {product.image3 && !image3File && <img src={product.image3} alt="Current image 3" className="mt-2 h-20 w-20 rounded-md object-cover"/>}
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="image3">Or Update Image 3 URL</Label>
                    <Input id="image3" value={product.image3 || ''} onChange={(e) => setProduct({ ...product, image3: e.target.value })} disabled={isLoading || !!image3File} />
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={product.description || ''} onChange={(e) => setProduct({ ...product, description: e.target.value })} required rows={4} disabled={isLoading} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ingredients">Ingredients</Label>
                  <Textarea id="ingredients" value={product.ingredients || ''} onChange={(e) => setProduct({ ...product, ingredients: e.target.value })} rows={4} disabled={isLoading} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="productInfo">Product Info</Label>
                  <Textarea id="productInfo" value={product.productInfo || ''} onChange={(e) => setProduct({ ...product, productInfo: e.target.value })} rows={4} disabled={isLoading} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}
