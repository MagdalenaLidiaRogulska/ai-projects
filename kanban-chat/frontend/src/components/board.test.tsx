import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as Dialog from '@radix-ui/react-dialog';
import { CardEditor, ColumnHeading } from './board';
const card = { id: 'one', title: 'An idea', details: 'Some context' };
function editor(existing = false) {
  const dispatch = vi.fn(), onClose = vi.fn();
  render(<Dialog.Root open><CardEditor editor={{ columnId: 'backlog', card: existing ? card : undefined }} columnName="Backlog" dispatch={dispatch} onClose={onClose} /></Dialog.Root>);
  return { dispatch, onClose, user: userEvent.setup() };
}
describe('card editor', () => {
  it('focuses title, validates whitespace, and submits trimmed content', async () => {
    const { dispatch, user } = editor();
    expect(screen.getByLabelText(/Title/)).toHaveFocus();
    await user.type(screen.getByLabelText(/Title/), '   ');
    await user.click(screen.getByRole('button', { name: 'Add card' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Give your card a title');
    expect(dispatch).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText(/Title/), 'Ship it  ');
    await user.type(screen.getByLabelText(/Details/), 'Context');
    await user.click(screen.getByRole('button', { name: 'Add card' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'add', columnId: 'backlog', card: { id: expect.any(String), title: 'Ship it', details: 'Context' } });
  });
  it('edits a card and saves its identity', async () => {
    const { dispatch, user } = editor(true);
    await user.clear(screen.getByLabelText(/Title/));
    await user.type(screen.getByLabelText(/Title/), 'Refined idea');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'edit', card: { ...card, title: 'Refined idea' } });
  });
  it('cancel discards changes', async () => {
    const { dispatch, onClose, user } = editor(true);
    await user.type(screen.getByLabelText(/Title/), 'unsaved');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(dispatch).not.toHaveBeenCalled(); expect(onClose).toHaveBeenCalled();
  });
  it('requires confirmation and lets the user keep or delete the card', async () => {
    const { dispatch, user } = editor(true);
    await user.click(screen.getByRole('button', { name: 'Delete card' }));
    expect(dispatch).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Keep card' }));
    expect(screen.getByLabelText(/Title/)).toHaveValue('An idea');
    await user.click(screen.getByRole('button', { name: 'Delete card' }));
    await user.click(screen.getByRole('button', { name: 'Delete card' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'delete', cardId: 'one' });
  });
});
describe('column heading', () => {
  it('saves on Enter and cancels on Escape', async () => {
    const dispatch = vi.fn(), user = userEvent.setup();
    render(<ColumnHeading column={{ id: 'backlog', name: 'Backlog', cards: [] }} dispatch={dispatch} />);
    await user.click(screen.getByRole('button', { name: 'Rename Backlog' }));
    await user.clear(screen.getByRole('textbox'));
    await user.type(screen.getByRole('textbox'), 'Ideas{Enter}');
    expect(dispatch).toHaveBeenCalledWith({ type: 'rename', columnId: 'backlog', name: 'Ideas' });
    dispatch.mockClear();
    await user.click(screen.getByRole('button', { name: 'Rename Backlog' }));
    await user.type(screen.getByRole('textbox'), 'discard{Escape}');
    expect(dispatch).not.toHaveBeenCalled();
  });
});
