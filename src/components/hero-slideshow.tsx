
"use client"

import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Slide {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
}

export function HeroSlideshow() {
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loading, setLoading] = useState(true);
    const [api, setApi] = useState<CarouselApi>();
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const fetchSlides = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, "slideshow"), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);
                const slidesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slide));
                setSlides(slidesData);
            } catch (error) {
                console.error("Error fetching slides:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSlides();
    }, []);

     useEffect(() => {
        if (!api) return;
        
        const onSelect = () => {
            setCurrent(api.selectedScrollSnap());
        };

        api.on("select", onSelect);
        // Set initial value
        onSelect();

        return () => {
            api.off("select", onSelect);
        };
    }, [api]);

    if (loading) {
        return (
            <div className="w-full h-full flex justify-center items-center bg-muted">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }
    
    if(slides.length === 0) {
        return (
             <div className="w-full h-full flex justify-center items-center bg-muted">
                <p>No slides found. Please add some in the admin panel.</p>
            </div>
        )
    }

    return (
        <Carousel setApi={setApi} className="w-full h-full" opts={{ loop: true }}>
            <CarouselContent className="h-full">
                {slides.map((slide, index) => (
                    <CarouselItem key={slide.id} className="h-full relative group">
                        <Image
                            src={slide.imageUrl}
                            alt={slide.title}
                            layout="fill"
                            objectFit="cover"
                            className="transition-transform duration-500 ease-in-out group-hover:scale-105"
                            priority={index === 0}
                        />
                         <div className="absolute inset-0 bg-black/40" />
                         <div className="absolute inset-0 flex items-center justify-center p-8">
                            <AnimatePresence>
                                {current === index && (
                                    <motion.div 
                                        className="text-center text-white"
                                        initial={{ y: 20, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -20, opacity: 0 }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                    >
                                        <h2 className="text-3xl md:text-5xl font-bold font-headline text-shadow-lg">{slide.title}</h2>
                                        <p className="mt-4 max-w-xl mx-auto text-lg text-shadow">{slide.description}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                         </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
             <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white bg-black/50 px-3 py-1 rounded-full">
                {current + 1} / {slides.length}
            </div>
        </Carousel>
    );
}
