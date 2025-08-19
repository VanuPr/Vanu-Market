
"use client"

import React, { Suspense } from 'react';
import Link from "next/link";
import { useSearchParams } from 'next/navigation';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";

function ApplicationConfirmationContent() {
    const searchParams = useSearchParams();
    const applicationId = searchParams.get('id');

    if (!applicationId) {
        return (
             <Card className="w-full max-w-lg text-center">
                <CardHeader className="items-center">
                    <Loader2 className="w-16 h-16 text-primary animate-spin mb-4" />
                    <CardTitle className="text-3xl font-headline">Verifying Application...</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Please wait a moment while we confirm your submission.</p>
                </CardContent>
            </Card>
        )
    }

  return (
    <Card className="w-full max-w-lg text-center">
        <CardHeader className="items-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <CardTitle className="text-3xl font-headline">Thank You for Your Application!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <CardDescription>Your application has been submitted successfully. We will review your information and get back to you shortly.</CardDescription>
            <p className="font-semibold text-lg">Your Application ID:</p>
            <p className="font-mono text-sm bg-muted text-muted-foreground p-2 rounded-md break-all">{applicationId}</p>
            <div className="py-4 flex gap-4 justify-center">
                 <Link href="/">
                    <Button variant="outline">Back to Home</Button>
                </Link>
                <Link href="/customer-support">
                    <Button>Contact Support</Button>
                </Link>
            </div>
        </CardContent>
    </Card>
  );
}


export default function ApplicationConfirmationPage() {
    return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 md:py-24">
        <Suspense fallback={
            <div className="flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        }>
            <ApplicationConfirmationContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
