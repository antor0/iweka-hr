"use client";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Plus, Loader2 } from "lucide-react";

export function PositionGradesTab() {
    const [positions, setPositions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchPositions = async () => {
        try {
            const res = await fetch("/api/v1/organization/position-grades");
            const data = await res.json();
            setPositions(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchPositions(); }, []);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-foreground">Grade per Position</h3>
                    <p className="text-sm text-muted-foreground">Map active salary grades to organizational positions</p>
                </div>
                <Button size="sm"><Plus className="w-4 h-4 mr-2" />Map Grade</Button>
            </div>

            {loading ? <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {positions.map(pos => (
                        <Card key={pos.id} className="glass glass-hover">
                            <CardContent className="p-4 flex items-start gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500 shrink-0">
                                    <Award className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-foreground mb-2">{pos.title}</h4>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {pos.positionGrades && pos.positionGrades.length > 0 ? (
                                            pos.positionGrades.map((pg: any) => (
                                                <Badge key={pg.gradeId} variant="secondary" className="bg-white/5 hover:bg-white/10 text-xs">
                                                    {pg.grade?.name || "Unknown"}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">No grades mapped</span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    {positions.length === 0 && <p className="text-sm text-muted-foreground">No positions found.</p>}
                </div>
            )}
        </div>
    );
}