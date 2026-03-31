"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { OfflineBanner } from "../components/offline-banner";
import { EssNav } from "../components/ess-nav";

interface ClaimItem {
    category: string;
    description: string;
    amount: number;
    receiptDate: string;
    merchant?: string;
    receiptUrl?: string;
}

interface Claim {
    id: string;
    claimNumber: string;
    title: string;
    status: string;
    totalAmount: number;
    submittedAt?: string;
    createdAt: string;
    items: ClaimItem[];
}

const CATEGORIES = [
    { value: "TRAVEL", label: "🚗 Business Travel" },
    { value: "MEALS", label: "🍽 Meals" },
    { value: "ACCOMMODATION", label: "🏨 Accommodation" },
    { value: "TRANSPORT", label: "🚌 Transport" },
    { value: "PARKING_TOLLS", label: "🅿 Parking & Tolls" },
    { value: "OFFICE_SUPPLIES", label: "📎 Office Supplies" },
    { value: "COMMUNICATION", label: "📱 Communication" },
    { value: "OTHER", label: "📋 Other" },
];

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
    DRAFT: { bg: "rgba(100,116,139,0.15)", color: "#94a3b8" },
    SUBMITTED: { bg: "rgba(245,158,11,0.15)", color: "#fbbf24" },
    APPROVED: { bg: "rgba(16,185,129,0.15)", color: "#34d399" },
    REJECTED: { bg: "rgba(239,68,68,0.15)", color: "#f87171" },
    PAID: { bg: "rgba(99,102,241,0.15)", color: "#818cf8" },
};

function formatIDR(n: number) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
}

export default function EssClaimsPage() {
    const router = useRouter();
    const [claims, setClaims] = useState<Claim[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadingItemIdx, setUploadingItemIdx] = useState<number | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [form, setForm] = useState({ title: "", description: "" });
    const [items, setItems] = useState<ClaimItem[]>([
        { category: "OTHER", description: "", amount: 0, receiptDate: new Date().toISOString().split("T")[0], merchant: "", receiptUrl: "" }
    ]);

    const fetchClaims = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/ess/claims");
            if (res.status === 401) { router.push("/ess"); return; }
            if (res.ok) setClaims((await res.json()).data || []);
        } catch { } finally { setIsLoading(false); }
    }, [router]);

    useEffect(() => { fetchClaims(); }, [fetchClaims]);

    const addItem = () => {
        setItems(prev => [...prev, { category: "OTHER", description: "", amount: 0, receiptDate: new Date().toISOString().split("T")[0], merchant: "", receiptUrl: "" }]);
    };
    const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));
    const updateItem = (idx: number, field: keyof ClaimItem, value: any) => {
        setItems(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
    };

    const totalAmount = items.reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const handleUploadReceipt = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingItemIdx(idx);
        setMessage(null);

        const formData = new FormData();
        formData.append("receipt", file);

        try {
            const res = await fetch("/api/v1/ess/claims/ocr", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            
            if (res.ok) {
                setItems(prev => prev.map((item, i) => {
                    if (i !== idx) return item;
                    return {
                        ...item,
                        receiptUrl: data.data.receiptUrl,
                        amount: data.data.extractedAmount || item.amount,
                        merchant: data.data.merchant || item.merchant,
                    };
                }));
                setMessage({ type: "success", text: "Receipt uploaded successfully!" });
            } else {
                setMessage({ type: "error", text: data.error || "Failed to upload receipt" });
            }
        } catch {
            setMessage({ type: "error", text: "An error occurred during upload" });
        } finally {
            setUploadingItemIdx(null);
            e.target.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.title.trim()) { setMessage({ type: "error", text: "Claim title is required" }); return; }
        if (items.some(i => !i.description || !i.amount)) { setMessage({ type: "error", text: "Complete all claim item details" }); return; }

        setIsSubmitting(true);
        setMessage(null);
        try {
            const res = await fetch("/api/v1/ess/claims", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, items }),
            });
            const data = await res.json();
            if (res.status === 401) {
                router.push("/ess");
                return;
            }
            if (res.ok) {
                setMessage({ type: "success", text: `✅ Claim ${data.data.claimNumber} submitted successfully!` });
                setShowForm(false);
                setForm({ title: "", description: "" });
                setItems([{ category: "OTHER", description: "", amount: 0, receiptDate: new Date().toISOString().split("T")[0], merchant: "", receiptUrl: "" }]);
                await fetchClaims();
            } else {
                setMessage({ type: "error", text: data.error || "Failed to submit claim" });
            }
        } catch {
            setMessage({ type: "error", text: "Could not connect to the server" });
        } finally { setIsSubmitting(false); }
    };

    if (isLoading) return <div style={s.root}><div style={s.center}><div style={s.spinner} /></div></div>;

    return (
        <div style={s.root}>
            <OfflineBanner />
            <div style={s.orb} />

            <div style={s.page}>
                <div style={s.headerRow}>
                    <div>
                        <h1 style={s.pageTitle}>Claims</h1>
                        <p style={s.pageSub}>Submit expense reimbursement</p>
                    </div>
                    <button id="new-claim-btn" onClick={() => { setShowForm(!showForm); setMessage(null); }} style={s.newBtn}>
                        {showForm ? "✕ Close" : "+ New Claim"}
                    </button>
                </div>

                {message && (
                    <div style={{ ...s.msgBox, background: message.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)", borderColor: message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)", color: message.type === "success" ? "#34d399" : "#fca5a5" }}>
                        {message.text}
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <div style={s.formCard}>
                        <h2 style={s.formTitle}>New Claim Submission</h2>
                        <form onSubmit={handleSubmit} style={s.form}>
                            <div style={s.field}>
                                <label style={s.label}>Claim Title</label>
                                <input id="claim-title" type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={s.input} placeholder="Example: Surabaya Business Trip Claim" required />
                            </div>
                            <div style={s.field}>
                                <label style={s.label}>Description (optional)</label>
                                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...s.input, minHeight: 60, resize: "vertical" }} placeholder="Additional notes..." />
                            </div>

                            <div style={s.itemsSection}>
                                <div style={s.itemsHeader}>
                                    <span style={s.label}>EXPENSE ITEMS</span>
                                    <button type="button" id="add-item-btn" onClick={addItem} style={s.addItemBtn}>+ Add Item</button>
                                </div>

                                {items.map((item, idx) => (
                                    <div key={idx} style={s.itemCard}>
                                        <div style={s.itemHeaderRow}>
                                            <span style={{ fontSize: 12, color: "#818cf8", fontWeight: 600 }}>Item {idx + 1}</span>
                                            {items.length > 1 && (
                                                <button type="button" onClick={() => removeItem(idx)} style={s.removeBtn}>✕</button>
                                            )}
                                        </div>
                                        <div style={s.field}>
                                            <label style={s.label}>Category</label>
                                            <select value={item.category} onChange={e => updateItem(idx, "category", e.target.value)} style={s.select}>
                                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                            </select>
                                        </div>
                                        <div style={s.field}>
                                            <label style={s.label}>Description</label>
                                            <input type="text" value={item.description} onChange={e => updateItem(idx, "description", e.target.value)} style={s.input} placeholder="Expense explanation..." required />
                                        </div>
                                        <div style={s.twoCol}>
                                            <div style={{ ...s.field, flex: 1 }}>
                                                <label style={s.label}>Amount (Rp)</label>
                                                <input type="number" value={item.amount || ""} onChange={e => updateItem(idx, "amount", Number(e.target.value))} style={s.input} placeholder="0" min="0" required />
                                            </div>
                                            <div style={{ ...s.field, flex: 1 }}>
                                                <label style={s.label}>Receipt Date</label>
                                                <input type="date" value={item.receiptDate} onChange={e => updateItem(idx, "receiptDate", e.target.value)} style={s.input} required />
                                            </div>
                                        </div>
                                        <div style={s.field}>
                                            <label style={s.label}>Merchant (optional)</label>
                                            <input type="text" value={item.merchant || ""} onChange={e => updateItem(idx, "merchant", e.target.value)} style={s.input} placeholder="Store/vendor name..." />
                                        </div>
                                        <div style={s.field}>
                                            <label style={s.label}>Receipt Photo (Optional / OCR)</label>
                                            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                                <input type="file" accept="image/*" capture="environment" onChange={(e) => handleUploadReceipt(idx, e)} disabled={uploadingItemIdx === idx} style={{...s.input, padding: "8px"}} />
                                                {uploadingItemIdx === idx && <span style={{ ...s.btnSpinner, width: 14, height: 14 }} />}
                                            </div>
                                            {item.receiptUrl && <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#818cf8", marginTop: 4 }}>View Attached Receipt</a>}
                                        </div>
                                    </div>
                                ))}

                                <div style={s.totalBox}>
                                    <span style={{ color: "#94a3b8", fontSize: 13 }}>Total Claim</span>
                                    <span style={{ color: "#e0e7ff", fontWeight: 800, fontSize: 18, fontFamily: "monospace" }}>{formatIDR(totalAmount)}</span>
                                </div>
                            </div>

                            <button id="submit-claim-btn" type="submit" disabled={isSubmitting} style={{ ...s.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}>
                                {isSubmitting ? <span style={s.btnSpinner} /> : `Submit Claim · ${formatIDR(totalAmount)}`}
                            </button>
                        </form>
                    </div>
                )}

                {/* Claims History */}
                <div style={s.section}>
                    <h2 style={s.sectionTitle}>Claim History</h2>
                    {claims.length === 0 ? (
                        <div style={s.emptyState}>
                            <span style={{ fontSize: 40 }}>💳</span>
                            <p style={{ color: "#64748b", margin: "8px 0 0" }}>No claims submitted yet</p>
                        </div>
                    ) : (
                        <div style={s.claimList}>
                            {claims.map((claim) => {
                                const sc = STATUS_STYLE[claim.status] || STATUS_STYLE.DRAFT;
                                return (
                                    <div key={claim.id} style={s.claimCard}>
                                        <div style={s.claimTop}>
                                            <div style={{ flex: 1 }}>
                                                <p style={s.claimNumber}>{claim.claimNumber}</p>
                                                <p style={s.claimTitle}>{claim.title}</p>
                                            </div>
                                            <span style={{ ...s.statusChip, background: sc.bg, color: sc.color }}>{claim.status}</span>
                                        </div>
                                        <div style={s.claimBottom}>
                                            <span style={s.claimAmount}>{formatIDR(Number(claim.totalAmount))}</span>
                                            <span style={s.claimItems}>{claim.items.length} item{claim.items.length > 1 ? "s" : ""}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div style={{ height: 80 }} />
            </div>

            <EssNav />
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                select option { background: #1a1033; color: #e2e8f0; }
                input:focus, select:focus, textarea:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.2) !important; }
                button:hover:not(:disabled) { filter: brightness(1.1); }
            `}</style>
        </div>
    );
}

const s: Record<string, any> = {
    root: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0f1a 0%, #1a1033 50%, #0a1628 100%)", fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)", position: "relative" },
    orb: { position: "fixed", bottom: "-10%", left: "-5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(245,158,11,0.08)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 },
    center: { display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" },
    spinner: { width: 36, height: 36, border: "3px solid rgba(99,102,241,0.3)", borderTopColor: "#6366f1", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    page: { position: "relative", zIndex: 1, padding: "20px 16px 0", maxWidth: 480, margin: "0 auto" },
    headerRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
    pageTitle: { margin: "0 0 2px", fontSize: 26, fontWeight: 800, color: "#e0e7ff" },
    pageSub: { margin: 0, fontSize: 13, color: "#64748b" },
    newBtn: { padding: "8px 14px", background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: 10, color: "#fff", fontSize: 13, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(245,158,11,0.4)", marginTop: 4 },
    msgBox: { borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, border: "1px solid", marginBottom: 16 },
    formCard: { background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(245,158,11,0.15)", borderRadius: 20, padding: "20px 16px", marginBottom: 20 },
    formTitle: { margin: "0 0 16px", fontSize: 16, fontWeight: 700, color: "#e0e7ff" },
    form: { display: "flex", flexDirection: "column", gap: 14 },
    field: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
    input: { padding: "11px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit" },
    select: { padding: "11px 12px", background: "rgba(15,15,26,0.95)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#e2e8f0", fontSize: 14, width: "100%", boxSizing: "border-box" as const, fontFamily: "inherit", cursor: "pointer" },
    itemsSection: { display: "flex", flexDirection: "column", gap: 10 },
    itemsHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    addItemBtn: { padding: "5px 12px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer" },
    itemCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px", display: "flex", flexDirection: "column", gap: 10 },
    itemHeaderRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    removeBtn: { padding: "2px 8px", background: "rgba(239,68,68,0.15)", border: "none", borderRadius: 6, color: "#f87171", fontSize: 12, cursor: "pointer" },
    twoCol: { display: "flex", gap: 10 },
    totalBox: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "12px 14px" },
    submitBtn: { padding: "13px", background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(245,158,11,0.4)", minHeight: 48 },
    btnSpinner: { width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    section: { marginBottom: 20 },
    sectionTitle: { margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: "#64748b", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
    emptyState: { display: "flex", flexDirection: "column", alignItems: "center", padding: "32px", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.05)" },
    claimList: { display: "flex", flexDirection: "column", gap: 8 },
    claimCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px" },
    claimTop: { display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 },
    claimNumber: { margin: "0 0 2px", fontSize: 11, color: "#6366f1", fontWeight: 700, letterSpacing: "0.05em" },
    claimTitle: { margin: 0, fontSize: 13, fontWeight: 600, color: "#e0e7ff" },
    statusChip: { padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: "nowrap" as const, alignSelf: "flex-start" },
    claimBottom: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    claimAmount: { fontSize: 16, fontWeight: 800, color: "#fbbf24", fontFamily: "monospace" },
    claimItems: { fontSize: 11, color: "#475569", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 20 },
};
