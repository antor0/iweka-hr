"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    Plus,
    X,
    Inbox,
    CheckCircle2,
    XCircle,
    Clock,
    Banknote,
    Car,
    MoreHorizontal,
    Trash2,
    FileText,
    Camera,
    Utensils,
    Hotel,
    Bus,
    ParkingCircle,
    Paperclip,
    Smartphone as SmartphoneIcon,
    ClipboardList,
    AlertCircle,
    Receipt,
    Coins,
    Check,
    ChevronRight,
    Smartphone
} from "lucide-react";
import { MobileHeader } from "../components/mobile-header";
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
    { value: "TRAVEL", label: "Business Travel", icon: Car },
    { value: "MEALS", label: "Meals", icon: Utensils },
    { value: "ACCOMMODATION", label: "Accommodation", icon: Hotel },
    { value: "TRANSPORT", label: "Transport", icon: Bus },
    { value: "PARKING_TOLLS", label: "Parking & Tolls", icon: ParkingCircle },
    { value: "OFFICE_SUPPLIES", label: "Office Supplies", icon: Paperclip },
    { value: "COMMUNICATION", label: "Communication", icon: SmartphoneIcon },
    { value: "OTHER", label: "Other", icon: ClipboardList },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    DRAFT: { bg: "bg-muted/10", text: "text-muted-foreground", label: "Draft", icon: FileText },
    SUBMITTED: { bg: "bg-amber-500/10", text: "text-amber-500", label: "Submitted", icon: Clock },
    APPROVED: { bg: "bg-emerald-500/10", text: "text-emerald-500", label: "Approved", icon: CheckCircle2 },
    REJECTED: { bg: "bg-red-500/10", text: "text-red-500", label: "Rejected", icon: XCircle },
    PAID: { bg: "bg-primary/10", text: "text-primary", label: "Paid", icon: Banknote },
};

function formatIDR(n: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n);
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
                setMessage({ type: "success", text: "Receipt scanned successfully!" });
            } else {
                setMessage({ type: "error", text: data.error || "Failed to scan receipt" });
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
        setMessage(null);
        setIsSubmitting(true);
        try {
            const res = await fetch("/api/v1/ess/claims", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, items }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: "success", text: "Claim submitted successfully!" });
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

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex-1 pb-28 font-sans">
            <OfflineBanner />
            <MobileHeader
                title="Claims"
                rightAction={
                    <button
                        onClick={() => { setShowForm(!showForm); setMessage(null); }}
                        className={`p-2 transition-all ${showForm ? "text-[var(--ios-secondary-label)]" : "text-primary active:opacity-50"}`}
                    >
                        {showForm ? <X size={24} strokeWidth={2.5} /> : <Plus size={24} strokeWidth={2.5} />}
                    </button>
                }
            />

            <div className="pt-2 flex flex-col gap-5">
                {message && (
                    <div className="px-4">
                        <div className={`rounded-2xl p-4 text-[13px] font-bold border flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${message.type === "success"
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                            : "bg-red-500/10 border-red-500/30 text-red-500"
                            }`}>
                            {message.type === "success" ? <CheckCircle2 size={16} strokeWidth={3} /> : <AlertCircle size={16} strokeWidth={3} />}
                            {message.text}
                        </div>
                    </div>
                )}

                {/* Submit Form */}
                {showForm && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 px-4">
                        <div className="ios-list-group mx-0">
                            <h2 className="ios-list-header px-1">Claim Info</h2>
                            <div className="ios-list-content">
                                <div className="ios-cell flex flex-col items-stretch gap-1 py-1">
                                    <label className="text-[12px] font-bold text-primary uppercase tracking-tight">Claim Title</label>
                                    <input
                                        type="text"
                                        value={form.title}
                                        onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                        className="w-full bg-transparent text-[17px] font-normal text-[var(--ios-label)] focus:outline-none py-1"
                                        placeholder="e.g. Business Trip Surabaya"
                                        required
                                    />
                                </div>
                                <div className="ios-cell flex flex-col items-stretch gap-1 py-1">
                                    <label className="text-[12px] font-bold text-primary uppercase tracking-tight">Details (Optional)</label>
                                    <textarea
                                        value={form.description}
                                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                        className="w-full bg-transparent text-[17px] font-normal text-[var(--ios-label)] focus:outline-none py-1 min-h-[60px] resize-none"
                                        placeholder="Add notes..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <h2 className="ios-list-header px-1 flex justify-between items-center">
                                Expense Items
                                <button type="button" onClick={addItem} className="text-primary font-bold lowercase tracking-normal flex items-center gap-1">
                                    <Plus size={14} strokeWidth={3} /> Add item
                                </button>
                            </h2>
                            {items.map((item, idx) => (
                                <div key={idx} className="ios-list-group mx-0 mt-2 mb-6 animate-in zoom-in-95 duration-200">
                                    <div className="ios-list-content border-primary/20">
                                        <div className="ios-cell justify-between bg-primary/5">
                                            <span className="text-[12px] font-bold text-primary uppercase">Item #{idx + 1}</span>
                                            {items.length > 1 && (
                                                <button type="button" onClick={() => removeItem(idx)} className="text-destructive font-bold text-[12px] uppercase">
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                        <div className="ios-cell flex flex-col items-stretch gap-1 py-1 relative">
                                            <label className="text-[11px] font-bold text-[var(--ios-secondary-label)] uppercase">Category</label>
                                            <div className="relative w-full">
                                                <select
                                                    value={item.category}
                                                    onChange={e => updateItem(idx, "category", e.target.value)}
                                                    className="w-full bg-transparent text-[17px] text-[var(--ios-label)] focus:outline-none appearance-none cursor-pointer py-1 pr-8"
                                                >
                                                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                                </select>
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ios-secondary-label)] opacity-50">
                                                    <ChevronRight className="rotate-90" size={16} />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="ios-cell flex flex-col items-stretch gap-1 py-1">
                                            <label className="text-[11px] font-bold text-[var(--ios-secondary-label)] uppercase">Description</label>
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={e => updateItem(idx, "description", e.target.value)}
                                                className="w-full bg-transparent text-[17px] text-[var(--ios-label)] focus:outline-none py-1"
                                                placeholder="What was this for?"
                                                required
                                            />
                                        </div>
                                        <div className="ios-cell py-1">
                                            <div className="flex-1 flex flex-col gap-1">
                                                <label className="text-[11px] font-bold text-[var(--ios-secondary-label)] uppercase">Amount (Rp)</label>
                                                <input
                                                    type="number"
                                                    value={item.amount || ""}
                                                    onChange={e => updateItem(idx, "amount", Number(e.target.value))}
                                                    className="w-full bg-transparent text-[17px] font-bold text-[var(--ios-label)] focus:outline-none py-1 font-mono"
                                                    placeholder="0"
                                                    required
                                                />
                                            </div>
                                            <div className="w-[0.5px] h-8 bg-[var(--ios-separator)] mx-4" />
                                            <div className="flex-1 flex flex-col gap-1 text-right">
                                                <label className="text-[11px] font-bold text-[var(--ios-secondary-label)] uppercase">Date</label>
                                                <input
                                                    type="date"
                                                    value={item.receiptDate}
                                                    onChange={e => updateItem(idx, "receiptDate", e.target.value)}
                                                    className="w-full bg-transparent text-[17px] text-[var(--ios-label)] focus:outline-none py-1 text-right"
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="ios-cell">
                                            <label className="flex-1 flex items-center gap-3 text-primary cursor-pointer active:opacity-50">
                                                <Camera size={20} />
                                                <span className="text-[17px] font-medium">{uploadingItemIdx === idx ? "Scanning..." : (item.receiptUrl ? "Update Receipt" : "Scan Receipt")}</span>
                                                <input type="file" accept="image/*" capture="environment" onChange={(e) => handleUploadReceipt(idx, e)} className="hidden" disabled={uploadingItemIdx === idx} />
                                            </label>
                                            {item.receiptUrl && <Check size={20} className="text-emerald-500" strokeWidth={3} />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex flex-col gap-6">
                            <div className="bg-[#FF9500] rounded-2xl p-4 flex justify-between items-center text-white shadow-lg shadow-amber-500/20">
                                <span className="text-[15px] font-bold uppercase tracking-tight">Total Amount</span>
                                <span className="text-[20px] font-bold font-mono">{formatIDR(totalAmount)}</span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-4.5 bg-primary text-primary-foreground rounded-2xl text-[17px] font-bold shadow-lg shadow-primary/20 active:opacity-80 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Submit Claim"}
                            </button>
                        </div>
                    </div>
                )}

                {!showForm && (
                    <div className="ios-list-group">
                        <h2 className="ios-list-header">History</h2>
                        <div className="ios-list-content">
                            {claims.length === 0 ? (
                                <div className="ios-empty-state">
                                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                        <Inbox size={28} strokeWidth={1.5} />
                                    </div>
                                    <p className="ios-empty-state-text">No Claims Yet</p>
                                    <p className="ios-empty-state-subtext">Submit your first expense claim using the + button above.</p>
                                </div>
                            ) : (
                                claims.map((claim) => {
                                    const style = STATUS_STYLE[claim.status] || STATUS_STYLE.DRAFT;
                                    const StatusIcon = style.icon;
                                    return (
                                        <div key={claim.id} className="ios-cell items-start py-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg} ${style.text}`}>
                                                <Receipt size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-[15px] font-bold text-primary font-mono tracking-tight uppercase opacity-60">{claim.claimNumber}</p>
                                                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 ${style.text} ${style.bg}`}>
                                                        <StatusIcon size={12} strokeWidth={3} />
                                                        {style.label}
                                                    </span>
                                                </div>
                                                <h3 className="text-[17px] font-bold text-[var(--ios-label)] mt-0.5 leading-tight">{claim.title}</h3>
                                                <p className="text-[13px] text-[var(--ios-secondary-label)] font-medium mt-1">
                                                    {claim.items.length} Expense Item{claim.items.length > 1 ? "s" : ""}
                                                </p>
                                                <p className="text-[17px] font-bold text-[var(--ios-label)] mt-2 font-mono">{formatIDR(Number(claim.totalAmount))}</p>
                                            </div>
                                            <ChevronRight className="ios-chevron mt-1" size={18} />
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>

            <EssNav />
        </div>
    );
}
