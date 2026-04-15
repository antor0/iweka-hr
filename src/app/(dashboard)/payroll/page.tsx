"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatIDR } from "@/lib/utils";
import { IncentivesTab } from "./components/incentives-tab";
import { useToast } from "@/hooks/use-toast";
import {
    Wallet, Play, Download, FileText, CheckCircle2, Clock, AlertCircle,
    ArrowRight, Calendar, Users, TrendingUp, Banknote, Gift, Loader2, X
} from "lucide-react";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

function getPipelineSteps(status: string) {
    const allSteps = ["DRAFT", "REVIEW", "APPROVED", "FINALIZED"];
    const currentIdx = allSteps.indexOf(status);
    return [
        { step: 1, title: "Auto Calculation", description: "Calculate salary, tax, BPJS", status: currentIdx >= 0 ? "completed" : "pending" },
        { step: 2, title: "Review", description: "Check & adjust values", status: currentIdx >= 1 ? (currentIdx === 1 ? "current" : "completed") : "pending" },
        { step: 3, title: "Approval", description: "Manager approval", status: currentIdx >= 2 ? (currentIdx === 2 ? "current" : "completed") : "pending" },
        { step: 4, title: "Finalization", description: "Lock payroll data", status: currentIdx >= 3 ? "completed" : "pending" },
    ];
}

const stepStyle: Record<string, { color: string; icon: React.ReactNode }> = {
    completed: { color: "bg-success text-success-foreground", icon: <CheckCircle2 className="h-4 w-4" /> },
    current: { color: "bg-primary text-primary-foreground animate-pulse", icon: <Play className="h-4 w-4" /> },
    pending: { color: "bg-muted text-muted-foreground", icon: <Clock className="h-4 w-4" /> },
};

const statusVariant: Record<string, any> = {
    FINALIZED: "success", APPROVED: "default", REVIEW: "warning", DRAFT: "secondary"
};

export default function PayrollPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRunModal, setShowRunModal] = useState(false);
    const [isRunning, setIsRunning] = useState(false);

    const now = new Date();
    const [runMonth, setRunMonth] = useState(now.getMonth() + 1);
    const [runYear, setRunYear] = useState(now.getFullYear());

    const fetchRuns = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/v1/payroll?limit=6");
            if (res.ok) {
                const json = await res.json();
                setPayrollRuns(json.data ?? []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchRuns(); }, [fetchRuns]);

    const handleRunPayroll = async () => {
        setIsRunning(true);
        try {
            const res = await fetch("/api/v1/payroll/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ periodMonth: runMonth, periodYear: runYear })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Failed to run payroll");
            toast({ title: "Payroll Generated", description: `${MONTH_NAMES[runMonth - 1]} ${runYear} payroll run created successfully.` });
            setShowRunModal(false);
            fetchRuns();
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsRunning(false);
        }
    };

    const latestRun = payrollRuns[0] ?? null;
    const pipelineSteps = latestRun ? getPipelineSteps(latestRun.status) : getPipelineSteps("NONE");
    const pipelineProgress = latestRun
        ? ({ DRAFT: 25, REVIEW: 50, APPROVED: 75, FINALIZED: 100 }[latestRun.status as string] ?? 0)
        : 0;

    const statsCards = latestRun ? [
        { title: "Total Gross Salary", value: formatIDR(Number(latestRun.totalGross)), subtitle: `${latestRun._count?.items ?? 0} employees | ${MONTH_NAMES[latestRun.periodMonth - 1]} ${latestRun.periodYear}`, icon: <Banknote className="h-5 w-5" />, accent: "primary" as const },
        { title: "Total Tax (PPh 21)", value: formatIDR(Number(latestRun.totalTax)), subtitle: `${latestRun.totalGross > 0 ? ((Number(latestRun.totalTax) / Number(latestRun.totalGross)) * 100).toFixed(1) : 0}% of gross`, icon: <FileText className="h-5 w-5" />, accent: "warning" as const },
        { title: "Total BPJS", value: formatIDR(Number(latestRun.totalBpjsCompany) + Number(latestRun.totalBpjsEmployee)), subtitle: "Company + Employee", icon: <Users className="h-5 w-5" />, accent: "accent" as const },
        { title: "Total Net Salary", value: formatIDR(Number(latestRun.totalNet)), subtitle: "Disbursed", icon: <Wallet className="h-5 w-5" />, accent: "success" as const },
    ] : [
        { title: "Total Gross Salary", value: "IDR 0", subtitle: "No payroll runs yet", icon: <Banknote className="h-5 w-5" />, accent: "primary" as const },
        { title: "Total Tax (PPh 21)", value: "IDR 0", subtitle: "—", icon: <FileText className="h-5 w-5" />, accent: "warning" as const },
        { title: "Total BPJS", value: "IDR 0", subtitle: "—", icon: <Users className="h-5 w-5" />, accent: "accent" as const },
        { title: "Total Net Salary", value: "IDR 0", subtitle: "—", icon: <Wallet className="h-5 w-5" />, accent: "success" as const },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-primary" /> Payroll
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {latestRun
                            ? `Latest period: ${MONTH_NAMES[latestRun.periodMonth - 1]} ${latestRun.periodYear}`
                            : "No payroll runs yet"}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1.5" /> Export</Button>
                    <Button size="sm" onClick={() => setShowRunModal(true)}>
                        <Play className="h-4 w-4 mr-1.5" /> Run Payroll
                    </Button>
                </div>
            </div>

            {/* Run Payroll Modal */}
            {showRunModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <Card className="glass w-full max-w-sm mx-4 shadow-2xl">
                        <CardHeader className="border-b border-border/50 pb-4">
                            <CardTitle className="flex items-center justify-between text-base">
                                <span className="flex items-center gap-2"><Play className="h-4 w-4 text-primary" /> Run Payroll</span>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowRunModal(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </CardTitle>
                            <CardDescription>Select period to generate payroll calculations.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Month</Label>
                                    <select
                                        className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={runMonth}
                                        onChange={(e) => setRunMonth(Number(e.target.value))}
                                    >
                                        {MONTH_NAMES.map((m, i) => (
                                            <option key={m} value={i + 1}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Year</Label>
                                    <Input type="number" value={runYear} min={2020} max={2099} onChange={(e) => setRunYear(Number(e.target.value))} />
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground">This calculates PPh 21 (TER/Progressive), BPJS, leave deductions, and late penalties using active configurations.</p>
                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" className="flex-1" onClick={() => setShowRunModal(false)}>Cancel</Button>
                                <Button className="flex-1" onClick={handleRunPayroll} disabled={isRunning}>
                                    {isRunning && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    {isRunning ? "Running..." : "Generate"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs defaultValue="overview" className="w-full space-y-6">
                <TabsList className="bg-muted/50 w-full sm:w-auto overflow-x-auto inline-flex justify-start sm:justify-center px-1.5 py-1.5 rounded-2xl p-1 shadow-sm border border-border/10">
                    <TabsTrigger value="overview" className="rounded-xl flex gap-2 w-full sm:w-auto font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <Wallet className="h-4 w-4" /> Overview
                    </TabsTrigger>
                    <TabsTrigger value="incentives" className="rounded-xl flex gap-2 w-full sm:w-auto font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm">
                        <Gift className="h-4 w-4" /> Incentives & Bonuses
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-0 animate-fade-in">
                    {loading ? (
                        <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                {statsCards.map((stat) => (
                                    <GlassStatCard key={stat.title} title={stat.title} value={stat.value} subtitle={stat.subtitle} icon={stat.icon} accentColor={stat.accent} />
                                ))}
                            </div>

                            {/* Payroll Pipeline */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" />
                                        {latestRun
                                            ? `${MONTH_NAMES[latestRun.periodMonth - 1]} ${latestRun.periodYear} Payroll Pipeline`
                                            : "Payroll Pipeline"}
                                    </CardTitle>
                                    <CardDescription>
                                        {latestRun ? `Status: ${latestRun.status}` : "No active payroll run"}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                        {pipelineSteps.map((step, i) => (
                                            <div key={step.step} className="flex items-center gap-2 min-w-0">
                                                <div className="flex flex-col items-center gap-2 min-w-[120px]">
                                                    <div className={`flex items-center justify-center h-10 w-10 rounded-xl ${stepStyle[step.status].color} transition-all`}>
                                                        {stepStyle[step.status].icon}
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-xs font-semibold text-foreground">{step.title}</p>
                                                        <p className="text-[10px] text-muted-foreground">{step.description}</p>
                                                    </div>
                                                </div>
                                                {i < pipelineSteps.length - 1 && (
                                                    <div className={`h-0.5 w-8 shrink-0 ${step.status === "completed" ? "bg-success" : "bg-border"} rounded-full transition-colors`} />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 flex items-center gap-4">
                                        <Progress value={pipelineProgress} className="flex-1" />
                                        <span className="text-sm text-muted-foreground font-medium">{pipelineProgress}% completed</span>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Payroll History */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Calendar className="h-5 w-5 text-primary" /> Payroll History
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
                                                {payrollRuns.map((run) => (
                                                    <tr key={run.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                                                            {MONTH_NAMES[run.periodMonth - 1]} {run.periodYear}
                                                        </td>
                                                        <td className="px-4 py-3 text-center text-sm">{run._count?.items ?? 0}</td>
                                                        <td className="px-4 py-3 text-right text-sm font-mono">{formatIDR(Number(run.totalGross))}</td>
                                                        <td className="px-4 py-3 text-right text-sm font-mono text-destructive">{formatIDR(Number(run.totalTax))}</td>
                                                        <td className="px-4 py-3 text-right text-sm font-mono font-medium text-success">{formatIDR(Number(run.totalNet))}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Badge variant={statusVariant[run.status] ?? "secondary"}>{run.status}</Badge>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button variant="ghost" size="sm" onClick={() => router.push(`/payroll/${run.id}`)}>
                                                                <FileText className="h-3.5 w-3.5 mr-1" /> Details
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {payrollRuns.length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} className="py-12 text-center text-muted-foreground">
                                                            No payroll runs found. Click "Run Payroll" to get started.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="incentives" className="mt-0 animate-fade-in space-y-4">
                    <IncentivesTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
