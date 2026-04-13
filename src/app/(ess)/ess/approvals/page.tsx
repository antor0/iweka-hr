"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
        if (action === "REJECTED" && reason === null) return; // User cancelled prompt

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
                setMessage({ type: "success", text: `${type} has been ${action.toLowerCase()} successfully.` });
                if (type === "LEAVE") setLeaves(prev => prev.filter(x => x.id !== id));
                if (type === "CLAIM") setClaims(prev => prev.filter(x => x.id !== id));
            } else {
                setMessage({ type: "error", text: data.error || `Failed to process ${type}` });
            }
        } catch {
            setMessage({ type: "error", text: "Could not complete the action. Try again." });
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) return <div style={s.root}><div style={s.center}><div style={s.spinner} /></div></div>;

    const totalPending = leaves.length + claims.length;

    return (
        <div style={s.root}>
            <OfflineBanner />
            <div style={s.orb} />

            <div style={s.page}>
                <div style={s.headerRow}>
                    <div>
                        <h1 style={s.pageTitle}>Approvals</h1>
                        <p style={s.pageSub}>{totalPending} request{totalPending !== 1 ? "s" : ""} waiting</p>
                    </div>
                </div>

                {message && (
                    <div style={{ ...s.msgBox, background: message.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)", borderColor: message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)", color: message.type === "success" ? "#34d399" : "#fca5a5" }}>
                        {message.text}
                    </div>
                )}

                {/* Leave Requests */}
                <div style={s.section}>
                    <h2 style={s.sectionTitle}>Leave Requests ({leaves.length})</h2>
                    {leaves.length === 0 ? (
                        <div style={s.emptyState}>
                            <p style={{ color: "#64748b", margin: 0 }}>No pending leaves.</p>
                        </div>
                    ) : (
                        <div style={s.listContainer}>
                            {leaves.map((leave) => (
                                <div key={leave.id} style={s.card}>
                                    <div style={s.cardTop}>
                                        <div style={s.avatar}>{leave.employee.fullName.charAt(0)}</div>
                                        <div style={{ flex: 1 }}>
                                            <p style={s.cardTitle}>{leave.employee.fullName}</p>
                                            <p style={s.cardSub}>{leave.employee.employeeNumber}</p>
                                        </div>
                                        <span style={s.badge}>{leave.leaveType.name}</span>
                                    </div>
                                    <div style={s.cardBody}>
                                        <div style={s.metaRow}>
                                            <span style={s.metaLabel}>Date:</span>
                                            <span style={s.metaValue}>
                                                {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                                {" "}({leave.totalDays} days)
                                            </span>
                                        </div>
                                        <div style={s.metaRow}>
                                            <span style={s.metaLabel}>Reason:</span>
                                            <span style={s.metaValue}>{leave.reason}</span>
                                        </div>
                                    </div>
                                    <div style={s.actionRow}>
                                        <button 
                                            onClick={() => handleAction("LEAVE", leave.id, "REJECTED")} 
                                            disabled={processingId === leave.id}
                                            style={s.rejectBtn}
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            onClick={() => handleAction("LEAVE", leave.id, "APPROVED")} 
                                            disabled={processingId === leave.id}
                                            style={s.approveBtn}
                                        >
                                            {processingId === leave.id ? "Processing..." : "Approve"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Claim Requests */}
                <div style={s.section}>
                    <h2 style={s.sectionTitle}>Expense Claims ({claims.length})</h2>
                    {claims.length === 0 ? (
                        <div style={s.emptyState}>
                            <p style={{ color: "#64748b", margin: 0 }}>No pending claims.</p>
                        </div>
                    ) : (
                        <div style={s.listContainer}>
                            {claims.map((claim) => (
                                <div key={claim.id} style={s.card}>
                                    <div style={s.cardTop}>
                                        <div style={s.avatar}>{claim.employee.fullName.charAt(0)}</div>
                                        <div style={{ flex: 1 }}>
                                            <p style={s.cardTitle}>{claim.employee.fullName}</p>
                                            <p style={s.cardSub}>{claim.title} ({claim.claimNumber})</p>
                                        </div>
                                        <span style={s.badgeItems}>{claim._count.items} item{claim._count.items > 1 ? "s" : ""}</span>
                                    </div>
                                    <div style={s.cardBody}>
                                        <div style={s.metaRow}>
                                            <span style={s.metaLabel}>Submitted:</span>
                                            <span style={s.metaValue}>{new Date(claim.submittedAt).toLocaleDateString()}</span>
                                        </div>
                                        <div style={s.metaRow}>
                                            <span style={s.metaLabel}>Total IDR:</span>
                                            <span style={{...s.metaValue, fontWeight: 700, color: "#fbbf24", fontFamily: "monospace"}}>
                                                {new Intl.NumberFormat("en-US", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(Number(claim.totalAmount))}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={s.actionRow}>
                                        <button 
                                            onClick={() => handleAction("CLAIM", claim.id, "REJECTED")} 
                                            disabled={processingId === claim.id}
                                            style={s.rejectBtn}
                                        >
                                            Reject
                                        </button>
                                        <button 
                                            onClick={() => handleAction("CLAIM", claim.id, "APPROVED")} 
                                            disabled={processingId === claim.id}
                                            style={s.approveBtn}
                                        >
                                            {processingId === claim.id ? "Processing..." : "Approve"}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ height: 80 }} />
            </div>

            <EssNav />
        </div>
    );
}

const s: Record<string, any> = {
    root: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0f1a 0%, #1a1033 50%, #0a1628 100%)", fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)", position: "relative" },
    orb: { position: "fixed", top: "10%", right: "-10%", width: 300, height: 300, borderRadius: "50%", background: "rgba(99,102,241,0.08)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 },
    center: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
    spinner: { width: 36, height: 36, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    page: { position: "relative", zIndex: 1, padding: "20px 16px 0", maxWidth: 480, margin: "0 auto" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 },
    pageTitle: { margin: "0 0 2px", fontSize: 26, fontWeight: 800, color: "#e0e7ff" },
    pageSub: { margin: 0, fontSize: 13, color: "#64748b" },
    msgBox: { borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, border: "1px solid", marginBottom: 16 },
    section: { marginBottom: 24 },
    sectionTitle: { margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#818cf8", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
    emptyState: { padding: "20px", background: "rgba(255,255,255,0.02)", borderRadius: 12, border: "1px dashed rgba(255,255,255,0.1)", textAlign: "center" as const },
    listContainer: { display: "flex", flexDirection: "column", gap: 12 },
    card: { background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "16px" },
    cardTop: { display: "flex", alignItems: "center", gap: 12, marginBottom: 14 },
    avatar: { width: 36, height: 36, borderRadius: "50%", background: "rgba(99,102,241,0.2)", color: "#818cf8", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16 },
    cardTitle: { margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#e0e7ff" },
    cardSub: { margin: 0, fontSize: 12, color: "#94a3b8" },
    badge: { background: "rgba(99,102,241,0.15)", color: "#818cf8", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
    badgeItems: { background: "rgba(245,158,11,0.15)", color: "#fbbf24", padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600 },
    cardBody: { display: "flex", flexDirection: "column", gap: 6, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" },
    metaRow: { display: "flex", alignItems: "flex-start", gap: 8 },
    metaLabel: { fontSize: 12, color: "#64748b", width: 70, shrink: 0 },
    metaValue: { fontSize: 13, color: "#e2e8f0", flex: 1, lineHeight: "1.4" },
    actionRow: { display: "flex", gap: 10 },
    rejectBtn: { flex: 1, padding: "10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#fca5a5", fontSize: 13, fontWeight: 600, cursor: "pointer" },
    approveBtn: { flex: 1, padding: "10px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 10, color: "#34d399", fontSize: 13, fontWeight: 600, cursor: "pointer" },
};
