
"use client"

import { useState } from "react";
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, QrCode } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { indianStates } from "@/lib/indian-states";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Image from "next/image";

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function KisanJaivikCardPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
    const [utr, setUtr] = useState('');
    const [pendingApplicationId, setPendingApplicationId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        fatherName: '',
        dob: '',
        aadharNo: '',
        panNo: '',
        mobile: '',
        village: '',
        panchayat: '',
        block: '',
        district: '',
        pinCode: '',
        state: '',
    });

    const [files, setFiles] = useState({
        aadharFile: null as File | null,
        panFile: null as File | null,
        photoFile: null as File | null,
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleSelectChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, files: inputFiles } = e.target;
        if (inputFiles && inputFiles[0]) {
            setFiles(prev => ({...prev, [id]: inputFiles[0]}));
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const requiredFields: (keyof typeof formData)[] = ['name', 'fatherName', 'dob', 'aadharNo', 'panNo', 'mobile', 'village', 'panchayat', 'block', 'district', 'pinCode', 'state'];
        for (const key of requiredFields) {
            if (!formData[key]) {
                 toast({ variant: 'destructive', title: 'Missing fields', description: `Please fill in all required details.` });
                 return;
            }
        }
        if (!files.aadharFile || !files.panFile || !files.photoFile) {
            toast({ variant: 'destructive', title: 'File Upload Required', description: `Please upload Aadhar, PAN, and your photo.` });
            return;
        }

        setIsLoading(true);

        try {
             const docRef = await addDoc(collection(db, "kisan-jaivik-card-applications"), {
                ...formData,
                status: 'payment_pending',
                submittedAt: serverTimestamp()
            });
            setPendingApplicationId(docRef.id);
            setIsQrDialogOpen(true);

        } catch (error) {
            toast({ variant: 'destructive', title: 'Submission Error', description: 'Could not create application. Please try again.' });
        } finally {
            setIsLoading(false);
        }
    };

    const uploadFile = async (file: File, applicationId: string, fileType: string): Promise<string> => {
        const storageRef = ref(storage, `kisan-jaivik-card-applications/${applicationId}/${fileType}-${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        return getDownloadURL(uploadResult.ref);
    };

    const handleQrSubmit = async () => {
         if (!utr) {
            toast({ variant: 'destructive', title: 'UTR is required', description: 'Please enter the transaction ID to confirm payment.' });
            return;
        }
        if (!pendingApplicationId || !files.photoFile || !files.aadharFile || !files.panFile) {
            toast({ variant: 'destructive', title: 'Application or files missing.', description: 'Please restart the application process.' });
            return;
        }
        setIsLoading(true);

         try {
            const photoUrl = await uploadFile(files.photoFile, pendingApplicationId, 'photo');
            const aadharUrl = await uploadFile(files.aadharFile, pendingApplicationId, 'aadhar');
            const panUrl = await uploadFile(files.panFile, pendingApplicationId, 'pan');
            
            const docRef = doc(db, "kisan-jaivik-card-applications", pendingApplicationId);
            await updateDoc(docRef, {
                status: 'Received',
                paymentId: `Paid by QR: ${utr}`,
                paymentMethod: 'QR Code',
                photoUrl, aadharUrl, panUrl
            });
            
            toast({ title: "Application Submitted", description: "Your application has been received."});
            router.push(`/application-confirmation?id=${pendingApplicationId}`);

        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Submission Error', description: error.message || 'Could not submit application. Please try again.' });
        } finally {
            setIsLoading(false);
            setIsQrDialogOpen(false);
        }
    }

  return (
    <>
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24 flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-headline">Kisaan Jaivik Card Application</CardTitle>
            <CardDescription>Fill out the form below to apply for your card. Grant amount is ₹65.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Farmer's Name</Label>
                        <Input id="name" value={formData.name} onChange={handleInputChange} placeholder="Enter your full name" required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="fatherName">Father's/Husband's Name</Label>
                        <Input id="fatherName" value={formData.fatherName} onChange={handleInputChange} placeholder="Enter name" required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="dob">Date of Birth</Label>
                        <Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="mobile">Mobile Number</Label>
                        <Input id="mobile" type="tel" value={formData.mobile} onChange={handleInputChange} placeholder="Enter your mobile number" required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="aadharNo">Aadhar No.</Label>
                        <Input id="aadharNo" value={formData.aadharNo} onChange={handleInputChange} placeholder="Enter Aadhar number" required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="panNo">PAN No.</Label>
                        <Input id="panNo" value={formData.panNo} onChange={handleInputChange} placeholder="Enter PAN number" required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="photoFile">Upload Passport Photo</Label>
                        <Input id="photoFile" type="file" onChange={handleFileChange} disabled={isLoading} accept="image/*,.pdf" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="aadharFile">Upload Aadhar Card</Label>
                        <Input id="aadharFile" type="file" onChange={handleFileChange} disabled={isLoading} accept="image/*,.pdf" required />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="panFile">Upload PAN Card</Label>
                        <Input id="panFile" type="file" onChange={handleFileChange} disabled={isLoading} accept="image/*,.pdf" required />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                     <div className="grid gap-2">
                        <Label htmlFor="village">Village Name</Label>
                        <Input id="village" value={formData.village} onChange={handleInputChange} placeholder="Enter your village" required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="panchayat">Panchayat</Label>
                        <Input id="panchayat" value={formData.panchayat} onChange={handleInputChange} placeholder="Enter your panchayat" required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="state">State</Label>
                        <Select onValueChange={(v) => handleSelectChange('state', v)} value={formData.state} required disabled={isLoading}>
                            <SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger>
                            <SelectContent>
                                {indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="district">District</Label>
                         <Input id="district" value={formData.district} onChange={handleInputChange} placeholder="Enter your district" required disabled={isLoading} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="block">Block</Label>
                        <Input id="block" value={formData.block} onChange={handleInputChange} placeholder="Enter your block" required disabled={isLoading} />
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="pinCode">PIN Code</Label>
                        <Input id="pinCode" value={formData.pinCode} onChange={handleInputChange} placeholder="Enter PIN code" required disabled={isLoading} />
                    </div>
                </div>
                
                <div className="grid gap-2">
                   <Label>Anudan Rashi (Application Fee)</Label>
                   <Input value="₹65" readOnly disabled className="font-bold text-center bg-muted" />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                    {isLoading ? 'Processing...' : 'Pay & Submit Application'}
                </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
    <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Scan QR Code to Pay</DialogTitle>
                <DialogDescription>
                    Please scan the QR code to pay the **₹65** fee. Once paid, confirm the transaction.
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
                 <Button onClick={handleQrSubmit} disabled={isLoading || !utr}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm Payment & Submit
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}
