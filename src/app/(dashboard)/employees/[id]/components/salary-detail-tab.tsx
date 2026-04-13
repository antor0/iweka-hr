"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, DollarSign, Wallet, PiggyBank } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function SalaryDetailTab({ employeeId }: { employeeId: string }) {
    const [allowances, setAllowances] = useState<any[]>([]);
    const [monthlyInputs, setMonthlyInputs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [isAllowanceOpen, setIsAllowanceOpen] = useState(false);
    const [newAllowance, setNewAllowance] = useState({ name: "", category: "FIXED", basis: "FIXED_AMOUNT", amount: 0 });

    const [isVariableOpen, setIsVariableOpen] = useState(false);
    const [newVariable, setNewVariable] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
        thrAmount: 0, overtimeAmount: 0, commissionAmount: 0, bonusAmount: 0, notes: ""
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [resA, resB] = await Promise.all([
                fetch(`/api/v1/employees/${employeeId}/allowances`),
                fetch(`/api/v1/employees/${employeeId}/variable-inputs`)
            ]);
            setAllowances(await resA.json());
            setMonthlyInputs(await resB.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [employeeId]);

    const handleSaveAllowance = async () => {
        await fetch(`/api/v1/employees/${employeeId}/allowances`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...newAllowance, amount: Number(newAllowance.amount) })
        });
        setIsAllowanceOpen(false);
        fetchData();
    };

    const handleDeleteAllowance = async (id: string) => {
        if (!confirm("Are you sure?")) return;
        await fetch(`/api/v1/employees/${employeeId}/allowances/${id}`, { method: "DELETE" });
        fetchData();
    };

    const handleSaveVariable = async () => {
        await fetch(`/api/v1/employees/${employeeId}/variable-inputs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...newVariable,
                month: Number(newVariable.month),
                year: Number(newVariable.year),
                thrAmount: Number(newVariable.thrAmount),
                overtimeAmount: Number(newVariable.overtimeAmount),
                commissionAmount: Number(newVariable.commissionAmount),
                bonusAmount: Number(newVariable.bonusAmount),
            })
        });
        setIsVariableOpen(false);
        fetchData();
    };

    const formatRp = (v: any) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(Number(v || 0));

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

    const fixedAllowances = allowances.filter(a => a.category === "FIXED");
    const varAllowances = allowances.filter(a => a.category === "VARIABLE");

    return (
        <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
                {/* TUNJANGAN TETAP */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-emerald-500" /> Tunjangan Karyawan
                        </CardTitle>
                        <Dialog open={isAllowanceOpen} onOpenChange={setIsAllowanceOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Add</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Add Allowance</DialogTitle></DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input value={newAllowance.name} onChange={e => setNewAllowance({ ...newAllowance, name: e.target.value })} placeholder="e.g. Tunjangan Jabatan" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select value={newAllowance.category} onValueChange={v => setNewAllowance({ ...newAllowance, category: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FIXED">Tetap</SelectItem>
                                                {/* <SelectItem value="VARIABLE">Tidak Tetap (Recurring)</SelectItem> */}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Basis</Label>
                                        <Select value={newAllowance.basis} onValueChange={v => setNewAllowance({ ...newAllowance, basis: v })}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="FIXED_AMOUNT">Tetap per bulan</SelectItem>
                                                <SelectItem value="ATTENDANCE_BASED">Kehadiran (per hari)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Amount (Rp)</Label>
                                        <Input type="number" value={newAllowance.amount} onChange={e => setNewAllowance({ ...newAllowance, amount: Number(e.target.value) })} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsAllowanceOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSaveAllowance}>Save</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4 border-t border-white/5">
                        {fixedAllowances.map(a => (
                            <div key={a.id} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                                <div>
                                    <p className="font-semibold text-sm">{a.name}</p>
                                    <Badge variant="secondary" className="mt-1 text-[10px]">{a.basis}</Badge>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                    <span className="font-mono text-sm">{formatRp(a.amount)}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteAllowance(a.id)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {fixedAllowances.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No fixed allowances defined.</p>}
                    </CardContent>
                </Card>

                {/* MONTHLY VARIABLES */}
                <Card className="glass">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <PiggyBank className="w-5 h-5 text-amber-500" /> Variable Inputs (Monthly)
                        </CardTitle>
                        <Dialog open={isVariableOpen} onOpenChange={setIsVariableOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Add Result</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md">
                                <DialogHeader><DialogTitle>Upsert Monthly Variable</DialogTitle></DialogHeader>
                                <div className="grid grid-cols-2 gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Month (1-12)</Label>
                                        <Input type="number" min="1" max="12" value={newVariable.month} onChange={e => setNewVariable({ ...newVariable, month: Number(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Year</Label>
                                        <Input type="number" min="2000" value={newVariable.year} onChange={e => setNewVariable({ ...newVariable, year: Number(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>THR Amount (Rp)</Label>
                                        <Input type="number" value={newVariable.thrAmount} onChange={e => setNewVariable({ ...newVariable, thrAmount: Number(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Overtime (Rp)</Label>
                                        <Input type="number" value={newVariable.overtimeAmount} onChange={e => setNewVariable({ ...newVariable, overtimeAmount: Number(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Bonus (Rp)</Label>
                                        <Input type="number" value={newVariable.bonusAmount} onChange={e => setNewVariable({ ...newVariable, bonusAmount: Number(e.target.value) })} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Commission (Rp)</Label>
                                        <Input type="number" value={newVariable.commissionAmount} onChange={e => setNewVariable({ ...newVariable, commissionAmount: Number(e.target.value) })} />
                                    </div>
                                    <div className="col-span-2 space-y-2">
                                        <Label>Notes</Label>
                                        <Textarea value={newVariable.notes} onChange={e => setNewVariable({ ...newVariable, notes: String(e.target.value) })} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsVariableOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSaveVariable}>Save</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-4 border-t border-white/5">
                        {monthlyInputs.map((input) => (
                            <div key={input.id} className="p-3 bg-black/20 rounded-lg border border-white/5 text-sm">
                                <div className="flex justify-between font-semibold border-b border-white/10 pb-2 mb-2">
                                    <span>Period: {input.month}/{input.year}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">THR:</span>
                                        <span className="font-mono">{formatRp(input.thrAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Overtime:</span>
                                        <span className="font-mono">{formatRp(input.overtimeAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Bonus:</span>
                                        <span className="font-mono">{formatRp(input.bonusAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Commission:</span>
                                        <span className="font-mono">{formatRp(input.commissionAmount)}</span>
                                    </div>
                                </div>
                                {input.notes && <p className="mt-2 text-xs text-muted-foreground italic truncate">Note: {input.notes}</p>}
                            </div>
                        ))}
                        {monthlyInputs.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No variable inputs reported recently.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}