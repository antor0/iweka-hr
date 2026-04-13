import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Loader2, PlayCircle, Settings2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export function DepartmentWorkModelsCard({ departmentId, departmentWorkModels, onRefresh }: { departmentId: string, departmentWorkModels: any[], onRefresh: () => void }) {
    const [isManageOpen, setIsManageOpen] = useState(false);
    const [allModels, setAllModels] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        if (isManageOpen) {
            setLoading(true);
            fetch("/api/v1/organization/work-time-models")
                .then(res => res.json())
                .then(json => {
                    // API returns array directly
                    const models = Array.isArray(json) ? json : (json.data || []);
                    setAllModels(models);
                    setLoading(false);
                });
        }
    }, [isManageOpen]);

    const isAssigned = (modelId: string) => {
        return departmentWorkModels?.some((pwm: any) => pwm.workTimeModelId === modelId);
    };

    const handleToggleAssign = async (modelId: string, currentlyAssigned: boolean) => {
        setActionLoading(true);
        try {
            if (currentlyAssigned) {
                const res = await fetch(`/api/v1/departments/${departmentId}/work-models`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ workTimeModelId: modelId })
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to remove");
                }
            } else {
                const res = await fetch(`/api/v1/departments/${departmentId}/work-models`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ workTimeModelId: modelId })
                });
                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.error || "Failed to assign");
                }
            }
            onRefresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg flex items-center gap-2 mt-0">
                    <Clock className="h-5 w-5 text-indigo-500" />
                    Work Models
                </CardTitle>
                <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8">
                            <Settings2 className="h-4 w-4 mr-1.5" /> Manage
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Manage Department Work Models</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                            {loading ? (
                                <div className="flex justify-center p-4"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                            ) : allModels.length === 0 ? (
                                <p className="text-sm text-center text-muted-foreground p-4">No work models available in the system.</p>
                            ) : (
                                allModels.map(model => {
                                    const assigned = isAssigned(model.id);
                                    return (
                                        <div key={model.id} className={`flex items-center justify-between p-4 rounded-xl border ${assigned ? 'border-primary/50 bg-primary/5' : 'bg-card'}`}>
                                            <div>
                                                <p className="font-semibold text-sm">{model.name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px]">{model.type}</Badge>
                                                    <span className="text-xs text-muted-foreground">{model.schedules?.length || 0} shifts</span>
                                                </div>
                                            </div>
                                            <Button 
                                                variant={assigned ? "destructive" : "default"} 
                                                size="sm" 
                                                disabled={actionLoading}
                                                onClick={() => handleToggleAssign(model.id, assigned)}
                                            >
                                                {assigned ? "Remove" : "Assign"}
                                            </Button>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {!departmentWorkModels || departmentWorkModels.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic p-4 text-center">No work models assigned.</p>
                ) : (
                    <div className="space-y-3">
                        {departmentWorkModels.map((dwm: any) => {
                            const model = dwm.workTimeModel;
                            return (
                                <div key={dwm.id} className="p-3 rounded-lg border bg-card/50">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="font-medium text-sm">{model.name}</p>
                                        <Badge variant="secondary" className="text-[10px] uppercase font-mono">{model.type}</Badge>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                        {model.schedules?.map((s: any) => (
                                            <span key={s.id} className="bg-secondary/50 text-secondary-foreground px-2 py-1 rounded text-[10px]">
                                                {s.shiftName}: {s.startTime}-{s.endTime}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
