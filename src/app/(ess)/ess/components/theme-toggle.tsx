"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Laptop, Monitor } from "lucide-react";

export function EssThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const options = [
        { id: "light", icon: (active: boolean) => <Sun size={16} strokeWidth={active ? 3 : 2.5} />, label: "Light" },
        { id: "dark", icon: (active: boolean) => <Moon size={16} strokeWidth={active ? 3 : 2.5} />, label: "Dark" },
        { id: "system", icon: (active: boolean) => <Monitor size={16} strokeWidth={active ? 3 : 2.5} />, label: "System" },
    ];

    return (
        <div className="flex gap-2 p-1.5 bg-muted/20 border border-white/5 rounded-2xl backdrop-blur-xl shadow-inner">
            {options.map((opt) => {
                const isActive = theme === opt.id;
                return (
                    <button
                        key={opt.id}
                        onClick={() => setTheme(opt.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 relative overflow-hidden group ${
                            isActive
                                ? "bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]"
                                : "text-muted-foreground/60 hover:bg-muted/30"
                        }`}
                    >
                        {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        )}
                        {opt.icon(isActive)}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? "opacity-100" : "opacity-60"}`}>{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
