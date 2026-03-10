"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassStatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    trend?: {
        value: number;
        label: string;
    };
    accentColor?: "primary" | "accent" | "success" | "warning" | "destructive";
    className?: string;
}

const accentColors = {
    primary: {
        bg: "from-primary/20 to-primary/5",
        icon: "bg-primary/10 text-primary",
        trend: "text-primary",
    },
    accent: {
        bg: "from-accent/20 to-accent/5",
        icon: "bg-accent/10 text-accent",
        trend: "text-accent",
    },
    success: {
        bg: "from-success/20 to-success/5",
        icon: "bg-success/10 text-success",
        trend: "text-success",
    },
    warning: {
        bg: "from-warning/20 to-warning/5",
        icon: "bg-warning/10 text-warning",
        trend: "text-warning",
    },
    destructive: {
        bg: "from-destructive/20 to-destructive/5",
        icon: "bg-destructive/10 text-destructive",
        trend: "text-destructive",
    },
};

export function GlassStatCard({
    title,
    value,
    subtitle,
    icon,
    trend,
    accentColor = "primary",
    className,
}: GlassStatCardProps) {
    const colors = accentColors[accentColor];

    return (
        <div
            className={cn(
                "glass glass-hover rounded-2xl p-5 relative overflow-hidden group cursor-default transition-all duration-300",
                className
            )}
        >
            {/* Gradient accent overlay */}
            <div
                className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                    colors.bg
                )}
            />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-muted-foreground">
                        {title}
                    </span>
                    <div
                        className={cn(
                            "p-2 rounded-xl transition-transform duration-300 group-hover:scale-110",
                            colors.icon
                        )}
                    >
                        {icon}
                    </div>
                </div>

                <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold tracking-tight text-foreground animate-counter">
                        {value}
                    </span>
                    {trend && (
                        <span
                            className={cn(
                                "text-xs font-medium mb-1 flex items-center gap-0.5",
                                trend.value >= 0 ? "text-success" : "text-destructive"
                            )}
                        >
                            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
                        </span>
                    )}
                </div>

                {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
