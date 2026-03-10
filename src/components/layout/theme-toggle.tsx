"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="rounded-xl">
                <Sun className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="rounded-xl relative overflow-hidden"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
            <Sun
                className={`h-4 w-4 transition-all duration-300 ${theme === "dark"
                        ? "rotate-90 scale-0 opacity-0"
                        : "rotate-0 scale-100 opacity-100"
                    }`}
            />
            <Moon
                className={`h-4 w-4 absolute transition-all duration-300 ${theme === "dark"
                        ? "rotate-0 scale-100 opacity-100"
                        : "-rotate-90 scale-0 opacity-0"
                    }`}
            />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
