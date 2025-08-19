
"use client"

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ProductCard } from "@/components/product-card";
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useLanguage } from '@/context/language-context';

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  imageHover?: string;
  aiHint?: string;
  category?: string; // This is the slug
  categoryName?: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function CategoryPage() {
  const params = useParams();
  const { slug } = params;
  const { translations } = useLanguage();
  const t = translations.productCategoryPage;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    const fetchCategoryProducts = async () => {
      setLoading(true);
      try {
        // Fetch category details
        const catQuery = query(collection(db, 'categories'), where('slug', '==', slug), limit(1));
        const catSnapshot = await getDocs(catQuery);

        if (!catSnapshot.empty) {
          const catData = catSnapshot.docs[0].data() as Category;
          setCategory(catData);

          // Fetch products for this category
          const productsQuery = query(collection(db, 'products'), where('category', '==', slug), where('status', '==', 'Active'));
          const productsSnapshot = await getDocs(productsQuery);
          const productsData = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
          setProducts(productsData);
        } else {
            // Handle category not found
            setCategory(null);
            setProducts([]);
        }

      } catch (error) {
        console.error("Error fetching category products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, [slug]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section id="products" className="w-full py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
              {loading ? (
                 <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" />
              ) : category ? (
                <>
                  <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">{category.name}</h1>
                  <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                    {t.browseCollection.replace('{categoryName}', category.name.toLowerCase())}
                  </p>
                </>
              ) : (
                 <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">{t.categoryNotFound}</h1>
              )}
            </div>
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : products.length > 0 ? (
              <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
               <p className="mt-12 text-center text-muted-foreground">{t.noProductsInCategory}</p>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
