
"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
import { useCart } from '@/context/cart-context';
import { db, auth } from '@/lib/firebase';
import { collection, addDoc, doc, getDoc, serverTimestamp, onSnapshot, updateDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import Image from "next/image";

import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Home, Info, QrCode } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Address } from '@/app/account/page';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddressForm } from '@/components/address-form';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

interface Fee {
    name: string;
    value: number;
}

declare global {
    interface Window {
        Razorpay: any;
    }
}


export default function CheckoutPage() {
  const { translations } = useLanguage();
  const { cart, clearCart } = useCart();
  const t = translations.checkout;
  const router = useRouter();
  const { toast } = useToast();
  const [user, loadingAuth] = useAuthState(auth);

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shipping, setShipping] = useState(0);
  const [additionalFees, setAdditionalFees] = useState<Fee[]>([]);
  const [minCartValue, setMinCartValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [utr, setUtr] = useState('');


  useEffect(() => {
    if (!loadingAuth) {
        if (!user) {
            router.push('/customer-login');
            return;
        }

        if (cart.length === 0 && !isSubmitting) {
            router.push('/products');
        }
    }
  }, [user, loadingAuth, cart, isSubmitting, router]);

  useEffect(() => {
    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const shippingDoc = await getDoc(doc(db, 'settings', 'shipping'));
            if (shippingDoc.exists()) {
                setShipping(shippingDoc.data().charge || 0);
            }

            const feesDoc = await getDoc(doc(db, 'settings', 'fees'));
            if (feesDoc.exists()) {
                setAdditionalFees(feesDoc.data().charges || []);
            }

             const minCartDoc = await getDoc(doc(db, 'settings', 'minCartValue'));
            if (minCartDoc.exists()) {
                setMinCartValue(minCartDoc.data().value || 0);
            }

        } catch (error) {
            console.error("Error fetching settings:", error);
            setShipping(50); // Fallback
        } finally {
            setLoading(false);
        }
    };
    
    fetchInitialData();
    
    if (user) {
        const unsubAddresses = onSnapshot(collection(db, 'users', user.uid, 'addresses'), (snapshot) => {
            const userAddresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
            setAddresses(userAddresses);
            if (!selectedAddress && userAddresses.length > 0) {
                setSelectedAddress(userAddresses[0]);
            }
        });
        return () => unsubAddresses();
    }
  }, [user, selectedAddress]);

  const getPriceAsNumber = (price: string | number) => {
    if (typeof price === 'number') return price;
    return parseFloat(price.replace(/[^0-9.]/g, ''));
  };

  const subtotal = cart.reduce((sum, item) => sum + (getPriceAsNumber(item.price) * item.quantity), 0);
  const totalFees = additionalFees.reduce((sum, fee) => sum + fee.value, 0);
  const total = subtotal + shipping + totalFees;

  const isMinCartValueMet = subtotal >= minCartValue;

  const processOrder = async (paymentDetails: any) => {
    if (!user || !selectedAddress) {
      toast({ variant: 'destructive', title: 'User or address missing.' });
      return;
    }
    
    setIsSubmitting(true);
    
    const orderData = {
        userId: user.uid,
        customerName: `${selectedAddress.firstName} ${selectedAddress.lastName}`,
        email: user?.email,
        shippingAddress: selectedAddress,
        items: cart.map(({ imageHover, aiHint, ...item }) => item),
        subtotal, shipping, fees: additionalFees, total,
        status: 'Pending',
        ...paymentDetails,
        date: serverTimestamp(),
    };
    
    try {
        const orderDocRef = await addDoc(collection(db, "orders"), orderData);

        for (const item of cart) {
            const productRef = doc(db, 'products', item.id);
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
                const currentStock = productSnap.data().stock || 0;
                const newStock = Math.max(0, currentStock - item.quantity);
                await updateDoc(productRef, { stock: newStock });
            }
        }
        clearCart();
        toast({ title: 'Order Placed!', description: 'Thank you for your purchase.' });
        router.push(`/order-confirmation?id=${orderDocRef.id}`);

    } catch (error) {
        console.error("Error placing order:", error);
        toast({ variant: 'destructive', title: 'Order Failed', description: 'There was an issue placing your order. Please try again.' });
    } finally {
        setIsSubmitting(false);
        setIsQrDialogOpen(false);
    }
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress) {
        toast({ variant: 'destructive', title: 'Please select or add a shipping address.' });
        return;
    }
    if (cart.length === 0) {
        toast({ variant: 'destructive', title: 'Your cart is empty' });
        return;
    }
    if (!isMinCartValueMet) {
        toast({ variant: 'destructive', title: `A minimum order value of ₹${minCartValue} is required.` });
        return;
    }
    
    if (paymentMethod === 'cod') {
        processOrder({ paymentMethod: 'cod' });
    } else if (paymentMethod === 'qr') {
        setIsQrDialogOpen(true);
    } else {
        toast({ variant: 'destructive', title: 'Please select a valid payment method.' });
    }
  };

  const handleQrSubmit = () => {
      if (!utr) {
           toast({ variant: 'destructive', title: 'UTR is required', description: 'Please enter the transaction ID to confirm payment.' });
           return;
      }
      processOrder({ paymentMethod: 'qr', paymentId: `Paid by QR: ${utr}` });
  }

   const handleSaveAddress = async (addressData: Omit<Address, 'id'>) => {
        if (!user) return;
        try {
            await addDoc(collection(db, 'users', user.uid, 'addresses'), addressData);
            toast({ title: 'Address added' });
            setIsAddressDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to save address' });
        }
    };

  if (loadingAuth || loading || !user) {
    return (
        <div className="flex h-screen w-screen items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }

  return (
    <>
        <div className="flex min-h-screen flex-col bg-background">
          <Header />
          <main className="flex-1 py-16 md:py-24">
            <form onSubmit={handlePlaceOrder}>
                <div className="container mx-auto px-4 md:px-6">
                    <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl mb-8">{t.title}</h1>
                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="md:col-span-2">
                            <div className="space-y-8">
                                {/* Shipping Information */}
                                <Card>
                                    <CardHeader className="flex flex-row justify-between items-center">
                                        <CardTitle className="font-headline">{t.shippingTitle}</CardTitle>
                                        <Button type="button" variant="outline" size="sm" onClick={() => setIsAddressDialogOpen(true)}>
                                            <PlusCircle className="mr-2 h-4 w-4"/> {t.addNewAddress}
                                        </Button>
                                    </CardHeader>
                                    <CardContent>
                                        <RadioGroup value={selectedAddress?.id} onValueChange={(id) => setSelectedAddress(addresses.find(a => a.id === id) || null)}>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {addresses.map(address => (
                                                    <div key={address.id}>
                                                        <RadioGroupItem value={address.id} id={`addr-${address.id}`} className="peer sr-only"/>
                                                        <Label htmlFor={`addr-${address.id}`} className="flex flex-col rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                                            <span className="font-bold mb-2">{address.firstName} {address.lastName}</span>
                                                            <span className="text-sm">{address.address}</span>
                                                            <span className="text-sm">{address.city}, {address.state} - {address.zip}</span>
                                                            <span className="text-sm mt-1">{address.phone}</span>
                                                        </Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </RadioGroup>
                                        {addresses.length === 0 && (
                                            <div className="text-center text-muted-foreground py-8">
                                                <p>{t.noAddressFound}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Payment Method */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="font-headline">{t.paymentTitle}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                            <div>
                                                <RadioGroupItem value="card" id="card" className="peer sr-only" disabled/>
                                                <Label htmlFor="card" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 text-muted-foreground peer-disabled:cursor-not-allowed peer-disabled:opacity-50">
                                                    {t.creditCard} (Soon)
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="qr" id="qr" className="peer sr-only" />
                                                <Label htmlFor="qr" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                                    <QrCode className="mr-2 h-4 w-4"/> Pay with QR Code
                                                </Label>
                                            </div>
                                            <div>
                                                <RadioGroupItem value="cod" id="cod" className="peer sr-only" />
                                                <Label htmlFor="cod" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer">
                                                    {t.cod}
                                                </Label>
                                            </div>
                                        </RadioGroup>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="md:col-span-1">
                             <Card>
                                <CardHeader>
                                    <CardTitle className="font-headline">{t.orderSummaryTitle}</CardTitle>
                                    <CardDescription>{t.summaryDescription}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {cart.map(item => (
                                        <div key={item.id} className="flex justify-between text-muted-foreground text-sm">
                                            <span>{item.quantity} x {item.name}</span>
                                            <span>₹{(getPriceAsNumber(item.price) * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <Separator/>
                                     <div className="flex justify-between">
                                        <span>{t.subtotal}</span>
                                        <span>₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t.shipping}</span>
                                        <span>₹{shipping.toFixed(2)}</span>
                                    </div>
                                    {additionalFees.map(fee => (
                                        <div key={fee.name} className="flex justify-between">
                                            <span>{fee.name}</span>
                                            <span>₹{fee.value.toFixed(2)}</span>
                                        </div>
                                    ))}
                                    <Separator/>
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>{t.total}</span>
                                        <span>₹{total.toFixed(2)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                             {!isMinCartValueMet && minCartValue > 0 && (
                                <Alert variant="destructive" className="mt-4">
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                       Minimum order value of ₹{minCartValue.toFixed(2)} is required to place an order.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <Button type="submit" className="w-full mt-6" disabled={isSubmitting || cart.length === 0 || !selectedAddress || !isMinCartValueMet}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                                {isSubmitting ? t.placingOrder : t.placeOrderButton}
                            </Button>
                        </div>
                    </div>
                </div>
            </form>
             <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Shipping Address</DialogTitle>
                    </DialogHeader>
                    <AddressForm
                        onSubmit={handleSaveAddress}
                        onCancel={() => setIsAddressDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
            <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Scan QR Code to Pay</DialogTitle>
                        <DialogDescription>
                            Please scan the QR code below to pay the total amount of <strong>₹{total.toFixed(2)}</strong>. Once paid, confirm the transaction.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-center p-4">
                        <Image src="https://github.com/VanuPr/vanu-assets/blob/main/Qr%20Code.png?raw=true" alt="Payment QR Code" width={300} height={300} data-ai-hint="payment qr" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="utr">Enter UTR / Transaction ID<span className="text-destructive">*</span></Label>
                        <Input id="utr" value={utr} onChange={(e) => setUtr(e.target.value)} placeholder="Enter the transaction reference number" />
                    </div>
                    <DialogFooter>
                         <Button variant="ghost" onClick={() => setIsQrDialogOpen(false)}>Cancel</Button>
                         <Button onClick={handleQrSubmit} disabled={isSubmitting || !utr}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Payment & Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
          </main>
          <Footer />
        </div>
    </>
  );
}
