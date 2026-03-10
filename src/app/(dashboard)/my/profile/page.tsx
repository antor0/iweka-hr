"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatIDR } from "@/lib/utils";
import {
    UserCircle, Mail, Phone, MapPin, Building2, Briefcase,
    Calendar, CreditCard, FileText, Download, Shield,
} from "lucide-react";

export default function MyProfilePage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <UserCircle className="h-6 w-6 text-primary" /> My Profile
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Your personal and employment information</p>
            </div>

            {/* Profile Card */}
            <Card>
                <CardContent className="py-6">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <Avatar className="h-24 w-24 text-2xl">
                            <AvatarFallback>WW</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-xl font-bold">Wisesa Widyantoro</h2>
                            <p className="text-muted-foreground">HR Admin — Human Resources</p>
                            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
                                <Badge variant="success">Active</Badge>
                                <Badge variant="default">Permanent</Badge>
                                <Badge variant="outline" className="font-mono">EMP-0042</Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted-foreground justify-center sm:justify-start">
                                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> wisesa@company.co.id</span>
                                <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> 081234567890</span>
                                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Joined 15/03/2020</span>
                            </div>
                        </div>
                        <Button variant="outline" size="sm">Edit Profile</Button>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="info">
                <TabsList>
                    <TabsTrigger value="info">Personal Data</TabsTrigger>
                    <TabsTrigger value="employment">Employment</TabsTrigger>
                    <TabsTrigger value="payslips">Payslips</TabsTrigger>
                    <TabsTrigger value="leave">Leave Balance</TabsTrigger>
                </TabsList>

                <TabsContent value="info">
                    <Card>
                        <CardHeader><CardTitle>Personal Data</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                {[
                                    ["Full Name", "Wisesa Widyantoro"],
                                    ["ID Number (KTP)", "3271••••••••0001"],
                                    ["Place, Date of Birth", "Jakarta, 15 March 1990"],
                                    ["Gender", "Male"],
                                    ["Marital Status", "Married (K/2)"],
                                    ["Tax ID", "01.234.•••.•-•••.•••"],
                                    ["Health BPJS No.", "0001••••••••01"],
                                    ["Employment BPJS No.", "191••••••••01"],
                                    ["Address", "Jl. Sudirman No. 42, Jakarta"],
                                    ["Emergency Contact", "Siti Nurhaliza (Wife) — 081234567891"],
                                ].map(([label, value]) => (
                                    <div key={label} className="space-y-1">
                                        <p className="text-xs text-muted-foreground">{label}</p>
                                        <p className="text-sm font-medium">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="employment">
                    <Card>
                        <CardHeader><CardTitle>Employment Data</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                                {[
                                    ["Employee Number", "EMP-0042"],
                                    ["Department", "Human Resources"],
                                    ["Position", "HR Admin"],
                                    ["Grade", "VI"],
                                    ["Contract Type", "Permanent"],
                                    ["Join Date", "15/03/2020"],
                                    ["Length of Service", "5 years 11 months"],
                                    ["Direct Manager", "Bambang Sugiarto (HR Manager)"],
                                    ["Bank", "Bank Mandiri"],
                                    ["Account Number", "130-00-••••••-8"],
                                ].map(([label, value]) => (
                                    <div key={label} className="space-y-1">
                                        <p className="text-xs text-muted-foreground">{label}</p>
                                        <p className="text-sm font-medium">{value}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="payslips">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Payslips</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {["February 2026", "January 2026", "December 2025", "November 2025"].map((month) => (
                                    <div key={month} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                <FileText className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{month}</p>
                                                <p className="text-xs text-muted-foreground">Net Salary: {formatIDR(8750000)}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm"><Download className="h-4 w-4 mr-1" /> PDF</Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="leave">
                    <Card>
                        <CardHeader><CardTitle>2026 Leave Balance</CardTitle></CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[
                                    { type: "Annual Leave", total: 12, used: 3, remaining: 9 },
                                    { type: "Sick Leave", total: "∞", used: 1, remaining: "∞" },
                                    { type: "Special Leave", total: "As per policy", used: 0, remaining: "—" },
                                ].map((leave) => (
                                    <div key={leave.type} className="glass rounded-xl p-4 text-center">
                                        <p className="text-sm font-medium text-foreground mb-2">{leave.type}</p>
                                        <p className="text-3xl font-bold text-primary">{leave.remaining}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Used: {leave.used} of {leave.total}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
