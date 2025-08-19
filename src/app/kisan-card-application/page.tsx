
"use client"

import { useState } from "react";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

interface KccApplicationData {
    bankName: string;
    branchName: string;
    kccType: string;
    loanAmount: string;
    applicantName: string;
    accountNo: string;
    consentPmsby: boolean;
    consentPmjjby: boolean;
    existingLoanBank: string;
    existingLoanBranch: string;
    existingLoanFacility: string;
    existingLoanOutstanding: string;
    existingLoanOverdues: string;
    landVillage: string;
    landSurveyNo: string;
    landArea: string;
    landTitle: string;
    cropsKharif: string;
    cropsRabi: string;
    cropsOther: string;
    fisheriesVillage: string;
    fisheriesDairy: string;
    fisheriesSheepGoat: string;
    fisheriesPigs: string;
    fisheriesPoultry: string;
    fisheriesInland: string;
    fisheriesMarine: string;
    securityPrimary: string;
    securityCollateral: string;
    declaration: boolean;
    status: 'Received' | 'Under Review' | 'Submitted' | 'Approved' | 'Rejected';
    submittedAt?: any;
}


export default function KisanCardApplicationPage() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState<KccApplicationData>({
        bankName: '',
        branchName: '',
        kccType: '',
        loanAmount: '',
        applicantName: '',
        accountNo: '',
        consentPmsby: false,
        consentPmjjby: false,
        existingLoanBank: '',
        existingLoanBranch: '',
        existingLoanFacility: '',
        existingLoanOutstanding: '',
        existingLoanOverdues: '',
        landVillage: '',
        landSurveyNo: '',
        landArea: '',
        landTitle: '',
        cropsKharif: '',
        cropsRabi: '',
        cropsOther: '',
        fisheriesVillage: '',
        fisheriesDairy: '',
        fisheriesSheepGoat: '',
        fisheriesPigs: '',
        fisheriesPoultry: '',
        fisheriesInland: '',
        fisheriesMarine: '',
        securityPrimary: '',
        securityCollateral: '',
        declaration: false,
        status: 'Received',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleRadioChange = (name: keyof KccApplicationData, value: string) => {
        setFormData(prev => ({...prev, [name]: value}));
    };
    
    const handleCheckboxChange = (name: keyof KccApplicationData, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!formData.declaration) {
            toast({ variant: 'destructive', title: 'Declaration required', description: 'You must agree to the declaration to submit.' });
            return;
        }
        setIsLoading(true);

        try {
            const docData = {
                ...formData,
                submittedAt: serverTimestamp()
            };
            await addDoc(collection(db, "kcc-applications"), docData);
            toast({ title: 'Application Submitted', description: 'Your KCC application has been received successfully.'});
            // Optionally, reset form or redirect
            // setFormData({ ...initial state... });
        } catch (error) {
            console.error("Error submitting application: ", error);
            toast({ variant: 'destructive', title: 'Submission Failed', description: 'There was an error submitting your application.'});
        } finally {
            setIsLoading(false);
        }
    }


  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-headline font-bold tracking-tight text-foreground sm:text-5xl">Loan Application for PM-KISAN Beneficiaries</h1>
            <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">Please fill out the form below to apply for agricultural credit under the PM-KISAN scheme.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Bank Details</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                 <div className="grid gap-2">
                    <Label htmlFor="bankName">Name of Bank</Label>
                    <Input id="bankName" placeholder="Enter bank name" value={formData.bankName} onChange={handleInputChange} disabled={isLoading} required />
                </div>
                 <div className="grid gap-2">
                    <Label htmlFor="branchName">Branch</Label>
                    <Input id="branchName" placeholder="Enter branch name" value={formData.branchName} onChange={handleInputChange} disabled={isLoading} required />
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>B. Type of KCC/Amount of loan required</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <RadioGroup onValueChange={(value) => handleRadioChange('kccType', value)} value={formData.kccType} className="grid md:grid-cols-3 gap-4" disabled={isLoading}>
                        <div>
                            <RadioGroupItem value="fresh" id="fresh" className="peer sr-only" />
                            <Label htmlFor="fresh" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Issue of fresh KCC
                            </Label>
                        </div>
                         <div>
                            <RadioGroupItem value="enhancement" id="enhancement" className="peer sr-only" />
                            <Label htmlFor="enhancement" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Enhancement of existing limit
                            </Label>
                        </div>
                         <div>
                            <RadioGroupItem value="activation" id="activation" className="peer sr-only" />
                            <Label htmlFor="activation" className="flex items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                Activation of inoperative KCC
                            </Label>
                        </div>
                    </RadioGroup>
                    <div className="grid gap-2">
                        <Label htmlFor="loanAmount">Amount of Loan required (₹)</Label>
                        <Input id="loanAmount" type="number" placeholder="e.g., 50000" value={formData.loanAmount} onChange={handleInputChange} disabled={isLoading} required/>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>C. Particulars of the applicant(s)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid gap-2">
                        <Label htmlFor="applicantName">Name of the Applicant</Label>
                        <Input id="applicantName" placeholder="Enter full name" value={formData.applicantName} onChange={handleInputChange} disabled={isLoading} required/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="accountNo">Account No (PM Kisan Beneficiary)</Label>
                        <Input id="accountNo" placeholder="Enter PM Kisan account number" value={formData.accountNo} onChange={handleInputChange} disabled={isLoading} required/>
                    </div>
                     <Separator className="my-6"/>
                    <CardDescription>Insurance Scheme Consent (if not already covered)</CardDescription>
                     <div className="grid md:grid-cols-2 gap-6 items-start p-4 border rounded-md">
                        <p className="text-sm font-medium">Pradhan Mantri Suraksha Bima Yojana (PMSBY) - ₹12/annum</p>
                         <div className="flex items-center space-x-4">
                             <Label>Consent:</Label>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="pmsby" onCheckedChange={(checked) => handleCheckboxChange('consentPmsby', !!checked)} checked={formData.consentPmsby} disabled={isLoading}/>
                                <Label htmlFor="pmsby">Yes</Label>
                             </div>
                        </div>
                    </div>
                     <div className="grid md:grid-cols-2 gap-6 items-start p-4 border rounded-md">
                        <p className="text-sm font-medium">Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY) - ₹330/annum</p>
                         <div className="flex items-center space-x-4">
                             <Label>Consent:</Label>
                             <div className="flex items-center space-x-2">
                                <Checkbox id="pmjjby" onCheckedChange={(checked) => handleCheckboxChange('consentPmjjby', !!checked)} checked={formData.consentPmjjby} disabled={isLoading}/>
                                <Label htmlFor="pmjjby">Yes</Label>
                             </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>D. Details of existing loans, if any</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                     <div className="grid gap-2 md:col-span-2">
                        <Label htmlFor="existingLoanBank">Bank/Co-operative Banks/Other Sources</Label>
                        <Input id="existingLoanBank" placeholder="Name of the bank or source" value={formData.existingLoanBank} onChange={handleInputChange} disabled={isLoading} required/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="existingLoanBranch">Branch Name</Label>
                        <Input id="existingLoanBranch" placeholder="Enter branch name" value={formData.existingLoanBranch} onChange={handleInputChange} disabled={isLoading} required/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="existingLoanFacility">Facility (KCC/ATL)</Label>
                        <Input id="existingLoanFacility" placeholder="Type of facility" value={formData.existingLoanFacility} onChange={handleInputChange} disabled={isLoading} required/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="existingLoanOutstanding">Outstanding (₹)</Label>
                        <Input id="existingLoanOutstanding" type="number" placeholder="e.g., 25000" value={formData.existingLoanOutstanding} onChange={handleInputChange} disabled={isLoading} required/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="existingLoanOverdues">Overdues, if any (₹)</Label>
                        <Input id="existingLoanOverdues" type="number" placeholder="e.g., 5000" value={formData.existingLoanOverdues} onChange={handleInputChange} disabled={isLoading} required/>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>E. Particulars of total land holdings and crops</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="landVillage">Name of the Village</Label>
                            <Input id="landVillage" placeholder="Village name" value={formData.landVillage} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="landSurveyNo">Survey/Khasra No.</Label>
                            <Input id="landSurveyNo" placeholder="Survey/Khasra number" value={formData.landSurveyNo} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="landArea">Area in acres</Label>
                            <Input id="landArea" type="number" placeholder="e.g., 5.5" value={formData.landArea} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                    </div>
                     <div className="grid gap-2">
                         <Label>Title</Label>
                         <RadioGroup onValueChange={(value) => handleRadioChange('landTitle', value)} value={formData.landTitle} className="flex space-x-4" disabled={isLoading}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="owned" id="owned"/>
                                <Label htmlFor="owned">Owned</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="leased" id="leased"/>
                                <Label htmlFor="leased">Leased</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="share" id="share"/>
                                <Label htmlFor="share">Share Cropper</Label>
                            </div>
                         </RadioGroup>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="cropsKharif">Kharif Crops</Label>
                            <Input id="cropsKharif" placeholder="e.g., Rice" value={formData.cropsKharif} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="cropsRabi">Rabi Crops</Label>
                            <Input id="cropsRabi" placeholder="e.g., Wheat" value={formData.cropsRabi} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="cropsOther">Other Crops</Label>
                            <Input id="cropsOther" placeholder="e.g., Sugarcane" value={formData.cropsOther} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>F. KCC to Fisheries and Animal Husbandry Farmers</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid gap-2">
                        <Label htmlFor="fisheriesVillage">Name of Village</Label>
                        <Input id="fisheriesVillage" placeholder="Village name for fisheries/animal husbandry" value={formData.fisheriesVillage} onChange={handleInputChange} disabled={isLoading} required/>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="fisheriesDairy">Total Dairy Animals</Label>
                            <Input id="fisheriesDairy" type="number" placeholder="e.g., 10" value={formData.fisheriesDairy} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="fisheriesSheepGoat">Total Sheep & Goat</Label>
                            <Input id="fisheriesSheepGoat" type="number" placeholder="e.g., 20" value={formData.fisheriesSheepGoat} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="fisheriesPigs">Total Pigs</Label>
                            <Input id="fisheriesPigs" type="number" placeholder="e.g., 5" value={formData.fisheriesPigs} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="fisheriesPoultry">Total Poultry</Label>
                            <Input id="fisheriesPoultry" type="number" placeholder="e.g., 50" value={formData.fisheriesPoultry} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                         <div className="md:col-span-2 grid gap-2">
                            <Label htmlFor="fisheriesInland">Inland Fisheries & Aquaculture</Label>
                            <Input id="fisheriesInland" placeholder="Details..." value={formData.fisheriesInland} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                         <div className="md:col-span-2 grid gap-2">
                            <Label htmlFor="fisheriesMarine">Marine Fisheries & Mariculture</Label>
                            <Input id="fisheriesMarine" placeholder="Details..." value={formData.fisheriesMarine} onChange={handleInputChange} disabled={isLoading} required/>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>G. Security Proposed to be offered</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="securityPrimary">Particulars of Primary Security offered</Label>
                        <Textarea id="securityPrimary" placeholder="Describe primary security" value={formData.securityPrimary} onChange={handleInputChange} disabled={isLoading} required/>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="securityCollateral">Particulars of Collateral Security (where applicable)</Label>
                        <Textarea id="securityCollateral" placeholder="Describe collateral security" value={formData.securityCollateral} onChange={handleInputChange} disabled={isLoading} required/>
                    </div>
                </CardContent>
            </Card>
            
             <Card>
                <CardHeader>
                    <CardTitle>H. Declaration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="items-top flex space-x-2">
                        <Checkbox id="declaration" onCheckedChange={(checked) => handleCheckboxChange('declaration', !!checked)} checked={formData.declaration} disabled={isLoading}/>
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="declaration" className="cursor-pointer">
                                I/We hereby declare that all information furnished by me/us is true, correct and complete to the best of my/our knowledge and belief. I/We hereby undertake to abide by the terms and conditions that the Bank may stipulate in sanction of this loan and inform Bank in the event of acquiring any other assets during the tenure of the advance. I/We hereby declare that I/We have not availed KCC from any other bank branch.
                            </Label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                {isLoading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
