
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';

export default function DistributorRootPage() {
    const router = useRouter();
    const [user, loading] = useAuthState(auth);

    useEffect(() => {
        if (!loading) {
            router.replace('/distributor/dashboard');
        }
    }, [loading, router]);

    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
}
