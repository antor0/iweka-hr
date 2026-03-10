"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Plus, Users, Timer, UserCheck } from "lucide-react";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";

const sBadge: Record<string, "default" | "success" | "warning" | "outline" | "destructive"> = { OPEN: "success", DRAFT: "outline", PENDING_APPROVAL: "warning", CLOSED: "destructive" };

export default function RecruitmentPage() {
    const [requisitions, setRequisitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchRequisitions = async () => {
            try {
                const res = await fetch('/api/v1/recruitment/requisitions');
                if (!res.ok) throw new Error("Failed to fetch");
                const { data } = await res.json();
                setRequisitions(data || []);
            } catch (err: any) {
                setError(err.message);
                console.error("Failed to fetch requisitions", err);
            } finally {
                setLoading(false);
            }
        };
        fetchRequisitions();
    }, []);

    const activeCount = requisitions.filter(r => r.status === 'OPEN').length;
    const totalApplications = requisitions.reduce((acc, r) => acc + (r._count?.applications || 0), 0);

    const stats = [
        { title: "Active Postings", value: String(activeCount), subtitle: "Live jobs", icon: <Briefcase className="h-5 w-5" />, accent: "primary" as const },
        { title: "Total Candidates", value: String(totalApplications), subtitle: "Across all jobs", icon: <Users className="h-5 w-5" />, accent: "accent" as const },
        { title: "Interview Process", value: "-", subtitle: "Awaiting schedule", icon: <Timer className="h-5 w-5" />, accent: "warning" as const },
        { title: "Hired", value: "-", subtitle: "This month", icon: <UserCheck className="h-5 w-5" />, accent: "success" as const },
    ];

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-primary" /> Recruitment (ATS)
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage new employee recruitment pipelines</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm"><Plus className="h-4 w-4 mr-1.5" /> Create Job Posting</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => <GlassStatCard key={s.title} {...s} accentColor={s.accent} />)}
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Job Requisitions</CardTitle>
                    <Badge variant="outline">{requisitions.length} total</Badge>
                </CardHeader>
                <CardContent className="p-0">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-border">
                                {["Position", "Department", "Applicants", "Status", "Requestor", "Date"].map(h => (
                                    <th key={h} className="text-left text-xs font-medium text-muted-foreground uppercase px-4 py-3">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</td></tr>
                            ) : requisitions.length === 0 ? (
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No job requisitions found.</td></tr>
                            ) : requisitions.map((p, i) => (
                                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                                    <td className="px-4 py-3 text-sm font-medium">{p.title}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{p.department?.name}</td>
                                    <td className="px-4 py-3 text-sm font-medium">{p._count?.applications || 0}</td>
                                    <td className="px-4 py-3"><Badge variant={sBadge[p.status] || "outline"}>{p.status}</Badge></td>
                                    <td className="px-4 py-3 text-sm">{p.requestedBy?.fullName}</td>
                                    <td className="px-4 py-3 text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleDateString("id-ID")}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
}
