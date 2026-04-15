"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Settings,
    Building2,
    Shield,
    Palette,
    Bell,
    Database,
    Globe,
    Save,
    Check,
    X,
    ChevronDown,
    ChevronUp,
    Users,
    Mail,
    Calendar,
    FileText,
    Loader2,
    HeartPulse,
    Receipt,
    Clock
} from "lucide-react";
import { ROLE_PERMISSIONS, PERMISSION_GROUPS, hasPermission } from "@/lib/auth/permissions-config";
import { UsersTab } from "./users-tab";

export default function SettingsPage() {
    const [expandedRole, setExpandedRole] = useState<string | null>(null);
    
    // Company Config State
    const [companyConfig, setCompanyConfig] = useState<any>(null);
    const [isLoadingCompany, setIsLoadingCompany] = useState(true);
    const [isSavingCompany, setIsSavingCompany] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchCompanyConfig = async () => {
            try {
                const res = await fetch("/api/v1/settings/company");
                const data = await res.json();
                setCompanyConfig(data);
            } catch (e) {
                console.error("Failed to fetch company config", e);
            } finally {
                setIsLoadingCompany(false);
            }
        };
        fetchCompanyConfig();
    }, []);

    const handleSaveCompany = async () => {
        setIsSavingCompany(true);
        try {
            const res = await fetch("/api/v1/settings/company", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(companyConfig),
            });
            
            if (!res.ok) throw new Error("Failed to save");
            
            toast({
                title: "Settings Saved",
                description: "Company information updated successfully.",
            });
        } catch (e) {
            console.error("Failed to save company config", e);
            toast({
                title: "Error Saving",
                description: "Could not save company configuration.",
                variant: "destructive",
            });
        } finally {
            setIsSavingCompany(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <Settings className="h-6 w-6 text-primary" />
                    Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                    HRIS system configuration
                </p>
            </div>

            <Tabs defaultValue="company" className="w-full">
                <TabsList className="flex-wrap h-auto gap-1 p-1">
                    <TabsTrigger value="company"><Building2 className="h-4 w-4 mr-1.5" /> Company</TabsTrigger>
                    <TabsTrigger value="roles"><Shield className="h-4 w-4 mr-1.5" /> Roles & Permissions</TabsTrigger>
                    <TabsTrigger value="users"><Users className="h-4 w-4 mr-1.5" /> Platform Users</TabsTrigger>
                    <TabsTrigger value="appearance"><Palette className="h-4 w-4 mr-1.5" /> Appearance</TabsTrigger>
                    <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1.5" /> Notifications</TabsTrigger>
                    <TabsTrigger value="system"><Database className="h-4 w-4 mr-1.5" /> System Config</TabsTrigger>
                </TabsList>

                <TabsContent value="company">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Information</CardTitle>
                            <CardDescription>Company data for payroll and reporting purposes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isLoadingCompany ? (
                                <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Company Name</label>
                                            <Input value={companyConfig?.companyName || ""} onChange={(e) => setCompanyConfig({...companyConfig, companyName: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Company Tax ID</label>
                                            <Input value={companyConfig?.companyTaxId || ""} onChange={(e) => setCompanyConfig({...companyConfig, companyTaxId: e.target.value})} className="font-mono" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Company Email</label>
                                            <Input type="email" value={companyConfig?.email || ""} onChange={(e) => setCompanyConfig({...companyConfig, email: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Phone Number</label>
                                            <Input value={companyConfig?.phone || ""} onChange={(e) => setCompanyConfig({...companyConfig, phone: e.target.value})} />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-medium">Address</label>
                                            <Input value={companyConfig?.address || ""} onChange={(e) => setCompanyConfig({...companyConfig, address: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Payroll Date</label>
                                            <Input type="number" value={companyConfig?.payrollDate || ""} onChange={(e) => setCompanyConfig({...companyConfig, payrollDate: parseInt(e.target.value) || 25})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">JKK Risk Group</label>
                                            <Input value={companyConfig?.jkkRiskGroup || ""} onChange={(e) => setCompanyConfig({...companyConfig, jkkRiskGroup: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Main Bank</label>
                                            <Input value={companyConfig?.mainBank || ""} onChange={(e) => setCompanyConfig({...companyConfig, mainBank: e.target.value})} />
                                        </div>
                                    </div>

                                    <Separator />

                                    <div className="flex justify-end">
                                        <Button onClick={handleSaveCompany} disabled={isSavingCompany}>
                                            {isSavingCompany ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />} 
                                            Save Changes
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roles">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Management</CardTitle>
                            <CardDescription>View system roles and their assigned permissions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.keys(ROLE_PERMISSIONS).map((role) => (
                                    <div key={role} className="border border-border rounded-xl overflow-hidden shadow-sm">
                                        <div
                                            className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors"
                                            onClick={() => setExpandedRole(expandedRole === role ? null : role)}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Shield className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{role.replace(/_/g, " ")}</p>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                        {ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS].includes("*")
                                                            ? "Full System Access"
                                                            : `${ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS].length} permission sets assigned`}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                {expandedRole === role ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </Button>
                                        </div>

                                        {expandedRole === role && (
                                            <div className="p-4 bg-background border-t border-border grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {PERMISSION_GROUPS.map(group => (
                                                    <div key={group.name} className="space-y-3">
                                                        <h4 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">{group.name}</h4>
                                                        <div className="flex flex-col gap-2">
                                                            {group.permissions.map(perm => {
                                                                const isAllowed = hasPermission(role, perm as any);
                                                                return (
                                                                    <div key={perm} className="flex items-center gap-2">
                                                                        {isAllowed ? (
                                                                            <div className="h-4 w-4 rounded bg-primary/20 flex items-center justify-center shrink-0">
                                                                                <Check className="h-3 w-3 text-primary" />
                                                                            </div>
                                                                        ) : (
                                                                            <div className="h-4 w-4 rounded bg-secondary/50 flex items-center justify-center shrink-0">
                                                                                <X className="h-3 w-3 text-muted-foreground/50" />
                                                                            </div>
                                                                        )}
                                                                        <span className={`text-[13px] ${isAllowed ? "text-foreground font-medium" : "text-muted-foreground line-through decoration-muted-foreground/30"}`}>
                                                                            {perm.split(".")[1]}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="users">
                    <UsersTab />
                </TabsContent>

                <TabsContent value="appearance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance Settings</CardTitle>
                            <CardDescription>Customize app theme and appearance</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Theme</label>
                                <p className="text-xs text-muted-foreground">
                                    Choose app color theme. Use the toggle in the topbar for quick switching.
                                </p>
                                <div className="flex gap-3 mt-2">
                                    <div className="flex-1 p-4 rounded-xl glass glass-hover cursor-pointer border-2 border-primary/50">
                                        <div className="h-20 rounded-lg bg-gradient-to-br from-white to-slate-100 mb-2" />
                                        <p className="text-sm font-medium text-center">Light</p>
                                    </div>
                                    <div className="flex-1 p-4 rounded-xl glass glass-hover cursor-pointer">
                                        <div className="h-20 rounded-lg bg-gradient-to-br from-slate-900 to-slate-800 mb-2" />
                                        <p className="text-sm font-medium text-center">Dark</p>
                                    </div>
                                    <div className="flex-1 p-4 rounded-xl glass glass-hover cursor-pointer">
                                        <div className="h-20 rounded-lg bg-gradient-to-br from-white via-slate-300 to-slate-900 mb-2" />
                                        <p className="text-sm font-medium text-center">System</p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Language</label>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="cursor-pointer">
                                        🇮🇩 Bahasa Indonesia
                                    </Badge>
                                    <Badge variant="default" className="cursor-pointer">
                                        🇬🇧 English
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                            <CardDescription>Configure email and in-app notifications</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">Notification configuration will be available soon.</p>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="system">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-warning" />
                                    Attendance Setting
                                </CardTitle>
                                <CardDescription>Configure rules for employee attendance tracking and late penalties</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isLoadingCompany ? (
                                    <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Late Grace Period (Minutes)</label>
                                                <Input 
                                                    type="number" 
                                                    min="0" 
                                                    value={companyConfig?.lateGracePeriodMins ?? 15} 
                                                    onChange={(e) => setCompanyConfig({...companyConfig, lateGracePeriodMins: parseInt(e.target.value) || 0})} 
                                                />
                                                <p className="text-xs text-muted-foreground">Minutes of lateness to ignore before applying penalty</p>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Penalty Amount (IDR per occurrence)</label>
                                                <Input 
                                                    type="number" 
                                                    min="0" 
                                                    value={companyConfig?.latePenaltyAmount ?? 0} 
                                                    onChange={(e) => setCompanyConfig({...companyConfig, latePenaltyAmount: parseFloat(e.target.value) || 0})} 
                                                />
                                                <p className="text-xs text-muted-foreground">Fixed amount deducted per late occurrence exceeding grace period</p>
                                            </div>
                                        </div>

                                        <Separator />
                                        
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                            <div className="flex gap-3">
                                                <div className="mt-1">
                                                    <Calendar className="h-5 w-5 text-orange-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">Automatic Deductions</p>
                                                    <p className="text-xs text-muted-foreground">Penalties are automatically calculated and applied during the payroll run based on approved timesheets.</p>
                                                </div>
                                            </div>
                                            <Button onClick={handleSaveCompany} disabled={isSavingCompany}>
                                                {isSavingCompany ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />} 
                                                Save Attendance Config
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Configuration & Master Data</CardTitle>
                                <CardDescription>Manage system-wide configuration and templates</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Link href="/surat-templates" className="flex flex-col p-4 rounded-xl border border-border glass glass-hover transition-all">
                                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                                        <FileText className="h-5 w-5 text-primary" />
                                    </div>
                                    <h4 className="font-medium text-sm">Surat Templates</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Manage official company letter formats and numbering</p>
                                </Link>

                                <Link href="/settings/holidays" className="flex flex-col p-4 rounded-xl border border-border glass glass-hover transition-all">
                                    <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3">
                                        <Calendar className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <h4 className="font-medium text-sm">Holiday Settings</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Configure national and company holidays per year</p>
                                </Link>

                                <Link href="/settings/email" className="flex flex-col p-4 rounded-xl border border-border glass glass-hover transition-all">
                                    <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3">
                                        <Mail className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <h4 className="font-medium text-sm">Email Config</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Configure SMTP settings for system notifications</p>
                                </Link>

                                <Link href="/settings/bpjs" className="flex flex-col p-4 rounded-xl border border-border glass glass-hover transition-all">
                                    <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3">
                                        <HeartPulse className="h-5 w-5 text-emerald-500" />
                                    </div>
                                    <h4 className="font-medium text-sm">BPJS Configuration</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Manage Health and Employment BPJS rates</p>
                                </Link>

                                <Link href="/settings/tax" className="flex flex-col p-4 rounded-xl border border-border glass glass-hover transition-all">
                                    <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center mb-3">
                                        <Receipt className="h-5 w-5 text-violet-500" />
                                    </div>
                                    <h4 className="font-medium text-sm">Tax PPh 21 Configuration</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Manage TER rates, PTKP values, and progressive brackets</p>
                                </Link>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>System Information</CardTitle>
                                <CardDescription>Technical details and system status</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-3 rounded-xl bg-secondary/50">
                                        <p className="text-xs text-muted-foreground">App Version</p>
                                        <p className="text-sm font-mono font-medium">v1.0.0-beta</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-secondary/50">
                                        <p className="text-xs text-muted-foreground">Database</p>
                                        <p className="text-sm font-mono font-medium">PostgreSQL 16</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-secondary/50">
                                        <p className="text-xs text-muted-foreground">Framework</p>
                                        <p className="text-sm font-mono font-medium">Next.js 15 (App Router)</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-secondary/50">
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <Badge variant="success">Healthy</Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
