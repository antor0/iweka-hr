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
    const collapseProgress = Math.min(1, scrollAmount / 44);
    const titleOpacity = Math.max(0, (scrollAmount - 20) / 24);

    return (
        <div className="flex flex-col w-full relative">
            {/* Top Navigation Bar (Sticky) */}
            <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[100] h-[44px] transition-all duration-300 ${
                scrolled ? "bg-background/80 backdrop-blur-xl border-b border-[var(--ios-separator)]" : "bg-transparent"
            }`}>
                <div className="h-full flex items-center px-4">
                    <div className="flex-1 flex items-center">
                        {showBack && (
                            <button 
                                onClick={() => router.back()}
                                className="flex items-center text-primary active:opacity-50 transition-opacity -ml-1"
                            >
                                <ChevronLeft size={24} strokeWidth={2.5} />
                                <span className="text-[17px] -ml-1">Back</span>
                            </button>
                        )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <span className={`text-[17px] font-semibold tracking-tight transition-opacity duration-200 ${
                            scrolled ? "opacity-100" : "opacity-0"
                        }`}>
                            {title}
                        </span>
                        {subtitle && scrolled && (
                            <span className={`text-[11px] font-medium text-[var(--ios-secondary-label)] -mt-0.5 tracking-tight transition-opacity duration-200 opacity-100`}>
                                {subtitle}
                            </span>
                        )}
                    </div>

                    <div className="flex-1 flex justify-end">
                        {rightAction}
                    </div>
                </div>
            </div>

            {/* Large Title Area (Inline) */}
            <div className="w-full pt-[44px] pb-2 px-5">
                <div 
                    className="transition-all origin-left flex flex-col"
                    style={{ 
                        opacity: 1 - collapseProgress,
                        transform: `scale(${1 - collapseProgress * 0.1}) translateY(${-scrollAmount * 0.2}px)`,
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
