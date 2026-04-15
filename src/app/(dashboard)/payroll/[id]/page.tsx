"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatIDR } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Wallet, Users, FileText, CheckCircle2, Loader2, ChevronDown, ChevronUp, Banknote, Shield } from "lucide-react";

const MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

const statusVariant: Record<string, any> = {
    FINALIZED: "success", APPROVED: "default", REVIEW: "warning", DRAFT: "secondary"
};

const nextStatusAction: Record<string, { label: string; nextStatus: string } | null> = {
    DRAFT: { label: "Submit for Review", nextStatus: "REVIEW" },
    REVIEW: { label: "Approve", nextStatus: "APPROVED" },
    APPROVED: { label: "Finalize", nextStatus: "FINALIZED" },
    FINALIZED: null,
};

export default function PayrollRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const { toast } = useToast();
    const [run, setRun] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

    useEffect(() => {
        const fetchRun = async () => {
            try {
                const res = await fetch(`/api/v1/payroll/${id}`);
                if (res.ok) {
                    const json = await res.json();
                    setRun(json.data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchRun();
    }, [id]);

    const handleStatusUpdate = async (nextStatus: string) => {
        setIsUpdating(true);
        try {
            const res = await fetch(`/api/v1/payroll/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: nextStatus })
            });
            if (!res.ok) throw new Error("Failed to update status");
            const json = await res.json();
            setRun((prev: any) => ({ ...prev, status: json.data.status }));
            toast({ title: "Status Updated", description: `Payroll run is now ${json.data.status}.` });
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    if (!run) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>Payroll run not found.</p>
                <Link href="/payroll" className="text-primary hover:underline mt-2 inline-block">← Back to Payroll</Link>
            </div>
        );
    }

    const action = nextStatusAction[run.status];

    return (
        <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
            <Link href="/payroll" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Payroll
            </Link>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <Wallet className="h-6 w-6 text-primary" />
                        {MONTH_NAMES[run.periodMonth - 1]} {run.periodYear} — Payroll Run
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Processed by {run.runBy?.email ?? "System"} · {run._count?.items ?? run.items?.length ?? 0} employees
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant={statusVariant[run.status] ?? "secondary"} className="text-sm px-3 py-1">{run.status}</Badge>
                    {action && (
                        <Button onClick={() => handleStatusUpdate(action.nextStatus)} disabled={isUpdating} size="sm">
                            {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            <CheckCircle2 className="h-4 w-4 mr-1.5" /> {action.label}
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Total Gross", value: formatIDR(Number(run.totalGross)), icon: <Banknote className="h-4 w-4 text-primary" /> },
                    { label: "Total Tax", value: formatIDR(Number(run.totalTax)), icon: <FileText className="h-4 w-4 text-warning" /> },
                    { label: "Total BPJS", value: formatIDR(Number(run.totalBpjsCompany) + Number(run.totalBpjsEmployee)), icon: <Shield className="h-4 w-4 text-accent" /> },
                    { label: "Total Net", value: formatIDR(Number(run.totalNet)), icon: <Wallet className="h-4 w-4 text-success" /> },
                ].map((s) => (
                    <Card key={s.label} className="glass">
                        <CardContent className="pt-5 pb-4">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">{s.icon} {s.label}</div>
                            <p className="text-lg font-bold font-mono">{s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Employee Breakdown Table */}
            <Card className="glass">
                <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" /> Employee Breakdown
                    </CardTitle>
                    <CardDescription>Click any row to expand detailed components</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Employee</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Basic</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">Gross</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">PPh 21</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase">BPJS Emp</th>
                                    <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase font-bold">Net</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {(run.items ?? []).map((item: any) => {
                                    const isExpanded = expandedItemId === item.id;
                                    const comp = item.components ?? {};
                                    const totalBpjsEmp = Number(item.bpjsKesEmployee) + Number(item.bpjsTkJhtEmployee) + Number(item.bpjsTkJpEmployee);
                                    return (
                                        <>
                                            <tr
                                                key={item.id}
                                                className="border-b border-border/50 hover:bg-secondary/20 transition-colors cursor-pointer"
                                                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="font-medium text-foreground">{item.employee?.fullName ?? "—"}</p>
                                                    <p className="text-xs text-muted-foreground">{item.employee?.employeeNumber ?? ""} · {item.employee?.position?.title ?? ""}</p>
                                                </td>
                                                <td className="px-4 py-3 text-right font-mono">{formatIDR(Number(item.basicSalary))}</td>
                                                <td className="px-4 py-3 text-right font-mono">{formatIDR(Number(item.grossIncome))}</td>
                                                <td className="px-4 py-3 text-right font-mono text-destructive">{formatIDR(Number(item.pph21Amount))}</td>
                                                <td className="px-4 py-3 text-right font-mono">{formatIDR(totalBpjsEmp)}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-success">{formatIDR(Number(item.netSalary))}</td>
                                                <td className="px-4 py-3 text-center text-muted-foreground">
                                                    {isExpanded ? <ChevronUp className="h-4 w-4 inline" /> : <ChevronDown className="h-4 w-4 inline" />}
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr key={`${item.id}-expand`} className="bg-muted/20">
                                                    <td colSpan={7} className="px-6 py-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                                                            {/* Earnings */}
                                                            <div>
                                                                <p className="font-semibold text-success mb-2">Earnings</p>
                                                                <DetailRow label="Base Salary" value={formatIDR(comp.earnings?.baseSalary ?? 0)} />
                                                                {(comp.earnings?.allowances ?? []).map((a: any, i: number) => (
                                                                    <DetailRow key={i} label={a.name} value={formatIDR(a.amount)} />
                                                                ))}
                                                                {comp.earnings?.variableInputs?.overtime > 0 && <DetailRow label="Overtime" value={formatIDR(comp.earnings.variableInputs.overtime)} />}
                                                                {comp.earnings?.variableInputs?.thr > 0 && <DetailRow label="THR" value={formatIDR(comp.earnings.variableInputs.thr)} />}
                                                                {comp.earnings?.variableInputs?.bonus > 0 && <DetailRow label="Bonus" value={formatIDR(comp.earnings.variableInputs.bonus)} />}
                                                                {comp.earnings?.variableInputs?.commission > 0 && <DetailRow label="Commission" value={formatIDR(comp.earnings.variableInputs.commission)} />}
                                                                {comp.earnings?.incentives?.incentive > 0 && <DetailRow label="Incentive" value={formatIDR(comp.earnings.incentives.incentive)} />}
                                                                {comp.earnings?.incentives?.bonus > 0 && <DetailRow label="Incentive Bonus" value={formatIDR(comp.earnings.incentives.bonus)} />}
                                                            </div>
                                                            {/* Deductions */}
                                                            <div>
                                                                <p className="font-semibold text-destructive mb-2">Deductions</p>
                                                                <DetailRow label="BPJS Kes (Emp)" value={formatIDR(comp.deductions?.bpjs?.kesEmployee ?? 0)} />
                                                                <DetailRow label="BPJS JHT (Emp)" value={formatIDR(comp.deductions?.bpjs?.jhtEmployee ?? 0)} />
                                                                <DetailRow label="BPJS JP (Emp)" value={formatIDR(comp.deductions?.bpjs?.jpEmployee ?? 0)} />
                                                                <DetailRow
                                                                    label={`PPh 21 (${comp.deductions?.pph21?.method} Cat ${comp.deductions?.pph21?.category})`}
                                                                    value={formatIDR(comp.deductions?.pph21?.amount ?? 0)}
                                                                />
                                                                {comp.deductions?.unpaidLeave?.days > 0 && (
                                                                    <DetailRow label={`Unpaid Leave (${comp.deductions.unpaidLeave.days}d)`} value={formatIDR(comp.deductions.unpaidLeave.amount)} />
                                                                )}
                                                                {comp.deductions?.latePenalty?.occurrences > 0 && (
                                                                    <DetailRow label={`Late (${comp.deductions.latePenalty.occurrences}×)`} value={formatIDR(comp.deductions.latePenalty.amount)} />
                                                                )}
                                                                {comp.deductions?.manualDeduction > 0 && (
                                                                    <DetailRow label="Manual Deduction" value={formatIDR(comp.deductions.manualDeduction)} />
                                                                )}
                                                            </div>
                                                            {/* Company Cost */}
                                                            <div>
                                                                <p className="font-semibold text-muted-foreground mb-2">Company Cost</p>
                                                                <DetailRow label="BPJS Kes (Co)" value={formatIDR(comp.companyCost?.kesCompany ?? 0)} />
                                                                <DetailRow label="BPJS JHT (Co)" value={formatIDR(comp.companyCost?.jhtCompany ?? 0)} />
                                                                <DetailRow label="BPJS JP (Co)" value={formatIDR(comp.companyCost?.jpCompany ?? 0)} />
                                                                <DetailRow label="BPJS JKK (Co)" value={formatIDR(comp.companyCost?.jkkCompany ?? 0)} />
                                                                <DetailRow label="BPJS JKM (Co)" value={formatIDR(comp.companyCost?.jkmCompany ?? 0)} />
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                                {(run.items ?? []).length === 0 && (
                                    <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No employee data found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between py-0.5">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-medium">{value}</span>
        </div>
    );
}
