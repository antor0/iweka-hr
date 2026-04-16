"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
    ShieldCheck, 
    Paintbrush, 
    LogOut, 
    CheckCircle2, 
    AlertCircle, 
    Fingerprint, 
    Mail, 
    Briefcase,
    ChevronRight,
    Sparkles,
    KeyRound,
    User
} from "lucide-react";
import { MobileHeader } from "../components/mobile-header";
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
        setMessage(null);
        if (newPin !== confirmPin) {
            setMessage({ type: "error", text: "New PIN and confirmation do not match" });
            return;
        }
        if (!/^\d{6}$/.test(newPin)) {
            setMessage({ type: "error", text: "PIN must be exactly 6 digits" });
            return;
        }

        setIsSubmitting(true);
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
        <div className="flex-1 pb-24 font-sans">
            <OfflineBanner />
            <MobileHeader title="Settings" />

            <div className="pt-2 flex flex-col gap-8 w-full">
                {/* Security Prompt */}
                {isFirstTime && (
                    <div className="px-4">
                        <div className="bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-2xl p-4 flex gap-3 items-start animate-in fade-in slide-in-from-top-4 duration-500">
                            <ShieldCheck className="text-[#FF9500] flex-shrink-0 mt-0.5" size={20} />
                            <div>
                                <p className="text-[15px] font-bold text-[#FF9500]">Security Update Required</p>
                                <p className="text-[13px] text-[#FF9500]/80 font-medium leading-tight mt-1">Please update your PIN before using the application.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Section */}
                {profile && (
                    <div className="ios-list-group mt-0">
                        <div className="ios-list-content">
                            <div className="ios-cell py-4">
                                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-2xl font-bold shadow-sm">
                                    {getInitials(profile.fullName)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-[20px] font-bold text-[var(--ios-label)] truncate">{profile.fullName}</h3>
                                    <p className="text-[15px] text-[var(--ios-secondary-label)] font-medium">
                                        {profile.employeeNumber} · {profile.position?.title || "Staff"}
                                    </p>
                                </div>
                            </div>
                            <div className="ios-cell bg-[var(--ios-system-bg)]/30">
                                <Briefcase className="text-primary" size={20} />
                                <span className="text-[17px] flex-1 text-[var(--ios-label)]">Department</span>
                                <span className="text-[17px] font-medium text-[var(--ios-secondary-label)]">{profile.department?.name || "General"}</span>
                            </div>
                            <div className="ios-cell">
                                <Mail className="text-primary" size={20} />
                                <span className="text-[17px] flex-1 text-[var(--ios-label)]">Email</span>
                                <span className="text-[17px] font-medium text-[var(--ios-secondary-label)] truncate ml-4">{profile.email || "—"}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Appearance */}
                <div className="ios-list-group">
                    <h2 className="ios-list-header">Appearance</h2>
                    <div className="ios-list-content">
                        <div className="ios-cell flex flex-col items-stretch py-4">
                            <div className="flex items-center gap-2 mb-4">
                                <Paintbrush className="text-[#AF52DE]" size={20} />
                                <span className="text-[17px] font-medium text-[var(--ios-label)]">Theme Mode</span>
                            </div>
                            <EssThemeToggle />
                        </div>
                    </div>
                </div>

                {/* Security */}
                <div className="ios-list-group">
                    <h2 className="ios-list-header text-[#007AFF]">Security & PIN</h2>
                    {message && (
                        <div className="px-5 py-3">
                            <div className={`text-[13px] font-bold flex items-center gap-2 ${message.type === "success" ? "text-emerald-500" : "text-destructive"}`}>
                                {message.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                                {message.text}
                            </div>
                        </div>
                    )}
                    <div className="ios-list-content">
                        <div className="ios-cell flex flex-col items-stretch gap-1 py-1">
                            <label className="text-[12px] font-bold text-primary uppercase tracking-tight">Current PIN</label>
                            <input
                                id="current-pin"
                                type="password"
                                inputMode="numeric"
                                value={currentPin}
                                onChange={e => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className="w-full bg-transparent text-[24px] font-bold text-[var(--ios-label)] tracking-[0.4em] focus:outline-none py-1 font-mono"
                                placeholder="••••••"
                                maxLength={6}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="ios-cell flex flex-col items-stretch gap-1 py-1">
                            <label className="text-[12px] font-bold text-primary uppercase tracking-tight">New 6-Digit PIN</label>
                            <input
                                id="new-pin"
                                type="password"
                                inputMode="numeric"
                                value={newPin}
                                onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className="w-full bg-transparent text-[24px] font-bold text-[var(--ios-label)] tracking-[0.4em] focus:outline-none py-1 font-mono"
                                placeholder="••••••"
                                maxLength={6}
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="ios-cell flex flex-col items-stretch gap-1 py-1">
                            <label className="text-[12px] font-bold text-primary uppercase tracking-tight">Confirm PIN</label>
                            <input
                                id="confirm-pin"
                                type="password"
                                inputMode="numeric"
                                value={confirmPin}
                                onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className="w-full bg-transparent text-[24px] font-bold text-[var(--ios-label)] tracking-[0.4em] focus:outline-none py-1 font-mono"
                                placeholder="••••••"
                                maxLength={6}
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>
                    <div className="px-5 mt-4">
                        <button
                            id="change-pin-btn"
                            disabled={isSubmitting || currentPin.length < 6 || newPin.length < 6 || confirmPin.length < 6}
                            onClick={handleChangePin}
                            className="w-full py-4.5 bg-primary text-primary-foreground rounded-2xl text-[17px] font-bold shadow-lg shadow-primary/20 active:opacity-80 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : "Update PIN"}
                        </button>
                    </div>
                </div>

                {/* Account Actions */}
                {!isFirstTime && (
                    <div className="ios-list-group">
                        <div className="ios-list-content">
                            <button
                                id="logout-btn"
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="ios-cell w-full justify-center active:bg-red-500/10"
                            >
                                {isLoggingOut ? (
                                    <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                                ) : (
                                    <span className="text-[17px] text-destructive font-semibold">Sign Out</span>
                                )}
                            </button>
                        </div>
                        <p className="text-center text-[13px] text-[var(--ios-secondary-label)] mt-2 font-medium">Enterprise HRIS Mobile v1.1.0</p>
                    </div>
                )}
            </div>

            <EssNav />
        </div>
    );
}

export default function EssSettingsPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        }>
            <SettingsContent />
        </Suspense>
    );
}
