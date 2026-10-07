import { describe, expect, it } from 'vitest';
import { boardReducer, createSampleBoard } from './board';
describe('board state', () => {
  it('starts with five columns and twelve unique cards', () => {
    const board = createSampleBoard();
    expect(board).toHaveLength(5);
    expect(new Set(board.flatMap(c => c.cards.map(c => c.id))).size).toBe(12);
  });
  it('appends a card only to its destination without mutating the initial board', () => {
    const board = createSampleBoard();
    const card = { id: 'new', title: 'Test', details: '' };
    const next = boardReducer(board, { type: 'add', columnId: board[1].id, card });
    expect(next[1].cards.at(-1)).toEqual(card);
    expect(board[1].cards).toHaveLength(3);
    expect(next[0]).toBe(board[0]);
  });
  it('edits only the selected card and deletes it', () => {
    const board = createSampleBoard();
    const card = { ...board[0].cards[0], title: 'Changed', details: 'Full details' };
    const edited = boardReducer(board, { type: 'edit', card });
    expect(edited[0].cards[0]).toEqual(card);
    expect(edited[0].cards[1]).toEqual(board[0].cards[1]);
    expect(boardReducer(edited, { type: 'delete', cardId: card.id })[0].cards).toHaveLength(2);
  });
  it('trims a column name and ignores blank renames', () => {
    const board = createSampleBoard();
    expect(boardReducer(board, { type: 'rename', columnId: board[0].id, name: '  Ideas  ' })[0].name).toBe('Ideas');
    expect(boardReducer(board, { type: 'rename', columnId: board[0].id, name: ' ' })[0].name).toBe('Backlog');
  });
  it('reorders first to last and last to first', () => {
    const board = createSampleBoard();
    const last = boardReducer(board, { type: 'move', cardId: board[0].cards[0].id, columnId: board[0].id, index: 2 });
    expect(last[0].cards.map(c => c.id)).toEqual(['card-0-1', 'card-0-2', 'card-0-0']);
    expect(boardReducer(last, { type: 'move', cardId: 'card-0-0', columnId: board[0].id, index: 0 })).toEqual(board);
  });
  it('moves between columns at a specified position preserving content and uniqueness', () => {
    const board = createSampleBoard();
    const next = boardReducer(board, { type: 'move', cardId: 'card-0-0', columnId: board[1].id, index: 1 });
    expect(next[1].cards[1]).toEqual(board[0].cards[0]);
    expect(next[0].cards).toHaveLength(2);
    expect(next.flatMap(c => c.cards)).toHaveLength(12);
    expect(new Set(next.flatMap(c => c.cards.map(c => c.id))).size).toBe(12);
  });
  it('moves to an empty column and restores a canceled move', () => {
    const board = createSampleBoard().map((c, i) => i === 4 ? { ...c, cards: [] } : c);
    const next = boardReducer(board, { type: 'move', cardId: 'card-0-0', columnId: board[4].id, index: 0 });
    expect(next[4].cards).toEqual([board[0].cards[0]]);
    expect(boardReducer(next, { type: 'restore', columns: board })).toBe(board);
  });
  it('leaves state unchanged for a missing destination', () => {
    const board = createSampleBoard();
    expect(boardReducer(board, { type: 'move', cardId: 'card-0-0', columnId: 'missing', index: 0 })).toBe(board);
  });
});
