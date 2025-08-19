
"use client"

import React, { Suspense, useState } from 'react';
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Loader2, Star } from "lucide-react";
import { useLanguage } from "@/context/language-context";
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

function OrderConfirmationContent() {
    const { translations } = useLanguage();
    const searchParams = useSearchParams();
    const orderId = searchParams.get('id');
    const t = translations.orderConfirmation;

    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    const handleRating = (rate: number) => {
        setRating(rate);
        setFeedbackSubmitted(true);
    };

    if (!orderId) {
        return (
             <Card className="w-full max-w-lg text-center">
                <CardHeader className="items-center">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                    <CardTitle className="text-3xl font-headline">{t.verifyingOrder}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{t.pleaseWait}</p>
                </CardContent>
            </Card>
        )
    }

  return (
    <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-headline">{t.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <CardDescription>{t.subtitle}</CardDescription>
            <p className="font-semibold text-lg">{t.orderNumber}:</p>
            <p className="font-mono text-sm bg-muted text-muted-foreground p-2 rounded-md break-all">{orderId}</p>
            <div className="py-4 flex gap-4 justify-center">
                 <Link href="/products">
                    <Button variant="outline">{t.continueShoppingButton}</Button>
                </Link>
                <Link href="/account?view=orders">
                    <Button>{t.goToMyOrders}</Button>
                </Link>
            </div>
            <Separator />
            <div className="pt-4">
                 <h4 className="font-semibold text-muted-foreground mb-3">
                    {feedbackSubmitted ? t.feedbackThanks : t.feedbackPrompt}
                 </h4>
                 <div className="flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                            key={star}
                            className={cn(
                                "h-8 w-8 cursor-pointer transition-colors",
                                (hoverRating || rating) >= star ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground/50"
                            )}
                            onClick={() => handleRating(star)}
                            onMouseEnter={() => !feedbackSubmitted && setHoverRating(star)}
                            onMouseLeave={() => !feedbackSubmitted && setHoverRating(0)}
                        />
                    ))}
                 </div>
            </div>
            <div className="pt-6">
                <Link href="/customer-support">
                    <Button variant="link">Have questions? Contact Support</Button>
                </Link>
            </div>
        </CardContent>
    </Card>
  );
}


export default function OrderConfirmationPage() {
    return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 md:py-24">
        <Suspense fallback={
            <div className="flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <OrderConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
