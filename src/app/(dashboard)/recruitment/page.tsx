"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { CreateRequisitionDialog } from "./components/create-requisition-dialog";
import { Briefcase, Users, Timer, UserCheck } from "lucide-react";
import { GlassStatCard } from "@/components/liquid-glass/glass-stat-card";

const sBadge: Record<string, "default" | "success" | "warning" | "outline" | "destructive"> = {
    OPEN: "success",
    DRAFT: "outline",
    PENDING_APPROVAL: "warning",
    CLOSED: "destructive"
};

export default function RecruitmentPage() {
    const [requisitions, setRequisitions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ activePostings: 0, totalCandidates: 0, interviewsThisMonth: 0, hiredThisMonth: 0 });
    const router = useRouter();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [reqRes, statsRes] = await Promise.all([
                fetch('/api/v1/recruitment/requisitions'),
                fetch('/api/v1/recruitment/stats')
            ]);
            if (reqRes.ok) {
                const { data } = await reqRes.json();
                setRequisitions(data || []);
            }
            if (statsRes.ok) {
                const { data } = await statsRes.json();
                setStats(data);
            }
        } catch (err) {
            console.error("Failed to fetch recruitment data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const statCards = [
        { title: "Active Postings", value: String(stats.activePostings), subtitle: "Live jobs", icon: <Briefcase className="h-5 w-5" />, accent: "primary" as const },
        { title: "Total Candidates", value: String(stats.totalCandidates), subtitle: "In active postings", icon: <Users className="h-5 w-5" />, accent: "accent" as const },
        { title: "Interviews", value: String(stats.interviewsThisMonth), subtitle: "Scheduled this month", icon: <Timer className="h-5 w-5" />, accent: "warning" as const },
        { title: "Hired", value: String(stats.hiredThisMonth), subtitle: "This month", icon: <UserCheck className="h-5 w-5" />, accent: "success" as const },
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
                    <CreateRequisitionDialog onSuccess={fetchData} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s) => <GlassStatCard key={s.title} {...s} accentColor={s.accent} />)}
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
                                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-muted-foreground">No job requisitions found. Create one to get started.</td></tr>
                            ) : requisitions.map((p) => (
                                <tr
                                    key={p.id}
                                    onClick={() => router.push(`/recruitment/${p.id}`)}
                                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                                >
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
