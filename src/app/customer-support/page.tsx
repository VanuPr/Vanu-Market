
"use client"

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/context/language-context";

export default function CustomerSupportPage() {
    const { translations } = useLanguage();
    const t = translations.supportPage;
    const tf = translations.footer;
    
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">{t.title}</h1>
                <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">{t.subtitle}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-16 items-start">
                {/* Contact Form */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">{t.formTitle}</CardTitle>
                        <CardDescription>{t.formDesc}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">{t.name}</Label>
                            <Input id="name" placeholder={t.namePlaceholder} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t.email}</Label>
                            <Input id="email" type="email" placeholder={t.emailPlaceholder} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="message">{t.message}</Label>
                            <Textarea id="message" placeholder={t.messagePlaceholder} />
                        </div>
                        <Button className="w-full">{t.submit}</Button>
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">{t.contactInfoTitle}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-4">
                                <Phone className="w-6 h-6 mt-1 text-primary" />
                                <div>
                                    <h3 className="font-semibold">{t.phone}</h3>
                                    <a href="tel:+916422357207" className="text-muted-foreground hover:underline">+91-6422357207</a>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Mail className="w-6 h-6 mt-1 text-primary" />
                                <div>
                                    <h3 className="font-semibold">{t.emailContact}</h3>
                                    <a href="mailto:info@vanuorganic.com" className="text-muted-foreground hover:underline">info@vanuorganic.com</a>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                         <CardHeader>
                            <CardTitle className="font-headline">{tf.locations}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="flex items-start gap-4">
                                <MapPin className="w-6 h-6 mt-1 text-primary" />
                                <div>
                                <p className="font-semibold">{tf.goddaOffice}</p>
                                <p className="text-muted-foreground">Nahar Chowk, Godda, Jharkhand 814133, India.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <MapPin className="w-6 h-6 mt-1 text-primary" />
                                <div>
                                <p className="font-semibold">{tf.registeredOffice}</p>
                                <p className="text-muted-foreground">C/O Rishav Kumar, Vill-Matiahi, Madhepura, Bihar - 852121.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
