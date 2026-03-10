"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "@/components/liquid-glass/glass-card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Users, CheckCircle2 } from "lucide-react";

export default function PerformancePage() {
    const [cycles, setCycles] = useState<any[]>([]);
    const [appraisals, setAppraisals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchPerformanceData() {
            try {
                // Fetch cycles
                const cyclesRes = await fetch('/api/v1/performance/cycles');
                if (!cyclesRes.ok) throw new Error('Failed to fetch cycles');
                const cyclesData = await cyclesRes.json();
                setCycles(cyclesData.data || []);

                // If we have active cycles, fetch appraisals for the first one
                if (cyclesData.data && cyclesData.data.length > 0) {
                    const activeCycleId = cyclesData.data[0].id;
                    const appraisalsRes = await fetch(`/api/v1/performance/appraisals?cycleId=${activeCycleId}`);
                    if (!appraisalsRes.ok) throw new Error('Failed to fetch appraisals');
                    const appraisalsData = await appraisalsRes.json();
                    setAppraisals(appraisalsData.data || []);
                }
            } catch (err: any) {
                console.error("Error fetching performance data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchPerformanceData();
    }, []);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'COMPLETED':
                return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Completed</Badge>;
            case 'MANAGER_ASSESSMENT':
            case 'SELF_ASSESSMENT':
                return <Badge variant="secondary" className="bg-blue-500 hover:bg-blue-600 text-white">In Progress</Badge>;
            case 'DRAFT':
            default:
                return <Badge variant="outline" className="border-gray-400 text-gray-400">Draft</Badge>;
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading performance records...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    }

    const activeCycle = cycles.length > 0 ? cycles[0] : null;
    const completedAppraisals = appraisals.filter(a => a.status === 'COMPLETED').length;
    const averageScore = appraisals.length > 0
        ? appraisals.reduce((acc, curr) => acc + (Number(curr.finalScore) || 0), 0) / appraisals.length
        : 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Performance Management</h1>
                <p className="text-muted-foreground">Manage employee appraisals, goals, and review cycles.</p>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <GlassCard className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Active Cycle</h3>
                        <Target className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {activeCycle ? activeCycle.name : 'No Active Cycle'}
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Total Appraisals</h3>
                        <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {appraisals.length}
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Completed</h3>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {completedAppraisals}
                    </div>
                </GlassCard>

                <GlassCard className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <h3 className="tracking-tight text-sm font-medium text-muted-foreground">Avg Final Score</h3>
                        <TrendingUp className="h-4 w-4 text-rose-500" />
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                        {averageScore > 0 ? averageScore.toFixed(2) : '-'} / 5.0
                    </div>
                </GlassCard>
            </div>

            {/* Appraisals Table */}
            <GlassCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-foreground">Appraisal Records</h2>
                    <Button>New Appraisal</Button>
                </div>

                <div className="rounded-md border border-white/10">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-muted-foreground">Employee</TableHead>
                                <TableHead className="text-muted-foreground">Department</TableHead>
                                <TableHead className="text-muted-foreground">Manager</TableHead>
                                <TableHead className="text-muted-foreground items-center gap-2">Goals</TableHead>
                                <TableHead className="text-muted-foreground">Status</TableHead>
                                <TableHead className="text-muted-foreground text-right">Final Score</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {appraisals.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center text-muted-foreground h-24">
                                        No appraisals found in the current cycle.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                appraisals.map((appraisal) => (
                                    <TableRow key={appraisal.id} className="border-white/10 hover:bg-white/5 transition-colors cursor-pointer">
                                        <TableCell className="font-medium text-foreground">
                                            {appraisal.employee?.fullName}
                                            <div className="text-xs text-muted-foreground">{appraisal.employee?.position?.title}</div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{appraisal.employee?.department?.name || 'N/A'}</TableCell>
                                        <TableCell className="text-muted-foreground">{appraisal.manager?.fullName || 'N/A'}</TableCell>
                                        <TableCell className="text-muted-foreground">
                                            <Badge variant="outline" className="bg-white/5">{appraisal.goals?.length || 0}</Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(appraisal.status)}</TableCell>
                                        <TableCell className="text-right font-medium">
                                            {appraisal.finalScore ? <span className="text-emerald-500">{Number(appraisal.finalScore).toFixed(1)}</span> : '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </GlassCard>
        </div>
    );
}
