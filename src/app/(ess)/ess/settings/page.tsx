"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OfflineBanner } from "../components/offline-banner";
import { EssNav } from "../components/ess-nav";

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
            setMessage({ type: "error", text: "PIN baru dan konfirmasi tidak cocok" });
            return;
        }
        if (!/^\d{6}$/.test(newPin)) {
            setMessage({ type: "error", text: "PIN harus terdiri dari 6 digit angka" });
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
                setMessage({ type: "success", text: "✅ PIN berhasil diubah!" });
                setCurrentPin(""); setNewPin(""); setConfirmPin("");
                if (isFirstTime) {
                    setTimeout(() => router.push("/ess/home"), 1500);
                }
            } else {
                setMessage({ type: "error", text: data.error || "Gagal mengubah PIN" });
            }
        } catch {
            setMessage({ type: "error", text: "Tidak dapat terhubung ke server" });
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
        <div style={s.root}>
            <OfflineBanner />
            <div style={s.orb} />

            <div style={s.page}>
                {/* First-time prompt */}
                {isFirstTime && (
                    <div style={s.firstTimeBanner}>
                        <span style={{ fontSize: 20 }}>🔐</span>
                        <div>
                            <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700, color: "#fbbf24" }}>Ganti PIN Sekarang!</p>
                            <p style={{ margin: 0, fontSize: 12, color: "#d97706" }}>Untuk keamanan akun, silakan ganti PIN default Anda sebelum melanjutkan.</p>
                        </div>
                    </div>
                )}

                {/* Profile Header */}
                {profile && (
                    <div style={s.profileCard}>
                        <div style={s.profileAvatar}>{getInitials(profile.fullName)}</div>
                        <div>
                            <p style={s.profileName}>{profile.fullName}</p>
                            <p style={s.profileRole}>{profile.position?.title || "—"}</p>
                            <p style={s.profileDept}>{profile.department?.name || "—"} · {profile.employeeNumber}</p>
                        </div>
                    </div>
                )}

                {/* Change PIN Card */}
                <div style={s.card}>
                    <div style={s.cardHeader}>
                        <span style={{ fontSize: 20 }}>🔐</span>
                        <h2 style={s.cardTitle}>Ganti PIN</h2>
                    </div>
                    <p style={s.cardDesc}>PIN digunakan untuk masuk ke aplikasi MyHRIS. Pastikan PIN Anda mudah diingat namun tidak mudah ditebak.</p>

                    {message && (
                        <div style={{ ...s.msgBox, background: message.type === "success" ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.12)", borderColor: message.type === "success" ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.25)", color: message.type === "success" ? "#34d399" : "#fca5a5" }}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleChangePin} style={s.form}>
                        <div style={s.field}>
                            <label style={s.label}>PIN Saat Ini</label>
                            <div style={s.pinWrapper}>
                                <input
                                    id="current-pin"
                                    type="password"
                                    inputMode="numeric"
                                    value={currentPin}
                                    onChange={e => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    style={{ ...s.pinInput, letterSpacing: currentPin ? "0.4em" : "normal", fontSize: currentPin ? 22 : 16 }}
                                    placeholder="••••••"
                                    maxLength={6}
                                    disabled={isSubmitting}
                                />
                                <span style={s.pinLen}>{currentPin.length}/6</span>
                            </div>
                        </div>
                        <div style={s.field}>
                            <label style={s.label}>PIN Baru</label>
                            <div style={s.pinWrapper}>
                                <input
                                    id="new-pin"
                                    type="password"
                                    inputMode="numeric"
                                    value={newPin}
                                    onChange={e => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    style={{ ...s.pinInput, letterSpacing: newPin ? "0.4em" : "normal", fontSize: newPin ? 22 : 16 }}
                                    placeholder="••••••"
                                    maxLength={6}
                                    disabled={isSubmitting}
                                />
                                <span style={s.pinLen}>{newPin.length}/6</span>
                            </div>
                        </div>
                        <div style={s.field}>
                            <label style={s.label}>Konfirmasi PIN Baru</label>
                            <div style={s.pinWrapper}>
                                <input
                                    id="confirm-pin"
                                    type="password"
                                    inputMode="numeric"
                                    value={confirmPin}
                                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                    style={{
                                        ...s.pinInput,
                                        letterSpacing: confirmPin ? "0.4em" : "normal",
                                        fontSize: confirmPin ? 22 : 16,
                                        borderColor: confirmPin && newPin && confirmPin === newPin ? "rgba(16,185,129,0.5)" : confirmPin && newPin && confirmPin !== newPin ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)",
                                    }}
                                    placeholder="••••••"
                                    maxLength={6}
                                    disabled={isSubmitting}
                                />
                                {confirmPin && newPin && (
                                    <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 16 }}>
                                        {confirmPin === newPin ? "✅" : "❌"}
                                    </span>
                                )}
                            </div>
                        </div>

                        <button
                            id="change-pin-btn"
                            type="submit"
                            disabled={isSubmitting || currentPin.length < 6 || newPin.length < 6 || confirmPin.length < 6}
                            style={{
                                ...s.submitBtn,
                                opacity: isSubmitting || currentPin.length < 6 || newPin.length < 6 || confirmPin.length < 6 ? 0.5 : 1,
                                cursor: isSubmitting || currentPin.length < 6 ? "not-allowed" : "pointer",
                            }}
                        >
                            {isSubmitting ? <span style={s.btnSpinner} /> : isFirstTime ? "✅ Simpan PIN & Lanjutkan" : "Ganti PIN"}
                        </button>
                    </form>
                </div>

                {/* Info Card */}
                <div style={s.infoCard}>
                    <h3 style={{ ...s.cardTitle, fontSize: 14 }}>ℹ️ Informasi Akun</h3>
                    <div style={s.infoRow}>
                        <span style={s.infoLabel}>Employee ID</span>
                        <span style={s.infoValue}>{profile?.employeeNumber || "—"}</span>
                    </div>
                    <div style={s.infoRow}>
                        <span style={s.infoLabel}>Email</span>
                        <span style={s.infoValue}>{profile?.email || "—"}</span>
                    </div>
                    <div style={s.infoRow}>
                        <span style={s.infoLabel}>Status</span>
                        <span style={{ ...s.infoValue, color: "#34d399" }}>{profile?.employmentStatus || "—"}</span>
                    </div>
                </div>

                {/* Logout */}
                {!isFirstTime && (
                    <button
                        id="logout-btn"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        style={{ ...s.logoutBtn, opacity: isLoggingOut ? 0.7 : 1 }}
                    >
                        {isLoggingOut ? "Keluar..." : "🚪 Keluar dari Akun"}
                    </button>
                )}

                <div style={{ height: 80 }} />
            </div>

            <EssNav />

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.2) !important; }
                button:hover:not(:disabled) { filter: brightness(1.1); }
                input::placeholder { color: #475569; }
            `}</style>
        </div>
    );
}

export default function EssSettingsPage() {
    return (
        <Suspense fallback={<div style={{ background: "#0f0f1a", height: "100vh" }} />}>
            <SettingsContent />
        </Suspense>
    );
}

const s: Record<string, any> = {
    root: { minHeight: "100vh", background: "linear-gradient(135deg, #0f0f1a 0%, #1a1033 50%, #0a1628 100%)", fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)", position: "relative" },
    orb: { position: "fixed", top: "-10%", right: "-5%", width: 300, height: 300, borderRadius: "50%", background: "rgba(168,85,247,0.15)", filter: "blur(80px)", pointerEvents: "none", zIndex: 0 },
    page: { position: "relative", zIndex: 1, padding: "20px 16px 0", maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 },
    firstTimeBanner: { background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" },
    profileCard: { display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px" },
    profileAvatar: { width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0 },
    profileName: { margin: "0 0 2px", fontSize: 16, fontWeight: 700, color: "#e0e7ff" },
    profileRole: { margin: "0 0 2px", fontSize: 12, color: "#818cf8" },
    profileDept: { margin: 0, fontSize: 11, color: "#475569" },
    card: { background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 20, padding: "20px 16px" },
    cardHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
    cardTitle: { margin: 0, fontSize: 16, fontWeight: 700, color: "#e0e7ff" },
    cardDesc: { margin: "0 0 16px", fontSize: 12, color: "#64748b", lineHeight: 1.5 },
    msgBox: { borderRadius: 10, padding: "10px 14px", fontSize: 13, fontWeight: 600, border: "1px solid", marginBottom: 14 },
    form: { display: "flex", flexDirection: "column", gap: 14 },
    field: { display: "flex", flexDirection: "column", gap: 6 },
    label: { fontSize: 11, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
    pinWrapper: { position: "relative" },
    pinInput: { width: "100%", padding: "13px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#e2e8f0", transition: "all 0.2s", boxSizing: "border-box" as const, fontFamily: "inherit" },
    pinLen: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "#475569" },
    submitBtn: { padding: "14px", background: "linear-gradient(135deg, #a855f7, #7c3aed)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(168,85,247,0.4)", minHeight: 50, gap: 8 },
    btnSpinner: { width: 18, height: 18, border: "2px solid rgba(255,255,255,0.4)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
    infoCard: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px", display: "flex", flexDirection: "column", gap: 10 },
    infoRow: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    infoLabel: { fontSize: 12, color: "#64748b" },
    infoValue: { fontSize: 13, fontWeight: 600, color: "#cbd5e1" },
    logoutBtn: { width: "100%", padding: "14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12, color: "#f87171", fontSize: 15, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" },
};
