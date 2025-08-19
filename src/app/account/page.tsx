
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthState, useUpdateProfile } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, collection, query, where, getDocs, orderBy, Timestamp, onSnapshot, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, ShoppingBag, LogOut, Edit, X, Shield, Upload, FileDown, Eye, History, Home, PlusCircle, MoreVertical, Trash2, Heart, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { sendNotificationEmail } from '@/ai/flows/send-email-flow';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { OrderStatusStepper } from '@/components/order-status-stepper';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AddressForm } from '@/components/address-form';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { ProductCard } from '@/components/product-card';
import Link from 'next/link';

// --- Interfaces ---
interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
}
interface ShippingInfo {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
}

interface Fee {
    name: string;
    value: number;
}
interface UserProfile {
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl?: string;
    gender?: 'male' | 'female';
}

export interface Address {
    id: string;
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
}

interface Order {
  id: string;
  total: number;
  subtotal: number;
  shipping: number;
  fees: Fee[];
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Shipped' | 'Delivered';
  date: Timestamp;
  items: CartItem[];
  shippingAddress: ShippingInfo;
  email?: string;
}

type ActiveView = 'profile' | 'orders' | 'addresses' | 'cart' | 'wishlist';

export default function AccountPage() {
    const [user, loadingAuth, authError] = useAuthState(auth);
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const invoiceRef = useRef<HTMLDivElement>(null);

    const [profile, setProfile] = useState<UserProfile>({ firstName: '', lastName: '', phone: '', gender: undefined, avatarUrl: '' });
    const [initialProfile, setInitialProfile] = useState<UserProfile>({ firstName: '', lastName: '', phone: '', gender: undefined, avatarUrl: '' });
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingAddresses, setLoadingAddresses] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [activeView, setActiveView] = useState<ActiveView>('profile');
    const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
    const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
    const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    const { cart, removeFromCart, updateQuantity } = useCart();
    const { wishlist } = useWishlist();

    // Firebase hooks for profile updates
    const [updateProfileHook, updatingProfile] = useUpdateProfile(auth);
    
    useEffect(() => {
        if (!loadingAuth && !user) {
            router.push('/customer-login');
            return;
        }

        if (user) {
            const fetchProfile = async () => {
                setLoadingProfile(true);
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    if (userDocSnap.exists()) {
                        const data = userDocSnap.data() as UserProfile;
                        setProfile(data);
                        setInitialProfile(data);
                    } else {
                        const [firstName, ...lastName] = (user.displayName || '').split(' ');
                        const initialData: UserProfile = { firstName, lastName: lastName.join(' '), phone: user.phoneNumber || '', avatarUrl: user.photoURL || '' };
                        setProfile(initialData);
                        setInitialProfile(initialData);
                         await setDoc(userDocRef, initialData, { merge: true });
                    }
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Failed to load profile' });
                } finally {
                    setLoadingProfile(false);
                }
            };
            
            const q = query(collection(db, 'orders'), where('userId', '==', user.uid));
            const unsubOrders = onSnapshot(q, (querySnapshot) => {
                setLoadingOrders(true);
                const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                userOrders.sort((a, b) => b.date.toMillis() - a.date.toMillis());
                setOrders(userOrders);
                setLoadingOrders(false);
            }, (error) => {
                toast({ variant: 'destructive', title: 'Failed to load orders' });
                setLoadingOrders(false);
            });
            
            const unsubAddresses = onSnapshot(collection(db, 'users', user.uid, 'addresses'), (snapshot) => {
                setLoadingAddresses(true);
                const userAddresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Address));
                setAddresses(userAddresses);
                setLoadingAddresses(false);
            }, (error) => {
                toast({ variant: 'destructive', title: 'Failed to load addresses' });
                setLoadingAddresses(false);
            });


            fetchProfile();
            
            return () => {
                unsubOrders();
                unsubAddresses();
            }
        }

    }, [user, loadingAuth, router, toast]);


    const handleGenderChange = (value: 'male' | 'female') => {
        setProfile(prev => ({...prev, gender: value}));
    }
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if(e.target.files && e.target.files[0]) {
            setNewAvatarFile(e.target.files[0]);
            const reader = new FileReader();
            reader.onload = (event) => {
                setProfile(prev => ({ ...prev, avatarUrl: event.target?.result as string }));
            }
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    const handleProfileSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setIsSaving(true);
        try {
            let avatarUrl = profile.avatarUrl || '';
            if (newAvatarFile) {
                const storageRef = ref(storage, `avatars/${user.uid}`);
                const uploadResult = await uploadBytes(storageRef, newAvatarFile);
                avatarUrl = await getDownloadURL(uploadResult.ref);
            }

            await updateProfileHook({ displayName: `${profile.firstName} ${profile.lastName}`, photoURL: avatarUrl });
            
            const profileToSave = { ...profile, avatarUrl };
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, profileToSave, { merge: true });
            
            setInitialProfile(profileToSave);
            toast({ title: 'Profile Updated', description: 'Your information has been saved successfully.' });
            setIsEditing(false);
            setNewAvatarFile(null);
            
            if (user.email) {
                await sendNotificationEmail({
                    to: user.email,
                    subject: "Your Profile Has Been Updated",
                    text: `Hi ${profile.firstName},\n\nThis is a confirmation that your profile details were successfully updated on Vanu Organic.\n\nThank you!`,
                    html: `<p>Hi ${profile.firstName},</p><p>This is a confirmation that your profile details were successfully updated on Vanu Organic.</p><p>Thank you!</p>`
                });
            }

        } catch (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not save your profile.' });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleCancelEdit = () => {
        setProfile(initialProfile);
        setIsEditing(false);
        setNewAvatarFile(null);
    }

    const handleDownloadInvoice = async (order: Order) => {
        setSelectedOrderForInvoice(order);
        
        await new Promise(resolve => setTimeout(resolve, 0));

        const invoiceElement = invoiceRef.current;
        if (!invoiceElement) {
            toast({ variant: "destructive", title: "Could not generate invoice." });
            return;
        }

        const canvas = await html2canvas(invoiceElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`vanu-invoice-${order.id.slice(0, 7)}.pdf`);

        setSelectedOrderForInvoice(null);
    };

    const handleOpenAddressDialog = (address: Address | null = null) => {
        setEditingAddress(address);
        setIsAddressDialogOpen(true);
    };

    const handleSaveAddress = async (addressData: Omit<Address, 'id'>) => {
        if (!user) return;
        try {
            if (editingAddress) {
                // Update
                const addressRef = doc(db, 'users', user.uid, 'addresses', editingAddress.id);
                await updateDoc(addressRef, addressData);
                toast({ title: 'Address updated' });
            } else {
                // Create
                await addDoc(collection(db, 'users', user.uid, 'addresses'), addressData);
                toast({ title: 'Address added' });
            }
            setIsAddressDialogOpen(false);
            setEditingAddress(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Failed to save address' });
        }
    };
    
    const handleDeleteAddress = async (addressId: string) => {
        if (!user || !window.confirm("Are you sure you want to delete this address?")) return;
        try {
            await deleteDoc(doc(db, 'users', user.uid, 'addresses', addressId));
            toast({ title: 'Address deleted' });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Failed to delete address' });
        }
    };

    if (loadingAuth || !user) {
        return (
            <div className="flex h-screen w-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    const ProfileView = () => (
        <dl className="divide-y text-sm">
            <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="font-medium text-muted-foreground">Full Name</dt>
                <dd className="col-span-2 text-foreground">{profile.firstName} {profile.lastName}</dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="font-medium text-muted-foreground">Email address</dt>
                <dd className="col-span-2 text-foreground">{user.email}</dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="font-medium text-muted-foreground">Phone Number</dt>
                <dd className="col-span-2 text-foreground">{profile.phone || '-'}</dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="font-medium text-muted-foreground">Gender</dt>
                <dd className="col-span-2 text-foreground capitalize">{profile.gender || '-'}</dd>
            </div>
        </dl>
    );

    const ProfileEdit = () => (
         <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="relative w-32 h-32 mx-auto">
                 <Avatar className="h-32 w-32 border-2 border-background shadow-md cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <AvatarImage src={profile.avatarUrl} alt="User Avatar" />
                     <AvatarFallback className="text-4xl bg-muted">
                        <User className="h-16 w-16 text-muted-foreground" />
                     </AvatarFallback>
                </Avatar>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute bottom-1 right-1 bg-primary text-primary-foreground rounded-full p-2 hover:bg-primary/90">
                    <Upload className="h-4 w-4"/>
                </button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} accept="image/*" className="hidden"/>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={profile.firstName || ''} onChange={(e) => setProfile(prev => ({...prev, firstName: e.target.value}))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={profile.lastName || ''} onChange={(e) => setProfile(prev => ({...prev, lastName: e.target.value}))}/>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" type="tel" value={profile.phone || ''} onChange={(e) => setProfile(prev => ({...prev, phone: e.target.value}))}/>
                </div>
                 <div className="space-y-2">
                    <Label>Gender</Label>
                     <RadioGroup value={profile.gender} onValueChange={handleGenderChange} className="flex gap-4 pt-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="male" id="male" />
                            <Label htmlFor="male">Male</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="female" id="female" />
                            <Label htmlFor="female">Female</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>
            <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>
                    Cancel
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Save Changes
                </Button>
            </div>
        </form>
    );

    const OrdersView = () => (
        loadingOrders ? <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div> : orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">You haven't placed any orders yet.</p>
        ) : (
            <div className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map(order => (
                            <TableRow key={order.id}>
                                <TableCell className="font-mono text-xs">{order.id.slice(0, 7)}...</TableCell>
                                <TableCell>{order.date.toDate().toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge variant={order.status === 'Rejected' ? 'destructive' : 'secondary'}>{order.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                                <TableCell className="text-right flex gap-2 justify-end">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-3xl">
                                            <DialogHeader>
                                                <DialogTitle>Order Details</DialogTitle>
                                                <DialogDescription>
                                                    Order ID: {order.id}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4 space-y-6">
                                                <OrderStatusStepper currentStatus={order.status}/>
                                                <div className="grid md:grid-cols-2 gap-6">
                                                    <div>
                                                        <h3 className="font-semibold mb-2">Shipping Address</h3>
                                                        <div className="text-sm text-muted-foreground space-y-1">
                                                            <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                                                            <p>{order.shippingAddress.phone}</p>
                                                            <p>{order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}</p>
                                                        </div>
                                                    </div>
                                                    <div className="md:col-span-2">
                                                        <h3 className="font-semibold mb-2">Price Breakdown</h3>
                                                        <div className="space-y-2 text-sm border p-4 rounded-md">
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Subtotal</span>
                                                                <span>₹{order.subtotal.toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-muted-foreground">Shipping</span>
                                                                <span>₹{order.shipping.toFixed(2)}</span>
                                                            </div>
                                                            {order.fees && order.fees.map(fee => (
                                                                <div key={fee.name} className="flex justify-between">
                                                                    <span className="text-muted-foreground">{fee.name}</span>
                                                                    <span>₹{fee.value.toFixed(2)}</span>
                                                                </div>
                                                            ))}
                                                            <Separator />
                                                            <div className="flex justify-between font-bold text-base">
                                                                <span className="text-foreground">Grand Total</span>
                                                                <span>₹{order.total.toFixed(2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>

                                    <Button variant="ghost" size="icon" onClick={() => handleDownloadInvoice(order)}>
                                        <FileDown className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )
    );
    
    const AddressesView = () => (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenAddressDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Address
                </Button>
            </div>
            {loadingAddresses ? (
                <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
            ) : addresses.length === 0 ? (
                 <p className="text-muted-foreground text-center py-8">You haven't saved any addresses yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(address => (
                        <Card key={address.id}>
                            <CardContent className="p-4 flex justify-between items-start">
                                <div className="text-sm">
                                    <p className="font-bold">{address.firstName} {address.lastName}</p>
                                    <p className="text-muted-foreground">{address.phone}</p>
                                    <p className="text-muted-foreground mt-2">{address.address}</p>
                                    <p className="text-muted-foreground">{address.city}, {address.state} - {address.zip}</p>
                                </div>
                                 <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={() => handleOpenAddressDialog(address)}>
                                            <Edit className="mr-2 h-4 w-4"/> Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDeleteAddress(address.id)} className="text-destructive">
                                            <Trash2 className="mr-2 h-4 w-4"/> Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            <Dialog open={isAddressDialogOpen} onOpenChange={setIsAddressDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                    </DialogHeader>
                    <AddressForm 
                        initialData={editingAddress} 
                        onSubmit={handleSaveAddress}
                        onCancel={() => setIsAddressDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );

    const CartView = () => (
         cart.length === 0 ? (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Your cart is empty.</p>
                <Link href="/products"><Button variant="link">Go shopping</Button></Link>
            </div>
        ) : (
            <div className="space-y-4">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cart.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>{item.name}</TableCell>
                                <TableCell>₹{item.price.toFixed(2)}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className="text-right">
                                    <Button size="sm" variant="outline" onClick={() => removeFromCart(item.id)}>Remove</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                 <div className="flex justify-end">
                    <Link href="/cart">
                        <Button>Go to Cart</Button>
                    </Link>
                </div>
            </div>
        )
    );

    const WishlistView = () => (
         wishlist.length === 0 ? (
            <div className="text-center py-8">
                <p className="text-muted-foreground">Your wishlist is empty.</p>
                 <Link href="/products"><Button variant="link">Discover products</Button></Link>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {wishlist.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        )
    );


    // This component will be hidden and used only for PDF generation
    const InvoiceTemplate = ({ order }: { order: Order | null }) => {
        if (!order) return null;
        return (
            <div ref={invoiceRef} className="p-8 bg-white text-black" style={{ width: '210mm', minHeight: '297mm', fontFamily: 'sans-serif' }}>
                 <div className="flex justify-between items-center pb-4 border-b">
                    <div>
                        <h1 className="text-2xl font-bold">Vanu Organic</h1>
                        <p>Nahar Chowk, Godda, Jharkhand 814133</p>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-700">INVOICE</h2>
                </div>
                <div className="flex justify-between mt-8">
                    <div>
                        <h3 className="font-semibold">Bill To:</h3>
                        <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                        <p>{order.shippingAddress.address}</p>
                        <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zip}</p>
                        <p>{order.shippingAddress.phone}</p>
                    </div>
                    <div>
                        <p><span className="font-semibold">Invoice #:</span> {order.id.slice(0, 7).toUpperCase()}</p>
                        <p><span className="font-semibold">Date:</span> {order.date.toDate().toLocaleDateString()}</p>
                    </div>
                </div>
                <table className="w-full mt-8 text-left">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="p-2">Item</th>
                            <th className="p-2">Quantity</th>
                            <th className="p-2 text-right">Unit Price</th>
                            <th className="p-2 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order.items.map(item => (
                            <tr key={item.id} className="border-b">
                                <td className="p-2">{item.name}</td>
                                <td className="p-2">{item.quantity}</td>
                                <td className="p-2 text-right">₹{item.price.toFixed(2)}</td>
                                <td className="p-2 text-right">₹{(item.price * item.quantity).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 <div className="flex justify-end mt-8">
                    <div className="w-1/2">
                        <div className="flex justify-between p-2">
                            <span>Subtotal</span>
                            <span>₹{order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between p-2">
                            <span>Shipping</span>
                            <span>₹{order.shipping.toFixed(2)}</span>
                        </div>
                        {order.fees.map(fee => (
                            <div key={fee.name} className="flex justify-between p-2">
                                <span>{fee.name}</span>
                                <span>₹{fee.value.toFixed(2)}</span>
                            </div>
                        ))}
                        <div className="flex justify-between p-2 font-bold border-t mt-2">
                            <span>Grand Total</span>
                            <span>₹{order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div className="mt-16 text-center text-sm text-gray-600">
                    <p>Thank you for your business!</p>
                </div>
            </div>
        )
    }

    return (
        <>
            <div className="flex min-h-screen flex-col bg-muted/20">
                <Header />
                <main className="flex-1 py-16">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="grid md:grid-cols-4 gap-8">
                            {/* Sidebar */}
                            <aside className="md:col-span-1">
                                <Card className="p-4">
                                    <div className="flex flex-col items-center gap-4">
                                        <Avatar className="h-24 w-24 border-2 border-background shadow-md">
                                            <AvatarImage src={profile.avatarUrl} alt="User Avatar" />
                                            <AvatarFallback className="bg-muted">
                                                <User className="h-12 w-12 text-muted-foreground" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-center">
                                            <h2 className="text-xl font-bold">{profile.firstName} {profile.lastName}</h2>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                    </div>
                                    <nav className="mt-6 flex flex-col gap-2">
                                        <Button 
                                            variant={activeView === 'profile' ? 'secondary' : 'ghost'} 
                                            className="justify-start"
                                            onClick={() => setActiveView('profile')}>
                                            <User className="mr-2 h-4 w-4"/>
                                            Profile Details
                                        </Button>
                                         <Button 
                                            variant={activeView === 'addresses' ? 'secondary' : 'ghost'} 
                                            className="justify-start"
                                            onClick={() => setActiveView('addresses')}>
                                            <Home className="mr-2 h-4 w-4"/>
                                            My Addresses
                                        </Button>
                                        <Button 
                                            variant={activeView === 'orders' ? 'secondary' : 'ghost'} 
                                            className="justify-start"
                                            onClick={() => setActiveView('orders')}>
                                            <History className="mr-2 h-4 w-4"/>
                                            My Orders
                                        </Button>
                                        <Button 
                                            variant={activeView === 'cart' ? 'secondary' : 'ghost'} 
                                            className="justify-start"
                                            onClick={() => setActiveView('cart')}>
                                            <ShoppingCart className="mr-2 h-4 w-4"/>
                                            My Cart
                                        </Button>
                                         <Button 
                                            variant={activeView === 'wishlist' ? 'secondary' : 'ghost'} 
                                            className="justify-start"
                                            onClick={() => setActiveView('wishlist')}>
                                            <Heart className="mr-2 h-4 w-4"/>
                                            My Wishlist
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            className="justify-start text-destructive hover:text-destructive"
                                            onClick={() => { auth.signOut(); router.push('/')}}>
                                            <LogOut className="mr-2 h-4 w-4"/>
                                            Logout
                                        </Button>
                                    </nav>
                                </Card>
                            </aside>

                            {/* Content */}
                            <div className="md:col-span-3">
                                <Card>
                                    <CardHeader>
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-2xl capitalize">
                                                {activeView === 'profile' && 'Profile Information'}
                                                {activeView === 'orders' && 'Order History'}
                                                {activeView === 'addresses' && 'Manage Addresses'}
                                                {activeView === 'cart' && 'Items in Your Cart'}
                                                {activeView === 'wishlist' && 'Your Wishlist'}
                                            </CardTitle>
                                            {activeView === 'profile' && !isEditing && (
                                                <Button variant="outline" onClick={() => setIsEditing(true)}>
                                                    <Edit className="mr-2 h-4 w-4"/> Edit Profile
                                                </Button>
                                            )}
                                            {activeView === 'profile' && isEditing && (
                                                <Button variant="outline" onClick={handleCancelEdit}>
                                                    <X className="mr-2 h-4 w-4"/> Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {loadingProfile ? <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div> : (
                                            activeView === 'profile' ? (
                                                isEditing ? <ProfileEdit /> : <ProfileView />
                                            ) : activeView === 'orders' ? (
                                                <OrdersView />
                                            ) : activeView === 'addresses' ? (
                                                <AddressesView />
                                            ) : activeView === 'cart' ? (
                                                <CartView />
                                            ) : (
                                                <WishlistView />
                                            )
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>

            {/* Hidden invoice for PDF generation */}
            <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                <InvoiceTemplate order={selectedOrderForInvoice} />
            </div>
        </>
    );
}
