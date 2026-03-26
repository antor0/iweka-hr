"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";
import {
    FileText,
    Plus,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    Eye,
    Send,
    Car,
    Utensils,
    Building,
    Bus,
    ParkingCircle,
    Briefcase,
    Phone,
    MoreHorizontal,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
    TRAVEL: <Car className="h-4 w-4" />,
    MEALS: <Utensils className="h-4 w-4" />,
    ACCOMMODATION: <Building className="h-4 w-4" />,
    TRANSPORT: <Bus className="h-4 w-4" />,
    PARKING_TOLLS: <ParkingCircle className="h-4 w-4" />,
    OFFICE_SUPPLIES: <Briefcase className="h-4 w-4" />,
    COMMUNICATION: <Phone className="h-4 w-4" />,
    OTHER: <MoreHorizontal className="h-4 w-4" />,
};

const statusMap: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" | "secondary" }> = {
    DRAFT: { label: "Draft", variant: "secondary" },
    SUBMITTED: { label: "Submitted", variant: "warning" },
    APPROVED: { label: "Approved", variant: "success" },
    REJECTED: { label: "Rejected", variant: "destructive" },
    PAID: { label: "Paid", variant: "default" },
};

interface ClaimData {
    id: string;
    claimNumber: string;
    title: string;
    status: string;
    totalAmount: string | number;
    createdAt: string;
    submittedAt: string | null;
    employee: { fullName: string; employeeNumber: string };
    _count: { items: number };
}

function formatCurrency(value: string | number): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

export default function ClaimsPage() {
    const [claims, setClaims] = useState<ClaimData[]>([]);
    const [stats, setStats] = useState({ totalClaims: 0, pending: 0, approved: 0, totalAmount: 0 });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("all");

    const fetchClaims = useCallback(async (status?: string) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ limit: "50" });
            if (status && status !== "all") params.set("status", status);
            const res = await fetch(`/api/v1/claims?${params}`);
            const json = await res.json();
            setClaims(json.data || []);
            if (json.stats) setStats(json.stats);
        } catch {
            // ignore
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchClaims(activeTab === "all" ? undefined : activeTab);
    }, [activeTab, fetchClaims]);

    const claimStats = [
        { title: "Total Claims", value: String(stats.totalClaims), subtitle: "All time", icon: <FileText className="h-5 w-5" />, accent: "primary" as const },
        { title: "Pending Review", value: String(stats.pending), subtitle: "Awaiting approval", icon: <Clock className="h-5 w-5" />, accent: "warning" as const },
        { title: "Approved", value: String(stats.approved), subtitle: "This period", icon: <CheckCircle2 className="h-5 w-5" />, accent: "success" as const },
        { title: "Total Approved", value: formatCurrency(stats.totalAmount), subtitle: "Approved + Paid", icon: <DollarSign className="h-5 w-5" />, accent: "accent" as const },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        Claims Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Submit and manage expense reimbursement claims
                    </p>
                </div>
                <Link href="/claims/new">
                    <Button size="sm">
                        <Plus className="h-4 w-4 mr-1.5" /> New Claim
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {claimStats.map((stat) => (
                    <GlassStatCard key={stat.title} title={stat.title} value={stat.value} subtitle={stat.subtitle} icon={stat.icon} accentColor={stat.accent} />
                ))}
            </div>

            <Tabs defaultValue="all" onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="DRAFT">Draft</TabsTrigger>
                    <TabsTrigger value="SUBMITTED">Submitted ({stats.pending})</TabsTrigger>
                    <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                    <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                    <Card>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-border">
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Claim #</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Employee</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Title</th>
                                            <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Items</th>
                                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Amount</th>
                                            <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Date</th>
                                            <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Status</th>
                                            <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                        Loading claims...
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : claims.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                                                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    <p>No claims found</p>
                                                    <Link href="/claims/new">
                                                        <Button size="sm" variant="outline" className="mt-2">
                                                            <Plus className="h-3.5 w-3.5 mr-1" /> Create your first claim
                                                        </Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ) : (
                                            claims.map((claim) => (
                                                <tr key={claim.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-mono font-medium text-primary">{claim.claimNumber}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm font-medium">{claim.employee.fullName}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className="text-sm">{claim.title}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className="text-sm font-medium">{claim._count.items}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className="text-sm font-semibold">{formatCurrency(claim.totalAmount)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-muted-foreground">
                                                        {formatDate(claim.submittedAt || claim.createdAt)}
                                                    </td>
                                                    <td className="px-4 py-3 text-center">
                                                        <Badge variant={statusMap[claim.status]?.variant || "default"}>
                                                            {statusMap[claim.status]?.label || claim.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <Link href={`/claims/${claim.id}`}>
                                                            <Button size="sm" variant="ghost" className="h-7 px-2">
                                                                <Eye className="h-3.5 w-3.5 mr-1" /> View
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
