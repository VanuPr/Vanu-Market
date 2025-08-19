
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, User, CheckCircle } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  status: 'Active' | 'Suspended' | 'Pending Approval';
  createdAt: Timestamp;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      toast({ variant: 'destructive', title: 'Error fetching users' });
      setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const filteredUsers = useMemo(() => {
    return users.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);
  
  const handleStatusChange = async (userId: string, newStatus: 'Active' | 'Suspended') => {
      try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, { status: newStatus });
          toast({ title: 'User status updated', description: `User is now ${newStatus}.`});
      } catch (error) {
          toast({ variant: 'destructive', title: 'Update Failed' });
      }
  }

  const handleApproveUser = async (userId: string) => {
      try {
          const userRef = doc(db, 'users', userId);
          await updateDoc(userRef, { status: 'Active' });
          toast({ title: 'User Approved', description: 'The user account has been activated.' });
      } catch (error) {
          toast({ variant: 'destructive', title: 'Approval Failed' });
      }
  }

  const getStatusBadge = (status: UserProfile['status']) => {
    switch(status) {
        case 'Active':
            return <Badge variant="default">Active</Badge>;
        case 'Suspended':
            return <Badge variant="destructive">Suspended</Badge>;
        case 'Pending Approval':
            return <Badge variant="secondary">Pending Approval</Badge>;
        default:
            return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">View and manage all registered users.</p>
        </div>
        <div className="w-full max-w-sm">
           <Input 
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>A list of all users who have registered on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatarUrl} />
                          <AvatarFallback><User/></AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.firstName} {user.lastName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || 'N/A'}</TableCell>
                    <TableCell>{user.createdAt?.toDate().toLocaleDateString() || 'N/A'}</TableCell>
                    <TableCell>
                      {getStatusBadge(user.status)}
                    </TableCell>
                    <TableCell className="text-right">
                       {user.status === 'Pending Approval' ? (
                          <Button size="sm" onClick={() => handleApproveUser(user.id)}>
                            <CheckCircle className="mr-2 h-4 w-4"/> Approve
                          </Button>
                       ) : (
                         <Switch 
                            checked={user.status === 'Active'}
                            onCheckedChange={(checked) => handleStatusChange(user.id, checked ? 'Active' : 'Suspended')}
                            aria-label="Toggle user status"
                        />
                       )}
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
