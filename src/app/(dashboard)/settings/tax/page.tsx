"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Trash2, Plus, ArrowLeft, Receipt, History, Loader2, Sparkles, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { OFFICIAL_TER_2024 } from "@/lib/constants/tax-presets";

export default function TaxConfigSettingsPage() {
    const [configHistory, setConfigHistory] = useState<any[]>([]);
    const [activeConfig, setActiveConfig] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    const defaultBrackets = [
         { max: 60000000, rate: 0.05 },
         { max: 250000000, rate: 0.15 },
         { max: 500000000, rate: 0.25 },
         { max: 5000000000, rate: 0.30 },
         { max: null, rate: 0.35 }
    ];

    const defaultPTKPValues = {
         "TK_0": 54000000,
         "TK_1": 58500000,
         "TK_2": 63000000,
         "TK_3": 67500000,
         "K_0": 58500000,
         "K_1": 63000000,
         "K_2": 67500000,
         "K_3": 72000000
    };

    const defaultTER = {
         "A": [{ min: 0, max: 5400000, rate: 0 }],
         "B": [{ min: 0, max: 6200000, rate: 0 }],
         "C": [{ min: 0, max: 6600000, rate: 0 }]
    };

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/settings/tax?history=true`);
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
                        method: "TER",
                        brackets: defaultBrackets,
                        ptkpValues: defaultPTKPValues,
                        terRates: defaultTER,
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
            const method = "POST";
            const url = "/api/v1/settings/tax";
            
            const reqBody = {
                 ...activeConfig,
                 id: undefined,
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
                description: "Tax PPh 21 configuration has been successfully updated.",
            });
            fetchConfigs();
        } catch (error: any) {
             toast({
                title: "Error",
                description: error.message || "Failed to save Tax configuration.",
                variant: "destructive",
             });
        } finally {
            setIsSaving(false);
        }
    };

    const formatPercent = (val: number) => (val * 100).toFixed(2);
    const parsePercent = (val: string) => {
         const n = parseFloat(val);
         return isNaN(n) ? 0 : n / 100;
    };

    const handlePTKPChange = (key: string, val: string) => {
        const num = parseInt(val, 10);
        setActiveConfig({
            ...activeConfig,
            ptkpValues: {
                 ...activeConfig.ptkpValues,
                 [key]: isNaN(num) ? 0 : num
            }
        });
    };

    const handleBracketChange = (index: number, field: string, val: string) => {
         const newBrackets = [...activeConfig.brackets];
         if (field === 'rate') {
              newBrackets[index][field] = parsePercent(val);
         } else {
              const num = parseInt(val, 10);
              newBrackets[index][field] = isNaN(num) ? null : num;
         }
         setActiveConfig({...activeConfig, brackets: newBrackets});
    };

    const addBracket = () => {
         setActiveConfig({
              ...activeConfig,
              brackets: [...activeConfig.brackets, { max: null, rate: 0 }]
         });
    };

    const removeBracket = (index: number) => {
         const newBrackets = [...activeConfig.brackets];
         newBrackets.splice(index, 1);
         setActiveConfig({...activeConfig, brackets: newBrackets});
    };


    const handleTERChange = (category: string, index: number, field: string, val: string) => {
         const newTer = { ...activeConfig.terRates };
         if (!newTer[category]) return;
         if (field === 'rate') {
              newTer[category][index][field] = parsePercent(val);
         } else {
              const num = parseInt(val, 10);
              newTer[category][index][field] = isNaN(num) ? null : num;
         }
         setActiveConfig({...activeConfig, terRates: newTer});
    };

    const addTERRow = (category: string) => {
         const newTer = { ...activeConfig.terRates };
         if (!newTer[category]) newTer[category] = [];
         newTer[category].push({ min: 0, max: null, rate: 0 });
         setActiveConfig({...activeConfig, terRates: newTer});
    };

    const removeTERRow = (category: string, index: number) => {
         const newTer = { ...activeConfig.terRates };
         if (!newTer[category]) return;
         newTer[category].splice(index, 1);
         setActiveConfig({...activeConfig, terRates: newTer});
    };

    const handlePopulatePreset = (category: 'A' | 'B' | 'C') => {
        const newTer = { ...activeConfig.terRates };
        newTer[category] = OFFICIAL_TER_2024[category].map(row => ({...row}));
        setActiveConfig({...activeConfig, terRates: newTer});
        
        toast({
            title: `Category ${category} Populated`,
            description: `Filled with all ${OFFICIAL_TER_2024[category].length} official rows from PP 58/2023.`,
        });
    };

    const handleClearTER = (category: string) => {
        const newTer = { ...activeConfig.terRates };
        newTer[category] = [];
        setActiveConfig({...activeConfig, terRates: newTer});
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
                        <Receipt className="w-6 h-6 text-violet-500" /> Tax PPh 21 Configuration
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">Manage TER rates, PTKP values, and progressive brackets</p>
                </div>
            </div>

            <Card className="glass">
                <CardHeader className="border-b border-border/50 pb-4">
                    <CardTitle className="text-base flex items-center justify-between">
                         Active Tax Rates
                         {activeConfig?.isActive && <Badge variant="success">Active</Badge>}
                    </CardTitle>
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
                        <div className="space-y-2">
                            <Label>Tax Method</Label>
                             <select 
                                 className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                 value={activeConfig?.method || "TER"}
                                 onChange={(e) => setActiveConfig({...activeConfig, method: e.target.value})}
                             >
                                 <option value="TER">TER (Tarif Efektif Rata-rata)</option>
                                 <option value="PROGRESSIVE">Progressive Only (Pasal 17)</option>
                             </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                         <h3 className="font-semibold text-sm border-b pb-2 text-primary">PTKP Values (Penghasilan Tidak Kena Pajak) - Tahunan</h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              {Object.keys(defaultPTKPValues).map(key => (
                                   <div key={key} className="space-y-1">
                                        <Label className="text-xs">{key.replace('_', '/')}</Label>
                                        <Input 
                                            type="number" 
                                            value={activeConfig?.ptkpValues?.[key] ?? 0} 
                                            onChange={(e) => handlePTKPChange(key, e.target.value)}
                                        />
                                   </div>
                              ))}
                         </div>
                    </div>

                    <div className="space-y-4">
                         <h3 className="font-semibold text-sm border-b pb-2 text-primary flex justify-between items-center">
                              Progressive Brackets (Pasal 17)
                              <Button variant="outline" size="sm" onClick={addBracket}><Plus className="w-3 h-3 mr-1"/> Row</Button>
                         </h3>
                         <div className="space-y-2">
                              {activeConfig?.brackets?.map((b: any, i: number) => (
                                  <div key={i} className="flex gap-4 items-center">
                                       <div className="flex-1 space-y-1">
                                           <Label className="text-xs">Max Income (Leave empty for ∞)</Label>
                                           <Input type="number" value={b.max === null ? "" : b.max} onChange={(e) => handleBracketChange(i, 'max', e.target.value)} placeholder="e.g. 60000000"/>
                                       </div>
                                       <div className="flex-1 space-y-1">
                                           <Label className="text-xs">Rate (%)</Label>
                                           <Input type="number" step="1" value={formatPercent(b.rate)} onChange={(e) => handleBracketChange(i, 'rate', e.target.value)} />
                                       </div>
                                       <Button variant="ghost" size="icon" className="self-end hover:bg-destructive/10 text-destructive" onClick={() => removeBracket(i)}>
                                            <Trash2 className="w-4 h-4"/>
                                       </Button>
                                  </div>
                              ))}
                         </div>
                    </div>

                    {activeConfig?.method === 'TER' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-sm border-b pb-2 text-primary">
                                TER Rates (Kategori A / B / C)
                                <p className="text-xs text-muted-foreground font-normal mt-1">
                                     Add the required monthly brackets per PP 58/2023. Example: 0 to 5,400,000 = 0%. 
                                </p>
                            </h3>
                            {["A", "B", "C"].map((category) => (
                                 <div key={category} className="space-y-4 bg-secondary/20 p-4 rounded-xl border border-border/30">
                                      <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border/50">
                                           <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-sm">Category {category}</h4>
                                                <Badge variant="outline" className="text-[10px] h-4">
                                                     {category === 'A' ? 'TK/0, TK/1, K/0' : category === 'B' ? 'TK/2, TK/3, K/1, K/2' : 'K/3'}
                                                </Badge>
                                           </div>
                                           <div className="flex items-center gap-2">
                                                <Button 
                                                     variant="outline" 
                                                     size="sm" 
                                                     className="h-7 text-[10px] gap-1 border-violet-500/50 text-violet-500 hover:bg-violet-500/10"
                                                     onClick={() => handlePopulatePreset(category as 'A' | 'B' | 'C')}
                                                >
                                                     <Sparkles className="w-3 h-3"/> Auto-Populate (2024)
                                                </Button>
                                                <Button 
                                                     variant="ghost" 
                                                     size="sm" 
                                                     className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-destructive"
                                                     onClick={() => handleClearTER(category)}
                                                >
                                                     <X className="w-3 h-3"/> Clear
                                                </Button>
                                                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={() => addTERRow(category)}>
                                                     <Plus className="w-3 h-3"/> Row
                                                </Button>
                                           </div>
                                      </div>
                                      {activeConfig?.terRates?.[category]?.map((row: any, i: number) => (
                                          <div key={i} className="flex gap-2 items-center">
                                               <div className="flex-1">
                                                    <Label className="text-xs">Min</Label>
                                                    <Input type="number" value={row.min} onChange={(e) => handleTERChange(category, i, 'min', e.target.value)} />
                                               </div>
                                               <div className="flex-1">
                                                    <Label className="text-xs">Max</Label>
                                                    <Input type="number" value={row.max === null ? "" : row.max} onChange={(e) => handleTERChange(category, i, 'max', e.target.value)} />
                                               </div>
                                               <div className="flex-1">
                                                    <Label className="text-xs">Rate (%)</Label>
                                                    <Input type="number" step="0.01" value={formatPercent(row.rate)} onChange={(e) => handleTERChange(category, i, 'rate', e.target.value)} />
                                               </div>
                                               <Button variant="ghost" size="icon" className="self-end hover:bg-destructive/10 text-destructive mb-1" onClick={() => removeTERRow(category, i)}>
                                                    <Trash2 className="w-4 h-4"/>
                                               </Button>
                                          </div>
                                      ))}
                                 </div>
                            ))}
                        </div>
                    )}

                    {activeConfig?.method === 'TER' && (
                         <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 text-xs text-violet-600 space-y-2">
                              <p className="font-semibold flex items-center gap-2">
                                   <Sparkles className="w-3 h-3" /> Quick Tip: PP 58/2023 Implementation
                              </p>
                              <p className="leading-relaxed">
                                   TER (Tarif Efektif Rata-rata) is calculated from **Monthly Gross Income**. 
                                   Category A, B, and C are determined by the employee's PTKP status. 
                                   Use the **Auto-Populate** button to quickly load the hundreds of rows required by the latest 2024 regulations.
                              </p>
                         </div>
                    )}


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
                                    <th className="py-3 px-4 text-left font-medium text-muted-foreground">Method</th>
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
                                           <td className="py-3 px-4 text-xs font-mono">
                                                {h.method}
                                           </td>
                                           <td className="py-3 px-4">
                                                {h.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="secondary">Archived</Badge>}
                                           </td>
                                      </tr>
                                ))}
                                {configHistory.length === 0 && (
                                     <tr>
                                         <td colSpan={4} className="py-8 text-center text-muted-foreground">No historical records found.</td>
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
