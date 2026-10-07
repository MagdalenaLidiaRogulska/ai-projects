export type Card = {
  id: string;
  title: string;
  details: string;
};

export type Column = {
  id: string;
  title: string;
  cards: Card[];
};

export type Board = {
  columns: Column[];
};

const DEFAULT_COLUMN_TITLES = [
  "Backlog",
  "In Progress",
  "Review",
  "Blocked",
  "Done",
];

let idCounter = 0;

const createId = (prefix: string) => {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
};

export const createCard = (title: string, details: string): Card => ({
  id: createId("card"),
  title: title.trim(),
  details: details.trim(),
});

const seedCard = (id: string, title: string, details: string): Card => ({
  id,
  title,
  details,
});

export const initialBoard = (): Board => ({
  columns: [
    {
      id: "backlog",
      title: "Backlog",
      cards: [
        seedCard("seed-backlog-1", "Kickoff planning", "Align design, scope, and stakeholder expectations."),
        seedCard("seed-backlog-2", "User research", "Review interview notes and call out top friction points."),
      ],
    },
    {
      id: "in-progress",
      title: "In Progress",
      cards: [seedCard("seed-progress-1", "Design system", "Refine card spacing, components, and action styles.")],
    },
    {
      id: "review",
      title: "Review",
      cards: [seedCard("seed-review-1", "Accessibility pass", "Check contrast, focus states, and keyboard flow.")],
    },
    {
      id: "blocked",
      title: "Blocked",
      cards: [seedCard("seed-blocked-1", "Waiting on asset", "Need final brand icons from marketing.")],
    },
    {
      id: "done",
      title: "Done",
      cards: [
        seedCard("seed-done-1", "Prototype feedback", "Share the first click-through with the product team."),
        seedCard("seed-done-2", "Sprint brief", "Publish the sprint goals and milestone summary."),
      ],
    },
  ],
});

export const addCard = (
  board: Board,
  columnId: string,
  rawTitle: string,
  rawDetails: string,
): Board => {
  const title = rawTitle.trim();
  if (!title) {
    return board;
  }

  return {
    columns: board.columns.map((column) =>
      column.id === columnId
        ? {
            ...column,
            cards: [...column.cards, createCard(title, rawDetails)],
          }
        : column,
    ),
  };
};

export const deleteCard = (board: Board, columnId: string, cardId: string): Board => ({
  columns: board.columns.map((column) => {
    if (column.id !== columnId) {
      return column;
    }

    return {
      ...column,
      cards: column.cards.filter((card) => card.id !== cardId),
    };
  }),
});

export const renameColumn = (
  board: Board,
  columnId: string,
  nextTitle: string,
): Board => ({
  columns: board.columns.map((column) =>
    column.id === columnId
      ? { ...column, title: nextTitle.trim() || column.title }
      : column,
  ),
});

export const moveCard = (
  board: Board,
  activeCardId: string,
  overId: string | null,
): Board => {
  if (!activeCardId || !overId || activeCardId === overId) {
    return board;
  }

  const sourceColumnIndex = board.columns.findIndex((column) =>
    column.cards.some((card) => card.id === activeCardId),
  );

  if (sourceColumnIndex === -1) {
    return board;
  }

  const sourceColumn = board.columns[sourceColumnIndex];
  const activeCard = sourceColumn.cards.find((card) => card.id === activeCardId);

  if (!activeCard) {
    return board;
  }

  const sourceCards = sourceColumn.cards.filter((card) => card.id !== activeCardId);

  const targetColumnIndex = board.columns.findIndex((column) =>
    column.id === overId || column.cards.some((card) => card.id === overId),
  );

  if (targetColumnIndex === -1) {
    return board;
  }

  const targetColumn = board.columns[targetColumnIndex];

  if (sourceColumnIndex === targetColumnIndex) {
    const reordered = [...sourceCards];
    const targetPosition = targetColumn.cards.findIndex((card) => card.id === overId);
    const insertIndex = targetPosition === -1 ? reordered.length : targetPosition;
    reordered.splice(insertIndex, 0, activeCard);

    return {
      columns: board.columns.map((column, index) =>
        index === sourceColumnIndex ? { ...column, cards: reordered } : column,
      ),
    };
  }

  const targetCards = [...targetColumn.cards];
  const targetPosition = targetCards.findIndex((card) => card.id === overId);
  const insertIndex = targetPosition === -1 ? targetCards.length : targetPosition;
  targetCards.splice(insertIndex, 0, activeCard);

  return {
    columns: board.columns.map((column, index) => {
      if (index === sourceColumnIndex) {
        return { ...column, cards: sourceCards };
      }

      if (index === targetColumnIndex) {
        return { ...column, cards: targetCards };
      }

      return column;
    }),
  };
};

export const getDefaultColumnNames = () => [...DEFAULT_COLUMN_TITLES];
