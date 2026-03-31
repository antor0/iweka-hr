"use client";

import { useEffect, useState } from "react";

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
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            background: "rgba(245,158,11,0.95)",
            backdropFilter: "blur(8px)",
            color: "#78350f",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 13,
            fontWeight: 600,
            zIndex: 9999,
            justifyContent: "center",
        }}>
            <span>📡</span>
            <span>No internet connection. Some features may be unavailable.</span>
        </div>
    );
}
