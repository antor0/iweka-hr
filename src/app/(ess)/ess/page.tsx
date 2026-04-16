"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
    LogIn,
    AlertCircle,
    WifiOff,
    Smartphone,
    Download,
    Share
} from "lucide-react";
import { OfflineBanner } from "./components/offline-banner";

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
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(console.error);
        }

        const updateOnlineStatus = () => setIsOffline(!navigator.onLine);
        window.addEventListener("online", updateOnlineStatus);
        window.addEventListener("offline", updateOnlineStatus);
        setIsOffline(!navigator.onLine);

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
            setError("Please enter your Employee ID and PIN");
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
                setError(data.error || "Login failed");
                return;
            }

            if (data.pinMustChange) {
                router.push("/ess/settings?first=true");
            } else {
                router.push("/ess/home");
            }
        } catch {
            setError("Could not connect to the server");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center font-sans pb-10">
            <OfflineBanner />

            <div className="w-full flex flex-col items-stretch gap-10 animate-in fade-in zoom-in-95 duration-700 mt-4 sm:mt-8">
                {/* Brand Section */}
                <div className="flex flex-col items-center text-center gap-4 px-6">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-xl p-1 relative overflow-hidden ring-1 ring-black/5">
                        <Image
                            src="/icons/icon-192x192.png"
                            alt="DigiHR+"
                            width={80}
                            height={80}
                            className="rounded-[22px]"
                            priority
                        />
                    </div>
                    <div>
                        <h1 className="text-[34px] font-bold text-[var(--ios-label)] tracking-tight">Mobile DigiHR+</h1>
                        <p className="text-[17px] text-[var(--ios-secondary-label)] font-medium">Employee Self Service</p>
                    </div>
                </div>

                {/* Login Inputs Group */}
                <div className="flex flex-col gap-8">
                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-4 flex items-center gap-3 text-[13px] text-destructive font-bold animate-in slide-in-from-top-4">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="flex flex-col w-full">
                        <div className="ios-list-group mt-0 mb-6">
                            <div className="ios-list-content">
                                <div className="ios-cell flex flex-col items-center gap-0.5 py-2.5">
                                    <label className="text-[12px] font-medium text-[var(--ios-secondary-label)] text-center w-full">Employee ID</label>
                                    <input
                                        id="employee-number"
                                        type="text"
                                        placeholder="EMP-XXXX"
                                        value={employeeNumber}
                                        onChange={(e) => setEmployeeNumber(e.target.value)}
                                        className="w-full bg-transparent text-[17px] font-normal text-[var(--ios-label)] focus:outline-none py-1 text-center"
                                        autoComplete="username"
                                        autoCapitalize="characters"
                                        disabled={isLoading}
                                    />
                                </div>
                                <div className="ios-cell flex flex-col items-center gap-0.5 py-2.5">
                                    <label className="text-[12px] font-medium text-[var(--ios-secondary-label)] text-center w-full">Access PIN</label>
                                    <input
                                        id="pin-input"
                                        type="password"
                                        inputMode="numeric"
                                        placeholder="••••••"
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                        className="w-full bg-transparent text-[24px] font-bold text-[var(--ios-label)] tracking-[0.4em] focus:outline-none py-1 font-mono text-center"
                                        autoComplete="current-password"
                                        maxLength={6}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-5 pb-6">
                            <button
                                id="login-button"
                                type="submit"
                                disabled={isLoading || isOffline}
                                className="w-full py-4.5 bg-primary text-primary-foreground rounded-2xl text-[17px] font-bold shadow-lg shadow-primary/20 active:opacity-80 transition-all disabled:opacity-50 min-h-[56px] flex items-center justify-center relative overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/20 opacity-0 active:opacity-100 transition-opacity"></div>
                                {isLoading ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : "Sign In"}
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-[13px] text-[var(--ios-secondary-label)] font-medium leading-tight px-4 opacity-60">
                        Authorized Access Only. Use your corporate credentials to sign in.
                    </p>
                </div>

                {/* Install Instructions for iOS / PWA */}
                <div className="mt-2 flex flex-col gap-6 px-4">
                    {showInstall ? (
                        <div className="bg-[var(--ios-secondary-bg)] rounded-3xl p-4 border border-[var(--ios-separator)] flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <p className="text-[15px] font-bold text-[var(--ios-label)]">Install App</p>
                                    <p className="text-[12px] text-[var(--ios-secondary-label)]">Quick access from home</p>
                                </div>
                            </div>
                            <button
                                onClick={handleInstall}
                                className="bg-primary hover:bg-primary/90 text-white text-[13px] font-bold px-4 py-2 rounded-xl transition-colors shadow-sm"
                            >
                                Install
                            </button>
                        </div>
                    ) : (
                        <div className="text-center px-4 mb-4">
                            <p className="text-[12px] text-[var(--ios-secondary-label)] font-medium leading-relaxed bg-[var(--ios-secondary-bg)]/50 py-3 px-4 rounded-2xl">
                                On iOS, tap <Share className="inline-block w-4 h-4 text-primary mb-[2px] mx-1" /> and then <span className="text-[var(--ios-label)] font-bold">"Add to Home Screen"</span> for the native app experience.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
