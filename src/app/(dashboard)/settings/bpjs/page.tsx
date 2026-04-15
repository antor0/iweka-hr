"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Settings, Loader2, ArrowLeft, HeartPulse, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const JKK_RISK_GROUPS = [
    { label: "Level 1 (Sangat Rendah) - 0.24%", value: 0.0024 },
    { label: "Level 2 (Rendah) - 0.54%", value: 0.0054 },
    { label: "Level 3 (Sedang) - 0.89%", value: 0.0089 },
    { label: "Level 4 (Tinggi) - 1.27%", value: 0.0127 },
    { label: "Level 5 (Sangat Tinggi) - 1.74%", value: 0.0174 },
];

export default function BPJSConfigSettingsPage() {
    const [configHistory, setConfigHistory] = useState<any[]>([]);
    const [activeConfig, setActiveConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/settings/bpjs?history=true`);
            if (res.ok) {
                const json = await res.json();
                setConfigHistory(json.data);
                const active = json.data.find((c: any) => c.isActive);
                if (active) {
                    setActiveConfig({
                        ...active,
                        effectiveDate: new Date(active.effectiveDate).toISOString().split('T')[0],
                    });
                } else if (json.data.length > 0) {
                     setActiveConfig({
                         ...json.data[0],
                         effectiveDate: new Date().toISOString().split('T')[0],
                     })
                } else {
                     setActiveConfig({
                        effectiveDate: new Date().toISOString().split('T')[0],
                        kesEmployeeRate: 0.01,
                        kesCompanyRate: 0.04,
                        kesSalaryCap: 12000000,
                        jhtEmployeeRate: 0.02,
                        jhtCompanyRate: 0.037,
                        jkkCompanyRate: 0.0054,
                        jkmCompanyRate: 0.003,
                        jpEmployeeRate: 0.01,
                        jpCompanyRate: 0.02,
                        jpSalaryCap: 10042300,
                     })
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        
        try {
            // Find if there is an existing config with the Exact same effective date
            const existingWithSameDate = configHistory.find(c => 
                 new Date(c.effectiveDate).toISOString().split('T')[0] === activeConfig.effectiveDate
            );

            // POST to create a newly effective config, PUT to update the current one.
            const method = "POST";
            const url = "/api/v1/settings/bpjs";
            // Wait, we should probably just ALWAYS POST if effective date is different, 
            // OR if it's the exact same day, we could PUT.
            // But let's just POST to create a new config with the new effective date.
            
            const reqBody = {
                 ...activeConfig,
                 id: undefined, // remove id so POST works
                 endDate: undefined,
                 createdAt: undefined,
                 updatedAt: undefined
            };

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(reqBody),
            });
            
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Failed to save config");
            }
            
            toast({
                title: "Settings Saved",
                description: "BPJS configuration has been successfully updated.",
            });
            fetchConfigs();
        } catch (error: any) {
             toast({
                title: "Error",
                description: error.message || "Failed to save BPJS configuration.",
                variant: "destructive",
             });
        } finally {
            setIsSaving(false);
        }
    };

    // helper to format numbers to percentages
    const formatPercent = (val: number) => (val * 100).toFixed(2);
    
    // helper to set percentage from input to decimal
    const handlePercentChange = (field: string, val: string) => {
         const num = parseFloat(val);
         if (!isNaN(num)) {
             setActiveConfig({ ...activeConfig, [field]: num / 100 });
         } else {
             setActiveConfig({ ...activeConfig, [field]: 0 });
         }
    };

    if (loading) {
       return (
            <div className="flex justify-center p-8">
                 <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
       )
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
            <Link 
                href="/settings" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Settings
            </Link>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                        <HeartPulse className="w-6 h-6 text-emerald-500" /> BPJS Configuration
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage Health and Employment BPJS rates and caps</p>
                </div>
            </div>

            <Card className="glass">
                <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-base flex items-center justify-between">
                         Active BPJS Rates
                         {activeConfig?.isActive && <Badge variant="success">Active</Badge>}
                    </CardTitle>
                    <CardDescription>
                         Update rates or set a new effective date to create a new config version. Rates should be entered as percentages (e.g., 4 = 4%).
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label>Effective Date</Label>
                            <Input 
                                type="date" 
                                value={activeConfig?.effectiveDate || ""} 
                                onChange={(e) => setActiveConfig({...activeConfig, effectiveDate: e.target.value})} 
                            />
                        </div>
                    </div>
                    
                    {/* Health BPJS */}
                    <div className="space-y-4">
                         <h3 className="font-semibold text-sm border-b pb-2 text-primary">Health BPJS (Kesehatan)</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className="space-y-2">
                                 <Label>Employee Rate (%)</Label>
                                 <Input type="number" step="0.01" value={formatPercent(activeConfig?.kesEmployeeRate)} onChange={(e) => handlePercentChange('kesEmployeeRate', e.target.value)} />
                             </div>
                             <div className="space-y-2">
                                 <Label>Company Rate (%)</Label>
                                 <Input type="number" step="0.01" value={formatPercent(activeConfig?.kesCompanyRate)} onChange={(e) => handlePercentChange('kesCompanyRate', e.target.value)} />
                             </div>
                             <div className="space-y-2">
                                 <Label>Salary Cap (IDR)</Label>
                                 <Input type="number" value={activeConfig?.kesSalaryCap} onChange={(e) => setActiveConfig({...activeConfig, kesSalaryCap: parseFloat(e.target.value) || 0})} />
                             </div>
                         </div>
                    </div>

                    {/* Employment BPJS */}
                    <div className="space-y-4">
                         <h3 className="font-semibold text-sm border-b pb-2 text-primary">Employment BPJS (Ketenagakerjaan)</h3>
                         
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                             <div className="space-y-4 bg-secondary/20 p-4 rounded-xl border border-border/30">
                                 <h4 className="text-sm font-medium">JHT (Old Age)</h4>
                                 <div className="space-y-2">
                                     <Label className="text-xs">Employee Rate (%)</Label>
                                     <Input type="number" step="0.01" value={formatPercent(activeConfig?.jhtEmployeeRate)} onChange={(e) => handlePercentChange('jhtEmployeeRate', e.target.value)} />
                                 </div>
                                  <div className="space-y-2">
                                     <Label className="text-xs">Company Rate (%)</Label>
                                     <Input type="number" step="0.01" value={formatPercent(activeConfig?.jhtCompanyRate)} onChange={(e) => handlePercentChange('jhtCompanyRate', e.target.value)} />
                                 </div>
                             </div>

                             <div className="space-y-4 bg-secondary/20 p-4 rounded-xl border border-border/30">
                                 <h4 className="text-sm font-medium">JP (Pension)</h4>
                                 <div className="space-y-2">
                                     <Label className="text-xs">Employee Rate (%)</Label>
                                     <Input type="number" step="0.01" value={formatPercent(activeConfig?.jpEmployeeRate)} onChange={(e) => handlePercentChange('jpEmployeeRate', e.target.value)} />
                                 </div>
                                  <div className="space-y-2">
                                     <Label className="text-xs">Company Rate (%)</Label>
                                     <Input type="number" step="0.01" value={formatPercent(activeConfig?.jpCompanyRate)} onChange={(e) => handlePercentChange('jpCompanyRate', e.target.value)} />
                                 </div>
                                 <div className="space-y-2">
                                     <Label className="text-xs">Salary Cap (IDR)</Label>
                                     <Input type="number" value={activeConfig?.jpSalaryCap} onChange={(e) => setActiveConfig({...activeConfig, jpSalaryCap: parseFloat(e.target.value) || 0})} />
                                 </div>
                             </div>

                             <div className="space-y-4 bg-secondary/20 p-4 rounded-xl border border-border/30">
                                 <h4 className="text-sm font-medium">JKM (Death)</h4>
                                 <div className="space-y-2">
                                     <Label className="text-xs text-muted-foreground line-through">Employee Rate</Label>
                                     <Input disabled value="0%" />
                                 </div>
                                  <div className="space-y-2">
                                     <Label className="text-xs">Company Rate (%)</Label>
                                     <Input type="number" step="0.01" value={formatPercent(activeConfig?.jkmCompanyRate)} onChange={(e) => handlePercentChange('jkmCompanyRate', e.target.value)} />
                                 </div>
                             </div>

                              <div className="space-y-4 bg-secondary/20 p-4 rounded-xl border border-border/30">
                                 <h4 className="text-sm font-medium">JKK (Work Accident)</h4>
                                 <div className="space-y-2">
                                     <Label className="text-xs text-muted-foreground line-through">Employee Rate</Label>
                                     <Input disabled value="0%" />
                                 </div>
                                  <div className="space-y-2">
                                     <Label className="text-xs">Risk Group</Label>
                                     <select 
                                         className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                         value={activeConfig?.jkkCompanyRate || 0.0054}
                                         onChange={(e) => setActiveConfig({...activeConfig, jkkCompanyRate: parseFloat(e.target.value)})}
                                     >
                                         {JKK_RISK_GROUPS.map(rg => (
                                              <option key={rg.value} value={rg.value}>{rg.label}</option>
                                         ))}
                                     </select>
                                 </div>
                                  <div className="space-y-2">
                                     <Label className="text-xs">Company Rate (%)</Label>
                                     <Input disabled value={formatPercent(activeConfig?.jkkCompanyRate)} />
                                 </div>
                             </div>
                         </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-border/50">
                         <Button onClick={handleSave} disabled={isSaving}>
                              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Configuration
                         </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="glass">
                <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                         <History className="w-5 h-5 text-muted-foreground" /> Config History
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Effective Date</th>
                                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">End Date</th>
                                    <th className="py-3 px-4 text-right font-medium text-muted-foreground">Kes (Emp/Comp)</th>
                                    <th className="py-3 px-4 text-right font-medium text-muted-foreground">JHT (Emp/Comp)</th>
                                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {configHistory.map((h, idx) => (
                                      <tr key={h.id || idx} className="border-b last:border-b-0 hover:bg-muted/30">
                                           <td className="py-3 px-4 font-mono text-xs">
                                                {new Date(h.effectiveDate).toLocaleDateString()}
                                           </td>
                                           <td className="py-3 px-4 font-mono text-xs">
                                                {h.endDate ? new Date(h.endDate).toLocaleDateString() : '—'}
                                           </td>
                                           <td className="py-3 px-4 text-right font-mono text-xs">
                                                {formatPercent(h.kesEmployeeRate)}% / {formatPercent(h.kesCompanyRate)}%
                                           </td>
                                           <td className="py-3 px-4 text-right font-mono text-xs">
                                                {formatPercent(h.jhtEmployeeRate)}% / {formatPercent(h.jhtCompanyRate)}%
                                           </td>
                                           <td className="py-3 px-4">
                                                {h.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Archived</Badge>}
                                           </td>
                                      </tr>
                                ))}
                                {configHistory.length === 0 && (
                                     <tr>
                                         <td colSpan={5} className="py-8 text-center text-muted-foreground">No historical records found.</td>
                                     </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
