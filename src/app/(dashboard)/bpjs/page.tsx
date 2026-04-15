"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";
import { formatIDR } from "@/lib/utils";
import {
    HeartPulse,
    Download,
    Settings,
    Shield,
    FileText,
    Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function BPJSPage() {
    const [bpjsConfig, setBpjsConfig] = useState<any>(null);
    const [payrollRuns, setPayrollRuns] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch active BPJS config
                const configRes = await fetch("/api/v1/settings/bpjs");
                if (configRes.ok) {
                    const configJson = await configRes.json();
                    setBpjsConfig(configJson.data);
                }

                // Fetch payroll runs for stats and summary
                const payrollRes = await fetch("/api/v1/payroll?limit=12");
                if (payrollRes.ok) {
                    const payrollJson = await payrollRes.json();
                    // only consider finalized or approved runs if needed, here we just use all returned
                    setPayrollRuns(payrollJson.data || []);
                }
            } catch (error) {
                console.error("Failed to fetch BPJS data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const handleExportSIPP = () => {
        if (!payrollRuns || payrollRuns.length === 0) {
             toast({
                 title: "No Data",
                 description: "There is no BPJS summary data available to export.",
                 variant: "destructive"
             });
             return;
        }

        const headers = ["Period", "Status", "Company BPJS", "Employee BPJS", "Total BPJS"];
        const rows = payrollRuns.map((r: any) => [
            `${monthNames[r.periodMonth - 1]} ${r.periodYear}`,
            r.status,
            r.totalBpjsCompany,
            r.totalBpjsEmployee,
            (Number(r.totalBpjsCompany) + Number(r.totalBpjsEmployee))
        ]);

        let csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n"
            + rows.map((e: any[]) => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `BPJS_SIPP_Export_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({
             title: "Export Successful",
             description: "BPJS SIPP Summary CSV generated successfully."
        });
    };

    const formatPercent = (val: number) => (val * 100).toFixed(2) + "%";

    // Build the dynamic rates array based on active config
    const bpjsRates = bpjsConfig ? [
        { program: "Health BPJS", company: formatPercent(bpjsConfig.kesCompanyRate), employee: formatPercent(bpjsConfig.kesEmployeeRate), cap: formatIDR(bpjsConfig.kesSalaryCap), description: "National Health Insurance" },
        { program: "JHT (Old Age Security)", company: formatPercent(bpjsConfig.jhtCompanyRate), employee: formatPercent(bpjsConfig.jhtEmployeeRate), cap: "—", description: "Old age savings" },
        { program: "JKK (Work Accident Security)", company: formatPercent(bpjsConfig.jkkCompanyRate), employee: "—", cap: "—", description: "Based on risk group" },
        { program: "JKM (Death Security)", company: formatPercent(bpjsConfig.jkmCompanyRate), employee: "—", cap: "—", description: "Death compensation" },
        { program: "JP (Pension Security)", company: formatPercent(bpjsConfig.jpCompanyRate), employee: formatPercent(bpjsConfig.jpEmployeeRate), cap: formatIDR(bpjsConfig.jpSalaryCap), description: "Pension security, subject to wage cap" },
    ] : [];

    // Get the latest payroll run for the top stats
    const latestRun = payrollRuns.length > 0 ? payrollRuns[0] : null;

    // We don't have separate Kes and TK in payrollRun totals, only totalBpjsCompany and totalBpjsEmployee.
    // To be precise we could fetch the items, but for now we'll just show the totals from the run.
    const bpjsStats = latestRun ? [
        { title: "Total BPJS (Company)", value: formatIDR(latestRun.totalBpjsCompany), subtitle: "Latest Period", icon: <Shield className="h-5 w-5" />, accent: "primary" as const },
        { title: "Total BPJS (Employee)", value: formatIDR(latestRun.totalBpjsEmployee), subtitle: "Latest Period", icon: <HeartPulse className="h-5 w-5" />, accent: "accent" as const },
        { title: "Total BPJS Combined", value: formatIDR(Number(latestRun.totalBpjsCompany) + Number(latestRun.totalBpjsEmployee)), subtitle: "Company + Employee", icon: <Shield className="h-5 w-5" />, accent: "success" as const },
        { title: "Processed Employees", value: latestRun._count?.items || 0, subtitle: "In latest period", icon: <Shield className="h-5 w-5" />, accent: "warning" as const },
    ] : [
        { title: "Total BPJS (Company)", value: "IDR 0", subtitle: "Latest Period", icon: <Shield className="h-5 w-5" />, accent: "primary" as const },
        { title: "Total BPJS (Employee)", value: "IDR 0", subtitle: "Latest Period", icon: <HeartPulse className="h-5 w-5" />, accent: "accent" as const },
        { title: "Total BPJS Combined", value: "IDR 0", subtitle: "Company + Employee", icon: <Shield className="h-5 w-5" />, accent: "success" as const },
        { title: "Processed Employees", value: 0, subtitle: "In latest period", icon: <Shield className="h-5 w-5" />, accent: "warning" as const },
    ];



    if (loading) {
        return (
            <div className="flex justify-center p-8">
                 <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <HeartPulse className="h-6 w-6 text-primary" />
                        BPJS Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Health BPJS & Employment BPJS — contributions and reporting
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/settings/bpjs">
                        <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-1.5" /> Rate Configuration
                        </Button>
                    </Link>
                    <Button size="sm" onClick={handleExportSIPP}>
                        <Download className="h-4 w-4 mr-1.5" /> Export SIPP
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {bpjsStats.map((stat) => (
                    <GlassStatCard key={stat.title} title={stat.title} value={stat.value} subtitle={stat.subtitle} icon={stat.icon} accentColor={stat.accent} />
                ))}
            </div>

            {/* Rate Configuration Table */}
            <Card className="glass">
                <CardHeader className="border-b border-border/50 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Settings className="h-5 w-5 text-primary" />
                                Active BPJS Rates
                            </CardTitle>
                            <CardDescription>
                                Rates effective since {bpjsConfig?.effectiveDate ? new Date(bpjsConfig.effectiveDate).toLocaleDateString() : 'N/A'} — configurable in Settings
                            </CardDescription>
                        </div>
                        {bpjsConfig?.isActive && <Badge variant="success">Active</Badge>}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50 border-border">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Program</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">Company</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">Employee</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Wage Cap</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bpjsRates.map((rate, i) => (
                                    <tr key={rate.program + i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium">{rate.program}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant="default" className="font-mono">{rate.company}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {rate.employee === "0.00%" || rate.employee === "—" ? (
                                                <span className="text-muted-foreground text-sm">—</span>
                                            ) : (
                                                <Badge variant="outline" className="font-mono">{rate.employee}</Badge>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono text-muted-foreground">{rate.cap}</td>
                                        <td className="px-4 py-3 text-sm text-muted-foreground">{rate.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Summary */}
            <Card className="glass">
                <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-5 w-5 text-primary" />
                        Monthly Contribution Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-muted/50 border-border">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Period</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Status</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Company BPJS</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Employee BPJS</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3 font-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrollRuns.map((row) => (
                                    <tr key={row.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium">{monthNames[row.periodMonth - 1]} {row.periodYear}</td>
                                        <td className="px-4 py-3 text-right">
                                             <Badge variant={row.status === "FINALIZED" ? "success" : "secondary"}>{row.status}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right text-sm font-mono">{formatIDR(row.totalBpjsCompany)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-mono">{formatIDR(row.totalBpjsEmployee)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-mono font-bold text-primary">{formatIDR(Number(row.totalBpjsCompany) + Number(row.totalBpjsEmployee))}</td>
                                    </tr>
                                ))}
                                {payrollRuns.length === 0 && (
                                    <tr>
                                         <td colSpan={5} className="py-8 text-center text-muted-foreground">No payroll data found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
