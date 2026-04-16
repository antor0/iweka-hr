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
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#FF3B30] text-white py-2 px-4 flex items-center justify-center gap-2 text-[13px] font-semibold z-[9999] shadow-md border-b border-white/10 animate-in slide-in-from-top duration-500">
            <WifiOff size={16} strokeWidth={2.5} />
            <span>Connection Lost</span>
        </div>
    );
}
