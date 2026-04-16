"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
    Wallet, 
    Plus, 
    X, 
    Inbox, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    CreditCard, 
    Banknote, 
    Car, 
    ShoppingBag, 
    HeartPulse, 
    MoreHorizontal,
    Trash2,
    FileText,
    Camera,
    Utensils,
    Hotel,
    Bus,
    ParkingCircle,
    Paperclip,
    Smartphone,
    ClipboardList,
    AlertCircle,
    Receipt,
    Coins,
    Check
} from "lucide-react";
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
    { value: "COMMUNICATION", label: "Communication", icon: Smartphone },
    { value: "OTHER", label: "Other", icon: ClipboardList },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string; icon: any }> = {
    DRAFT: { bg: "bg-muted/15", text: "text-muted-foreground", label: "Draft", icon: FileText },
    SUBMITTED: { bg: "bg-warning/15", text: "text-warning", label: "Submitted", icon: Clock },
    APPROVED: { bg: "bg-success/15", text: "text-success", label: "Approved", icon: CheckCircle2 },
    REJECTED: { bg: "bg-destructive/15", text: "text-destructive", label: "Rejected", icon: XCircle },
    PAID: { bg: "bg-primary/15", text: "text-primary", label: "Paid", icon: Banknote },
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
                setMessage({ type: "success", text: `Claim ${data.data.claimNumber} submitted successfully!` });
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
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-warning/30 border-t-warning rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Loading claims...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent font-sans relative">
            <OfflineBanner />

            <div className="relative z-10 px-4 pt-6 pb-24 max-w-[480px] mx-auto flex flex-col gap-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-extrabold text-foreground tracking-tight underline decoration-warning/30 underline-offset-8">Claims</h1>
                        <p className="text-[11px] text-muted-foreground font-black mt-4 uppercase tracking-[0.2em] px-1 opacity-70">Submit expense reimbursement</p>
                    </div>
                    <button 
                        id="new-claim-btn" 
                        onClick={() => { setShowForm(!showForm); setMessage(null); }} 
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 ${
                            showForm 
                                ? "bg-muted text-muted-foreground" 
                                : "bg-gradient-to-br from-warning to-orange-600 text-white shadow-warning/30"
                        }`}
                        title={showForm ? "Close Form" : "New Claim"}
                    >
                        {showForm ? <X size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
                    </button>
                </div>

                {message && (
                    <div className={`rounded-2xl p-4 text-[11px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
                        message.type === "success" 
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                            : "bg-red-500/10 border-red-500/30 text-red-500"
                    }`}>
                        {message.type === "success" ? <CheckCircle2 size={14} strokeWidth={3} /> : <AlertCircle size={14} strokeWidth={3} />}
                        {message.text}
                    </div>
                )}

                {/* Form */}
                {showForm && (
                    <div className="glass border-warning/20 rounded-[32px] p-6 shadow-2xl shadow-warning/5 animate-in fade-in slide-in-from-top-4 duration-500">
                        <h2 className="text-base font-black text-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                            <Receipt size={18} className="text-warning" /> New Submission
                        </h2>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Claim Title</label>
                                <input 
                                    id="claim-title" 
                                    type="text" 
                                    value={form.title} 
                                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))} 
                                    className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-warning/50 transition-all font-sans" 
                                    placeholder="e.g. Surabaya Business Trip" 
                                    required 
                                />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Description</label>
                                <textarea 
                                    value={form.description} 
                                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))} 
                                    className="w-full bg-muted/30 border border-border/50 rounded-2xl px-4 py-3.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-warning/50 transition-all min-h-[60px] resize-none" 
                                    placeholder="Additional notes..." 
                                />
                            </div>

                            <div className="mt-2 flex flex-col gap-4">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Expense Items</span>
                                    <button 
                                        type="button" 
                                        id="add-item-btn" 
                                        onClick={addItem} 
                                        className="text-[9px] font-black text-warning uppercase tracking-widest bg-warning/10 px-4 py-2 rounded-xl border border-warning/20 hover:bg-warning/20 transition-all flex items-center gap-2"
                                    >
                                        <Plus size={12} strokeWidth={3} /> Add Item
                                    </button>
                                </div>

                                {items.map((item, idx) => (
                                    <div key={idx} className="bg-muted/20 border border-border/40 rounded-[28px] p-5 flex flex-col gap-4 relative animate-in zoom-in-95 duration-200">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-black text-warning/70 uppercase tracking-[0.25em]">Item #{idx + 1}</span>
                                            {items.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => removeItem(idx)} 
                                                    className="w-7 h-7 flex items-center justify-center bg-red-500/10 text-red-500 rounded-full hover:bg-red-500/20 transition-all active:scale-90"
                                                >
                                                    <Trash2 size={12} strokeWidth={2.5} />
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Category</label>
                                                <div className="relative">
                                                    <select 
                                                        value={item.category} 
                                                        onChange={e => updateItem(idx, "category", e.target.value)} 
                                                        className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-warning/50 transition-all appearance-none cursor-pointer"
                                                    >
                                                        {CATEGORIES.map(c => <option key={c.value} value={c.value} className="bg-background">{c.label}</option>)}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                                                        <MoreHorizontal size={14} />
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Explanation</label>
                                                <input 
                                                    type="text" 
                                                    value={item.description} 
                                                    onChange={e => updateItem(idx, "description", e.target.value)} 
                                                    className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-warning/50 transition-all" 
                                                    placeholder="What was this for?" 
                                                    required 
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Amount (Rp)</label>
                                                    <input 
                                                        type="number" 
                                                        value={item.amount || ""} 
                                                        onChange={e => updateItem(idx, "amount", Number(e.target.value))} 
                                                        className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-warning/50 transition-all font-mono" 
                                                        placeholder="0" 
                                                        min="0" 
                                                        required 
                                                    />
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={item.receiptDate} 
                                                        onChange={e => updateItem(idx, "receiptDate", e.target.value)} 
                                                        className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-warning/50 transition-all" 
                                                        required 
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Merchant (Optional)</label>
                                                <input 
                                                    type="text" 
                                                    value={item.merchant || ""} 
                                                    onChange={e => updateItem(idx, "merchant", e.target.value)} 
                                                    className="w-full bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-warning/50 transition-all" 
                                                    placeholder="Store name..." 
                                                />
                                            </div>

                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] pl-1">Receipt (Optional OCR)</label>
                                                <div className="flex gap-2 items-center">
                                                    <label className="flex-1 flex items-center gap-3 bg-background/50 border border-border/50 rounded-xl px-4 py-3 text-[10px] font-black text-muted-foreground cursor-pointer hover:border-warning/30 transition-all overflow-hidden whitespace-nowrap">
                                                        <Camera size={14} className="text-warning" />
                                                        <span>{uploadingItemIdx === idx ? "Processing..." : (item.receiptUrl ? "Update Receipt" : "Tap to Scan/Upload")}</span>
                                                        <input 
                                                            type="file" 
                                                            accept="image/*" 
                                                            capture="environment" 
                                                            onChange={(e) => handleUploadReceipt(idx, e)} 
                                                            disabled={uploadingItemIdx === idx} 
                                                            className="hidden" 
                                                        />
                                                    </label>
                                                    {uploadingItemIdx === idx && (
                                                        <div className="w-5 h-5 border-2 border-warning/30 border-t-warning rounded-full animate-spin" />
                                                    )}
                                                </div>
                                                {item.receiptUrl && (
                                                    <a href={item.receiptUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-black uppercase tracking-widest mt-1 pl-1 hover:underline">
                                                        <Check size={12} strokeWidth={3} /> Receipt Attached
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <div className="bg-warning/10 border border-warning/20 rounded-[24px] p-5 flex justify-between items-center group shadow-lg shadow-warning/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-xl bg-warning/20 flex items-center justify-center text-warning">
                                            <Coins size={16} />
                                        </div>
                                        <span className="text-[10px] font-black text-warning uppercase tracking-[0.2em]">Total Claim</span>
                                    </div>
                                    <span className="text-xl font-black text-warning tracking-tighter transition-all group-hover:scale-105 font-mono">{formatIDR(totalAmount)}</span>
                                </div>
                            </div>

                            <button 
                                id="submit-claim-btn" 
                                type="submit" 
                                disabled={isSubmitting} 
                                className="w-full py-4.5 bg-gradient-to-br from-warning to-orange-600 rounded-[22px] text-white text-sm font-black uppercase tracking-[0.2em] shadow-xl shadow-warning/30 hover:shadow-warning/40 active:scale-[0.98] transition-all disabled:opacity-50 mt-4"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                                ) : `Submit Claim Submission`}
                            </button>
                        </form>
                    </div>
                )}

                {/* Claims History */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.25em] px-2 opacity-60">
                        Claim History
                    </h2>
                    {claims.length === 0 ? (
                        <div className="glass border-dashed border-border/50 rounded-[32px] p-20 flex flex-col items-center justify-center text-center opacity-60">
                            <Wallet size={48} className="text-muted-foreground opacity-30 mb-4" strokeWidth={1.5} />
                            <p className="text-[11px] text-muted-foreground font-black uppercase tracking-widest opacity-60">No claims submitted yet</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {claims.map((claim) => {
                                const style = STATUS_STYLE[claim.status] || STATUS_STYLE.DRAFT;
                                const StatusIcon = style.icon;
                                return (
                                    <div key={claim.id} className="glass border-border/40 rounded-[32px] overflow-hidden flex flex-col group transition-all hover:bg-muted/5">
                                        <div className="p-6 flex flex-col gap-4">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        {claim.claimNumber}
                                                    </p>
                                                    <h3 className="text-sm font-black text-foreground leading-snug tracking-tight uppercase">
                                                        {claim.title}
                                                    </h3>
                                                </div>
                                                <span className={`px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${style.bg} ${style.text}`}>
                                                    <StatusIcon size={12} strokeWidth={2.5} />
                                                    {style.label}
                                                </span>
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2">
                                                {claim.items.slice(0, 3).map((item, i) => {
                                                    const cat = CATEGORIES.find(c => c.value === item.category);
                                                    const CatIcon = cat?.icon || ClipboardList;
                                                    return (
                                                        <div key={i} className="flex items-center gap-1.5 bg-muted/20 px-2 py-1 rounded-lg border border-border/20">
                                                            <CatIcon size={10} className="text-muted-foreground opacity-60" />
                                                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{cat?.label || "Other"}</span>
                                                        </div>
                                                    );
                                                })}
                                                {claim.items.length > 3 && (
                                                    <div className="flex items-center bg-muted/20 px-2 py-1 rounded-lg border border-border/20">
                                                        <span className="text-[9px] font-black text-muted-foreground opacity-60">+{claim.items.length - 3} more</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="bg-muted/15 border-t border-border/40 p-5 flex justify-between items-center mt-auto">
                                            <div className="flex flex-col">
                                                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] opacity-40 mb-1">Total Amount</span>
                                                <span className="text-base font-black text-foreground tracking-tighter font-mono">{formatIDR(Number(claim.totalAmount))}</span>
                                            </div>
                                            <div className="bg-background/40 px-3 py-1.5 rounded-xl border border-border/30 text-[9px] font-black text-muted-foreground uppercase tracking-[0.1em] flex items-center gap-2">
                                                <FileText size={12} strokeWidth={2.5} opacity={0.5} />
                                                {claim.items.length} item{claim.items.length > 1 ? "s" : ""}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <EssNav />
        </div>
    );
}
