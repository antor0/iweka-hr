"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";
import { formatIDR } from "@/lib/utils";
import { IncentivesTab } from "./components/incentives-tab";
import {
    Wallet,
    Play,
    Download,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    ArrowRight,
    Calendar,
    Users,
    TrendingUp,
    Banknote,
    Gift,
} from "lucide-react";

const payrollStats = [
    { title: "Total Gross Salary", value: formatIDR(3248750000), subtitle: "487 employees", icon: <Banknote className="h-5 w-5" />, accent: "primary" as const },
    { title: "Total Tax (PPh 21)", value: formatIDR(287430000), subtitle: "8.8% of gross", icon: <FileText className="h-5 w-5" />, accent: "warning" as const },
    { title: "Total BPJS", value: formatIDR(398500000), subtitle: "Company + Employee", icon: <Users className="h-5 w-5" />, accent: "accent" as const },
    { title: "Total Net Salary", value: formatIDR(2562820000), subtitle: "Disbursed", icon: <Wallet className="h-5 w-5" />, accent: "success" as const },
];

const payrollHistory = [
    { period: "January 2026", status: "finalized", employees: 485, gross: 3215000000, net: 2548200000, tax: 282100000, processedDate: "31/01/2026" },
    { period: "December 2025", status: "finalized", employees: 483, gross: 3198500000, net: 2535100000, tax: 280500000, processedDate: "31/12/2025" },
    { period: "November 2025", status: "finalized", employees: 480, gross: 3175000000, net: 2520400000, tax: 278200000, processedDate: "30/11/2025" },
    { period: "October 2025", status: "finalized", employees: 478, gross: 3160000000, net: 2510000000, tax: 276800000, processedDate: "31/10/2025" },
];

const payrollSteps = [
    { step: 1, title: "Data Cut-off", description: "Attendance & leave recap", status: "completed" },
    { step: 2, title: "Auto Calculation", description: "Calculate salary, tax, BPJS", status: "completed" },
    { step: 3, title: "Review & Adjustment", description: "Check & manual correction", status: "current" },
    { step: 4, title: "Approval", description: "Manager approval", status: "pending" },
    { step: 5, title: "Finalization", description: "Lock payroll data", status: "pending" },
    { step: 6, title: "Disbursement", description: "Salary transfer & payslips", status: "pending" },
];

const stepStatus: Record<string, { color: string; icon: React.ReactNode }> = {
    completed: { color: "bg-success text-success-foreground", icon: <CheckCircle2 className="h-4 w-4" /> },
    current: { color: "bg-primary text-primary-foreground animate-pulse-ring", icon: <Play className="h-4 w-4" /> },
    pending: { color: "bg-muted text-muted-foreground", icon: <Clock className="h-4 w-4" /> },
};

export default function PayrollPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-primary" />
                        Payroll
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage monthly payroll process — February 2026 Period
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1.5" /> Export
                    </Button>
                    <Button size="sm">
                        <Play className="h-4 w-4 mr-1.5" /> Run Payroll
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="overview" className="w-full space-y-6">
                <TabsList className="bg-muted/50 w-full sm:w-auto overflow-x-auto inline-flex justify-start sm:justify-center px-1.5 py-1.5 rounded-2xl p-1 shadow-sm border border-border/10">
                    <TabsTrigger value="overview" className="rounded-xl flex gap-2 w-full sm:w-auto font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <Wallet className="h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="incentives" className="rounded-xl flex gap-2 w-full sm:w-auto font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <Gift className="h-4 w-4" />
                        Incentives & Bonuses
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-0 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {payrollStats.map((stat) => (
                            <GlassStatCard key={stat.title} title={stat.title} value={stat.value} subtitle={stat.subtitle} icon={stat.icon} accentColor={stat.accent} />
                        ))}
                    </div>

                    {/* Payroll Pipeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                February 2026 Payroll Pipeline
                            </CardTitle>
                            <CardDescription>This month's payroll process status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                {payrollSteps.map((step, i) => (
                                    <div key={step.step} className="flex items-center gap-2 min-w-0">
                                        <div className="flex flex-col items-center gap-2 min-w-[120px]">
                                            <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${stepStatus[step.status].color} transition-all`}>
                                                {stepStatus[step.status].icon}
                                            </div>
                                            <div className="text-center">
                                                <p className="text-xs font-semibold text-foreground">{step.title}</p>
                                                <p className="text-[10px] text-muted-foreground">{step.description}</p>
                                            </div>
                                        </div>
                                        {i < payrollSteps.length - 1 && (
                                            <div className={`h-0.5 w-8 shrink-0 ${step.status === "completed" ? "bg-success" : "bg-border"} rounded-full transition-colors`} />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex items-center gap-4">
                                <Progress value={40} className="flex-1" />
                                <span className="text-sm text-muted-foreground font-medium">40% completed</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payroll History */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Payroll History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Period</th>
                                            <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Employees</th>
                                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Gross Salary</th>
                                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Tax</th>
                                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Net Salary</th>
                                            <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                                            <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payrollHistory.map((item, i) => (
                                            <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-foreground">{item.period}</td>
                                                <td className="px-4 py-3 text-center text-sm">{item.employees}</td>
                                                <td className="px-4 py-3 text-right text-sm font-mono">{formatIDR(item.gross)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-mono text-destructive">{formatIDR(item.tax)}</td>
                                                <td className="px-4 py-3 text-right text-sm font-mono font-medium text-success">{formatIDR(item.net)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <Badge variant="success">Completed</Badge>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <Button variant="ghost" size="sm">
                                                        <FileText className="h-3.5 w-3.5 mr-1" /> Details
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="incentives" className="mt-0 animate-fade-in space-y-4">
                    <IncentivesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
