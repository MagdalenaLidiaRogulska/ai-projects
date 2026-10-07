"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import {
  addCard,
  deleteCard,
  initialBoard,
  moveCard,
  renameColumn,
  type Board,
  type Card,
  type Column,
} from "@/lib/kanban";
import styles from "./page.module.css";

const emptyDraft = () => ({ title: "", details: "" });

export default function Home() {
  const [board, setBoard] = useState<Board>(initialBoard());
  const [drafts, setDrafts] = useState<Record<string, { title: string; details: string }>>({});
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const collisionDetection: CollisionDetection = (args) => {
    const pointerCollisions = pointerWithin(args);
    const cardCollisions = pointerCollisions.filter((collision) =>
      board.columns.some((column) =>
        column.cards.some((card) => card.id === collision.id),
      ),
    );

    return cardCollisions.length ? cardCollisions : pointerCollisions.length ? pointerCollisions : closestCenter(args);
  };

  const handleAddCard = (columnId: string) => {
    const draft = drafts[columnId] ?? emptyDraft();
    const title = draft.title.trim();

    if (!title) {
      return;
    }

    setBoard((current) => addCard(current, columnId, title, draft.details));
    setDrafts((current) => ({
      ...current,
      [columnId]: emptyDraft(),
    }));
  };

  const handleRename = (columnId: string, value: string) => {
    setBoard((current) => renameColumn(current, columnId, value));
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    setBoard((current) => deleteCard(current, columnId, cardId));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const card = board.columns
      .flatMap((column) => column.cards)
      .find((item) => item.id === String(event.active.id));

    setActiveCard(card ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) {
      return;
    }

    setBoard((current) => moveCard(current, String(active.id), String(over.id)));
  };

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div>
          <p className={styles.eyebrow}>Operations</p>
          <h1>Team Board</h1>
        </div>
      </header>

      <DndContext
        id="kanban-board-dnd"
        sensors={sensors}
        collisionDetection={collisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveCard(null)}
      >
        <div className={styles.board}>
          {board.columns.map((column: Column) => (
            <DroppableColumn key={column.id} id={column.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <input
                  aria-label={`${column.title} column title`}
                  className={styles.columnTitleInput}
                  value={column.title}
                  onChange={(event) => handleRename(column.id, event.target.value)}
                />
                <span className={styles.count}>{column.cards.length}</span>
              </div>

              <SortableContext items={column.cards.map((card) => card.id)} strategy={verticalListSortingStrategy}>
                <div className={styles.cardList}>
                  {column.cards.map((card: Card) => (
                    <SortableCard
                      key={card.id}
                      card={card}
                      columnId={column.id}
                      onDelete={handleDeleteCard}
                    />
                  ))}

                  <div className={styles.composeCard}>
                    <input
                      aria-label={`Title for ${column.title}`}
                      value={drafts[column.id]?.title ?? ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [column.id]: {
                            title: event.target.value,
                            details: current[column.id]?.details ?? "",
                          },
                        }))
                      }
                      placeholder="Add a card"
                    />
                    <textarea
                      aria-label={`Details for ${column.title}`}
                      value={drafts[column.id]?.details ?? ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [column.id]: {
                            title: current[column.id]?.title ?? "",
                            details: event.target.value,
                          },
                        }))
                      }
                      placeholder="Brief details"
                      rows={3}
                    />
                    <button type="button" onClick={() => handleAddCard(column.id)}>
                      Add card
                    </button>
                  </div>
                </div>
              </SortableContext>
            </DroppableColumn>
          ))}
        </div>
        <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {activeCard ? <CardPreview card={activeCard} overlay /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function DroppableColumn({
  id,
  className,
  children,
}: {
  id: string;
  className: string;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={`${className} ${isOver ? styles.columnOver : ""}`}>
      {children}
    </div>
  );
}

function CardPreview({ card, overlay = false }: { card: Card; overlay?: boolean }) {
  return (
    <div className={`${styles.card} ${overlay ? styles.dragOverlay : ""}`}>
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{card.title}</div>
        {overlay ? null : <span className={styles.deleteButton} aria-hidden="true">×</span>}
      </div>
      <p>{card.details}</p>
    </div>
  );
}

function SortableCard({
  card,
  columnId,
  onDelete,
}: {
  card: Card;
  columnId: string;
  onDelete: (columnId: string, cardId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={styles.card}
      {...listeners}
    >
      <div className={styles.cardHeader}>
        <div className={styles.cardTitle}>{card.title}</div>
        <button
          type="button"
          className={styles.dragHandle}
          aria-label={`Drag ${card.title}`}
          ref={setActivatorNodeRef}
          {...attributes}
        >
          <span aria-hidden="true">⠿</span>
        </button>
        <button
          type="button"
          className={styles.deleteButton}
          aria-label={`Delete ${card.title}`}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(columnId, card.id);
          }}
        >
          ×
        </button>
      </div>
      <p>{card.details}</p>
    </div>
  );
}
