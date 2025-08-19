
"use client"

import React, { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2 } from "lucide-react";
import { db, storage, createSecondaryApp } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { indianStates } from "@/lib/indian-states";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { deleteApp } from "firebase/app";

export default function PanchayatStockPointApplicationPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
    const [termsAgreed, setTermsAgreed] = useState(false);

    const [formData, setFormData] = useState({
        applicantName: '',
        gender: '',
        nationality: 'INDIAN',
        dob: '',
        qualification: '',
        fatherName: '',
        motherName: '',
        panNo: '',
        aadharNo: '',
        mobileNo: '',
        whatsappNo: '',
        email: '',
        password: '',
        village: '',
        post: '',
        panchayatName: '',
        policeStation: '',
        blockName: '',
        pinCode: '',
        district: '',
        state: '',
        docPan: false,
        docAadhar: false,
        docPassbook: false,
        docCancelCheque: false,
        docPhoto: false,
        docQualification: false,
    });

    const [photoFile, setPhotoFile] = useState<File | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSelectChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleRadioChange = (name: keyof typeof formData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (name: keyof typeof formData, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPhotoFile(e.target.files[0]);
        }
    };

    const handleContinue = (e: React.FormEvent) => {
        e.preventDefault();
        const form = formRef.current;
        if (form && !form.checkValidity()) {
            form.reportValidity();
            toast({ variant: 'destructive', title: 'Incomplete Form', description: 'Please fill out all required fields.' });
            return;
        }
         if (!formData.docPan || !formData.docAadhar || !formData.docPassbook || !formData.docPhoto || !formData.docQualification) {
            toast({ variant: 'destructive', title: 'Document Checklist Required', description: 'You must check all required documents in the Undertakings section.' });
            return;
        }
        setIsTermsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!termsAgreed) {
            toast({ variant: 'destructive', title: 'Agreement Required', description: 'You must agree to the terms and conditions.' });
            return;
        }
        
        const requiredFields: (keyof typeof formData)[] = [
            'applicantName', 'gender', 'dob', 'qualification', 'fatherName', 'motherName', 
            'panNo', 'aadharNo', 'mobileNo', 'email', 'password', 'village', 'post', 'panchayatName', 
            'policeStation', 'blockName', 'pinCode', 'district', 'state'
        ];

        for (const key of requiredFields) {
            if (!formData[key]) {
                 toast({ variant: 'destructive', title: 'Missing fields', description: `Please fill in the '${key}' field.` });
                 return;
            }
        }

        if (!photoFile) {
            toast({ variant: 'destructive', title: 'Photo Required', description: 'Please upload a passport photograph.' });
            return;
        }

        setIsLoading(true);
        const { tempApp, tempAuth } = createSecondaryApp();

        try {
            // 1. Create User in Auth
            const userCredential = await createUserWithEmailAndPassword(tempAuth, formData.email, formData.password);
            const user = userCredential.user;
            
            // 2. Create User Profile in Firestore (users collection)
            const [firstName, ...lastNameParts] = formData.applicantName.split(' ');
            const lastName = lastNameParts.join(' ');
            
            const userDocRef = doc(db, 'users', user.uid);
            await setDoc(userDocRef, {
                firstName: firstName || '',
                lastName: lastName || '',
                email: formData.email,
                phone: formData.mobileNo,
                status: 'Pending Approval', // Initial status
                createdAt: serverTimestamp(),
                avatarUrl: '', // Will be updated later if needed
                roles: ['stockist']
            });

            // 3. Upload application photo
            const storageRef = ref(storage, `panchayat-stock-point-applications/${user.uid}/photo-${photoFile.name}`);
            await uploadBytes(storageRef, photoFile);
            const photoUrl = await getDownloadURL(storageRef);
            
            // 4. Save Application Data
            const { password, ...applicationData } = formData;
            const applicationDocRef = doc(db, "panchayat-stock-point-applications", user.uid);
            await setDoc(applicationDocRef, {
                ...applicationData,
                userId: user.uid,
                photoUrl,
                status: 'Received', // Application status
                submittedAt: serverTimestamp()
            });

            toast({ title: 'Application Submitted', description: 'Your application has been received and is pending approval.' });
            router.push(`/application-confirmation?id=${user.uid}`);
            
        } catch (error: any) {
            console.error("Error submitting application:", error);
            if(error.code === 'auth/email-already-in-use') {
                toast({ variant: 'destructive', title: 'Submission Failed', description: 'This email is already registered. Please use a different email.' });
            } else {
                toast({ variant: 'destructive', title: 'Submission Failed', description: 'An unexpected error occurred. Please try again.' });
            }
        } finally {
            await deleteApp(tempApp);
            setIsLoading(false);
            setIsTermsModalOpen(false);
        }
    };

    return (
        <>
        <div className="flex min-h-screen flex-col bg-muted/20">
            <Header />
            <main className="flex-1 py-16 md:py-24">
                <div className="container mx-auto px-4 md:px-6">
                    <Card className="max-w-4xl mx-auto">
                        <CardHeader className="text-center">
                            <h1 className="text-3xl font-bold font-headline">Application From Panchayat Stock Point</h1>
                            <p className="text-muted-foreground">Application No.- V.O.P.L./025-2026</p>
                            <p className="text-destructive font-semibold">THE FORM IS TO BE FILLED IN CAPITAL LETTERS ONLY</p>
                        </CardHeader>
                        <CardContent>
                            <form ref={formRef} onSubmit={handleContinue} className="space-y-8">
                                
                                <section>
                                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Applicant's Details</h2>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="grid gap-2"><Label>Name<span className="text-destructive">*</span></Label><Input id="applicantName" value={formData.applicantName} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Gender<span className="text-destructive">*</span></Label><RadioGroup onValueChange={(v) => handleRadioChange('gender', v)} value={formData.gender} className="flex gap-4 pt-2"><RadioGroupItem value="male" id="male" /><Label htmlFor="male">Male</Label><RadioGroupItem value="female" id="female" /><Label htmlFor="female">Female</Label></RadioGroup></div>
                                        <div className="grid gap-2"><Label>Nationality</Label><Input id="nationality" value={formData.nationality} readOnly /></div>
                                        <div className="grid gap-2"><Label>D.O.B<span className="text-destructive">*</span></Label><Input id="dob" type="date" value={formData.dob} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Qualification<span className="text-destructive">*</span></Label><Input id="qualification" value={formData.qualification} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Passport Photograph<span className="text-destructive">*</span></Label><Input type="file" onChange={handleFileChange} accept="image/*" required /></div>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Account & Contact Details</h2>
                                     <div className="grid md:grid-cols-2 gap-6">
                                        <div className="grid gap-2"><Label>Father's Name<span className="text-destructive">*</span></Label><Input id="fatherName" value={formData.fatherName} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Mother's Name<span className="text-destructive">*</span></Label><Input id="motherName" value={formData.motherName} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>PAN Card No.<span className="text-destructive">*</span></Label><Input id="panNo" value={formData.panNo} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Aadhar Card No.<span className="text-destructive">*</span></Label><Input id="aadharNo" value={formData.aadharNo} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Mobile No.<span className="text-destructive">*</span></Label><Input id="mobileNo" type="tel" value={formData.mobileNo} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Whatsapp No. <span className="text-muted-foreground text-xs">(Optional)</span></Label><Input id="whatsappNo" type="tel" value={formData.whatsappNo} onChange={handleInputChange} /></div>
                                        <div className="grid gap-2"><Label>E-Mail ID (for Login)<span className="text-destructive">*</span></Label><Input id="email" type="email" value={formData.email} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Password (for Login)<span className="text-destructive">*</span></Label><Input id="password" type="password" value={formData.password} onChange={handleInputChange} required /></div>
                                    </div>
                                </section>

                                <section>
                                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">स्थायी पता का विवरण (Permanent Address Details)</h2>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="grid gap-2"><Label>Village<span className="text-destructive">*</span></Label><Input id="village" value={formData.village} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Post<span className="text-destructive">*</span></Label><Input id="post" value={formData.post} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Panchayat Name<span className="text-destructive">*</span></Label><Input id="panchayatName" value={formData.panchayatName} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Police Station<span className="text-destructive">*</span></Label><Input id="policeStation" value={formData.policeStation} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>Block Name<span className="text-destructive">*</span></Label><Input id="blockName" value={formData.blockName} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>PIN Code<span className="text-destructive">*</span></Label><Input id="pinCode" value={formData.pinCode} onChange={handleInputChange} required /></div>
                                        <div className="grid gap-2"><Label>State<span className="text-destructive">*</span></Label>
                                            <Select onValueChange={(v) => handleSelectChange('state', v)} value={formData.state} required><SelectTrigger><SelectValue placeholder="Select State" /></SelectTrigger><SelectContent>{indianStates.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
                                        </div>
                                        <div className="grid gap-2"><Label>District<span className="text-destructive">*</span></Label><Input id="district" value={formData.district} onChange={handleInputChange} required /></div>
                                    </div>
                                </section>
                                
                                <section>
                                    <Card>
                                        <CardHeader><CardTitle>Undertakings</CardTitle></CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="p-4 border rounded-md text-muted-foreground text-sm">
                                                I, {formData.applicantName || '.....................................'}, S/o {formData.fatherName || '.....................................'}, Aged about {formData.dob ? new Date().getFullYear() - new Date(formData.dob).getFullYear() : '..........'}, Resident of {formData.village || '.....................................'} do hereby solemnly affirm and declare that I am authorized panchayat level stockist of VANU ORGANIC PVT. LTD. A company incorporated under the companies Act, 2013 is district and undertake that I will fully abide by the norms and regulations of the company which I have entered while getting the coordinator of the company and will not do any activities which will harm the goodwill and reputations of the company in its market and I will be fully responsible for any unlawful activities done by me against the company norms and company will not be liable for the same in any manner.
                                            </div>
                                            <p className="font-semibold">Your Submitted Documents:</p>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
                                                <div className="flex items-center space-x-2"><Checkbox id="docPan" checked={formData.docPan} onCheckedChange={(c) => handleCheckboxChange('docPan', !!c)}/><Label htmlFor="docPan">PAN Card</Label></div>
                                                <div className="flex items-center space-x-2"><Checkbox id="docAadhar" checked={formData.docAadhar} onCheckedChange={(c) => handleCheckboxChange('docAadhar', !!c)}/><Label htmlFor="docAadhar">Aadhar Card</Label></div>
                                                <div className="flex items-center space-x-2"><Checkbox id="docPassbook" checked={formData.docPassbook} onCheckedChange={(c) => handleCheckboxChange('docPassbook', !!c)}/><Label htmlFor="docPassbook">Bank Passbook</Label></div>
                                                <div className="flex items-center space-x-2"><Checkbox id="docCancelCheque" checked={formData.docCancelCheque} onCheckedChange={(c) => handleCheckboxChange('docCancelCheque', !!c)}/><Label htmlFor="docCancelCheque">Cancel Cheque</Label></div>
                                                <div className="flex items-center space-x-2"><Checkbox id="docPhoto" checked={formData.docPhoto} onCheckedChange={(c) => handleCheckboxChange('docPhoto', !!c)}/><Label htmlFor="docPhoto">Photo</Label></div>
                                                <div className="flex items-center space-x-2"><Checkbox id="docQualification" checked={formData.docQualification} onCheckedChange={(c) => handleCheckboxChange('docQualification', !!c)}/><Label htmlFor="docQualification">Educational qualification</Label></div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </section>

                                <Button type="submit" className="w-full text-lg py-6" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-6 w-6 animate-spin"/> : null}
                                    Submit Application
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
            <Footer />
        </div>
        <Dialog open={isTermsModalOpen} onOpenChange={setIsTermsModalOpen}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Panchayat Stock Point - Terms & Conditions</DialogTitle>
                    <DialogDescription>
                        Please review and accept the terms to complete your application.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto p-4 border rounded-md my-4 space-y-6">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                        <h3>English Terms</h3>
                        <ul>
                            <li>To get the stock point of your Panchayat, you will have to pay a minimum amount of Rs. 100000 (one lakh), in which the company will give you goods worth MRP of two lakhs.</li>
                            <li>If you take stock points worth 2 lakhs, the company will give you a rental bonus of 1% per month for six months.</li>
                            <li>To get stock point, registration of Rs. 3550/- is mandatory.</li>
                            <li>It will be mandatory to deposit 70 percent of the amount within fifteen days of registration otherwise your registration will be cancelled.</li>
                            <li>If you cancel your registration for any reason, your registration fee will not be refunded.</li>
                            <li>It will be mandatory for you to submit the complete sale of your Panchayat to the Head Branch.</li>
                            <li>You will sell the product in your Panchayat. If there is no stock point in your nearby Panchayat then you can sell your product in that Panchayat also.</li>
                            <li>If for any reason your product is not sold then the company will take back its product and you will be given its money.</li>
                            <li>Transactions with any coordinator will be done in cash, otherwise you yourself will be responsible for it.</li>
                            <li>The company will give you ten percent of the total sales of the Panchayat.</li>
                            <li>Stock will be given by the company through commission product.</li>
                            <li>Before cancelling any stock point, information regarding the same must be given to the head branch.</li>
                            <li>Your presence will be mandatory in the Kisan Samman ceremony in your Panchayat.</li>
                            <li>For any complaint you will give it in writing to your head office.</li>
                            <li>Any transaction with the company will be done through cheque, DD, RTGS, NEFT etc. After making the payment, do not forget to get a receipt from your nearest branch.</li>
                            <li>The company will give you three flex banners for promotion, one piece of 8*3 and two pieces of 2.5*5.</li>
                            <li>The amount has to be deposited with the company one week before ordering the product, in this case if the company delays in delivering the product then the company will give you a bonus of two percent of the original amount.</li>
                            <li>After giving the product to any coordinator in your Panchayat, do not forget to give him the bill and get his signature.</li>
                            <li>It is mandatory for your stock point to have a GST license, if there is no GST then the company will give you the product in its GST.</li>
                            <li>You will provide the products at your stock point to farmers having organic farmer card at subsidized rates.</li>
                            <li>You cannot buy and sell chemicals and chemical fertilizers at your stock point.</li>
                            <li>The rules mentioned in the instructions of the company will be followed, otherwise the stock point license will be cancelled if not followed.</li>
                            <li>In the present situation, if any dispute arises, it will be resolved in the court of Godda with the help of Godda Head Branch.</li>
                            <li>While taking the product, you will check the count of the product and leakage yourself, otherwise the company will not be responsible for it.</li>
                            <li>Transportation of any product will be done by the company, the company's business is fertilizer, seeds, enzymes, organic fertilizer, all seeds will be available as per time.</li>
                        </ul>
                    </div>
                     <div className="prose prose-sm max-w-none dark:prose-invert">
                        <h3>Hindi Terms</h3>
                        <ul>
                            <li>अपको ऄपने पंचायत का स्टॉक पॉआंट लेने के ललए न्यूनतम रालि 100000 (एक लाख) रुपया देना होगा, लजसमे कंपनी अपको दो लाख MRP का सामान देगी!</li>
                            <li>यदद अप दो लाख का स्टॉक पॉआंट लेते है तो अपको कंपनी प्रलतमाह एक प्रलतित प्रलतमाह छः माह तक रेंटल बोनस देगी!</li>
                            <li>स्टॉक पॉआंट लेने के ललए 3550/- रुपया का रलजस्रेिन कराना ऄलनवायय है!</li>
                            <li>रलजस्रेिन होने के पंद्रह ददन के ऄन्दर 70 प्रलतित रालि जमा करना ऄलनवायय होगा ऄन्यथा अपका रलजस्रेिन रद्द कर ददया जायेगा!</li>
                            <li>दकसी भी कारणवि ऄपना रलजस्रेिन रद्द करते हैं तो आस क्रम में अपका रलजस्रेिन फीस वापस नहीं होगा!</li>
                            <li>अप ऄपने पंचायत का पूरा सेल लबबरन हेड ब्ांच में देना ऄलनवायय होगा!</li>
                            <li>अप ऄपने पंचायत में प्रोडक्ट सेल करेंगे, यदद अपके ऄगल बगल पंचायत में स्टॉक पॉआंट नहीं है तो अप ईस पंचायत में भी ऄपना प्रोडक्ट सेल कर सकते है!</li>
                            <li>दकसी कारणवि अपका प्रोडक्ट सेल नही होता है तो कंपनी ऄपना प्रोडक्ट वापस ले लेगी और अपको ईसका पैसा ददया जायेगा!</li>
                            <li>दकसी भी कोर्डडनेटर से लेन देन नगद करेंगे, ऄन्यथा आसके जीम्मेदार अप खुद होंगे!</li>
                            <li>कम्पनी अपको पंचायत के पुरे सेल का दस प्रलतित रालि देगी!</li>
                            <li>कंपनी द्वारा स्टॉक कमीसन प्रोडक्ट के द्वारा ददया जायेगा!</li>
                            <li>दकसी भी स्टॉक पॉआंट को रद्द करने से पहले आसकी सुचना हेड ब्ांच को देनी होगी!</li>
                            <li>अपके पंचायत में दकसान सम्मान समारोह में अपकी ईपलस्थलत ऄलनवायय होगी!</li>
                            <li>दकसी भी लिकायत के ललए अप ऄपने हेड ऑदफस में लललखत रूप से देंगे!</li>
                            <li>कंपनी में दकसी भी तरह का लेन देन चेक, डी डी , RTGS , NEFT आत्यादद से करेंगे, पेमेंट करने पर ऄपने नजदीकी ब्ांच से ररसववग लेना न भूले!</li>
                            <li>कंपनी अपको प्रचार प्रसार के ललए तीन फ्लेक्स बैनर देगी जो 8 *3 का एक लपस तथा 2.5*5 का दो पीस ददया जयेगा!</li>
                            <li>प्रोडक्ट मंगवाने के एक सप्ताह पूवय कंपनी को रालि जमा करना होगा, आस क्रम कंपनी प्रोडक्ट देने में देरी करती है तो कंपनी अपको मूल रालि का दो प्रलतित बोनस देगी!</li>
                            <li>अप ऄपने पंचायत में दकसी भी कोर्डडनेटर को प्रोडक्ट देने के बाद ईसको लबल देकर हस्ताक्षर लेना न भूले!</li>
                            <li>अपके स्टॉक पॉआंट का GST लाआसेंस होना ऄलनवायय है, GST न होने पर कंपनी अपको ऄपने GST में प्रोडक्ट देगी!</li>
                            <li>अप ऄपने स्टॉक पॉआंट पर जैलवक दकसान काडय वाले दकसानों को सलससडी पर प्रोडक्ट देंगे!</li>
                            <li>अप ऄपने स्टॉक पॉआंट में रासायलनक व् केलमकल खाद की खरीद लबक्री नहीं कर सकते है!</li>
                            <li>कंपनी के लनदेिानुसार बताये गये लनयमो का पालन करेंगे , ऄन्यथा पालन नहीं करने पर स्टॉक पॉआंट लाआसेंस रद्द कर ददया जायेगा!</li>
                            <li>बतयमान ऄवस्था में ईत्पन्न कोइ भी लबबाद होने पर ईसका लनराकरण गोड्डा हेड ब्ांच के सहयोग से गोड्डा के न्यायलय में दकया जायेगा!</li>
                            <li>प्रोडक्ट लेते समय अप प्रोडक्ट की लगनती तथा लीकेज की जााँच स्वंय कर लेंगे, ऄन्यथा आसकी लजम्मेदारी कंपनी की नहीं होगी!</li>
                            <li>दकसी भी प्रोडक्ट का रांसपोर्टटग कंपनी की होगी, कंपनी का लबसनेस खाद, बीज, जाआम, जैलवक खाद समय के ऄनुसार सभी बीज ईपलसध होगी!</li>
                        </ul>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="terms" checked={termsAgreed} onCheckedChange={(c) => setTermsAgreed(!!c)} />
                    <Label htmlFor="terms" className="cursor-pointer">I have read, understood, and agree to the terms and conditions.</Label>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsTermsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!termsAgreed || isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Agree & Submit
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}

    