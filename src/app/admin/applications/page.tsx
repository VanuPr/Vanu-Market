
"use client"

import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Eye } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface BaseApplication {
    id: string;
    applicantName?: string; // For stock points
    name?: string; // For kisan cards
    fatherName?: string;
    submittedAt: Timestamp;
    status: string;
    photoUrl?: string; // Stock points have this
}

interface StockPointApplication extends BaseApplication {
    gender: string;
    dob: string;
    qualification: string;
    mobileNo: string;
    district: string;
    state: string;
    [key: string]: any; // For other fields
}

interface KisanCardApplication extends BaseApplication {
    mobile: string;
    district: string;
    state: string;
    [key: string]: any;
}

type Application = StockPointApplication | KisanCardApplication;

const ApplicationDetailsDialog = ({ application, type }: { application: Application, type: string }) => {
    return (
        <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
                <DialogTitle>{type} Application Details</DialogTitle>
                <DialogDescription>
                    Full details for application ID: {application.id.slice(0, 7)}
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="space-y-4">
                     {application.photoUrl && (
                        <div className="flex justify-center">
                            <Image src={application.photoUrl} alt="Applicant Photo" width={128} height={128} className="rounded-md border object-cover"/>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                    {Object.entries(application).map(([key, value]) => {
                        if (key === 'id' || key === 'photoUrl' || typeof value === 'object' && value !== null) return null;
                        if (typeof value === 'boolean') {
                             return (
                                <React.Fragment key={key}>
                                    <dt className="font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                                    <dd>{value ? 'Yes' : 'No'}</dd>
                                </React.Fragment>
                            )
                        }
                        return (
                            <React.Fragment key={key}>
                                <dt className="font-medium text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</dt>
                                <dd>{String(value)}</dd>
                            </React.Fragment>
                        )
                    })}
                    </div>
                </div>
            </div>
        </DialogContent>
    );
};


const ApplicationTable = ({ collectionName, type }: { collectionName: string, type: string }) => {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, collectionName), orderBy('submittedAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const appData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
            setApplications(appData);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [collectionName]);

    if (loading) return <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>;

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Applicant Name</TableHead>
                    <TableHead>Father's Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {applications.map(app => (
                    <TableRow key={app.id}>
                        <TableCell>{app.submittedAt.toDate().toLocaleDateString()}</TableCell>
                        <TableCell>{app.applicantName || app.name}</TableCell>
                        <TableCell>{app.fatherName}</TableCell>
                        <TableCell>{'mobileNo' in app ? app.mobileNo : app.mobile}</TableCell>
                        <TableCell>{app.district}, {app.state}</TableCell>
                        <TableCell><Badge variant={app.status === 'Received' ? 'default' : 'secondary'}>{app.status}</Badge></TableCell>
                        <TableCell className="text-right">
                           <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon"><Eye className="h-4 w-4"/></Button>
                                </DialogTrigger>
                                <ApplicationDetailsDialog application={app} type={type} />
                           </Dialog>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};


export default function ApplicationsPage() {
    const applicationTypes = [
        { name: 'District Stock Point', collection: 'district-stock-point-applications' },
        { name: 'Block Stock Point', collection: 'block-stock-point-applications' },
        { name: 'Panchayat Stock Point', collection: 'panchayat-stock-point-applications' },
        { name: 'Kisan Jaivik Card', collection: 'kisan-jaivik-card-applications' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Application Management</h1>
                <p className="text-muted-foreground">Review and manage all incoming applications.</p>
            </div>
            
            <Tabs defaultValue={applicationTypes[0].collection}>
                <TabsList>
                    {applicationTypes.map(appType => (
                         <TabsTrigger key={appType.collection} value={appType.collection}>{appType.name}</TabsTrigger>
                    ))}
                </TabsList>
                
                {applicationTypes.map(appType => (
                    <TabsContent key={appType.collection} value={appType.collection}>
                        <Card>
                             <CardHeader>
                                <CardTitle>{appType.name} Applications</CardTitle>
                                <CardDescription>List of all applicants for the {appType.name.toLowerCase()}.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ApplicationTable collectionName={appType.collection} type={appType.name} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
}
