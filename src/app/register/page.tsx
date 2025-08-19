
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useLanguage } from "@/context/language-context";
import { useToast } from "@/hooks/use-toast";

export default function RegisterPage() {
    const { translations } = useLanguage();
    const t = translations.customerAuth;
    const router = useRouter();
    const { toast } = useToast();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            if (user) {
                const fullName = `${firstName} ${lastName}`.trim();
                // Update Firebase Auth profile
                await updateProfile(user, { displayName: fullName });

                // Create user document in Firestore
                const userDocRef = doc(db, 'users', user.uid);
                await setDoc(userDocRef, {
                    firstName,
                    lastName,
                    email,
                    phone,
                    status: 'Active',
                    createdAt: serverTimestamp(),
                    avatarUrl: '', // Initialize with empty avatar
                });
            }
            
            toast({ title: "Registration Successful", description: "Welcome! Your account has been created." });
            router.push('/');
        } catch (error: any) {
             console.error("Registration Error:", error);
            toast({
                variant: "destructive",
                title: "Registration Failed",
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
          <form onSubmit={handleSignUp}>
              <CardHeader>
                <CardTitle className="text-2xl font-headline">{t.registerTitle}</CardTitle>
                <CardDescription>{t.registerDescription}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="firstName">{t.firstName}</Label>
                        <Input 
                            id="firstName" 
                            placeholder="John" 
                            required 
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="lastName">{t.lastName}</Label>
                        <Input 
                            id="lastName" 
                            placeholder="Doe" 
                            required 
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            disabled={isLoading}
                        />
                    </div>
                </div>
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
                 <div className="grid gap-2">
                  <Label htmlFor="phone">{t.phone}</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+91..."
                    required 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">{t.passwordLabel}</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col">
                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? t.creatingAccount : t.signUpButton}
                </Button>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  {t.alreadyAccountPrompt}{' '}
                  <Link href="/customer-login" className="underline">
                    {t.signInLink}
                  </Link>
                </p>
              </CardFooter>
          </form>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
