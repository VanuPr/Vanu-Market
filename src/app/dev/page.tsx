
"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, terminate, Timestamp, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, XCircle, AlertTriangle, Database, PowerOff, Server, ShieldX, KeyRound, GlobeLock, RefreshCw, CalendarIcon, Banknote, File, Wrench } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from 'date-fns';
import { cn } from "@/lib/utils";


type ServiceStatus = "checking" | "connected" | "error" | "terminated";
type SiteStatus = "live" | "maintenance" | "paused" | "down";
type AdminStatus = "live" | "billing_overdue";
type AdminPageStatus = "live" | "maintenance" | "not_subscribed" | "down" | "bugs_found";

interface PageStatus {
    [path: string]: SiteStatus;
}
interface AdminPageStatusMap {
    [path: string]: AdminPageStatus;
}


export default function DeveloperDashboardPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<ServiceStatus>("checking");

  const [websiteStatus, setWebsiteStatus] = useState<SiteStatus>('live');
  const [adminStatus, setAdminStatus] = useState<AdminStatus>('live');
  const [validUntil, setValidUntil] = useState<Date | null>(null);
  const [pageStatuses, setPageStatuses] = useState<PageStatus>({});
  const [adminPageStatuses, setAdminPageStatuses] = useState<AdminPageStatusMap>({});

  const adminEmail = "admin@vanu.com";

  const lockStateRef = doc(db, "siteSettings", "lockState");
  
  const pagesToControl: { path: string; name: string }[] = [
    { path: '/', name: 'Homepage' },
    { path: '/about', name: 'About Page' },
    { path: '/products', name: 'All Products Page' },
    { path: '/services', name: 'Services Page' },
    { path: '/customer-support', name: 'Customer Support Page' },
  ];
  
  const adminPagesToControl: { path: string; name: string }[] = [
      { path: '/admin/dashboard', name: 'Dashboard' },
      { path: '/admin/products', name: 'Products' },
      { path: '/admin/orders', name: 'Orders' },
      { path: '/admin/users', name: 'Users' },
      { path: '/admin/employees', name: 'Employees' },
      { path: '/admin/tasks', name: 'Tasks' },
      { path: '/admin/slideshow', name: 'Slideshow' },
  ]

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    const unsubscribeLock = onSnapshot(lockStateRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setWebsiteStatus(data.websiteStatus || 'live');
        setAdminStatus(data.adminStatus || 'live');
        setPageStatuses(data.pageStatus || {});
        setAdminPageStatuses(data.adminPageStatus || {});
        if (data.validUntil) {
          setValidUntil(data.validUntil.toDate());
        }
      }
    });

    checkDb();

    return () => {
      unsubscribeAuth();
      unsubscribeLock();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkDb = async () => {
    setDbStatus("checking");
    try {
      await getDoc(doc(db, "siteSettings", "lockState"));
      setDbStatus("connected");
    } catch (err: any) {
      if (err.code === 'terminated' || err.message.includes('terminated')) {
        setDbStatus("terminated");
      } else {
        console.error("DB Connection Check Failed:", err);
        setDbStatus("error");
      }
    }
  };
  
  const handleDisconnectFirestore = async () => {
    try {
      await terminate(db);
      setDbStatus("terminated");
      toast({ title: "Firestore Terminated", description: "The connection to Firestore has been closed.", variant: "destructive" });
    } catch (err) {
      console.error("Failed to terminate Firestore:", err);
      toast({ title: "Error", description: "Could not terminate Firestore connection.", variant: "destructive" });
    }
  };

  const handleReconnect = () => {
    window.location.reload();
  }

  const handleResetAdminPassword = async () => {
    try {
      await sendPasswordResetEmail(auth, adminEmail);
      toast({
        title: "Password Reset Email Sent",
        description: `An email has been sent to ${adminEmail} with instructions.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send password reset email.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (type: 'website' | 'admin' | 'page' | 'adminPage', status: string, path?: string) => {
    try {
        let updateData = {};
        if (type === 'page' && path) {
            updateData = { [`pageStatus.${path}`]: status };
        } else if (type === 'adminPage' && path) {
             updateData = { [`adminPageStatus.${path}`]: status };
        } else {
            const key = type === 'website' ? 'websiteStatus' : 'adminStatus';
            updateData = { [key]: status };
        }
        await setDoc(lockStateRef, updateData, { merge: true });
      
        toast({
            title: `Status Updated`,
            description: `Status set to: ${status}`,
            variant: status === 'live' ? 'default' : 'destructive',
        });

    } catch (error) {
      toast({ title: "Error", description: `Failed to update status.`, variant: "destructive" });
    }
  };

  const handleDateChange = async (date: Date | undefined) => {
    if (!date) return;
    setValidUntil(date);
    try {
        await setDoc(lockStateRef, { validUntil: Timestamp.fromDate(date) }, { merge: true });
        toast({ title: 'Validity Date Updated', description: `Admin panel access is now valid until ${format(date, 'PPP')}`});
    } catch (error) {
        toast({ title: 'Error', description: 'Failed to update validity date.', variant: 'destructive'});
    }
  };


  const StatusIndicator = ({ status }: { status: ServiceStatus }) => {
    if (status === "connected") {
      return <span className="flex items-center gap-2 text-green-600"><CheckCircle className="h-5 w-5" /> Connected</span>;
    }
    if (status === "error") {
      return <span className="flex items-center gap-2 text-red-600"><XCircle className="h-5 w-5" /> Error</span>;
    }
    if (status === "terminated") {
      return <span className="flex items-center gap-2 text-orange-500"><PowerOff className="h-5 w-5" /> Terminated</span>
    }
    return <span className="flex items-center gap-2 text-yellow-600"><AlertTriangle className="h-5 w-5" /> Checking...</span>;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold font-headline">Developer Dashboard</h1>
        <p className="text-muted-foreground mt-2">Monitor and manage your web application's core services.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Live checks for core backend services.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 border rounded-lg">
            <span className="font-semibold flex items-center gap-2"><Server className="w-5 h-5"/> Firebase Authentication</span>
            {loading ? (
              <span className="flex items-center gap-2 text-yellow-600"><AlertTriangle className="h-5 w-5" /> Checking...</span>
            ) : user ? (
              <span className="flex items-center gap-2 text-green-600"><CheckCircle className="h-5 w-5" /> Connected ({user.email})</span>
            ) : (
              <span className="flex items-center gap-2 text-muted-foreground"><XCircle className="h-5 w-5" /> Not Connected</span>
            )}
          </div>
          <div className="flex justify-between items-center p-3 border rounded-lg">
            <span className="font-semibold flex items-center gap-2"><Database className="w-5 h-5"/> Firestore Database</span>
            <div className="flex items-center gap-2">
              <StatusIndicator status={dbStatus} />
               {dbStatus === "connected" ? (
                 <Button size="sm" variant="destructive" onClick={handleDisconnectFirestore}>Disconnect</Button>
              ) : (
                 <Button size="sm" variant="outline" onClick={handleReconnect}><RefreshCw className="mr-2 h-4 w-4"/>Reconnect</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
              <CardTitle>Global Controls</CardTitle>
              <CardDescription>Manage administrative access and site-wide settings.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-primary"/>
                      <div>
                          <p className="font-semibold">Reset Admin Password</p>
                          <p className="text-xs text-muted-foreground">Send a reset link to the admin email.</p>
                      </div>
                  </div>
                  <Button variant="outline" onClick={handleResetAdminPassword}>Send Reset Email</Button>
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                      <ShieldX className="w-5 h-5 text-destructive"/>
                      <div>
                        <Label className="font-semibold cursor-pointer">Admin Panel Status</Label>
                        <p className="text-xs text-muted-foreground">Control access to all /admin routes.</p>
                      </div>
                  </div>
                  <Select value={adminStatus} onValueChange={(value) => handleStatusChange('admin', value)}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="live">Live</SelectItem>
                          <SelectItem value="billing_overdue">Bill Overdue</SelectItem>
                      </SelectContent>
                  </Select>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                      <GlobeLock className="w-5 h-5 text-destructive"/>
                      <div>
                        <Label className="font-semibold cursor-pointer">Entire Website Status</Label>
                        <p className="text-xs text-muted-foreground">Makes the entire site unavailable to public.</p>
                      </div>
                  </div>
                  <Select value={websiteStatus} onValueChange={(value) => handleStatusChange('website', value)}>
                      <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="live">Live</SelectItem>
                          <SelectItem value="maintenance">Under Maintenance</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                          <SelectItem value="down">Temporarily Down</SelectItem>
                      </SelectContent>
                  </Select>
              </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
              <CardTitle>Billing Control</CardTitle>
              <CardDescription>Manage automated billing lock for the admin panel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                      <Banknote className="w-5 h-5 text-primary"/>
                      <div>
                          <p className="font-semibold">Payment Validity</p>
                          <p className="text-xs text-muted-foreground">Admin panel access will be locked after this date.</p>
                      </div>
                  </div>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button
                          variant={"outline"}
                          className={cn(
                              "w-[200px] justify-start text-left font-normal",
                              !validUntil && "text-muted-foreground"
                          )}
                          >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {validUntil ? format(validUntil, "PPP") : <span>Pick a date</span>}
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                          <Calendar
                          mode="single"
                          selected={validUntil || undefined}
                          onSelect={handleDateChange}
                          initialFocus
                          />
                      </PopoverContent>
                  </Popover>
              </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Page-Specific Controls</CardTitle>
                <CardDescription>Override global settings for individual public pages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {pagesToControl.map(page => (
                    <div key={page.path} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                            <File className="w-5 h-5 text-primary"/>
                            <div>
                                <Label className="font-semibold">{page.name}</Label>
                                <p className="text-xs text-muted-foreground">{page.path}</p>
                            </div>
                        </div>
                        <Select 
                          value={pageStatuses[page.path] || 'live'} 
                          onValueChange={(value) => handleStatusChange('page', value, page.path)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="live">Live</SelectItem>
                                <SelectItem value="maintenance">Under Maintenance</SelectItem>
                                <SelectItem value="paused">Paused</SelectItem>
                                <SelectItem value="down">Temporarily Down</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                ))}
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Admin Page-Specific Controls</CardTitle>
                <CardDescription>Override global admin settings for individual pages.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                {adminPagesToControl.map(page => (
                    <div key={page.path} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                            <Wrench className="w-5 h-5 text-primary"/>
                            <div>
                                <Label className="font-semibold">{page.name}</Label>
                                <p className="text-xs text-muted-foreground">{page.path}</p>
                            </div>
                        </div>
                        <Select 
                          value={adminPageStatuses[page.path] || 'live'} 
                          onValueChange={(value) => handleStatusChange('adminPage', value, page.path)}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="live">Live</SelectItem>
                                <SelectItem value="maintenance">Under Maintenance</SelectItem>
                                <SelectItem value="not_subscribed">Not Subscribed</SelectItem>
                                <SelectItem value="down">Temporarily Down</SelectItem>
                                <SelectItem value="bugs_found">Bugs Found</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                ))}
            </CardContent>
        </Card>
      </div>

    </div>
  );
}
