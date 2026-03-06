"use client";

import React, { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ---------------------------------------------------------------------------
// Sortable item wrapper
// ---------------------------------------------------------------------------

interface SortableItemProps {
  id: string;
  disabled?: boolean;
  children: (props: {
    handleProps: Record<string, unknown>;
    isDragging: boolean;
  }) => React.ReactNode;
}

export function SortableItem({ id, disabled, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({
        handleProps: { ...attributes, ...listeners },
        isDragging,
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Drag handle
// ---------------------------------------------------------------------------

interface DragHandleProps {
  handleProps: Record<string, unknown>;
  disabled?: boolean;
}

export function DragHandle({ handleProps, disabled }: DragHandleProps) {
  return (
    <button
      type="button"
      {...handleProps}
      style={{
        ...dragHandleStyle,
        ...(disabled ? dragHandleDisabledStyle : {}),
      }}
      title="Drag to reorder"
      aria-label="Drag handle"
    >
      ⠿
    </button>
  );
}

const dragHandleStyle: React.CSSProperties = {
  cursor: "grab",
  touchAction: "none",
  border: "none",
  background: "transparent",
  color: "var(--wp-text-muted)",
  fontSize: 16,
  padding: "2px 4px",
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  lineHeight: 1,
};

const dragHandleDisabledStyle: React.CSSProperties = {
  cursor: "not-allowed",
  opacity: 0.3,
};

// ---------------------------------------------------------------------------
// Sortable list container
// ---------------------------------------------------------------------------

interface SortableListProps {
  items: string[];
  disabled?: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
  renderItem: (id: string, index: number) => React.ReactNode;
  renderOverlay?: (id: string) => React.ReactNode;
}

export function SortableList({
  items,
  disabled,
  onReorder,
  renderItem,
  renderOverlay,
}: SortableListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Pointer sensor with 8px activation distance (prevents accidental drags / allows clicks)
  // Touch sensor with 150ms delay + 5px tolerance (allows scroll on mobile)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const fromIndex = items.indexOf(String(active.id));
      const toIndex = items.indexOf(String(over.id));
      if (fromIndex === -1 || toIndex === -1) return;

      onReorder(fromIndex, toIndex);
    },
    [items, onReorder]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy} disabled={disabled}>
        {items.map((id, index) => renderItem(id, index))}
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeId && renderOverlay ? renderOverlay(activeId) : null}
      </DragOverlay>
    </DndContext>
  );
}
