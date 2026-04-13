"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatIDR } from "@/lib/utils";
import {
    UserCircle, Mail, Phone, MapPin, Building2, Briefcase,
    Calendar, CreditCard, FileText, Download, Shield, Key,
    Lock, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { format, differenceInYears, differenceInMonths } from "date-fns";

export default function MyProfilePage() {
    const { toast } = useToast();
    const [me, setMe] = useState<any>(null);
    const [employee, setEmployee] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Security Tab States
    const [passwords, setPasswords] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            // 1. Get current user info
            const meRes = await fetch("/api/v1/auth/me");
            const meData = await meRes.json();
            
            if (meData?.success) {
                setMe(meData.data);
                
                // 2. If employee, get full details
                if (meData.data.employeeId) {
                    const empRes = await fetch(`/api/v1/employees/${meData.data.employeeId}`);
                    const empData = await empRes.json();
                    if (empData?.data) {
                        setEmployee(empData.data);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
            toast({
                title: "Error",
                description: "Failed to load profile data",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast({
                title: "Error",
                description: "Passwords do not match",
                variant: "destructive"
            });
            return;
        }

        setIsUpdatingPassword(true);
        try {
            const res = await fetch("/api/v1/user/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(passwords)
            });

            const data = await res.json();
            if (res.ok) {
                toast({
                    title: "Success",
                    description: "Password updated successfully",
                });
                setPasswords({ currentPassword: "", newPassword: "", confirmPassword: "" });
            } else {
                throw new Error(data.error || "Failed to update password");
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-muted-foreground animate-pulse">Loading profile...</p>
            </div>
        );
    }

    const initials = me?.fullName?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "??";
    const joinDate = employee?.hireDate ? new Date(employee.hireDate) : null;
    const serviceLength = joinDate ? `${differenceInYears(new Date(), joinDate)} years ${differenceInMonths(new Date(), joinDate) % 12} months` : "N/A";

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <UserCircle className="h-6 w-6 text-primary" /> My Profile
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    {me?.isPlatformOnly ? "Your platform account information" : "Your personal and employment information"}
                </p>
            </div>

            {/* Profile Card */}
            <Card className="overflow-hidden border-none shadow-lg glass">
                <CardContent className="py-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                        <div className="relative">
                            <Avatar className="h-28 w-28 text-3xl ring-4 ring-primary/10 transition-transform hover:scale-105">
                                <AvatarImage src={me?.photoUrl || ""} />
                                <AvatarFallback className="bg-primary/5 text-primary font-bold">{initials}</AvatarFallback>
                            </Avatar>
                            {!me?.isPlatformOnly && (
                                <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 shadow-md" variant="success">
                                    Active
                                </Badge>
                            )}
                        </div>
                        
                        <div className="flex-1 text-center sm:text-left space-y-2">
                            <div>
                                <h2 className="text-2xl font-bold tracking-tight">{me?.fullName}</h2>
                                <p className="text-muted-foreground font-medium flex items-center justify-center sm:justify-start gap-2">
                                    {me?.position || me?.role?.replace("_", " ")} 
                                    {me?.department && (
                                        <>
                                            <span className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                                            {me.department}
                                        </>
                                    )}
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 mt-4 justify-center sm:justify-start">
                                {employee?.employmentType && (
                                    <Badge variant="secondary" className="bg-secondary/50 capitalize">
                                        {employee.employmentType.toLowerCase()}
                                    </Badge>
                                )}
                                {employee?.employeeNumber && (
                                    <Badge variant="outline" className="font-mono bg-background/50">
                                        {employee.employeeNumber}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-y-2 gap-x-6 mt-6 text-sm text-muted-foreground justify-center sm:justify-start">
                                <span className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary/70" /> {me?.email}</span>
                                {employee?.phone && <span className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary/70" /> {employee.phone}</span>}
                                {joinDate && (
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary/70" /> 
                                        Joined {format(joinDate, "dd/MM/yyyy")}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="hidden sm:flex rounded-xl hover:bg-primary hover:text-white transition-all">
                            Edit Profile
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="info" className="space-y-4">
                <TabsList className="bg-muted/50 p-1 rounded-xl">
                    <TabsTrigger value="info" className="rounded-lg">Personal Data</TabsTrigger>
                    {!me?.isPlatformOnly && (
                        <>
                            <TabsTrigger value="employment" className="rounded-lg">Employment</TabsTrigger>
                            <TabsTrigger value="payslips" className="rounded-lg">Payslips</TabsTrigger>
                            <TabsTrigger value="leave" className="rounded-lg">Leave Balance</TabsTrigger>
                        </>
                    )}
                    <TabsTrigger value="security" className="rounded-lg flex items-center gap-2">
                        <Shield className="h-3.5 w-3.5" /> Security
                    </TabsTrigger>
                </TabsList>

                {/* Personal Data Tab */}
                <TabsContent value="info">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <UserCircle className="h-5 w-5 text-primary" /> Personal Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                {[
                                    ["Full Name", me?.fullName],
                                    ["Email Address", me?.email],
                                    ["Role", me?.role?.replace("_", " ")],
                                    ["ID Number (KTP)", employee?.nik || "Not provided"],
                                    ["Place, Date of Birth", employee?.dateOfBirth ? format(new Date(employee.dateOfBirth), "PPP") : "Not provided"],
                                    ["Gender", employee?.gender || "Not provided"],
                                    ["Marital Status", employee?.maritalStatus || "Not provided"],
                                    ["Tax ID (NPWP)", employee?.npwp || "Not provided"],
                                    ["Health BPJS No.", employee?.bpjsKesNumber || "Not provided"],
                                    ["Employment BPJS No.", employee?.bpjsTkNumber || "Not provided"],
                                ].map(([label, value]) => (
                                    <div key={label} className="space-y-1.5 group">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                                        <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Employment Tab */}
                {!me?.isPlatformOnly && (
                    <TabsContent value="employment">
                        <Card className="border-none shadow-md">
                            <CardHeader><CardTitle className="text-lg">Employment Data</CardTitle></CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                                    {[
                                        ["Employee Number", employee?.employeeNumber],
                                        ["Department", employee?.department?.name],
                                        ["Position", employee?.position?.title],
                                        ["Grade", employee?.grade?.name],
                                        ["Contract Type", employee?.employmentType],
                                        ["Join Date", joinDate ? format(joinDate, "dd/MM/yyyy") : "N/A"],
                                        ["Length of Service", serviceLength],
                                        ["Direct Manager", employee?.manager?.fullName || "None"],
                                        ["Bank", employee?.bankName || "Not set"],
                                        ["Account Number", employee?.bankAccount ? employee.bankAccount : "Not set"],
                                    ].map(([label, value]) => (
                                        <div key={label} className="space-y-1.5">
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
                                            <p className="text-sm font-medium text-foreground">{value}</p>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {/* Security Tab */}
                <TabsContent value="security">
                    <Card className="border-none shadow-md">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" /> Security Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="max-w-md">
                            <form onSubmit={handlePasswordChange} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword" className="text-xs uppercase tracking-wider">Current Password</Label>
                                    <Input 
                                        id="currentPassword" 
                                        type="password" 
                                        className="rounded-xl"
                                        value={passwords.currentPassword}
                                        onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                                        required
                                    />
                                </div>
                                <Separator className="my-2" />
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-xs uppercase tracking-wider">New Password</Label>
                                    <Input 
                                        id="newPassword" 
                                        type="password" 
                                        className="rounded-xl"
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-xs uppercase tracking-wider">Confirm New Password</Label>
                                    <Input 
                                        id="confirmPassword" 
                                        type="password" 
                                        className="rounded-xl"
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({...passwords, confirmPassword: e.target.value})}
                                        required
                                    />
                                </div>
                                <Button 
                                    type="submit" 
                                    className="w-full mt-4 rounded-xl gap-2 shadow-sm"
                                    disabled={isUpdatingPassword}
                                >
                                    {isUpdatingPassword ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Key className="h-4 w-4" />
                                    )}
                                    Update Password
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Temporary Placeholders for other tabs if they were dynamic before */}
                {!me?.isPlatformOnly && (
                    <>
                        <TabsContent value="payslips">
                            <Card className="border-none shadow-md">
                                <CardHeader><CardTitle className="text-lg">Recent Payslips</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground italic">Payslip dynamic integration pending...</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="leave">
                            <Card className="border-none shadow-md">
                                <CardHeader><CardTitle className="text-lg">Leave Entitlement</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground italic">Leave balance dynamic integration pending...</p>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </>
                )}
            </Tabs>
        </div>
    );
}
