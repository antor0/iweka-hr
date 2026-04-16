"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

export function EssThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const options = [
        { id: "light", icon: Sun, label: "Light" },
        { id: "dark", icon: Moon, label: "Dark" },
        { id: "system", icon: Monitor, label: "System" },
    ];

    return (
        <div className="flex gap-0.5 p-1 bg-[var(--ios-separator)]/40 rounded-[12px]">
            {options.map((opt) => {
                const isActive = theme === opt.id;
                const Icon = opt.icon;
                return (
                    <button
                        key={opt.id}
                        id={`theme-${opt.id}`}
                        onClick={() => setTheme(opt.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[9px] text-[13px] font-semibold transition-all duration-200 ${
                            isActive
                                ? "bg-[var(--ios-secondary-bg)] text-[var(--ios-label)] shadow-sm"
                                : "text-[var(--ios-secondary-label)]"
                        }`}
                    >
                        <Icon size={14} strokeWidth={isActive ? 2.5 : 2} />
                        <span>{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
