
"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from 'firebase/firestore';
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

export default function DistributorLoginPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                if (userData.status === 'Pending Approval') {
                    await auth.signOut();
                    toast({
                        variant: "destructive",
                        title: "Login Failed",
                        description: "Your account is pending approval. Please contact support.",
                        duration: 5000,
                    });
                    setIsLoading(false);
                    return;
                }
                 if (userData.status === 'Suspended') {
                    await auth.signOut();
                    toast({
                        variant: "destructive",
                        title: "Account Suspended",
                        description: "Your account has been suspended. Please contact support.",
                        duration: 5000,
                    });
                    setIsLoading(false);
                    return;
                }
            } else {
                 await auth.signOut();
                 toast({ variant: "destructive", title: "Access Denied", description: "This login is for distributors only." });
                 setIsLoading(false);
                 return;
            }
            
            toast({ title: "Login Successful", description: "Welcome back!" });
            router.push('/distributor/dashboard');
        } catch (error: any) {
            console.error("Login Error:", error);
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: "Invalid email or password. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 flex items-center justify-center py-16 md:py-24">
        <Card className="w-full max-w-sm mx-auto flex flex-col justify-center">
            <CardHeader>
                <CardTitle className="text-2xl font-headline">Distributor Login</CardTitle>
                <CardDescription>Enter your distributor credentials to access your portal.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <form onSubmit={handleSignIn} className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
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
                        <div className="flex items-center">
                            <Label htmlFor="password">Password</Label>
                            <Link href="/forgot-password" passHref>
                               <span className="ml-auto inline-block text-sm underline cursor-pointer">Forgot password?</span>
                            </Link>
                        </div>
                      <Input 
                        id="password" 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isLoading}
                        />
                    </div>
                    <Button className="w-full" type="submit" disabled={isLoading}>
                        {isLoading ? "Signing In..." : "Sign In"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                <p className="text-center text-sm text-muted-foreground">
                  Not a distributor?{' '}
                  <Link href="/customer-login" className="underline">
                    Customer Login
                  </Link>
                </p>
            </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
