
"use client";

import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Leaf, Users, HeartHandshake, Loader2 } from "lucide-react";
import { HeroSlideshow } from "@/components/hero-slideshow";
import { useState, useEffect } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/context/language-context";

interface Service {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    aiHint: string;
    link: string;
}

export default function ServicesPage() {
    const { translations } = useLanguage();
    const t = translations.servicesPage;
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchServices = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "services"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const servicesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
                setServices(servicesData);
            } catch (error) {
                console.error("Error fetching services:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchServices();
    }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section id="services" className="w-full py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center">
                <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">{t.title}</h1>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
                    {t.subtitle}
                </p>
            </div>
            
             <div className="mt-12">
                <HeroSlideshow />
            </div>

            <div className="mt-24">
                {loading ? (
                    <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
                ) : services.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map((service) => (
                           <Link key={service.id} href={service.link || "#"} className="group">
                             <Card className="h-full transform transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl">
                               <CardHeader className="p-0">
                                 <div className="w-full h-48 relative">
                                   <Image src={service.imageUrl} alt={service.name} layout="fill" objectFit="cover" className="rounded-t-lg" data-ai-hint={service.aiHint} />
                                 </div>
                               </CardHeader>
                               <CardContent className="p-6">
                                 <h3 className="text-lg font-semibold font-headline">{service.name}</h3>
                                 <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                               </CardContent>
                             </Card>
                           </Link>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground">{t.servicesComingSoon}</p>
                )}
            </div>
          </div>
        </section>
        
        <section id="community" className="w-full py-16 md:py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <Badge variant="outline" className="text-primary border-primary">{t.communityImpactBadge}</Badge>
            <h2 className="mt-4 text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">
              {t.communityImpactTitle}
            </h2>
            <div className="max-w-3xl mx-auto">
              <p className="mt-4 text-muted-foreground">
                {t.communityImpactDesc}
              </p>
              <div className="mt-8 flex justify-center gap-8">
                <div className="flex flex-col items-center gap-2">
                  <Leaf className="w-10 h-10 text-primary" />
                  <span className="text-sm font-medium">{t.envStewardship}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-10 h-10 text-primary" />
                  <span className="text-sm font-medium">{t.farmerEducation}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <HeartHandshake className="w-10 h-10 text-primary" />
                  <span className="text-sm font-medium">{t.communitySupport}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
