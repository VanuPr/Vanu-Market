
"use client"

import { useLanguage } from '@/context/language-context';
import { cn } from '@/lib/utils';

export function AppBody({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  return (
    <body
      className={cn(
        "antialiased",
        language === 'en' ? 'font-body' : 'font-hindi'
      )}
    >
      {children}
    </body>
  );
}
