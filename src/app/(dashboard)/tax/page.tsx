"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";
import { formatIDR } from "@/lib/utils";
import {
    Receipt,
    Download,
    FileText,
    Settings,
    Calculator,
    Users,
    TrendingDown,
    Calendar,
} from "lucide-react";

const taxStats = [
    { title: "Tax This Month", value: formatIDR(287430000), subtitle: "February 2026", icon: <Receipt className="h-5 w-5" />, accent: "primary" as const },
    { title: "Tax YTD", value: formatIDR(569560000), subtitle: "Jan - Feb 2026", icon: <TrendingDown className="h-5 w-5" />, accent: "warning" as const },
    { title: "Taxpayers", value: "487", subtitle: "Employees with Tax ID", icon: <Users className="h-5 w-5" />, accent: "accent" as const },
    { title: "Method", value: "TER", subtitle: "Average Effective Rate", icon: <Calculator className="h-5 w-5" />, accent: "success" as const },
];

const ptkpCategories = [
    { status: "TK/0", description: "Single, 0 dependents", amount: 54000000, count: 156 },
    { status: "TK/1", description: "Single, 1 dependent", amount: 58500000, count: 23 },
    { status: "K/0", description: "Married, 0 dependents", amount: 58500000, count: 87 },
    { status: "K/1", description: "Married, 1 dependent", amount: 63000000, count: 112 },
    { status: "K/2", description: "Married, 2 dependents", amount: 67500000, count: 78 },
    { status: "K/3", description: "Married, 3 dependents", amount: 72000000, count: 31 },
];

const monthlyTaxData = [
    { month: "January", gross: 3215000000, taxable: 2895000000, tax: 282100000, employees: 485 },
    { month: "February", gross: 3248750000, taxable: 2923500000, tax: 287430000, employees: 487 },
];

export default function TaxPage() {
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Receipt className="h-6 w-6 text-primary" />
                        Income Tax (PPh 21)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Income tax calculation and reporting
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1.5" /> Configuration
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1.5" /> Monthly Return
                    </Button>
                    <Button size="sm">
                        <FileText className="h-4 w-4 mr-1.5" /> 1721-A1
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {taxStats.map((stat) => (
                    <GlassStatCard key={stat.title} title={stat.title} value={stat.value} subtitle={stat.subtitle} icon={stat.icon} accentColor={stat.accent} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PTKP Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            PTKP Distribution
                        </CardTitle>
                        <CardDescription>
                            Non-taxable income per category
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {ptkpCategories.map((cat) => (
                                <div key={cat.status} className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary/50 transition-colors">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-mono text-xs">{cat.status}</Badge>
                                            <span className="text-sm text-foreground">{cat.description}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground font-mono mt-0.5 block">
                                            PTKP: {formatIDR(cat.amount)} /year
                                        </span>
                                    </div>
                                    <Badge variant="secondary" className="font-mono">{cat.count} people</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Monthly Tax Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-primary" />
                            Monthly Tax Recap
                        </CardTitle>
                        <CardDescription>
                            Monthly tax summary (year 2026)
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">Month</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Gross</th>
                                        <th className="text-right text-xs font-medium text-muted-foreground uppercase px-4 py-3">Tax</th>
                                        <th className="text-center text-xs font-medium text-muted-foreground uppercase px-4 py-3">Emp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyTaxData.map((row) => (
                                        <tr key={row.month} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                                            <td className="px-4 py-3 text-sm font-medium">{row.month}</td>
                                            <td className="px-4 py-3 text-right text-sm font-mono">{formatIDR(row.gross)}</td>
                                            <td className="px-4 py-3 text-right text-sm font-mono text-destructive">{formatIDR(row.tax)}</td>
                                            <td className="px-4 py-3 text-center text-sm">{row.employees}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-border bg-secondary/30">
                                        <td className="px-4 py-3 text-sm font-bold">Total YTD</td>
                                        <td className="px-4 py-3 text-right text-sm font-mono font-bold">{formatIDR(6463750000)}</td>
                                        <td className="px-4 py-3 text-right text-sm font-mono font-bold text-destructive">{formatIDR(569560000)}</td>
                                        <td className="px-4 py-3 text-center text-sm font-bold">487</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
