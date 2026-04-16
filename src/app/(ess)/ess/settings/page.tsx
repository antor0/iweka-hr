"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    ShieldCheck, 
    User, 
    Paintbrush, 
    LogOut, 
    Lock, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Fingerprint, 
    Mail, 
    Briefcase,
    ChevronRight,
    Sparkles,
    UserCircle,
    KeyRound
} from "lucide-react";
import { OfflineBanner } from "../components/offline-banner";
import { EssNav } from "../components/ess-nav";
import { EssThemeToggle } from "../components/theme-toggle";

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isFirstTime = searchParams.get("first") === "true";

    const [profile, setProfile] = useState<any>(null);
    const [currentPin, setCurrentPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const fetchProfile = useCallback(async () => {
        try {
            const res = await fetch("/api/v1/ess/profile");
            if (res.status === 401) { router.push("/ess"); return; }
            if (res.ok) setProfile((await res.json()).data);
        } catch { }
    }, [router]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    const handleChangePin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPin !== confirmPin) {
            setMessage({ type: "error", text: "New PIN and confirmation do not match" });
            return;
        }
        if (!/^\d{6}$/.test(newPin)) {
            setMessage({ type: "error", text: "PIN must consist of 6 digits" });
            return;
        }

        setIsSubmitting(true);
        setMessage(null);
        try {
            const res = await fetch("/api/v1/ess/pin", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPin, newPin, confirmPin }),
            });
            const data = await res.json();
            if (res.ok) {
                setMessage({ type: "success", text: "PIN updated successfully!" });
                setCurrentPin(""); setNewPin(""); setConfirmPin("");
                if (isFirstTime) {
                    setTimeout(() => router.push("/ess/home"), 1500);
                }
            } else {
                setMessage({ type: "error", text: data.error || "Failed to update PIN" });
            }
        } catch {
            setMessage({ type: "error", text: "Could not connect to the server" });
        } finally { setIsSubmitting(false); }
    };

    const handleLogout = async () => {
        setIsLoggingOut(true);
        try {
            await fetch("/api/v1/ess/auth/logout", { method: "POST" });
        } finally {
            router.push("/ess");
        }
    };

    const getInitials = (name: string) => name?.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() || "?";

    return (
        <div className="min-h-screen bg-transparent font-sans">
            <OfflineBanner />

            <div className="relative z-10 px-4 pt-6 pb-24 max-w-[480px] mx-auto flex flex-col gap-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight underline decoration-primary/30 underline-offset-8">Settings</h1>
                    <p className="text-[11px] text-muted-foreground font-black mt-4 uppercase tracking-[0.2em] px-1 opacity-70">Personalize your experience</p>
                </div>

                {/* First-time prompt */}
                {isFirstTime && (
                    <div className="bg-warning/10 border border-warning/30 rounded-[28px] p-5 flex gap-4 items-start animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="w-10 h-10 rounded-2xl bg-warning/20 flex items-center justify-center text-warning flex-shrink-0">
                            <ShieldCheck size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-sm font-black text-warning uppercase tracking-widest mb-1">Update Your Security</p>
                            <p className="text-[11px] text-warning/70 font-bold leading-relaxed uppercase tracking-tight">For account security, please change your default PIN before continuing.</p>
                        </div>
                    </div>
                )}

                {/* Profile Header */}
                {profile && (
                    <div className="glass rounded-[32px] p-6 flex items-center gap-5 shadow-2xl shadow-primary/5 group relative overflow-hidden">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
                        <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-primary/30 flex-shrink-0">
                            {getInitials(profile.fullName)}
                        </div>
                        <div className="min-w-0 z-10">
                            <p className="text-base font-black text-foreground truncate tracking-tight uppercase">{profile.fullName}</p>
                            <p className="text-[10px] text-primary font-black uppercase tracking-widest mt-1 opacity-80">{profile.position?.title || "Staff"}</p>
                            <p className="text-[10px] text-muted-foreground font-bold mt-0.5 opacity-60 flex items-center gap-1.5 uppercase">
                                <Briefcase size={10} /> {profile.department?.name || "General"} · {profile.employeeNumber}
                            </p>
                        </div>
                    </div>
                )}

                {/* Appearance Card */}
                <div className="glass rounded-[32px] p-7 border-l-4 border-l-primary shadow-xl shadow-primary/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <Paintbrush size={18} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Aesthetics</h2>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-6 font-bold uppercase tracking-tight opacity-70">Customize how MyHRIS looks and feels on your device.</p>
                    <EssThemeToggle />
                </div>

                {/* Change PIN Card */}
                <div className="glass rounded-[32px] p-7 border-l-4 border-l-indigo-500 shadow-xl shadow-indigo-500/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <KeyRound size={18} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-sm font-black text-foreground uppercase tracking-widest">Security Access</h2>
                    </div>
                    <p className="text-[11px] text-muted-foreground mb-6 font-bold uppercase tracking-tight opacity-70">Your PIN protects your personal HR data. Keep it confidential.</p>

                    {message && (
                        <div className={`rounded-2xl p-4 text-[10px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 mb-6 animate-in fade-in slide-in-from-top-2 duration-300 ${
                            message.type === "success" 
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" 
                                : "bg-red-500/10 border-red-500/30 text-red-500"
                        }`}>
                            {message.type === "success" ? <CheckCircle2 size={12} strokeWidth={3} /> : <AlertCircle size={12} strokeWidth={3} />}
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleChangePin} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Current PIN</label>
                            <div className="relative">
                                <input
                                    id="current-pin"
                                    type="password"
                                    inputMode="numeric"
                                    value={currentPin}
                                    onChange={e => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className="w-full bg-muted/30 border border-border/50 rounded-2xl px-5 py-4 text-foreground font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                                    placeholder="••••••"
                                    maxLength={6}
                                    disabled={isSubmitting}
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/30 font-mono italic">{currentPin.length}/6</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">New PIN</label>
                            <div className="relative">
                                <input
                                    id="new-pin"
                                    type="password"
                                    inputMode="numeric"
                                    value={newPin}
                                    onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className="w-full bg-muted/30 border border-border/50 rounded-2xl px-5 py-4 text-foreground font-black tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono"
                                    placeholder="••••••"
                                    maxLength={6}
                                    disabled={isSubmitting}
                                />
                                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/30 font-mono italic">{newPin.length}/6</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] ml-1">Confirm New PIN</label>
                            <div className="relative">
                                <input
                                    id="confirm-pin"
                                    type="password"
                                    inputMode="numeric"
                                    value={confirmPin}
                                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    className={`w-full bg-muted/30 border rounded-2xl px-5 py-4 text-foreground font-black tracking-[0.5em] focus:outline-none focus:ring-2 transition-all font-mono ${
                                        confirmPin && newPin && confirmPin === newPin 
                                            ? "border-emerald-500/50 focus:ring-emerald-500/30" 
                                            : confirmPin && newPin && confirmPin !== newPin 
                                            ? "border-red-500/50 focus:ring-red-500/30" 
                                            : "border-border/50 focus:ring-primary/50"
                                    }`}
                                    placeholder="••••••"
                                    maxLength={6}
                                    disabled={isSubmitting}
                                />
                                {confirmPin && newPin && (
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2">
                                        {confirmPin === newPin 
                                            ? <CheckCircle2 size={16} className="text-emerald-500" strokeWidth={3} /> 
                                            : <XCircle size={16} className="text-red-500" strokeWidth={3} />
                                        }
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            id="change-pin-btn"
                            type="submit"
                            disabled={isSubmitting || currentPin.length < 6 || newPin.length < 6 || confirmPin.length < 6}
                            className="w-full mt-4 py-4.5 bg-gradient-to-r from-primary to-indigo-600 rounded-[22px] text-white font-black text-sm uppercase tracking-[0.15em] shadow-xl shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>{isFirstTime ? <Sparkles size={18} /> : <CheckCircle2 size={18} />} {isFirstTime ? "Authorize Account" : "Confirm Update"}</>
                            )}
                        </button>
                    </form>
                </div>

                {/* Info Card */}
                <div className="glass rounded-[32px] p-7 flex flex-col gap-4 shadow-xl shadow-primary/5">
                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.25em] px-1 opacity-60 mb-1">Account Specifications</h3>
                    <div className="flex justify-between items-center px-2 py-3 border-b border-border/20">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                             <Fingerprint size={12} className="opacity-40" /> Employee ID
                        </span>
                        <span className="text-xs font-black text-foreground font-mono tracking-tighter opacity-80">{profile?.employeeNumber || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center px-2 py-3 border-b border-border/20">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Mail size={12} className="opacity-40" /> Business Email
                        </span>
                        <span className="text-xs font-bold text-foreground/70 truncate ml-4 tracking-tight">{profile?.email || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center px-2 py-3">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Sparkles size={12} className="opacity-40" /> Employment
                        </span>
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                            {profile?.employmentStatus || "Active"}
                        </span>
                    </div>
                </div>

                {/* Logout Button */}
                {!isFirstTime && (
                    <button
                        id="logout-btn"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full mt-4 py-4.5 bg-red-500/5 group border-2 border-dashed border-red-500/20 rounded-[24px] text-red-500 font-black text-xs uppercase tracking-[0.25em] transition-all hover:bg-red-500/10 hover:border-red-500/40 active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        {isLoggingOut ? (
                            <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                            <><LogOut size={16} strokeWidth={2.5} className="group-hover:-translate-x-1 transition-transform" /> Exit System Access</>
                        )}
                    </button>
                )}
            </div>

            <EssNav />
        </div>
    );
}

export default function EssSettingsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest">Warming up systems...</p>
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}

