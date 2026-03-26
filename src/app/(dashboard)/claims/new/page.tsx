"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    FileText,
    Upload,
    X,
    Plus,
    ArrowLeft,
    Send,
    Save,
    ScanLine,
    Receipt,
    Loader2,
    ImageIcon,
    Trash2,
    Car,
    Utensils,
    Building,
    Bus,
    ParkingCircle,
    Briefcase,
    Phone,
    MoreHorizontal,
} from "lucide-react";

const categories = [
    { value: "TRAVEL", label: "Travel", icon: <Car className="h-4 w-4" /> },
    { value: "MEALS", label: "Meals & Food", icon: <Utensils className="h-4 w-4" /> },
    { value: "ACCOMMODATION", label: "Accommodation", icon: <Building className="h-4 w-4" /> },
    { value: "TRANSPORT", label: "Transport (Taxi/Grab)", icon: <Bus className="h-4 w-4" /> },
    { value: "PARKING_TOLLS", label: "Parking & Tolls", icon: <ParkingCircle className="h-4 w-4" /> },
    { value: "OFFICE_SUPPLIES", label: "Office Supplies", icon: <Briefcase className="h-4 w-4" /> },
    { value: "COMMUNICATION", label: "Communication", icon: <Phone className="h-4 w-4" /> },
    { value: "OTHER", label: "Other", icon: <MoreHorizontal className="h-4 w-4" /> },
];

interface ClaimItem {
    id?: string;
    category: string;
    description: string;
    amount: number;
    receiptDate: string;
    merchant: string;
    file: File | null;
    previewUrl: string | null;
    ocrRawText: string | null;
    receiptUrl: string | null;
    saved: boolean;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(value);
}

export default function NewClaimPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [items, setItems] = useState<ClaimItem[]>([]);
    const [saving, setSaving] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [claimId, setClaimId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Item being edited
    const [editingItem, setEditingItem] = useState<ClaimItem | null>(null);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [showAddItem, setShowAddItem] = useState(false);

    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

    const createClaim = async (): Promise<string | null> => {
        if (claimId) return claimId;

        const res = await fetch("/api/v1/claims", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description }),
        });
        const json = await res.json();
        if (!res.ok) {
            setError(json.error || "Failed to create claim");
            return null;
        }
        setClaimId(json.data.id);
        return json.data.id;
    };

    const handleFileSelect = async (file: File) => {
        const previewUrl = URL.createObjectURL(file);
        const today = new Date().toISOString().split("T")[0];

        setEditingItem({
            category: "OTHER",
            description: "",
            amount: 0,
            receiptDate: today,
            merchant: "",
            file,
            previewUrl,
            ocrRawText: null,
            receiptUrl: null,
            saved: false,
        });
        setShowAddItem(true);

        // Run OCR
        setOcrLoading(true);
        try {
            const formData = new FormData();
            formData.append("receipt", file);
            const res = await fetch("/api/v1/claims/ocr", {
                method: "POST",
                body: formData,
            });
            const json = await res.json();
            if (json.success && json.data) {
                setEditingItem((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        amount: json.data.extractedAmount || prev.amount,
                        merchant: json.data.merchant || prev.merchant,
                        ocrRawText: json.data.rawText || null,
                    };
                });
            }
        } catch {
            // OCR failed, user can enter manually
        }
        setOcrLoading(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith("image/")) {
            handleFileSelect(file);
        }
    };

    const saveItem = async () => {
        if (!editingItem) return;
        setSaving(true);
        setError(null);

        try {
            // Ensure claim exists
            const id = await createClaim();
            if (!id) { setSaving(false); return; }

            const formData = new FormData();
            if (editingItem.file) formData.append("receipt", editingItem.file);
            formData.append("category", editingItem.category);
            formData.append("description", editingItem.description || "Receipt");
            formData.append("amount", String(editingItem.amount));
            formData.append("receiptDate", editingItem.receiptDate);
            formData.append("merchant", editingItem.merchant || "");

            const res = await fetch(`/api/v1/claims/${id}/items`, {
                method: "POST",
                body: formData,
            });
            const json = await res.json();

            if (!res.ok) {
                setError(json.error || "Failed to add item");
                setSaving(false);
                return;
            }

            setItems((prev) => [...prev, { ...editingItem, id: json.data.id, saved: true, receiptUrl: json.data.receiptUrl }]);
            setEditingItem(null);
            setShowAddItem(false);
        } catch (err: any) {
            setError(err.message);
        }
        setSaving(false);
    };

    const removeItem = async (index: number) => {
        const item = items[index];
        if (item.id && claimId) {
            try {
                await fetch(`/api/v1/claims/${claimId}/items/${item.id}`, { method: "DELETE" });
            } catch {}
        }
        setItems((prev) => prev.filter((_, i) => i !== index));
    };

    const submitClaim = async () => {
        if (!claimId) return;
        setSubmitting(true);
        setError(null);

        try {
            const res = await fetch(`/api/v1/claims/${claimId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "submit" }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json.error || "Failed to submit claim");
                setSubmitting(false);
                return;
            }
            router.push("/claims");
        } catch (err: any) {
            setError(err.message);
        }
        setSubmitting(false);
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={() => router.push("/claims")}>
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <FileText className="h-6 w-6 text-primary" />
                        New Expense Claim
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Upload receipts and submit for reimbursement
                    </p>
                </div>
            </div>

            {error && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl px-4 py-3 text-sm">
                    {error}
                </div>
            )}

            {/* Claim Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Claim Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Claim Title *</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Business Trip to Surabaya - March 2026"
                            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            disabled={!!claimId}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-foreground mb-1.5 block">Description (Optional)</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description of the expenses..."
                            rows={2}
                            className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                            disabled={!!claimId}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Receipt Items */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Receipt className="h-5 w-5" />
                            Receipt Items ({items.length})
                        </CardTitle>
                        <div className="text-right">
                            <p className="text-xs text-muted-foreground">Total Amount</p>
                            <p className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Existing items */}
                    {items.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-secondary/20 group hover:bg-secondary/40 transition-colors">
                            {item.previewUrl && (
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/50">
                                    <img src={item.previewUrl} alt="Receipt" className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="secondary" className="text-xs">
                                        {categories.find(c => c.value === item.category)?.label || item.category}
                                    </Badge>
                                    {item.merchant && (
                                        <span className="text-xs text-muted-foreground truncate">{item.merchant}</span>
                                    )}
                                </div>
                                <p className="text-sm truncate">{item.description}</p>
                                <p className="text-xs text-muted-foreground">{item.receiptDate}</p>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold">{formatCurrency(item.amount)}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                                onClick={() => removeItem(index)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    {/* Add new item form */}
                    {showAddItem && editingItem ? (
                        <div className="p-5 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 space-y-4">
                            <div className="flex items-start gap-4">
                                {/* Receipt preview */}
                                {editingItem.previewUrl && (
                                    <div className="w-32 h-32 rounded-xl overflow-hidden bg-muted shrink-0 border border-border relative group/img">
                                        <img src={editingItem.previewUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                                        {ocrLoading && (
                                            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                                                <div className="text-center">
                                                    <ScanLine className="h-6 w-6 text-primary animate-pulse mx-auto" />
                                                    <p className="text-[10px] text-muted-foreground mt-1">Scanning...</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Item fields */}
                                <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Category *</label>
                                            <select
                                                value={editingItem.category}
                                                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            >
                                                {categories.map((cat) => (
                                                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                                                Amount (IDR) *
                                                {ocrLoading && <Loader2 className="h-3 w-3 inline ml-1 animate-spin" />}
                                            </label>
                                            <input
                                                type="number"
                                                value={editingItem.amount || ""}
                                                onChange={(e) => setEditingItem({ ...editingItem, amount: parseFloat(e.target.value) || 0 })}
                                                placeholder="0"
                                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Merchant</label>
                                            <input
                                                type="text"
                                                value={editingItem.merchant}
                                                onChange={(e) => setEditingItem({ ...editingItem, merchant: e.target.value })}
                                                placeholder="Store/vendor name"
                                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Receipt Date *</label>
                                            <input
                                                type="date"
                                                value={editingItem.receiptDate}
                                                onChange={(e) => setEditingItem({ ...editingItem, receiptDate: e.target.value })}
                                                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Description *</label>
                                        <input
                                            type="text"
                                            value={editingItem.description}
                                            onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                            placeholder="e.g., Taxi from airport to hotel"
                                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        />
                                    </div>

                                    {editingItem.ocrRawText && (
                                        <details className="text-xs">
                                            <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                                                <ScanLine className="h-3 w-3 inline mr-1" />
                                                OCR Extracted Text
                                            </summary>
                                            <pre className="mt-1 p-2 rounded-lg bg-muted/50 overflow-auto max-h-24 text-muted-foreground whitespace-pre-wrap">
                                                {editingItem.ocrRawText}
                                            </pre>
                                        </details>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2 justify-end">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setEditingItem(null); setShowAddItem(false); }}
                                >
                                    <X className="h-4 w-4 mr-1" /> Cancel
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={saveItem}
                                    disabled={saving || !editingItem.description || editingItem.amount <= 0 || !title}
                                >
                                    {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                                    {saving ? "Adding..." : "Add Item"}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Upload area */
                        <div
                            className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 group"
                            onDrop={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleFileSelect(file);
                                    e.target.value = "";
                                }}
                            />
                            <div className="flex flex-col items-center gap-3">
                                <div className="p-4 rounded-2xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                                    <Upload className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Upload Receipt Image
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Drag & drop or click to browse • OCR will auto-extract the amount
                                    </p>
                                </div>
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                    <Badge variant="secondary"><ImageIcon className="h-3 w-3 mr-1" /> JPG</Badge>
                                    <Badge variant="secondary"><ImageIcon className="h-3 w-3 mr-1" /> PNG</Badge>
                                    <Badge variant="secondary"><ScanLine className="h-3 w-3 mr-1" /> Auto OCR</Badge>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => router.push("/claims")}>
                    Cancel
                </Button>
                <div className="flex gap-2">
                    {claimId && items.length > 0 && (
                        <Button variant="outline" onClick={() => router.push("/claims")}>
                            <Save className="h-4 w-4 mr-1.5" /> Save Draft
                        </Button>
                    )}
                    <Button
                        onClick={submitClaim}
                        disabled={submitting || items.length === 0 || !claimId || !title}
                    >
                        {submitting ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
                        {submitting ? "Submitting..." : "Submit Claim"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
