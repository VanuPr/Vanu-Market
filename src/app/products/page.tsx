
"use client"

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/context/language-context";
import { ProductCard } from "@/components/product-card";
import { useState, useEffect, useMemo } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  status: 'Active' | 'Draft';
}

interface Category {
  id: string;
  name: string;
  slug: string;
}


export default function ProductsPage() {
  const { translations } = useLanguage();
  const t = translations.productsPage;
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const fetchProductsAndCategories = async () => {
        setLoading(true);
        try {
            const productsRef = collection(db, "products");
            let q;

            if (selectedCategory !== 'all') {
                q = query(productsRef, where("category", "==", selectedCategory), where("status", "==", "Active"));
            } else {
                q = query(productsRef, where("status", "==", "Active"));
            }
            
            const querySnapshot = await getDocs(q);
            const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
            setProducts(productsData);

            if (categories.length === 0) {
              const categoriesSnapshot = await getDocs(query(collection(db, 'categories'), orderBy('name')));
              const categoriesData = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
              setCategories(categoriesData);
            }

        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchProductsAndCategories();
  }, [selectedCategory, categories.length]);

  const filteredProducts = useMemo(() => {
    return products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section id="products" className="w-full py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">{t.title}</h1>
              <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                {t.description}
              </p>
            </div>
            <div className="my-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder={t.searchPlaceholder}
                        className="w-full rounded-full pl-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full sm:w-auto">
                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                        <SelectTrigger className="w-full sm:w-[220px] rounded-full">
                            <SelectValue placeholder={t.categoryFilterPlaceholder} />
                        </SelectTrigger>
                        <SelectContent>
                           <SelectItem value="all">{t.allCategories}</SelectItem>
                            {categories.map(cat => (
                                <SelectItem key={cat.id} value={cat.slug}>{cat.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
             {loading ? (
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : filteredProducts.length > 0 ? (
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filteredProducts.map((product) => (
                   <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
                <p className="mt-12 text-center text-muted-foreground">{t.noProductsFound}</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
