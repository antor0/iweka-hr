"use client";

import { useMemo, useState } from "react";
import { ApplicationStatus } from "@prisma/client";
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useToast } from "@/hooks/use-toast";
import { Column } from "./pipeline-column";
import { CandidateCard } from "./candidate-card";

export type ApplicationType = {
    id: string;
    status: ApplicationStatus;
    appliedDate: string;
    candidate: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        resumeUrl: string | null;
    };
};

interface PipelineBoardProps {
    applications: ApplicationType[];
    requisitionId: string;
    onUpdate: () => void;
}

const COLUMNS: ApplicationStatus[] = ["NEW", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

export function PipelineBoard({ applications, requisitionId, onUpdate }: PipelineBoardProps) {
    const { toast } = useToast();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [localApps, setLocalApps] = useState<ApplicationType[]>(applications);

    // Sync when props change, although could cause flicker if not careful, it's fine for simple use
    useMemo(() => setLocalApps(applications), [applications]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const activeApp = useMemo(() => localApps.find(app => app.id === activeId), [activeId, localApps]);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: any) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const isActiveCard = active.data.current?.type === "Card";
        const isOverCard = over.data.current?.type === "Card";
        const isOverColumn = over.data.current?.type === "Column";

        if (!isActiveCard) return;

        // Dropping a Card over another Card
        if (isActiveCard && isOverCard) {
            setLocalApps((apps) => {
                const activeIndex = apps.findIndex((a) => a.id === activeId);
                const overIndex = apps.findIndex((a) => a.id === overId);
                
                if (apps[activeIndex].status !== apps[overIndex].status) {
                    const newApps = [...apps];
                    newApps[activeIndex].status = apps[overIndex].status;
                    return arrayMove(newApps, activeIndex, overIndex);
                }
                return arrayMove(apps, activeIndex, overIndex);
            });
        }

        // Dropping a Card over a Column
        if (isActiveCard && isOverColumn) {
            setLocalApps((apps) => {
                const activeIndex = apps.findIndex((a) => a.id === activeId);
                const newApps = [...apps];
                newApps[activeIndex].status = overId as ApplicationStatus;
                return newApps;
            });
        }
    };

    const handleDragEnd = async (event: any) => {
        setActiveId(null);
        const { active, over } = event;
        if (!over) return;

        const appId = active.id as string;
        
        // Find the ultimate status it landed on
        const finalApp = localApps.find(a => a.id === appId);
        if (!finalApp) return;
        
        const originalApp = applications.find(a => a.id === appId);
        
        // If status changed, update backend
        if (originalApp && originalApp.status !== finalApp.status) {
            try {
                const res = await fetch(`/api/v1/recruitment/applications/${appId}/status`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: finalApp.status })
                });

                if (!res.ok) throw new Error("Failed to update status");
                toast({ title: "Updated", description: `Candidate moved to ${finalApp.status}` });
                onUpdate();
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to update status, reverting..." });
                setLocalApps(applications);
            }
        }
    };

    return (
        <div className="flex h-[600px] overflow-x-auto gap-4 pb-4">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
            >
                {COLUMNS.map((col) => (
                    <Column
                        key={col}
                        columnId={col}
                        applications={localApps.filter((a) => a.status === col)}
                    />
                ))}

                <DragOverlay>
                    {activeApp ? <CandidateCard app={activeApp} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
