export type Card = { id: string; title: string; details: string };
export type Column = { id: string; name: string; cards: Card[] };
export type BoardAction =
  | { type: 'add'; columnId: string; card: Card }
  | { type: 'edit'; card: Card }
  | { type: 'delete'; cardId: string }
  | { type: 'rename'; columnId: string; name: string }
  | { type: 'move'; cardId: string; columnId: string; index: number }
  | { type: 'restore'; columns: Column[] };

export function boardReducer(columns: Column[], action: BoardAction): Column[] {
  switch (action.type) {
    case 'restore': return action.columns;
    case 'add': return columns.map(c => c.id === action.columnId ? { ...c, cards: [...c.cards, action.card] } : c);
    case 'edit': return columns.map(c => ({ ...c, cards: c.cards.map(card => card.id === action.card.id ? action.card : card) }));
    case 'delete': return columns.map(c => ({ ...c, cards: c.cards.filter(card => card.id !== action.cardId) }));
    case 'rename': return columns.map(c => c.id === action.columnId && action.name.trim() ? { ...c, name: action.name.trim() } : c);
    case 'move': {
      const card = columns.flatMap(c => c.cards).find(c => c.id === action.cardId);
      if (!card || !columns.some(c => c.id === action.columnId)) return columns;
      return columns.map(c => {
        const cards = c.cards.filter(c => c.id !== action.cardId);
        if (c.id === action.columnId) cards.splice(action.index, 0, card);
        return { ...c, cards };
      });
    }
  }
}

const samples = [
  ['Backlog', [
    ['Explore onboarding ideas', 'Find a welcoming first-run experience that helps people get to their first win. Gather inspiration and sketch three directions.'],
    ['Map the customer journey', 'Trace the path from discovery to daily use. Identify the moments where we can make things feel effortless.'],
    ['Plan the launch story', 'Bring our positioning, key messages, and launch channels together in one clear narrative.'],
  ]],
  ['To Do', [
    ['Design the landing page', 'Turn the product story into a focused page. Lead with the value, show the experience, and make the next step clear.'],
    ['Write product copy', 'Give every screen a consistent voice. Keep the language useful, warm, and refreshingly simple.'],
    ['Set up analytics', 'Define the handful of events we need to understand activation and the core product experience.'],
  ]],
  ['In Progress', [
    ['Build the core experience', 'Connect the key interactions into a smooth, cohesive flow. Sweat the small details along the way.'],
    ['Create the design system', 'Refine the color palette, type scale, spacing, and reusable components for a consistent experience.'],
    ['Prepare launch assets', 'Create a cohesive set of product screenshots and visuals for the launch announcement.'],
  ]],
  ['Review', [
    ['Test the signup flow', 'Walk through the complete journey on desktop and mobile. Check the happy path and every error state.'],
    ['Review accessibility', 'Check keyboard navigation, focus states, readable contrast, and screen reader labels.'],
  ]],
  ['Done', [
    ['Define the product vision', 'A shared direction for what we are building, who it is for, and why it matters. Ready to bring to life.'],
  ]],
] as const;

export function createSampleBoard(): Column[] {
  return samples.map(([name, cards], i) => ({ id: `column-${i}`, name, cards: cards.map(([title, details], j) => ({ id: `card-${i}-${j}`, title, details })) }));
}
