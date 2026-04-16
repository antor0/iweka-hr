"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BackgroundOrbs } from "@/components/liquid-glass/background-orbs";
import { Lock, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;

        try {
            const res = await fetch("/api/v1/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Login failed");
            }

            // Success -> redirect
            router.push("/dashboard");
            router.refresh(); // Force refresh to apply server components auth state
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative p-4">
            <BackgroundOrbs />
            <div className="w-full max-w-md relative z-10 animate-slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white font-bold text-2xl mb-4 shadow-lg">
                        HR
                    </div>
                    <h1 className="text-2xl font-bold text-foreground">DigiHR+</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Log in to the HR management system
                    </p>
                </div>

                {/* Login Card */}
                <div className="glass-lg glass-gradient-border rounded-2xl p-8">
                    {error && (
                        <div className="mb-4 p-3 bg-destructive/15 text-destructive border border-destructive/20 rounded-md text-sm text-center">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="email"
                                    name="email"
                                    placeholder="name@company.co.id"
                                    className="pl-10"
                                    defaultValue="andiko@company.co.id"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="••••••••"
                                    className="pl-10 pr-10"
                                    defaultValue="password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                                <input type="checkbox" className="rounded" defaultChecked />
                                Remember me
                            </label>
                            <a href="#" className="text-primary hover:underline">Forgot password?</a>
                        </div>

                        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                            {isLoading ? "Logging in..." : "Login"}
                        </Button>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground mt-6">
                    © 2026 DigiHR+ — PT. Indowebhost Kreasi
                </p>
            </div>
        </div>
    );
}
