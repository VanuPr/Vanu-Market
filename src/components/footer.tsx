
"use client";

import Link from "next/link";
import { Logo } from "./logo";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export function Footer() {
  const { translations } = useLanguage();
  const t = translations.footer;

  return (
    <footer id="contact" className="bg-secondary text-secondary-foreground border-t border-border">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="flex flex-col">
            <Logo isFooter={false} />
            <p className="mt-4 text-sm text-muted-foreground">
              {t.tagline}
            </p>
          </div>

          <div>
            <h3 className="font-headline text-lg font-semibold text-foreground">Quick Links</h3>
            <ul className="mt-4 space-y-2">
                <li><Link href="/district-stock-point-application" className="text-sm text-muted-foreground hover:text-primary hover:underline">Apply for District Stock Point</Link></li>
                <li><Link href="/block-stock-point-application" className="text-sm text-muted-foreground hover:text-primary hover:underline">Apply for Block Stock Point</Link></li>
                <li><Link href="/stock-point-application" className="text-sm text-muted-foreground hover:text-primary hover:underline">Apply for Panchayat Stock Point</Link></li>
                <li><Link href="/services" className="text-sm text-muted-foreground hover:text-primary hover:underline">{t.services}</Link></li>
                <li><Link href="/customer-support" className="text-sm text-muted-foreground hover:text-primary hover:underline">{t.contact}</Link></li>
                <li><Link href="/policy" className="text-sm text-muted-foreground hover:text-primary hover:underline">Policies & Terms</Link></li>
                 <li><Link href="/downloads" className="text-sm text-muted-foreground hover:text-primary hover:underline">Download Forms</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-headline text-lg font-semibold text-foreground">{t.locations}</h3>
            <ul className="mt-4 space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{t.goddaOffice}</p>
                  <p className="text-sm text-muted-foreground">Nahar Chowk, Godda, Jharkhand 814133, India.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-1 shrink-0 text-primary" />
                <div>
                  <p className="font-semibold text-foreground">{t.registeredOffice}</p>
                  <p className="text-sm text-muted-foreground">C/O Rishav Kumar, Vill-Matiahi, Madhepura, Bihar - 852121.</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-headline text-lg font-semibold text-foreground">{t.workingHours}</h3>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-3"><Clock className="w-4 h-4 shrink-0" /><span>{t.weekdays}</span></li>
              <li className="flex items-center gap-3"><Clock className="w-4 h-4 shrink-0" /><span>{t.saturday}</span></li>
              <li className="flex items-center gap-3"><Clock className="w-4 h-4 shrink-0" /><span>{t.sunday}</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>{t.copyright.replace('{year}', new Date().getFullYear().toString())}</p>
        </div>
      </div>
    </footer>
  );
}
