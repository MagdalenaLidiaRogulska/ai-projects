import test from "node:test";
import assert from "node:assert/strict";

import { addCard, deleteCard, initialBoard, moveCard, renameColumn } from "./kanban";

test("initialBoard starts with five columns and seeded cards", () => {
  const board = initialBoard();

  assert.equal(board.columns.length, 5);
  assert.equal(board.columns[0].title, "Backlog");
  assert.ok(board.columns[0].cards.length > 0);
  assert.ok(board.columns.every((column) => column.cards.length >= 0));
});

test("addCard appends a new card to the specified column", () => {
  const board = initialBoard();

  const updated = addCard(board, "backlog", "New card", "Details here");

  assert.equal(updated.columns[0].cards.at(-1)?.title, "New card");
  assert.equal(updated.columns[0].cards.at(-1)?.details, "Details here");
});

test("deleteCard removes the chosen card from a column", () => {
  const board = initialBoard();
  const targetId = board.columns[0].cards[0].id;

  const updated = deleteCard(board, "backlog", targetId);

  assert.equal(
    updated.columns[0].cards.some((card) => card.id === targetId),
    false,
  );
});

test("renameColumn updates the label for the selected column", () => {
  const board = initialBoard();

  const updated = renameColumn(board, "review", "QA");

  assert.equal(updated.columns[2].title, "QA");
  assert.equal(updated.columns[0].title, "Backlog");
});

test("moveCard moves a card to another column and keeps the rest intact", () => {
  const board = initialBoard();
  const sourceId = board.columns[0].cards[0].id;

  const moved = moveCard(board, sourceId, board.columns[1].cards[0].id);

  assert.equal(moved.columns[0].cards.some((card) => card.id === sourceId), false);
  assert.equal(moved.columns[1].cards.some((card) => card.id === sourceId), true);
});
