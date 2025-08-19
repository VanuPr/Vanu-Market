
"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Loader2, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DevLayout({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  React.useEffect(() => {
    if (!loading) {
      if (!user || user.email !== 'dev@akm.com') {
        router.push('/employee-login');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || user.email !== 'dev@akm.com') {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Verifying access...</p>
      </div>
    );
  }

  return (
      <div className="flex min-h-screen flex-col">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
              <h1 className="text-lg font-semibold">Developer Area</h1>
              <Button variant="outline" onClick={() => auth.signOut()}><LogOut className="mr-2"/>Logout</Button>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8">
              {children}
          </main>
      </div>
  );
}
