
"use client"

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Shield, AlertTriangle } from "lucide-react";

export default function PolicyPage() {
    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            <Header />
            <main className="flex-1 py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-12">
                        <Badge variant="outline">Our Policies</Badge>
                        <h1 className="mt-4 text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">Terms, Conditions & Policies</h1>
                        <p className="mt-6 max-w-3xl mx-auto text-muted-foreground">
                            Please read our terms, conditions, and policies carefully before using our services.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto space-y-12">
                        {/* Terms and Conditions Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <FileText className="w-8 h-8 text-primary"/>
                                    <CardTitle className="text-2xl font-headline">Terms &amp; Conditions</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground prose prose-sm max-w-none">
                                <p>Welcome to <strong>Vanu Organic Pvt. Ltd.</strong>. By accessing our website and placing orders, you agree to the following terms and conditions:</p>
                                <h3>1. Products & Pricing</h3>
                                <ul>
                                  <li>All prices are inclusive of applicable taxes unless stated otherwise.</li>
                                  <li>We reserve the right to modify or discontinue products without notice.</li>
                                </ul>
                                <h3>2. Orders</h3>
                                <ul>
                                  <li>Orders once placed will be processed within 24–48 hours.</li>
                                  <li>In case of out-of-stock items, we will contact you for alternatives or refund.</li>
                                </ul>
                                <h3>3. Shipping & Delivery</h3>
                                <ul>
                                  <li>Delivery timelines depend on your location and courier service.</li>
                                  <li>We are not responsible for delays due to unforeseen circumstances (natural calamities, strikes, etc.).</li>
                                </ul>
                                <h3>4. Returns & Refunds</h3>
                                <ul>
                                  <li>Due to the organic nature of our products, returns are accepted only for damaged or incorrect items within 3 days of delivery.</li>
                                  <li>Refunds (if applicable) will be processed within 7 business days.</li>
                                </ul>
                                <h3>5. User Responsibilities</h3>
                                <ul>
                                  <li>You agree not to misuse the website or perform any illegal activity through our platform.</li>
                                  <li>All content on this site is the property of Vanu Organic Pvt. Ltd. and should not be copied without permission.</li>
                                </ul>
                                <h3>6. Governing Law</h3>
                                <p>All disputes will be subject to the jurisdiction of courts in Bihar, India.</p>
                                <h3>7. Contact</h3>
                                <p>For any queries, reach out to us at: <br/><strong>Email:</strong> info@vanuorganic.com<br/><strong>Phone:</strong> +91-6422357207</p>
                            </CardContent>
                        </Card>
                        
                        {/* Privacy Policy Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <Shield className="w-8 h-8 text-primary"/>
                                    <CardTitle className="text-2xl font-headline">Privacy Policy</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4 text-muted-foreground prose prose-sm max-w-none">
                                <p>At <strong>Vanu Organic Pvt. Ltd.</strong>, we respect your privacy and are committed to protecting the personal information you share with us. This Privacy Policy outlines how we collect, use, and safeguard your data when you use our website.</p>
                                <h3>1. Information We Collect</h3>
                                <ul>
                                <li>Personal Information: Name, email address, phone number, address, etc. during sign-up, purchase, or contact form submissions.</li>
                                <li>Payment Information: We use third-party secure payment gateways. We do not store card or UPI details.</li>
                                <li>Cookies: We may use cookies for user experience and analytics.</li>
                                </ul>
                                <h3>2. How We Use Your Information</h3>
                                <ul>
                                <li>To process orders and deliver products.</li>
                                <li>To improve our services and website performance.</li>
                                <li>To send updates, offers, and relevant communications (only if opted-in).</li>
                                </ul>
                                <h3>3. Data Security</h3>
                                <p>We use industry-standard security practices to protect your data from unauthorized access. However, we cannot guarantee 100% security over the internet.</p>
                                <h3>4. Sharing Your Information</h3>
                                <p>We do not sell, trade, or rent your personal information to others. We may share with trusted third parties only to fulfill services (e.g., delivery partners, payment gateways).</p>
                                <h3>5. Your Rights</h3>
                                <p>You can request to view, update, or delete your personal data by contacting us.</p>
                                <h3>6. Changes to This Policy</h3>
                                <p>We reserve the right to update this policy at any time. Changes will be posted on this page.</p>
                                <h3>7. Contact Us</h3>
                                <p>If you have any questions regarding this Privacy Policy, please contact us at: <br/><strong>Email:</strong> info@vanuorganic.com<br/><strong>Phone:</strong> +91-6422357207</p>
                            </CardContent>
                        </Card>

                        {/* Disclaimer Section */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    <AlertTriangle className="w-8 h-8 text-primary"/>
                                    <CardTitle className="text-2xl font-headline">Disclaimer</CardTitle>
                                </div>
                            </CardHeader>
                             <CardContent className="space-y-4 text-muted-foreground">
                                <p>The information provided by Vanu Organic Pvt Ltd on our website is for general informational purposes only. All information is provided in good faith, however, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, validity, reliability, or completeness of any information on the site.</p>
                                <p>Under no circumstance shall we have any liability to you for any loss or damage of any kind incurred as a result of the use of the site or reliance on any information provided. Your use of the site and your reliance on any information is solely at your own risk.</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
