"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function EssLoginPage() {
    const router = useRouter();
    const [employeeNumber, setEmployeeNumber] = useState("");
    const [pin, setPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isOffline, setIsOffline] = useState(false);
    const [showInstall, setShowInstall] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // Register service worker
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(console.error);
        }

        // Online/offline detection
        const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
        window.addEventListener("online", updateOnlineStatus);
        window.addEventListener("offline", updateOnlineStatus);
        setIsOffline(!navigator.onLine);

        // PWA install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowInstall(true);
        };
        window.addEventListener("beforeinstallprompt", handler);

        return () => {
            window.removeEventListener("online", updateOnlineStatus);
            window.removeEventListener("offline", updateOnlineStatus);
            window.removeEventListener("beforeinstallprompt", handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setShowInstall(false);
        setDeferredPrompt(null);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeNumber.trim() || !pin.trim()) {
            setError("Masukkan Employee ID dan PIN Anda");
            return;
        }
        setIsLoading(true);
        setError("");

        try {
            const res = await fetch("/api/v1/ess/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ employeeNumber: employeeNumber.trim().toUpperCase(), pin }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Login gagal");
                return;
            }

            if (data.pinMustChange) {
                router.push("/ess/settings?first=true");
            } else {
                router.push("/ess/home");
            }
        } catch {
            setError("Tidak dapat terhubung ke server");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={styles.root}>
            {/* Background orbs */}
            <div style={styles.orb1} />
            <div style={styles.orb2} />
            <div style={styles.orb3} />

            {/* Offline banner */}
            {isOffline && (
                <div style={styles.offlineBanner}>
                    <span style={{ fontSize: 14 }}>⚡</span>
                    <span>Anda sedang offline — beberapa fitur mungkin tidak tersedia</span>
                </div>
            )}

            <div style={styles.container}>
                {/* Logo */}
                <div style={styles.logoSection}>
                    <div style={styles.logoWrapper}>
                        <Image
                            src="/icons/icon-192x192.png"
                            alt="MyHRIS"
                            width={72}
                            height={72}
                            style={{ borderRadius: 18 }}
                        />
                    </div>
                    <h1 style={styles.appName}>MyHRIS</h1>
                    <p style={styles.appTagline}>Employee Self Service</p>
                </div>

                {/* Login Card */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Masuk ke Akun Anda</h2>
                    <p style={styles.cardSubtitle}>Gunakan Employee ID dan PIN Anda</p>

                    {error && (
                        <div style={styles.errorBox}>
                            <span>⚠ {error}</span>
                        </div>
                    )}

                    <form onSubmit={handleLogin} style={styles.form}>
                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>Employee ID</label>
                            <input
                                id="employee-number"
                                type="text"
                                placeholder="Contoh: EMP-0001"
                                value={employeeNumber}
                                onChange={(e) => setEmployeeNumber(e.target.value)}
                                style={styles.input}
                                autoComplete="username"
                                autoCapitalize="characters"
                                disabled={isLoading}
                            />
                        </div>

                        <div style={styles.fieldGroup}>
                            <label style={styles.label}>PIN (6 digit)</label>
                            <input
                                id="pin-input"
                                type="password"
                                inputMode="numeric"
                                placeholder="••••••"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                style={{ ...styles.input, letterSpacing: pin ? "0.5em" : "normal", fontSize: pin ? 22 : 16 }}
                                autoComplete="current-password"
                                maxLength={6}
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            id="login-button"
                            type="submit"
                            disabled={isLoading || isOffline}
                            style={{
                                ...styles.loginBtn,
                                opacity: isLoading || isOffline ? 0.7 : 1,
                                cursor: isLoading || isOffline ? "not-allowed" : "pointer",
                            }}
                        >
                            {isLoading ? (
                                <span style={styles.loadingSpinner} />
                            ) : (
                                "Masuk"
                            )}
                        </button>
                    </form>

                    <p style={styles.helpText}>
                        PIN default: <strong style={{ color: "#a5b4fc" }}>123456</strong>
                        {" "}&mdash; Anda akan diminta menggantinya saat pertama masuk.
                    </p>
                </div>

                {/* Install PWA Banner */}
                {showInstall && (
                    <div style={styles.installBanner}>
                        <div>
                            <p style={{ margin: 0, fontWeight: 600, color: "#e0e7ff", fontSize: 14 }}>
                                📲 Install MyHRIS
                            </p>
                            <p style={{ margin: "2px 0 0", fontSize: 12, color: "#a5b4fc" }}>
                                Pasang di layar utama untuk akses cepat
                            </p>
                        </div>
                        <button
                            id="install-pwa-button"
                            onClick={handleInstall}
                            style={styles.installBtn}
                        >
                            Install
                        </button>
                    </div>
                )}

                {/* Install instructions for iOS */}
                <div style={styles.iosInstallHint}>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b", textAlign: "center" }}>
                        Di iPhone/iPad: tekan{" "}
                        <span style={{ color: "#6366f1" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ verticalAlign: "middle" }}>
                                <path d="M12 2L8 6h3v8h2V6h3L12 2zm-8 11v7h16v-7h-2v5H6v-5H4z" />
                            </svg>
                        </span>{" "}
                        lalu <strong style={{ color: "#a5b4fc" }}>Tambah ke Layar Utama</strong>
                    </p>
                </div>

                <p style={styles.footerText}>© 2026 HRIS Pro &mdash; v1.0</p>
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input::placeholder { color: #475569; }
                input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.2) !important; }
                button:hover:not(:disabled) { filter: brightness(1.1); }
            `}</style>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    root: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f0f1a 0%, #1a1033 50%, #0a1628 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px 16px",
        position: "relative",
        overflow: "hidden",
        fontFamily: "var(--font-sans, Inter, system-ui, sans-serif)",
    },
    orb1: {
        position: "fixed",
        top: "-10%",
        right: "-5%",
        width: 350,
        height: 350,
        borderRadius: "50%",
        background: "rgba(99,102,241,0.18)",
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 0,
        animation: "float1 8s ease-in-out infinite",
    },
    orb2: {
        position: "fixed",
        bottom: "-10%",
        left: "-5%",
        width: 280,
        height: 280,
        borderRadius: "50%",
        background: "rgba(6,182,212,0.14)",
        filter: "blur(80px)",
        pointerEvents: "none",
        zIndex: 0,
    },
    orb3: {
        position: "fixed",
        top: "40%",
        left: "30%",
        width: 200,
        height: 200,
        borderRadius: "50%",
        background: "rgba(168,85,247,0.1)",
        filter: "blur(60px)",
        pointerEvents: "none",
        zIndex: 0,
    },
    offlineBanner: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: "rgba(245,158,11,0.9)",
        backdropFilter: "blur(8px)",
        color: "#78350f",
        padding: "10px 16px",
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        zIndex: 100,
        justifyContent: "center",
    },
    container: {
        width: "100%",
        maxWidth: 400,
        position: "relative",
        zIndex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
    },
    logoSection: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
    },
    logoWrapper: {
        padding: 4,
        background: "linear-gradient(135deg, rgba(99,102,241,0.3), rgba(6,182,212,0.3))",
        borderRadius: 22,
        boxShadow: "0 0 40px rgba(99,102,241,0.3)",
    },
    appName: {
        margin: 0,
        fontSize: 32,
        fontWeight: 800,
        background: "linear-gradient(135deg, #a5b4fc, #67e8f9)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        letterSpacing: "-0.5px",
    },
    appTagline: {
        margin: 0,
        fontSize: 14,
        color: "#64748b",
        fontWeight: 500,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
    },
    card: {
        width: "100%",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 20,
        padding: "28px 24px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
    },
    cardTitle: {
        margin: "0 0 4px",
        fontSize: 20,
        fontWeight: 700,
        color: "#e0e7ff",
    },
    cardSubtitle: {
        margin: "0 0 20px",
        fontSize: 13,
        color: "#64748b",
    },
    errorBox: {
        background: "rgba(239,68,68,0.12)",
        border: "1px solid rgba(239,68,68,0.25)",
        borderRadius: 10,
        padding: "10px 14px",
        marginBottom: 16,
        fontSize: 13,
        color: "#fca5a5",
    },
    form: {
        display: "flex",
        flexDirection: "column",
        gap: 16,
    },
    fieldGroup: {
        display: "flex",
        flexDirection: "column",
        gap: 6,
    },
    label: {
        fontSize: 12,
        fontWeight: 600,
        color: "#94a3b8",
        letterSpacing: "0.05em",
        textTransform: "uppercase",
    },
    input: {
        width: "100%",
        padding: "13px 14px",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 12,
        color: "#e2e8f0",
        fontSize: 16,
        transition: "all 0.2s",
        boxSizing: "border-box",
    },
    loginBtn: {
        width: "100%",
        padding: "14px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        border: "none",
        borderRadius: 12,
        color: "#fff",
        fontSize: 16,
        fontWeight: 700,
        letterSpacing: "0.02em",
        cursor: "pointer",
        transition: "all 0.2s",
        marginTop: 4,
        boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 50,
    },
    loadingSpinner: {
        width: 20,
        height: 20,
        border: "2px solid rgba(255,255,255,0.3)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        display: "inline-block",
        animation: "spin 0.8s linear infinite",
    },
    helpText: {
        marginTop: 16,
        fontSize: 12,
        color: "#475569",
        textAlign: "center" as const,
        lineHeight: 1.5,
    },
    installBanner: {
        width: "100%",
        background: "rgba(99,102,241,0.12)",
        border: "1px solid rgba(99,102,241,0.25)",
        borderRadius: 14,
        padding: "14px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    },
    installBtn: {
        padding: "8px 16px",
        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
        border: "none",
        borderRadius: 8,
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap" as const,
    },
    iosInstallHint: {
        padding: "4px 0",
    },
    footerText: {
        margin: 0,
        fontSize: 12,
        color: "#334155",
    },
};
