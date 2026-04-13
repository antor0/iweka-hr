"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Printer, FileText, Loader2, Calendar } from "lucide-react";

export function SuratHistoryTab({ employeeId }: { employeeId: string }) {
    const [history, setHistory] = useState<any[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isOpen, setIsOpen] = useState(false);
    const [formData, setFormData] = useState({ templateId: "", reason: "" });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [hisRes, tplRes] = await Promise.all([
                fetch(`/api/v1/employees/${employeeId}/surat`),
                fetch("/api/v1/surat/templates")
            ]);
            setHistory(await hisRes.json());
            setTemplates(await tplRes.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [employeeId]);

    const handleGenerate = async () => {
        if (!formData.templateId || !formData.reason) return;
        setLoading(true);
        await fetch(`/api/v1/employees/${employeeId}/surat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData)
        });
        setIsOpen(false);
        setFormData({ templateId: "", reason: "" });
        fetchData();
    };

    const handlePrint = (html: string) => {
        const win = window.open("", "_blank");
        if (!win) return;
        win.document.write(`
            <html>
                <head>
                    <title>Print Surat</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; padding: 0; }
                            @page { margin: 20mm; }
                        }
                    </style>
                </head>
                <body>${html}</body>
            </html>
        `);
        win.document.close();
        win.onload = () => { win.print(); };
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-white/5">
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-400" /> Surat & Letters
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Issue official company letters to this employee</p>
                </div>
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="w-4 h-4 mr-2" />Issue Surat</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Generate New Surat</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Select Template</Label>
                                <Select value={formData.templateId} onValueChange={v => setFormData({...formData, templateId: v})}>
                                    <SelectTrigger><SelectValue placeholder="Choose type" /></SelectTrigger>
                                    <SelectContent>
                                        {templates.map(t => (
                                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Reason / Notes</Label>
                                <Input value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="e.g. Absen 3 hari tanpa keterangan" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                            <Button onClick={handleGenerate}>Generate & Save</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="space-y-3">
                {history.map((record) => (
                    <Card key={record.id} className="glass glass-hover">
                        <CardContent className="p-4 sm:flex items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-lg shrink-0 hidden sm:block">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-semibold text-foreground text-base">{record.template?.name || "Official Letter"}</h4>
                                        <Badge variant="outline" className="text-[10px] bg-background">{record.suratNumber}</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1">{record.notes}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                                        <Calendar className="w-3.5 h-3.5" />
                                        <span>Issued on: {new Date(record.issuedDate).toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 sm:mt-0 flex shrink-0">
                                <Button variant="secondary" size="sm" onClick={() => handlePrint(record.renderedData?.html)}>
                                    <Printer className="w-4 h-4 mr-2" /> Print / PDF
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            
            {history.length === 0 && (
                <div className="text-center p-12 bg-black/10 rounded-xl border border-white/5 border-dashed">
                    <FileText className="w-10 h-10 text-white/20 mx-auto mb-3" />
                    <p className="text-muted-foreground">No surat history recorded.</p>
                </div>
            )}
        </div>
    );
}