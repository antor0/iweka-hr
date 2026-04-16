"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { 
    LogIn, 
    AlertCircle, 
    WifiOff, 
    Smartphone, 
    ShieldCheck, 
    Key, 
    Plus,
    Download
} from "lucide-react";

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
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative bg-transparent overflow-hidden font-sans">
            {/* Offline banner */}
            {isOffline && (
                <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-3 flex items-center justify-center gap-2 text-xs font-black z-[100] backdrop-blur-md animate-in slide-in-from-top duration-300 uppercase tracking-widest">
                    <WifiOff size={14} strokeWidth={2.5} />
                    <span>System Offline — Remote access limited</span>
                </div>
            )}

            <div className="w-full max-w-[400px] flex flex-col items-center gap-8 relative z-10 animate-in fade-in zoom-in-95 duration-700">
                {/* Logo Section */}
                <div className="flex flex-col items-center gap-4 text-center">
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-cyan-500/30 rounded-[36px] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
                        <div className="relative p-3 bg-gradient-to-br from-primary/30 to-cyan-500/30 rounded-[32px] shadow-2xl backdrop-blur-2xl border border-white/20">
                            <Image
                                src="/icons/icon-192x192.png"
                                alt="MyHRIS"
                                width={80}
                                height={80}
                                className="rounded-[24px] shadow-lg"
                                priority
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 mt-2">
                        <h1 className="text-5xl font-black bg-gradient-to-br from-primary via-indigo-500 to-cyan-400 bg-clip-text text-transparent tracking-tighter leading-none pb-2">MyHRIS</h1>
                        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground font-black opacity-60">Professional Portal</p>
                    </div>
                </div>

                {/* Login Card */}
                <div className="glass w-full rounded-[48px] p-9 shadow-2xl border-t border-white/10 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    
                    <div className="mb-8">
                        <h2 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                            Secure Login
                        </h2>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1.5 opacity-60">Authorized personnel only</p>
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-[11px] text-red-500 mb-7 font-black uppercase tracking-widest flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-300">
                            <AlertCircle size={14} strokeWidth={3} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="flex flex-col gap-7">
                        <div className="flex flex-col gap-2.5">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60 ml-2">Employee Identifier</label>
                            <input
                                id="employee-number"
                                type="text"
                                placeholder="e.g. EMP-0001"
                                value={employeeNumber}
                                onChange={(e) => setEmployeeNumber(e.target.value)}
                                className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-4.5 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-sans"
                                autoComplete="username"
                                autoCapitalize="characters"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-muted-foreground/60 ml-2">Access PIN</label>
                            <input
                                id="pin-input"
                                type="password"
                                inputMode="numeric"
                                placeholder="••••••"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                                className="w-full bg-muted/30 border border-border/50 rounded-2xl px-6 py-4.5 text-foreground font-black tracking-[0.8em] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all font-mono text-center text-xl"
                                autoComplete="current-password"
                                maxLength={6}
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            id="login-button"
                            type="submit"
                            disabled={isLoading || isOffline}
                            className="w-full mt-2 py-5 bg-gradient-to-r from-primary to-indigo-600 rounded-[24px] text-white font-black text-base uppercase tracking-[0.15em] shadow-xl shadow-primary/30 disabled:opacity-50 disabled:grayscale transition-all active:scale-[0.98] flex items-center justify-center gap-3 min-h-[64px]"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><LogIn size={20} strokeWidth={3} /> Authentication</>
                            )}
                        </button>
                    </form>

                    <div className="mt-9 pt-7 border-t border-border/50 text-center">
                        <p className="text-[10px] text-muted-foreground/60 font-medium leading-relaxed uppercase tracking-widest">
                            Initial PIN: <strong className="text-primary font-black">123456</strong>
                            <br /><span className="opacity-70">Mandatory rotation required upon first access.</span>
                        </p>
                    </div>
                </div>

                {/* Install PWA Banner */}
                {showInstall && (
                    <div className="w-full glass rounded-[32px] p-5 flex justify-between items-center border-primary/20 shadow-2xl shadow-primary/5 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Smartphone size={22} strokeWidth={2.5} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-foreground tracking-tight uppercase">Native App Access</p>
                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-60">Add to your workspace</p>
                            </div>
                        </div>
                        <button
                            id="install-pwa-button"
                            onClick={handleInstall}
                            className="h-11 px-6 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center gap-2"
                        >
                            <Download size={14} strokeWidth={3} /> Install
                        </button>
                    </div>
                )}

                {/* iOS Instructions */}
                <div className="px-8 text-center">
                    <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-bold uppercase tracking-tight">
                        On iOS: Select <span className="text-primary inline-flex items-center align-middle mx-1.5"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" strokeWidth="2.5"><path d="M12 2L8 6h3v8h2V6h3L12 2zm-8 11v7h16v-7h-2v5H6v-5H4z" /></svg></span> then activate <strong className="text-foreground tracking-widest">Add to Home Screen</strong>
                    </p>
                </div>

                <div className="flex items-center gap-2 py-4">
                    <ShieldCheck size={12} className="text-muted-foreground opacity-30" />
                    <p className="text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.3em]">Corporate Framework v1.0.0</p>
                </div>
            </div>
        </div>
    );
}

