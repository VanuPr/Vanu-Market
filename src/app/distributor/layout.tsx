
"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Loader2, LogOut, User, ShoppingCart, History, LayoutDashboard } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export default function DistributorLayout({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  React.useEffect(() => {
    if (loading) return; 

    const verifyDistributor = async () => {
        if (!user) {
            router.push('/distributor-login');
            return;
        }
        
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (!docSnap.exists() || !docSnap.data()?.roles?.includes('stockist')) {
                auth.signOut();
                toast({ variant: 'destructive', title: 'Access Denied', description: 'This portal is for distributors only.' });
                router.push('/distributor-login');
            }
        });

        return () => unsubscribe();
    };

    verifyDistributor();
  }, [user, loading, router, toast]);


  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  const navItems = [
    { href: '/distributor/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/distributor/orders', icon: History, label: 'My Orders' },
    { href: '/distributor/cart', icon: ShoppingCart, label: 'My Cart' },
    { href: '/distributor/profile', icon: User, label: 'My Profile' },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
            <div className="flex h-16 items-center border-b px-6">
                 <Logo />
            </div>
            <nav className="flex flex-col gap-2 p-4">
                {navItems.map((item) => (
                    <Link key={item.label} href={item.href}>
                        <Button
                            variant={pathname === item.href ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                        >
                            <item.icon className="mr-2 h-4 w-4" />
                            {item.label}
                        </Button>
                    </Link>
                ))}
            </nav>
             <div className="mt-auto p-4">
                 <Button variant="ghost" className="w-full justify-start" onClick={() => { auth.signOut(); router.push('/'); }}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                </Button>
            </div>
        </aside>
        <div className="flex flex-col sm:pl-60">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
            </header>
            <main className="flex-1 p-4 sm:p-6">
                {children}
            </main>
        </div>
    </div>
  );
}
