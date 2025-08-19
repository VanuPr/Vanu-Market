
"use client"

import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { Sparkles } from 'lucide-react';

interface TypewriterWelcomeProps {
    user: User | null | undefined;
    displayName?: string; // Optional override for name
    fullText: string;
    duration?: number;
}

export function TypewriterWelcome({ user, displayName, fullText, duration = 12000 }: TypewriterWelcomeProps) {
    const [welcomeText, setWelcomeText] = useState('');
    const [isVisible, setIsVisible] = useState(true);
    const [isFadingOut, setIsFadingOut] = useState(false);

    const nameToDisplay = displayName || user?.displayName || user?.email;
    const fullWelcomeMessage = `Welcome, ${nameToDisplay}! ${fullText}`;

    useEffect(() => {
        setIsVisible(true);
        setIsFadingOut(false);
        setWelcomeText('');
        
        // Typewriter effect
        let i = 0;
        const typingInterval = setInterval(() => {
            if (i < fullWelcomeMessage.length) {
                setWelcomeText(prev => prev + fullWelcomeMessage.charAt(i));
                i++;
            } else {
                clearInterval(typingInterval);
            }
        }, 50);

        // Hide component after duration
        const hideTimeout = setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => setIsVisible(false), 500); // Wait for fade out to complete
        }, duration);

        return () => {
            clearInterval(typingInterval);
            clearTimeout(hideTimeout);
        };
    // Using a key on the component is better for re-triggering than including all dependencies here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, displayName, fullText, duration]);

    if (!isVisible || !nameToDisplay) {
        return null;
    }

    return (
        <div className={cn(
            "transition-opacity duration-500",
            isFadingOut ? "opacity-0" : "opacity-100"
        )}>
            <Card className="bg-gradient-to-r from-primary/90 to-primary/80 text-primary-foreground shadow-lg">
                <CardContent className="p-4 flex items-center gap-4">
                    <Sparkles className="h-8 w-8 text-accent shrink-0" />
                    <p className="font-medium">
                        {welcomeText}
                        <span className="animate-ping">|</span>
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
