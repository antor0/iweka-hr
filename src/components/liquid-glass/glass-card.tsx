import * as React from "react"
import { cn } from "@/lib/utils"

const GlassCard = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative overflow-hidden rounded-xl border border-white/20 bg-background/60 shadow-xl backdrop-blur-xl transition-all duration-300 hover:shadow-2xl hover:border-white/30 dark:border-white/10 dark:bg-slate-900/50",
            className
        )}
        {...props}
    >
        {/* Animated gradient accent border on hover */}
        <div className="absolute inset-0 z-[-1] opacity-0 transition-opacity duration-500 hover:opacity-100 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/10" />
        {props.children}
    </div>
))
GlassCard.displayName = "GlassCard"

export { GlassCard }
