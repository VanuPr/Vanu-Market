
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPasswordPage() {
    const { translations } = useLanguage();
    const t = translations.customerAuth;
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            toast({ 
                title: t.resetEmailSentTitle, 
                description: t.resetEmailSentDesc 
            });
            router.push('/customer-login');
        } catch (error: any) {
            console.error("Password Reset Error:", error);
            toast({
                variant: "destructive",
                title: t.resetFailedTitle,
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 md:py-24">
        <Card className="w-full max-w-sm">
          <form onSubmit={handleResetPassword}>
              <CardHeader>
                <CardTitle className="text-2xl font-headline">{t.forgotPasswordTitle}</CardTitle>
                <CardDescription>{t.forgotPasswordDesc}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">{t.emailLabel}</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="m@example.com" 
                    required 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? t.sendingLink : t.sendResetLinkButton}
                </Button>
                 <Link href="/customer-login" passHref>
                    <span className="text-sm text-muted-foreground hover:underline cursor-pointer">{t.backToLogin}</span>
                </Link>
              </CardFooter>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
