"use client";

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
} from "lucide-react";

export default function SettingsPage() {
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
                    <TabsTrigger value="appearance"><Palette className="h-4 w-4 mr-1.5" /> Appearance</TabsTrigger>
                    <TabsTrigger value="notifications"><Bell className="h-4 w-4 mr-1.5" /> Notifications</TabsTrigger>
                    <TabsTrigger value="system"><Database className="h-4 w-4 mr-1.5" /> System</TabsTrigger>
                </TabsList>

                <TabsContent value="company">
                    <Card>
                        <CardHeader>
                            <CardTitle>Company Information</CardTitle>
                            <CardDescription>Company data for payroll and reporting purposes</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Company Name</label>
                                    <Input defaultValue="PT. Indowebhost Kreasi" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Company Tax ID</label>
                                    <Input defaultValue="01.234.567.8-012.345" className="font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Address</label>
                                    <Input defaultValue="Jl. Sudirman No. 123, Jakarta Selatan" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Payroll Date</label>
                                    <Input type="number" defaultValue="25" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">JKK Risk Group</label>
                                    <Input defaultValue="Level 2 (0.54%)" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Main Bank</label>
                                    <Input defaultValue="Bank Mandiri" />
                                </div>
                            </div>

                            <Separator />

                            <div className="flex justify-end">
                                <Button>
                                    <Save className="h-4 w-4 mr-1.5" /> Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="roles">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Management</CardTitle>
                            <CardDescription>Configure roles and permissions for each module</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {["System Admin", "HR Admin", "HR Manager", "Payroll Specialist", "Finance", "Line Manager", "Employee"].map((role) => (
                                    <div key={role} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <Shield className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{role}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {role === "System Admin" ? "Full access to the entire system" :
                                                        role === "Employee" ? "Limited access to own profile" :
                                                            "Access based on role"}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="outline" size="sm">Edit</Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
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
                </TabsContent>
            </Tabs>
        </div>
    );
}
