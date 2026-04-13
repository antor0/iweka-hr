"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, Loader2, Save, Send, CheckCircle2, AlertCircle, Settings, ArrowLeft } from "lucide-react";

export default function EmailSettingsPage() {
    const [config, setConfig] = useState({
        smtpHost: "",
        smtpPort: 587,
        smtpUser: "",
        smtpPass: "",
        fromName: "HRIS System",
        fromEmail: "",
        isActive: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testEmail, setTestEmail] = useState("");
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ type: "success" | "error"; msg: string } | null>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const res = await fetch("/api/v1/settings/email");
                if (res.ok) {
                    const data = await res.json();
                    if (data) setConfig(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch("/api/v1/settings/email", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...config, smtpPort: Number(config.smtpPort) }),
            });
            if (res.ok) {
                setTestResult({ type: "success", msg: "Configuration saved successfully." });
            } else {
                const err = await res.json();
                setTestResult({ type: "error", msg: err.error || "Save failed." });
            }
        } catch (e: any) {
            setTestResult({ type: "error", msg: e.message });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        if (!testEmail) return;
        setTesting(true);
        setTestResult(null);
        try {
            const res = await fetch("/api/v1/settings/email/test", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ to: testEmail }),
            });
            const data = await res.json();
            if (data.success) {
                setTestResult({ type: "success", msg: `Test email sent successfully! (ID: ${data.messageId})` });
            } else {
                setTestResult({ type: "error", msg: data.error || "Failed to send test email." });
            }
        } catch (e: any) {
            setTestResult({ type: "error", msg: e.message });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
            <Link 
                href="/settings" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <Settings className="w-6 h-6 text-primary" /> Email Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Configure SMTP settings for system notifications and alerts</p>
            </div>

            <Card className="glass">
                <CardHeader className="border-b border-white/5">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Mail className="w-5 h-5 text-blue-400" /> SMTP Configuration
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>SMTP Host</Label>
                            <Input
                                value={config.smtpHost}
                                onChange={e => setConfig({ ...config, smtpHost: e.target.value })}
                                placeholder="smtp.gmail.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>SMTP Port</Label>
                            <Input
                                type="number"
                                value={config.smtpPort}
                                onChange={e => setConfig({ ...config, smtpPort: Number(e.target.value) })}
                                placeholder="465 or 587"
                            />
                            <p className="text-xs text-muted-foreground">
                                Use 465 for SSL (secure), 587 for TLS (STARTTLS)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Username / Email</Label>
                            <Input
                                value={config.smtpUser}
                                onChange={e => setConfig({ ...config, smtpUser: e.target.value })}
                                placeholder="user@gmail.com"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Password / App Password</Label>
                            <Input
                                type="password"
                                value={config.smtpPass}
                                onChange={e => setConfig({ ...config, smtpPass: e.target.value })}
                                placeholder="••••••••••"
                            />
                        </div>
                    </div>

                    <div className="border-t border-white/5 pt-5 grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Sender Name</Label>
                            <Input
                                value={config.fromName}
                                onChange={e => setConfig({ ...config, fromName: e.target.value })}
                                placeholder="HRIS System"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Sender Email</Label>
                            <Input
                                value={config.fromEmail}
                                onChange={e => setConfig({ ...config, fromEmail: e.target.value })}
                                placeholder="noreply@company.com"
                            />
                        </div>
                    </div>

                    {testResult && (
                        <div className={`flex items-start gap-3 p-4 rounded-lg border text-sm ${testResult.type === "success" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                            {testResult.type === "success"
                                ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                                : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                            {testResult.msg}
                        </div>
                    )}

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving}>
                            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Configuration
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass">
                <CardHeader className="border-b border-white/5">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Send className="w-5 h-5 text-indigo-400" /> Test Email
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <p className="text-sm text-muted-foreground mb-4">
                        Send a test email to verify your SMTP configuration is working correctly.
                    </p>
                    <div className="flex gap-3">
                        <Input
                            type="email"
                            value={testEmail}
                            onChange={e => setTestEmail(e.target.value)}
                            placeholder="recipient@example.com"
                            className="max-w-xs"
                        />
                        <Button variant="secondary" onClick={handleTest} disabled={testing || !testEmail}>
                            {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                            Send Test
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
