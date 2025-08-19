
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, updateDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Eye, Truck, Check, PackageX, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { OrderStatusStepper } from '@/components/order-status-stepper';
import { sendNotificationEmail } from '@/ai/flows/send-email-flow';

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
interface Order {
  id: string;
  userId: string;
  customerName: string;
  total: number;
  subtotal: number;
  shipping: number;
  fees: Fee[];
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Shipped' | 'Delivered' | 'Cancellation Requested';
  date: Timestamp;
  items: CartItem[];
  shippingAddress: ShippingInfo;
  email?: string;
}

type OrderStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Shipped' | 'Delivered' | 'Cancellation Requested';
const orderStatuses: OrderStatus[] = ['Pending', 'Accepted', 'Shipped', 'Delivered', 'Rejected', 'Cancellation Requested'];


export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All'>('All');
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const ordersData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(ordersData);
        setLoading(false);
    }, (error) => {
        toast({ variant: "destructive", title: "Error fetching orders" });
        setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter(order => statusFilter === 'All' || order.status === statusFilter)
      .filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.email && order.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [orders, searchTerm, statusFilter]);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, order: Order) => {
    try {
        const orderRef = doc(db, 'orders', orderId);
        await updateDoc(orderRef, { status: newStatus });

        if (order.email) {
            const subject = `Your Vanu Organic Order is ${newStatus}`;
            const text = `Hi ${order.customerName},\n\nThe status of your order #${order.id.slice(0,7)} has been updated to: ${newStatus}.\n\nThank you for shopping with us!\n The Vanu Organic Team`;
            const html = `<p>Hi ${order.customerName},</p><p>The status of your order <strong>#${order.id.slice(0,7)}</strong> has been updated to: <strong>${newStatus}</strong>.</p><p>Thank you for shopping with us!</p><p>The Vanu Organic Team</p>`;
            
            await sendNotificationEmail({ to: order.email, subject, text, html });
        }
        
        toast({ title: "Order Status Updated", description: `Order ${orderId.slice(0,7)} is now ${newStatus}` });
    } catch (error) {
        toast({ variant: 'destructive', title: "Update Failed", description: "Could not update order status." });
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch(status) {
        case 'Rejected':
            return <Badge variant="destructive">{status}</Badge>;
        case 'Cancellation Requested':
             return <Badge variant="destructive" className="animate-pulse"><ShieldAlert className="h-3 w-3 mr-1" />{status}</Badge>;
        default:
             return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h1 className="text-3xl font-bold">Order Management</h1>
        <div className="flex items-center gap-2 flex-1 min-w-[250px] sm:min-w-auto sm:max-w-md">
            <Input 
                placeholder="Search by ID, name, email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OrderStatus | 'All')}>
                <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="All">All Statuses</SelectItem>
                    {orderStatuses.map(status => (
                         <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      
        <Card>
            <CardHeader>
                <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
                <CardDescription>View and manage all customer orders.</CardDescription>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-lg text-muted-foreground mb-4">No orders found.</p>
                    </div>
                ) : (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                            <TableCell className="font-mono text-xs">{order.id.slice(0, 7).toUpperCase()}</TableCell>
                            <TableCell>{order.date.toDate().toLocaleDateString()}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>₹{order.total.toFixed(2)}</TableCell>
                            <TableCell>
                                {getStatusBadge(order.status)}
                            </TableCell>
                            <TableCell className="flex gap-2 justify-end">
                                <Select value={order.status} onValueChange={(v) => handleStatusChange(order.id, v as OrderStatus, order)}>
                                    <SelectTrigger className="w-[180px] h-9">
                                        <SelectValue placeholder="Update Status"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {orderStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>

                                <Dialog>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
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
                                                <div>
                                                    <h3 className="font-semibold mb-2">Items Ordered</h3>
                                                     <div className="text-sm text-muted-foreground space-y-1 border p-2 rounded-md">
                                                        {order.items.map(item => (
                                                            <p key={item.id}>{item.quantity} x {item.name}</p>
                                                        ))}
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
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
