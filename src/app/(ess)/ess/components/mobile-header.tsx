"use client";

import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface MobileHeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    rightAction?: React.ReactNode;
}

export function MobileHeader({ title, subtitle, showBack, rightAction }: MobileHeaderProps) {
    const router = useRouter();
    const [scrolled, setScrolled] = useState(false);
    const [scrollAmount, setScrollAmount] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setScrolled(y > 20);
            setScrollAmount(y);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // iOS Large Title logic:
    // Threshold for full collapse is roughly 44px
    const collapseProgress = Math.min(1, Math.max(0, scrollAmount / 44));

    return (
        <div className="flex flex-col w-full relative">
            {/* Safe Area Cover — always opaque so status bar content is readable */}
            <div
                className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[101] bg-[var(--ios-system-bg)]"
                style={{ height: "env(safe-area-inset-top, 0px)" }}
            />

            {/* Navigation Bar (44px, below safe area) */}
            <div
                className={`fixed left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[100] h-[44px] transition-colors duration-300 ${
                    scrolled
                        ? "bg-[var(--ios-system-bg)]/80 backdrop-blur-xl border-b border-[var(--ios-separator)]"
                        : "bg-transparent"
                }`}
                style={{ top: "env(safe-area-inset-top, 0px)" }}
            >
                <div className="h-full flex items-center px-4 relative">
                    <div className="flex-1 flex items-center absolute left-4 z-10">
                        {showBack && (
                            <button 
                                onClick={() => router.back()}
                                className="flex items-center text-primary active:opacity-50 transition-opacity -ml-1"
                            >
                                <ChevronLeft size={28} strokeWidth={2.5} />
                                <span className="text-[17px] -ml-1 font-medium">Back</span>
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 w-full flex flex-col justify-center items-center">
                        <span className={`text-[17px] font-semibold tracking-tight transition-opacity duration-200 truncate px-12 ${
                            scrolled ? "opacity-100" : "opacity-0"
                        }`}>
                            {title}
                        </span>
                        {subtitle && scrolled && (
                            <span className={`text-[11px] font-medium text-[var(--ios-secondary-label)] -mt-0.5 tracking-tight transition-opacity duration-200 opacity-100 truncate max-w-[200px]`}>
                                {subtitle}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 flex justify-end absolute right-4 z-10">
                        {rightAction}
                    </div>
                </div>
            </div>

            {/* Spacer for Fixed Header */}
            <div style={{ height: "calc(44px + env(safe-area-inset-top))", width: "100%" }} />

            {/* Large Title Area (Inline) */}
            <div className="w-full pb-2 px-5">
                <div 
                    className="transition-all origin-left flex flex-col"
                    style={{ 
                        opacity: 1 - collapseProgress,
                        transform: `scale(${1 - collapseProgress * 0.05}) translateY(${-scrollAmount * 0.2}px)`,
                        visibility: collapseProgress === 1 ? 'hidden' : 'visible'
                    }}
                >
                    <h1 className="text-[34px] font-bold tracking-tight text-[var(--ios-label)] leading-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[13px] font-medium text-[var(--ios-secondary-label)] mt-0.5 uppercase tracking-wider">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
