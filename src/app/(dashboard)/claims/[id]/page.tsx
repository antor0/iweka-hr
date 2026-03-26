"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    ArrowLeft,
    CheckCircle2,
    XCircle,
    Clock,
    DollarSign,
    Send,
    Receipt,
    Loader2,
    Download,
    User,
    Calendar,
    ScanLine,
    Car,
    Utensils,
    Building,
    Bus,
    ParkingCircle,
    Briefcase,
    Phone,
    MoreHorizontal,
    AlertCircle,
} from "lucide-react";

const categoryMeta: Record<string, { label: string; icon: React.ReactNode }> = {
    TRAVEL: { label: "Travel", icon: <Car className="h-4 w-4" /> },
    MEALS: { label: "Meals & Food", icon: <Utensils className="h-4 w-4" /> },
    ACCOMMODATION: { label: "Accommodation", icon: <Building className="h-4 w-4" /> },
    TRANSPORT: { label: "Transport", icon: <Bus className="h-4 w-4" /> },
    PARKING_TOLLS: { label: "Parking & Tolls", icon: <ParkingCircle className="h-4 w-4" /> },
    OFFICE_SUPPLIES: { label: "Office Supplies", icon: <Briefcase className="h-4 w-4" /> },
    COMMUNICATION: { label: "Communication", icon: <Phone className="h-4 w-4" /> },
    OTHER: { label: "Other", icon: <MoreHorizontal className="h-4 w-4" /> },
};

const statusConfig: Record<string, { label: string; variant: "default" | "warning" | "success" | "destructive" | "secondary"; icon: React.ReactNode; color: string }> = {
    DRAFT: { label: "Draft", variant: "secondary", icon: <FileText className="h-4 w-4" />, color: "text-muted-foreground" },
    SUBMITTED: { label: "Submitted", variant: "warning", icon: <Clock className="h-4 w-4" />, color: "text-warning" },
    APPROVED: { label: "Approved", variant: "success", icon: <CheckCircle2 className="h-4 w-4" />, color: "text-success" },
    REJECTED: { label: "Rejected", variant: "destructive", icon: <XCircle className="h-4 w-4" />, color: "text-destructive" },
    PAID: { label: "Paid", variant: "default", icon: <DollarSign className="h-4 w-4" />, color: "text-primary" },
};

function formatCurrency(value: string | number): string {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
}

function formatDate(date: string): string {
    return new Date(date).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

interface ClaimDetail {
    id: string;
    claimNumber: string;
    title: string;
    description: string | null;
    status: string;
    totalAmount: string | number;
    createdAt: string;
    submittedAt: string | null;
    approvedAt: string | null;
    paidAt: string | null;
    rejectReason: string | null;
    employee: { fullName: string; employeeNumber: string; managerId: string | null };
    approvedBy: { fullName: string } | null;
    items: Array<{
        id: string;
        category: string;
        description: string;
        amount: string | number;
        receiptDate: string;
        receiptUrl: string | null;
        ocrRawText: string | null;
        merchant: string | null;
    }>;
}

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [claim, setClaim] = useState<ClaimDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch(`/api/v1/claims/${id}`);
                if (res.ok) {
                    setClaim(await res.json());
                }
            } catch {}
            setLoading(false);
        })();
    }, [id]);

    const handleProcess = async (status: "APPROVED" | "REJECTED") => {
        setProcessing(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/claims/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "process",
                    status,
                    rejectReason: status === "REJECTED" ? rejectReason : undefined,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error);
            } else {
                // Refresh
                const res2 = await fetch(`/api/v1/claims/${id}`);
                if (res2.ok) setClaim(await res2.json());
                setShowRejectForm(false);
            }
        } catch (err: any) {
            setError(err.message);
        }
        setProcessing(false);
    };

    const handleSubmit = async () => {
        setProcessing(true);
        setError(null);
        try {
            const res = await fetch(`/api/v1/claims/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "submit" }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error);
            } else {
                const res2 = await fetch(`/api/v1/claims/${id}`);
                if (res2.ok) setClaim(await res2.json());
            }
        } catch (err: any) {
            setError(err.message);
        }
        setProcessing(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
        );
    }

    if (!claim) {
        return (
            <div className="text-center py-20 text-muted-foreground">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>Claim not found</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => router.push("/claims")}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Claims
                </Button>
            </div>
        );
    }

    const sc = statusConfig[claim.status] || statusConfig.DRAFT;

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.push("/claims")}>
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                {claim.claimNumber}
                            </h1>
                            <Badge variant={sc.variant} className="text-xs">
                                {sc.icon}
                                <span className="ml-1">{sc.label}</span>
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{claim.title}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(claim.totalAmount)}</p>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                </div>
            )}

            {/* Claim Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <User className="h-3.5 w-3.5" />
                            <span className="text-xs">Employee</span>
                        </div>
                        <p className="text-sm font-medium">{claim.employee.fullName}</p>
                        <p className="text-xs text-muted-foreground">{claim.employee.employeeNumber}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="h-3.5 w-3.5" />
                            <span className="text-xs">Submitted</span>
                        </div>
                        <p className="text-sm font-medium">{claim.submittedAt ? formatDate(claim.submittedAt) : "Not yet"}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Receipt className="h-3.5 w-3.5" />
                            <span className="text-xs">Receipt Items</span>
                        </div>
                        <p className="text-sm font-medium">{claim.items.length} items</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span className="text-xs">Approved By</span>
                        </div>
                        <p className="text-sm font-medium">{claim.approvedBy?.fullName || "—"}</p>
                        {claim.approvedAt && <p className="text-xs text-muted-foreground">{formatDate(claim.approvedAt)}</p>}
                    </CardContent>
                </Card>
            </div>

            {/* Reject Reason */}
            {claim.status === "REJECTED" && claim.rejectReason && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
                    <p className="text-xs font-medium text-destructive mb-1 flex items-center gap-1">
                        <XCircle className="h-3.5 w-3.5" /> Rejection Reason
                    </p>
                    <p className="text-sm text-destructive/80">{claim.rejectReason}</p>
                </div>
            )}

            {claim.description && (
                <Card>
                    <CardContent className="p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                        <p className="text-sm">{claim.description}</p>
                    </CardContent>
                </Card>
            )}

            {/* Receipt Items */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Receipt Items
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {claim.items.map((item) => {
                        const cat = categoryMeta[item.category] || categoryMeta.OTHER;
                        return (
                            <div key={item.id} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
                                {item.receiptUrl && (
                                    <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted border border-border/50 hover:ring-2 hover:ring-primary/30 transition-all cursor-zoom-in">
                                            <img src={item.receiptUrl} alt="Receipt" className="w-full h-full object-cover" />
                                        </div>
                                    </a>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="secondary" className="text-xs gap-1">
                                            {cat.icon}
                                            {cat.label}
                                        </Badge>
                                        {item.merchant && (
                                            <span className="text-xs text-muted-foreground">• {item.merchant}</span>
                                        )}
                                    </div>
                                    <p className="text-sm">{item.description}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        <Calendar className="h-3 w-3 inline mr-1" />
                                        {formatDate(item.receiptDate)}
                                    </p>

                                    {item.ocrRawText && (
                                        <details className="text-xs mt-2">
                                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                                <ScanLine className="h-3 w-3 inline mr-1" />
                                                OCR Text
                                            </summary>
                                            <pre className="mt-1 p-2 rounded-lg bg-muted/50 overflow-auto max-h-20 text-muted-foreground whitespace-pre-wrap text-[11px]">
                                                {item.ocrRawText}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-bold">{formatCurrency(item.amount)}</p>
                                </div>
                            </div>
                        );
                    })}

                    {claim.items.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <Receipt className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No receipt items</p>
                        </div>
                    )}

                    {/* Total bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                        <span className="text-sm font-medium text-muted-foreground">Total ({claim.items.length} items)</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(claim.totalAmount)}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => router.push("/claims")}>
                    <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Claims
                </Button>
                <div className="flex gap-2">
                    {claim.status === "DRAFT" && (
                        <Button onClick={handleSubmit} disabled={processing || claim.items.length === 0}>
                            {processing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                            Submit for Approval
                        </Button>
                    )}
                    {claim.status === "SUBMITTED" && (
                        <>
                            {showRejectForm ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        placeholder="Reason for rejection..."
                                        className="px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-destructive/20 w-64"
                                    />
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => handleProcess("REJECTED")}
                                        disabled={processing || !rejectReason}
                                    >
                                        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Reject"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                                </div>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        className="text-destructive hover:bg-destructive/10"
                                        onClick={() => setShowRejectForm(true)}
                                        disabled={processing}
                                    >
                                        <XCircle className="h-4 w-4 mr-1.5" /> Reject
                                    </Button>
                                    <Button
                                        onClick={() => handleProcess("APPROVED")}
                                        disabled={processing}
                                    >
                                        {processing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                                        Approve
                                    </Button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
