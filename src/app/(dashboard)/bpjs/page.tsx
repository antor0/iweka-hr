"use client";

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
    Users,
    Wallet,
    FileText,
} from "lucide-react";

const bpjsStats = [
    { title: "Health BPJS (Company)", value: formatIDR(155200000), subtitle: "4% of basic salary", icon: <HeartPulse className="h-5 w-5" />, accent: "primary" as const },
    { title: "Health BPJS (Employee)", value: formatIDR(38800000), subtitle: "1% of basic salary", icon: <HeartPulse className="h-5 w-5" />, accent: "accent" as const },
    { title: "Employment BPJS (Company)", value: formatIDR(198750000), subtitle: "JHT + JKK + JKM + JP", icon: <Shield className="h-5 w-5" />, accent: "success" as const },
    { title: "Employment BPJS (Employee)", value: formatIDR(116250000), subtitle: "JHT + JP", icon: <Shield className="h-5 w-5" />, accent: "warning" as const },
];

const bpjsRates = [
    { program: "Health BPJS", company: "4%", employee: "1%", cap: formatIDR(12000000), description: "National Health Insurance" },
    { program: "JHT (Old Age Security)", company: "3.7%", employee: "2%", cap: "—", description: "Old age savings" },
    { program: "JKK (Work Accident Security)", company: "0.24%", employee: "—", cap: "—", description: "Based on risk group" },
    { program: "JKM (Death Security)", company: "0.30%", employee: "—", cap: "—", description: "Death compensation" },
    { program: "JP (Pension Security)", company: "2%", employee: "1%", cap: formatIDR(10042300), description: "Pension security, subject to wage cap" },
];

const bpjsSummary = [
    { month: "January 2026", kesCompany: 153800000, kesEmployee: 38450000, tkCompany: 196500000, tkEmployee: 115200000, total: 503950000 },
    { month: "February 2026", kesCompany: 155200000, kesEmployee: 38800000, tkCompany: 198750000, tkEmployee: 116250000, total: 509000000 },
];

export default function BPJSPage() {
    return (
        <div className="space-y-6 animate-fade-in">
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
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1.5" /> Rate Configuration
                    </Button>
                    <Button size="sm">
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
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                BPJS Rate Configuration
                            </CardTitle>
                            <CardDescription>
                                Rates effective since 01/01/2026 — configurable in Settings
                            </CardDescription>
                        </div>
                        <Badge variant="success">Active</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Program</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">Company</th>
                                    <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">Employee</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Wage Cap</th>
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Description</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bpjsRates.map((rate) => (
                                    <tr key={rate.program} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium">{rate.program}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge variant="default" className="font-mono">{rate.company}</Badge>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {rate.employee === "—" ? (
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Monthly Contribution Summary
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Period</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Health (Comp)</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Health (Emp)</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Emp. (Comp)</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Emp. (Emp)</th>
                                    <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3 font-bold">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bpjsSummary.map((row) => (
                                    <tr key={row.month} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                        <td className="px-4 py-3 text-sm font-medium">{row.month}</td>
                                        <td className="px-4 py-3 text-right text-sm font-mono">{formatIDR(row.kesCompany)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-mono">{formatIDR(row.kesEmployee)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-mono">{formatIDR(row.tkCompany)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-mono">{formatIDR(row.tkEmployee)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-mono font-bold text-primary">{formatIDR(row.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
