"use client";

import { useEffect, useMemo, useState, useRef } from "react";
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
    notes: string | null;
    expectedSalary: number | null;
    candidate: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string | null;
        resumeUrl: string | null;
        portfolioUrl: string | null;
        source: string | null;
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

    // Tracks the {appId -> newStatus} that was determined during dragOver,
    // so handleDragEnd can read it synchronously without stale-state issues.
    const pendingStatusRef = useRef<{ appId: string; newStatus: ApplicationStatus } | null>(null);

    // Sync local board when server data refreshes after onUpdate()
    useEffect(() => {
        setLocalApps(applications);
    }, [applications]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const activeApp = useMemo(() => localApps.find(app => app.id === activeId), [activeId, localApps]);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id as string);
        pendingStatusRef.current = null;
    };

    const handleDragOver = (event: any) => {
        const { active, over } = event;
        if (!over) return;

        const activeCardId = active.id as string;
        const overId = over.id as string;

        if (activeCardId === overId) return;

        const isActiveCard = active.data.current?.type === "Card";
        const isOverCard = over.data.current?.type === "Card";
        const isOverColumn = over.data.current?.type === "Column";

        if (!isActiveCard) return;

        // Dropping a Card over another Card
        if (isActiveCard && isOverCard) {
            setLocalApps((apps) => {
                const activeIndex = apps.findIndex((a) => a.id === activeCardId);
                const overIndex = apps.findIndex((a) => a.id === overId);
                if (activeIndex === -1 || overIndex === -1) return apps;

                let newApps = [...apps];
                if (apps[activeIndex].status !== apps[overIndex].status) {
                    newApps[activeIndex] = { ...newApps[activeIndex], status: apps[overIndex].status };
                    // Record the new status synchronously in the ref
                    pendingStatusRef.current = { appId: activeCardId, newStatus: apps[overIndex].status };
                }
                return arrayMove(newApps, activeIndex, overIndex);
            });
        }

        // Dropping a Card over a Column
        if (isActiveCard && isOverColumn) {
            const newStatus = overId as ApplicationStatus;
            setLocalApps((apps) => {
                const activeIndex = apps.findIndex((a) => a.id === activeCardId);
                if (activeIndex === -1) return apps;
                const newApps = [...apps];
                newApps[activeIndex] = { ...newApps[activeIndex], status: newStatus };
                return newApps;
            });
            // Record the new status synchronously in the ref
            pendingStatusRef.current = { appId: activeCardId, newStatus };
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active } = event;
        setActiveId(null);

        const appId = active.id as string;
        const pending = pendingStatusRef.current;
        pendingStatusRef.current = null;

        // Only save if a status change was detected during drag
        if (!pending || pending.appId !== appId) return;

        const originalApp = applications.find(a => a.id === appId);
        if (!originalApp) return;

        // Double-check the status actually changed
        if (pending.newStatus === originalApp.status) return;

        try {
            const res = await fetch(`/api/v1/recruitment/applications/${appId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: pending.newStatus }),
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || "Failed to update status");
            }
            toast({ title: "Saved", description: `Candidate moved to ${pending.newStatus}` });
            onUpdate();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to update status" });
            // Revert UI to last known server state
            setLocalApps(applications);
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
                        onUpdate={onUpdate}
                    />
                ))}

                <DragOverlay>
                    {activeApp ? <CandidateCard app={activeApp} onUpdate={onUpdate} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
}
