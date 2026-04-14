"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Save, Loader2, Edit3, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HTMLEditor } from "@/components/ui/html-editor";
import { useToast } from "@/hooks/use-toast";

export default function SuratTemplatesPage() {
    const [templates, setTemplates] = useState<any[]>([]);
    const [activeTemplate, setActiveTemplate] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { toast } = useToast();

    const fetchTemplates = async () => {
        try {
            const res = await fetch("/api/v1/surat/templates");
            const data = await res.json();
            setTemplates(data);
            if (data.length > 0 && !activeTemplate) setActiveTemplate(data[0]);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const handleSave = async () => {
        if (!activeTemplate) return;
        setSaving(true);
        try {
            const res = await fetch(`/api/v1/surat/templates/${activeTemplate.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: activeTemplate.name,
                    type: activeTemplate.type,
                    htmlContent: activeTemplate.htmlContent,
                    numberFormat: activeTemplate.numberFormat
                })
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Save failed");
            }

            fetchTemplates();
            toast({
                title: "Template Saved",
                description: "The surat template has been updated successfully.",
            });
        } catch (error: any) {
            console.error("Save failed", error);
            toast({
                title: "Error Saving",
                description: error.message || "Failed to update template. Please check your connection.",
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
            <Link 
                href="/settings" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
            </Link>
            <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                    <FileText className="w-6 h-6 text-primary" /> Surat Templates
                </h1>
                <p className="text-sm text-muted-foreground mt-1">Manage official company letter formats and numbering structure</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="md:col-span-1 glass h-fit">
                    <CardHeader className="pb-3 border-b border-white/5">
                        <CardTitle className="text-sm">Available Types</CardTitle>
                    </CardHeader>
                    <CardContent className="p-2">
                        <div className="flex flex-col gap-1 max-h-[600px] overflow-y-auto pr-2">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTemplate(t)}
                                    className={`text-left p-2.5 rounded-lg text-sm transition-colors border ${activeTemplate?.id === t.id ? 'bg-primary/20 border-primary/50 text-primary' : 'border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}
                                >
                                    <div className="font-semibold line-clamp-1">{t.name}</div>
                                    <div className="text-[10px] mt-1 opacity-70 font-mono tracking-wider">{t.type}</div>
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card className="md:col-span-3 glass">
                    {activeTemplate ? (
                        <div className="flex flex-col h-full">
                            <CardHeader className="flex flex-row items-start justify-between border-b border-white/5 pb-4">
                                <div>
                                    <CardTitle>Template Setup</CardTitle>
                                    <p className="text-xs text-muted-foreground mt-1">Configure layout and formatting for {activeTemplate.name}</p>
                                </div>
                                <Button onClick={handleSave} disabled={saving} size="sm">
                                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                    Save Changes
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label>Template Display Name</Label>
                                    <Input value={activeTemplate.name} onChange={e => setActiveTemplate({...activeTemplate, name: e.target.value})} />
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Numbering Format</Label>
                                    <div className="flex gap-2">
                                        <Input className="font-mono text-sm" value={activeTemplate.numberFormat} onChange={e => setActiveTemplate({...activeTemplate, numberFormat: e.target.value})} />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Variables: {`{{seq}} => Sequence, {{month}} => Roman Month (I-XII), {{year}} => 2026`}</p>
                                </div>

                                <div className="space-y-2 flex-1 flex flex-col">
                                    <Label className="flex justify-between">
                                        <span>Template Content Editor</span>
                                        <Badge variant="outline" className="text-[10px]">Rich Text + Variables Support</Badge>
                                    </Label>
                                    <HTMLEditor 
                                        value={activeTemplate.htmlContent} 
                                        onChange={html => setActiveTemplate({...activeTemplate, htmlContent: html})} 
                                        className="min-h-[500px]"
                                    />
                                </div>
                            </CardContent>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-muted-foreground">
                            <Edit3 className="w-12 h-12 text-white/10 mx-auto mb-4" />
                            <p>Select a template to begin editing.</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
