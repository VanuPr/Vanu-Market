
"use client";

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, FileDown, ShieldQuestion } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { OrderStatusStepper } from '@/components/order-status-stepper';
import { useToast } from '@/hooks/use-toast';

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
interface Order {
  id: string;
  total: number;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Shipped' | 'Delivered' | 'Cancellation Requested';
  date: Timestamp;
  items: CartItem[];
  shippingAddress: ShippingInfo;
}

export default function DistributorOrdersPage() {
    const [user] = useAuthState(auth);
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => {
        if (user) {
            const q = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('date', 'desc'));
            const unsubOrders = onSnapshot(q, (querySnapshot) => {
                const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                setOrders(userOrders);
                setLoadingOrders(false);
            }, (error) => {
                toast({ variant: 'destructive', title: 'Failed to load orders' });
                setLoadingOrders(false);
            });
            return () => unsubOrders();
        }
    }, [user, toast]);
    
    const handleCancellationRequest = async (orderId: string) => {
        try {
            await updateDoc(doc(db, "orders", orderId), {
                status: "Cancellation Requested"
            });
            toast({ title: "Request Sent", description: "Your cancellation request has been submitted for review." });
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not send cancellation request." });
        }
    };

    if (loadingOrders) {
        return <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground sm:text-4xl">My Orders</h1>
            {orders.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">You haven't placed any orders yet.</p>
            ) : (
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
                                    <Badge variant={order.status === 'Rejected' || order.status === 'Cancellation Requested' ? 'destructive' : 'secondary'}>{order.status}</Badge>
                                </TableCell>
                                <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                                <TableCell className="text-right flex gap-2 justify-end">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-xl">
                                            <DialogHeader>
                                                <DialogTitle>Order Details</DialogTitle>
                                                <DialogDescription>Order ID: {order.id}</DialogDescription>
                                            </DialogHeader>
                                            <div className="py-4 space-y-6">
                                                <OrderStatusStepper currentStatus={order.status} />
                                                <div>
                                                    <h3 className="font-semibold mb-2">Items</h3>
                                                    <ul className="text-sm text-muted-foreground list-disc pl-5">
                                                        {order.items.map(item => <li key={item.id}>{item.quantity} x {item.name}</li>)}
                                                    </ul>
                                                </div>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" disabled={order.status !== 'Pending' && order.status !== 'Accepted'}>
                                                <ShieldQuestion className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Request Order Cancellation</DialogTitle>
                                                <DialogDescription>
                                                    Are you sure you want to request to cancel this order? This action cannot be undone. The admin will review your request.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button variant="ghost">Cancel</Button>
                                                </DialogClose>
                                                <DialogClose asChild>
                                                    <Button variant="destructive" onClick={() => handleCancellationRequest(order.id)}>
                                                        Yes, Request Cancellation
                                                    </Button>
                                                </DialogClose>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
