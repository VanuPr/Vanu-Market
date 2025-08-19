
"use client"

import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Trash2, PlusCircle } from 'lucide-react';
import Image from 'next/image';

interface Slide {
    id: string;
    title: string;
    description: string;
    imageUrl: string;
    createdAt: any;
}

export default function SlideshowAdminPage() {
    const { toast } = useToast();
    const [slides, setSlides] = useState<Slide[]>([]);
    const [loadingSlides, setLoadingSlides] = useState(true);
    
    const [newSlide, setNewSlide] = useState({ title: '', description: '' });
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSlides = async () => {
        setLoadingSlides(true);
        try {
            const q = query(collection(db, "slideshow"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const slidesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Slide));
            setSlides(slidesData);
        } catch (error) {
            toast({ variant: "destructive", title: "Error fetching slides" });
        } finally {
            setLoadingSlides(false);
        }
    };

    useEffect(() => {
        fetchSlides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handleAddSlide = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSlide.title || !newSlide.description || !imageFile) {
            toast({ variant: "destructive", title: "Missing fields", description: "Please fill out all fields and select an image." });
            return;
        }
        setIsLoading(true);

        try {
            const storageRef = ref(storage, `slideshow/${Date.now()}_${imageFile.name}`);
            const uploadResult = await uploadBytes(storageRef, imageFile);
            const imageUrl = await getDownloadURL(uploadResult.ref);

            await addDoc(collection(db, "slideshow"), {
                ...newSlide,
                imageUrl,
                createdAt: serverTimestamp()
            });

            toast({ title: "Slide added", description: "The new slide has been added successfully." });
            setNewSlide({ title: '', description: '' });
            setImageFile(null);
            (document.getElementById('imageUpload') as HTMLInputElement).value = '';
            fetchSlides(); 
        } catch (error) {
            console.error("Error adding slide: ", error);
            toast({ variant: "destructive", title: "Error adding slide" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteSlide = async (id: string) => {
        if (window.confirm("Are you sure you want to delete this slide?")) {
            try {
                await deleteDoc(doc(db, "slideshow", id));
                toast({ title: "Slide deleted" });
                fetchSlides();
            } catch (error) {
                toast({ variant: "destructive", title: "Error deleting slide" });
            }
        }
    };

    return (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Slide</CardTitle>
                        <CardDescription>Create a new slide for the homepage carousel.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddSlide} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="title">Title</Label>
                                <Input id="title" value={newSlide.title} onChange={(e) => setNewSlide({ ...newSlide, title: e.target.value })} required disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" value={newSlide.description} onChange={(e) => setNewSlide({ ...newSlide, description: e.target.value })} required disabled={isLoading} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="imageUpload">Image</Label>
                                <Input id="imageUpload" type="file" onChange={handleImageChange} required disabled={isLoading} />
                            </div>
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <PlusCircle className="mr-2 h-4 w-4" />}
                                Add Slide
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
            <div className="md:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Manage Slides</CardTitle>
                        <CardDescription>Review and delete existing slides.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loadingSlides ? (
                            <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                        ) : slides.length === 0 ? (
                            <p className="text-center text-muted-foreground">No slides yet. Add one to get started.</p>
                        ) : (
                            <div className="space-y-4">
                                {slides.map(slide => (
                                    <div key={slide.id} className="flex items-center gap-4 p-2 border rounded-md">
                                        <Image src={slide.imageUrl} alt={slide.title} width={80} height={60} className="rounded-md object-cover" />
                                        <div className="flex-1">
                                            <h4 className="font-semibold">{slide.title}</h4>
                                            <p className="text-sm text-muted-foreground truncate">{slide.description}</p>
                                        </div>
                                        <Button variant="destructive" size="icon" onClick={() => handleDeleteSlide(slide.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
