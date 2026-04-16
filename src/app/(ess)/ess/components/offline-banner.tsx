"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const update = () => setIsOffline(!navigator.onLine);
        window.addEventListener("online", update);
        window.addEventListener("offline", update);
        update();
        return () => {
            window.removeEventListener("online", update);
            window.removeEventListener("offline", update);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 bg-red-600/95 backdrop-blur-xl text-white py-3 px-6 flex items-center justify-center gap-3 text-[11px] font-black z-[9999] shadow-2xl border-b border-white/20 uppercase tracking-[0.2em] animate-in slide-in-from-top duration-500">
            <WifiOff size={16} strokeWidth={3} className="animate-pulse" />
            <span className="leading-none">Connectivity Terminated · Remote Synchronization Disabled</span>
        </div>
    );
}
