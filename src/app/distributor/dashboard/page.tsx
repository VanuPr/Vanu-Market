
"use client"

import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, IndianRupee, ShoppingBag, History } from 'lucide-react';
import { TypewriterWelcome } from '@/components/typewriter-welcome';

interface Order {
    id: string;
    total: number;
    status: 'Pending' | 'Accepted' | 'Rejected' | 'Shipped' | 'Delivered' | 'Cancellation Requested';
    date: Timestamp;
}

export default function DistributorDashboardPage() {
    const [user, loadingAuth] = useAuthState(auth);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const q = query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('date', 'desc'));
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
                setOrders(ordersData);
                setLoading(false);
            }, (error) => {
                console.error("Error fetching orders:", error);
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [user]);

    const stats = React.useMemo(() => {
        const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
        const totalOrders = orders.length;
        const pendingOrders = orders.filter(order => order.status === 'Pending' || order.status === 'Accepted').length;
        return { totalRevenue, totalOrders, pendingOrders };
    }, [orders]);
    
    const salesData = React.useMemo(() => {
        const months: { [key: string]: number } = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        
        orders.forEach(order => {
            const date = order.date.toDate();
            const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
            if (!months[monthKey]) {
                months[monthKey] = 0;
            }
            months[monthKey] += order.total;
        });

        // Get last 6 months for chart
        const last6Months = [];
        let currentDate = new Date();
        for (let i = 0; i < 6; i++) {
            const monthKey = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
            last6Months.unshift({
                name: monthNames[currentDate.getMonth()],
                total: months[monthKey] || 0
            });
            currentDate.setMonth(currentDate.getMonth() - 1);
        }
        return last6Months;
    }, [orders]);

    const recentOrders = orders.slice(0, 5);

    if (loading || loadingAuth) {
        return <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="space-y-6">
            <TypewriterWelcome 
                user={user} 
                fullText="Here is a quick overview of your business activities."
            />
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <IndianRupee className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{stats.totalRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalOrders}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                        <History className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingOrders}</div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Sales Overview</CardTitle>
                        <CardDescription>Your sales performance for the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={salesData}>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>A list of your 5 most recent orders.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Order ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                             <TableBody>
                                {recentOrders.map(order => (
                                    <TableRow key={order.id}>
                                        <TableCell className="font-mono text-xs">{order.id.slice(0, 7)}</TableCell>
                                        <TableCell><Badge variant="secondary">{order.status}</Badge></TableCell>
                                        <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
