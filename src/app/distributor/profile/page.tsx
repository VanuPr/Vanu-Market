
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuthState, useUpdateProfile } from 'react-firebase-hooks/auth';
import { auth, db, storage } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, User, Edit, X, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface UserProfile {
    firstName: string;
    lastName: string;
    phone: string;
    avatarUrl?: string;
    gender?: 'male' | 'female';
}

export default function DistributorProfilePage() {
    const [user, loadingAuth] = useAuthState(auth);
    const router = useRouter();
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<UserProfile>({ firstName: '', lastName: '', phone: '', gender: undefined, avatarUrl: '' });
    const [initialProfile, setInitialProfile] = useState<UserProfile>({ firstName: '', lastName: '', phone: '', gender: undefined, avatarUrl: '' });
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);

    const [updateProfileHook, updatingProfile] = useUpdateProfile(auth);
    
    useEffect(() => {
        if (user) {
            const unsubProfile = onSnapshot(doc(db, 'users', user.uid), (doc) => {
                setLoadingProfile(true);
                if (doc.exists()) {
                    const data = doc.data() as UserProfile;
                    setProfile(data);
                    setInitialProfile(data);
                }
                setLoadingProfile(false);
            }, (error) => {
                toast({ variant: 'destructive', title: 'Failed to load profile' });
                setLoadingProfile(false);
            });

            return () => unsubProfile();
        }
    }, [user, toast]);

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
            await updateDoc(doc(db, 'users', user.uid), profileToSave);
            
            setInitialProfile(profileToSave);
            toast({ title: 'Profile Updated', description: 'Your information has been saved successfully.' });
            setIsEditing(false);
            setNewAvatarFile(null);

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
    
    if (loadingAuth || loadingProfile) {
        return <div className="flex justify-center py-8"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    const ProfileView = () => (
        <dl className="divide-y text-sm">
            <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="font-medium text-muted-foreground">Full Name</dt>
                <dd className="col-span-2 text-foreground">{profile.firstName} {profile.lastName}</dd>
            </div>
            <div className="py-3 grid grid-cols-3 gap-4">
                <dt className="font-medium text-muted-foreground">Email address</dt>
                <dd className="col-span-2 text-foreground">{user?.email}</dd>
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
                <Button type="button" variant="ghost" onClick={handleCancelEdit} disabled={isSaving}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    Save Changes
                </Button>
            </div>
        </form>
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl capitalize">
                        My Profile
                    </CardTitle>
                    {!isEditing && (
                        <Button variant="outline" onClick={() => setIsEditing(true)}>
                            <Edit className="mr-2 h-4 w-4"/> Edit Profile
                        </Button>
                    )}
                    {isEditing && (
                        <Button variant="outline" onClick={handleCancelEdit}>
                            <X className="mr-2 h-4 w-4"/> Cancel
                        </Button>
                    )}
                </div>
                 <CardDescription>View and edit your distributor profile information.</CardDescription>
            </CardHeader>
            <CardContent>
                {isEditing ? <ProfileEdit /> : <ProfileView />}
            </CardContent>
        </Card>
    );
}
