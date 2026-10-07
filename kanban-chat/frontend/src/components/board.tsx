'use client';

import { useReducer, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { DragDropProvider, useDroppable } from '@dnd-kit/react';
import { useSortable } from '@dnd-kit/react/sortable';
import { CollisionPriority } from '@dnd-kit/abstract';
import { pointerIntersection } from '@dnd-kit/collision';
import { move } from '@dnd-kit/helpers';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Check, ChevronRight, GripVertical, Layers2, LayoutGrid, Pencil, Plus, Trash2, X } from 'lucide-react';
import { boardReducer, createSampleBoard, type Card, type Column, type BoardAction } from '@/lib/board';

const colors = ['#8894a8', '#209dd7', '#ecad0a', '#aa76c0', '#67b49a'];
type Editor = { columnId: string; card?: Card; deleteRequested?: boolean };

export function CardEditor({ editor, columnName, onClose, dispatch, trigger }: {
  editor: Editor; columnName: string; onClose: () => void; dispatch: (action: BoardAction) => void; trigger?: HTMLElement | null;
}) {
  const [title, setTitle] = useState(editor.card?.title ?? '');
  const [details, setDetails] = useState(editor.card?.details ?? '');
  const [error, setError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(editor.deleteRequested ?? false);
  function save(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) { setError(true); return; }
    const card = { id: editor.card?.id ?? crypto.randomUUID(), title: title.trim(), details };
    dispatch(editor.card ? { type: 'edit', card } : { type: 'add', columnId: editor.columnId, card });
    onClose();
  }
  return <Dialog.Portal>
    <Dialog.Overlay className="dialog-overlay" />
    <Dialog.Content className="dialog-content" aria-describedby="editor-description" onOpenAutoFocus={event => { event.preventDefault(); (document.getElementById("card-title") ?? document.getElementById("keep-card"))?.focus(); }} onCloseAutoFocus={event => { if (trigger) { event.preventDefault(); const target = trigger.isConnected ? trigger : document.querySelector<HTMLElement>('.new-card'); target?.focus(); } }}>
      <div className="dialog-heading"><span className="eyebrow">{columnName}</span><Dialog.Close className="icon-button" aria-label="Close editor"><X size={19} /></Dialog.Close></div>
      <Dialog.Title>{confirmDelete ? 'Delete this card?' : editor.card ? 'A little more detail.' : 'Make room for an idea.'}</Dialog.Title>
      <Dialog.Description id="editor-description">{confirmDelete ? 'This card will be removed from your board.' : editor.card ? 'Refine the idea, then keep things moving.' : 'Every great project starts with a small next step.'}</Dialog.Description>
      {confirmDelete ? <div className="delete-confirmation">
        <p>{editor.card?.title}</p>
        <div className="dialog-actions"><button id="keep-card" className="secondary-button" onClick={() => { if (editor.deleteRequested) onClose(); else setConfirmDelete(false); }}>Keep card</button><button className="danger-button" onClick={() => { dispatch({ type: 'delete', cardId: editor.card!.id }); onClose(); }}>Delete card</button></div>
      </div> : <form onSubmit={save}>
        <label htmlFor="card-title">Title <span className="required">*</span></label>
        <input id="card-title" aria-required="true" value={title} onChange={e => { setTitle(e.target.value); setError(false); }} placeholder="What needs to happen?" aria-invalid={error} aria-describedby={error ? 'title-error' : undefined} />
        {error && <p id="title-error" role="alert" className="field-error">Give your card a title.</p>}
        <label htmlFor="card-details">Details <span className="optional">Optional</span></label>
        <textarea id="card-details" value={details} onChange={e => setDetails(e.target.value)} placeholder="Add a little context…" rows={5} />
        <div className="dialog-actions">
          {editor.card && <button type="button" className="delete-button" aria-label="Delete card" onClick={() => setConfirmDelete(true)}><Trash2 size={16} /></button>}
          <div className="action-spacer" />
          <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="primary-button">{editor.card ? 'Save changes' : 'Add card'}<ArrowUpRight size={16} /></button>
        </div>
      </form>}
    </Dialog.Content>
  </Dialog.Portal>;
}

function BoardCard({ card, index, columnId, onEdit, onDelete }: { card: Card; index: number; columnId: string; onEdit: (trigger: HTMLElement) => void; onDelete: (trigger: HTMLElement) => void }) {
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({ id: card.id, index, group: columnId, type: 'card', accept: 'card', collisionDetector: pointerIntersection });
  return <article ref={ref} className={`card ${isDragging ? 'dragging' : ''} ${isDropTarget ? 'drop-target' : ''}`} data-testid="card" data-card-id={card.id}>
    <button className="card-content" onClick={event => onEdit(event.currentTarget)} aria-label={`Edit ${card.title}`}>
      <h3>{card.title}</h3><p>{card.details || 'An idea waiting to take shape.'}</p>
    </button>
    <button className="card-edit" aria-label={`Edit card: ${card.title}`} title="Edit card" onClick={event => onEdit(event.currentTarget)}><Pencil size={13} /></button>
    <div className="card-foot"><span className="card-rule" /><div className="card-controls"><button className="card-delete" aria-label={`Delete ${card.title}`} title="Delete card" onClick={event => onDelete(event.currentTarget)}><Trash2 size={14} /></button><button ref={handleRef} className="drag-handle" aria-label={`Move ${card.title}`} title="Drag to move. Use Space and arrow keys with a keyboard."><GripVertical size={16} /></button></div></div>
  </article>;
}

export function ColumnHeading({ column, dispatch }: { column: Column; dispatch: (action: BoardAction) => void }) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(column.name);
  const canceled = useRef(false);
  function finish() {
    if (!canceled.current) dispatch({ type: 'rename', columnId: column.id, name });
    setRenaming(false);
  }
  return renaming ? <input className="column-name-input" autoFocus aria-label={`Rename ${column.name}`} value={name} onChange={e => setName(e.target.value)} onBlur={finish} onKeyDown={e => {
    if (e.key === 'Enter') { e.preventDefault(); finish(); }
    if (e.key === 'Escape') { canceled.current = true; setRenaming(false); }
  }} /> : <button className="column-name" aria-label={`Rename ${column.name}`} title="Rename column" onClick={() => { canceled.current = false; setName(column.name); setRenaming(true); }}><h2>{column.name}</h2><Pencil size={12} /></button>;
}

function BoardColumn({ column, index, dispatch, openEditor }: { column: Column; index: number; dispatch: (action: BoardAction) => void; openEditor: (editor: Editor, trigger: HTMLElement) => void }) {
  const { ref, isDropTarget } = useDroppable({ id: column.id, type: 'column', accept: 'card', collisionPriority: CollisionPriority.Low, collisionDetector: pointerIntersection });
  return <section ref={ref} className={`column ${isDropTarget ? 'column-over' : ''}`} style={{ '--column-color': colors[index] } as CSSProperties} aria-label={`${column.name} column`} data-testid={column.id}>
    <div className="column-heading"><span className="status-dot">{index === 4 && <Check size={8} />}</span><ColumnHeading column={column} dispatch={dispatch} /><span className="column-count">{column.cards.length}</span><button className="column-add icon-button" aria-label={`Add card to ${column.name}`} onClick={e => openEditor({ columnId: column.id }, e.currentTarget)}><Plus size={17} /></button></div>
    <div className="card-list">{column.cards.map((card, i) => <BoardCard key={card.id} card={card} index={i} columnId={column.id} onEdit={trigger => openEditor({ columnId: column.id, card }, trigger)} onDelete={trigger => openEditor({ columnId: column.id, card, deleteRequested: true }, trigger)} />)}
      {!column.cards.length && <div className="empty-column"><Layers2 size={23} /><p>A fresh start.</p><span>Add a card or drop one here.</span></div>}
    </div>
    <button className="add-card" onClick={e => openEditor({ columnId: column.id }, e.currentTarget)}><Plus size={15} />Add card</button>
  </section>;
}

export default function Board() {
  const [columns, dispatch] = useReducer(boardReducer, undefined, createSampleBoard);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const snapshot = useRef(columns);
  const [trigger, setTrigger] = useState<HTMLElement | null>(null);
  function openEditor(value: Editor, element: HTMLElement) { setTrigger(element); setEditor(value); }
  const total = columns.reduce((sum, c) => sum + c.cards.length, 0);
  const done = columns[4].cards.length;
  return <main>
    <header className="topbar"><div className="brand"><span className="brand-mark"><i /><i /><i /></span>forma<span className="brand-period">.</span></div><span className="topbar-divider" /><div className="workspace-label">Your workspace<ChevronRight size={13} /><span>Product Launch</span></div><span className="session-note"><span />Personal workspace</span></header>
    <div className="board-shell">
      <div className="board-intro"><div><div className="eyebrow"><span />A LITTLE CLARITY. A LOT OF MOMENTUM.</div><h1>Product Launch<span className="title-period">.</span></h1><p>Big ideas, small steps. Bring it all together here.</p></div><button className="primary-button new-card" onClick={e => openEditor({ columnId: columns[0].id }, e.currentTarget)}><Plus size={17} />New card</button></div>
      <div className="board-toolbar"><div className="board-tab"><LayoutGrid size={15} />Board<span className="total-count">{total}</span></div><div className="progress-summary"><span>{done} of {total} complete</span><div className="progress-track"><span style={{ width: `${total ? done / total * 100 : 0}%` }} /></div></div></div>
      <DragDropProvider
        onDragStart={() => { snapshot.current = columns; setAnnouncement('Card picked up. Use arrow keys to move, Space to drop, Escape to cancel.'); }}
        onDragOver={event => {
          if (!event.operation.target) return;
          const items = Object.fromEntries(columns.map(c => [c.id, c.cards]));
          const next = move(items, event);
          const cardId = String(event.operation.source!.id);
          const destination = columns.find(c => next[c.id].some(card => card.id === cardId))!;
          dispatch({ type: 'move', cardId, columnId: destination.id, index: next[destination.id].findIndex(card => card.id === cardId) });
        }}
        onDragEnd={event => {
          if (event.canceled || !event.operation.target) { dispatch({ type: 'restore', columns: snapshot.current }); setAnnouncement('Move canceled.'); }
          else {
            const destination = columns.find(c => c.cards.some(card => card.id === event.operation.source?.id));
            setAnnouncement(`Card moved to ${destination?.name}.`);
          }
        }}>
        <div className="board-scroll"><div className="board-grid">{columns.map((column, i) => <BoardColumn key={column.id} column={column} index={i} dispatch={dispatch} openEditor={openEditor} />)}</div></div>
      </DragDropProvider>
      <footer className="board-footer"><span><span className="footer-dot" />Space to focus. Room to make progress.</span><span>Drag cards to find their next step<ArrowUpRight size={12} /></span></footer>
    </div>
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    <Dialog.Root open={!!editor} onOpenChange={open => { if (!open) setEditor(null); }}>
      {editor && <CardEditor editor={editor} columnName={columns.find(c => c.id === editor.columnId)!.name} dispatch={dispatch} onClose={() => setEditor(null)} trigger={trigger} />}
    </Dialog.Root>
  </main>;
}

