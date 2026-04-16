"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
    CheckCircle2, 
    XCircle, 
    Inbox, 
    CalendarClock, 
    Banknote, 
    AlertCircle, 
    User,
    ChevronRight,
    ClipboardList
} from "lucide-react";
import { MobileHeader } from "../components/mobile-header";
import { OfflineBanner } from "../components/offline-banner";
import { EssNav } from "../components/ess-nav";

interface LeaveRequest {
    id: string;
    employee: { fullName: string; employeeNumber: string };
    leaveType: { name: string };
    startDate: string;
    endDate: string;
    totalDays: number;
    reason: string;
}

interface ClaimRequest {
    id: string;
    claimNumber: string;
    employee: { fullName: string; employeeNumber: string };
    title: string;
    totalAmount: number;
    submittedAt: string;
    _count: { items: number };
}

export default function EssApprovalsPage() {
    const router = useRouter();
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [claims, setClaims] = useState<ClaimRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const fetchApprovals = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/ess/approvals");
            if (res.status === 401) { router.push("/ess"); return; }
            if (res.ok) {
                const data = await res.json();
                setLeaves(data.data.leaves || []);
                setClaims(data.data.claims || []);
            }
        } catch { } finally { setIsLoading(false); }
    }, [router]);

    useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

    const handleAction = async (type: "LEAVE" | "CLAIM", id: string, action: "APPROVED" | "REJECTED") => {
        const reason = action === "REJECTED" ? prompt("Please enter a reason for rejection (optional):") : null;
        if (action === "REJECTED" && reason === null) return; 

        setProcessingId(id);
        setMessage(null);

        try {
            const res = await fetch("/api/v1/ess/approvals/process", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ type, id, action, notes: reason }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: "success", text: `Success: ${type} request ${action.toLowerCase()}.` });
                if (type === "LEAVE") setLeaves(prev => prev.filter(x => x.id !== id));
                if (type === "CLAIM") setClaims(prev => prev.filter(x => x.id !== id));
            } else {
                setMessage({ type: "error", text: data.error || `Failed to process ${type}` });
            }
        } catch {
            setMessage({ type: "error", text: "Connection error. Please try again." });
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[var(--ios-system-bg)] flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    const totalPending = leaves.length + claims.length;

    return (
        <div className="min-h-screen bg-[var(--ios-system-bg)] pb-24 font-sans">
            <OfflineBanner />
            <MobileHeader 
                title="Approvals" 
                subtitle={totalPending > 0 ? `${totalPending} pending items` : "All caught up"} 
            />

            <div className="max-w-[480px] mx-auto pt-2 flex flex-col gap-6">
                {message && (
                    <div className="px-4">
                        <div className={`rounded-2xl p-4 text-[13px] font-bold border flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
                            message.type === "success" 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                                : "bg-red-500/10 border-red-500/30 text-red-500"
                        }`}>
                            {message.type === "success" ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertCircle size={16} strokeWidth={3} />}
                            {message.text}
                        </div>
                    </div>
                )}

                {/* Leave Section */}
                <div className="ios-list-group">
                    <h2 className="ios-list-header px-4">Leave Requests</h2>
                    <div className="ios-list-content">
                        {leaves.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 opacity-30">
                                <CalendarClock size={48} strokeWidth={1} />
                                <p className="text-[15px] font-medium mt-2">No pending leave</p>
                            </div>
                        ) : (
                            leaves.map((leave) => (
                                <div key={leave.id} className="ios-cell flex flex-col items-stretch p-0">
                                    <div className="px-4 py-4 flex gap-3">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                            <User size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[17px] font-bold text-[var(--ios-label)] truncate">{leave.employee.fullName}</h3>
                                            <p className="text-[13px] text-[var(--ios-secondary-label)] font-medium">
                                                {leave.leaveType.name} · {leave.totalDays} Days
                                            </p>
                                            <p className="text-[13px] text-[var(--ios-secondary-label)] mt-1 truncate">
                                                Reason: {leave.reason}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-4 pb-4 flex gap-2">
                                        <button 
                                            onClick={() => handleAction("LEAVE", leave.id, "REJECTED")} 
                                            disabled={processingId === leave.id}
                                            className="flex-1 py-2 rounded-xl bg-destructive/10 text-destructive text-[13px] font-bold active:opacity-50"
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            onClick={() => handleAction("LEAVE", leave.id, "APPROVED")} 
                                            disabled={processingId === leave.id}
                                            className="flex-1 py-2 rounded-xl bg-primary text-white text-[13px] font-bold shadow-sm active:opacity-80"
                                        >
                                            {processingId === leave.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Approve"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Claims Section */}
                <div className="ios-list-group">
                    <h2 className="ios-list-header text-[#FF9500]">Expense Claims</h2>
                    <div className="ios-list-content">
                        {claims.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 opacity-30">
                                <Banknote size={48} strokeWidth={1} />
                                <p className="text-[15px] font-medium mt-2">No pending claims</p>
                            </div>
                        ) : (
                            claims.map((claim) => (
                                <div key={claim.id} className="ios-cell flex flex-col items-stretch p-0">
                                    <div className="px-4 py-4 flex gap-3">
                                        <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 flex-shrink-0">
                                            <User size={24} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-[17px] font-bold text-[var(--ios-label)] truncate">{claim.employee.fullName}</h3>
                                            <p className="text-[13px] text-[var(--ios-secondary-label)] font-medium">
                                                {claim.claimNumber} · {claim._count.items} Items
                                            </p>
                                            <p className="text-[17px] font-bold text-[var(--ios-label)] mt-1 font-mono">
                                                {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(claim.totalAmount))}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="px-4 pb-4 flex gap-2">
                                        <button 
                                            onClick={() => handleAction("CLAIM", claim.id, "REJECTED")} 
                                            disabled={processingId === claim.id}
                                            className="flex-1 py-2 rounded-xl bg-destructive/10 text-destructive text-[13px] font-bold active:opacity-50"
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            onClick={() => handleAction("CLAIM", claim.id, "APPROVED")} 
                                            disabled={processingId === claim.id}
                                            className="flex-1 py-2 rounded-xl bg-primary text-white text-[13px] font-bold shadow-sm active:opacity-80"
                                        >
                                            {processingId === claim.id ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Approve"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <EssNav />
        </div>
    );
}
