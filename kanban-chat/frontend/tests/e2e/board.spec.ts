import { test, expect, type Page, type Locator } from '@playwright/test';

async function cardIds(column: Locator) { return column.getByTestId('card').evaluateAll(cards => cards.map(c => c.getAttribute('data-card-id'))); }
async function drag(page: Page, source: Locator, destination: Locator, fraction = .5) {
  await source.scrollIntoViewIfNeeded();
  const from = await source.boundingBox();
  await destination.scrollIntoViewIfNeeded();
  const to = await destination.boundingBox();
  if (!from || !to) throw new Error('Missing drag geometry');
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 12, from.y + from.height / 2, { steps: 5 });
  await page.waitForTimeout(200);
  await page.mouse.move(to.x + to.width / 2, to.y + to.height * fraction, { steps: 20 });
  await page.waitForTimeout(350);
  await page.mouse.up();
}

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Product Launch.' })).toBeVisible();
});

test.afterEach(async ({ page }) => { expect(runtimeErrors.get(page) ?? []).toEqual([]); });

test('sample board, responsive layout, and clean runtime', async ({ page }, testInfo) => {
  await page.reload();
  await expect(page.getByTestId('card')).toHaveCount(12);
  await expect(page.locator('.column')).toHaveCount(5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Edit Explore onboarding ideas', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Title', { exact: false })).toBeFocused();
  await page.screenshot({ path: testInfo.outputPath('editor.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await page.screenshot({ path: testInfo.outputPath('board.png'), fullPage: true });
});

test('create, validate, edit, cancel, delete, and reset', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'New card', exact: true });
  await trigger.click();
  await page.getByRole('button', { name: 'Add card', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('Give your card a title.');
  await page.getByLabel('Title', { exact: false }).fill('  A fresh idea  ');
  await page.getByLabel('Details', { exact: false }).fill('First line\nSecond line');
  await page.getByRole('button', { name: 'Add card', exact: true }).click();
  await expect(page.getByTestId('column-0').getByTestId('card')).toHaveCount(4);
  await expect(trigger).toBeFocused();
  const edit = page.getByRole('button', { name: 'Edit A fresh idea', exact: true });
  await edit.click();
  await page.getByLabel('Title', { exact: false }).fill('An improved idea');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByRole('button', { name: 'Edit An improved idea', exact: true }).click();
  await expect(page.getByLabel('Details', { exact: false })).toHaveValue('First line\nSecond line');
  await page.getByLabel('Title', { exact: false }).fill('Discard me');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit An improved idea', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Edit An improved idea', exact: true }).click();
  await page.getByRole('button', { name: 'Delete card', exact: true }).click();
  await page.getByRole('button', { name: 'Keep card', exact: true }).click();
  await page.getByRole('button', { name: 'Delete card', exact: true }).click();
  await page.getByRole('button', { name: 'Delete card', exact: true }).click();
  await expect(page.getByTestId('card')).toHaveCount(12);
  await expect(trigger).toBeFocused();
  await page.getByRole('button', { name: 'Add card to To Do', exact: true }).click();
  await page.getByLabel('Title', { exact: false }).fill('Temporary');
  await page.getByRole('button', { name: 'Add card', exact: true }).click();
  await expect(page.getByTestId('column-1').getByTestId('card')).toHaveCount(4);
  await page.reload();
  await expect(page.getByTestId('card')).toHaveCount(12);
  await expect(page.getByRole('button', { name: 'Edit Temporary', exact: true })).toHaveCount(0);
});

test('column rename saves on Enter and blur, cancels on Escape, rejects blank names', async ({ page }) => {
  await page.getByRole('button', { name: 'Rename Backlog', exact: true }).click();
  await page.getByRole('textbox', { name: 'Rename Backlog' }).fill('Ideas');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Ideas', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rename Ideas', exact: true }).click();
  await page.getByRole('textbox', { name: 'Rename Ideas' }).fill('Canceled');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'Ideas', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rename Ideas', exact: true }).click();
  await page.getByRole('textbox', { name: 'Rename Ideas' }).fill('  ');
  await page.getByRole('heading', { name: 'Product Launch.' }).click();
  await expect(page.getByRole('heading', { name: 'Ideas', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Rename Ideas', exact: true }).click();
  await page.getByRole('textbox', { name: 'Rename Ideas' }).fill('Ready');
  await page.getByRole('heading', { name: 'Product Launch.' }).click();
  await expect(page.getByRole('heading', { name: 'Ready', exact: true })).toBeVisible();
});

test('dialog traps focus and Escape discards edits', async ({ page }) => {
  const trigger = page.getByRole('button', { name: 'New card', exact: true });
  await trigger.click();
  await page.getByLabel('Title', { exact: false }).fill('Discarded');
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    expect(await page.getByRole('dialog').evaluate(d => d.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(trigger).toBeFocused();
  await expect(page.getByTestId('card')).toHaveCount(12);
});

test('pointer reorder, cross-column moves, and empty-column drop preserve cards', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Touch is covered separately.');
  const backlog = page.getByTestId('column-0');
  await drag(page, page.getByRole('button', { name: 'Move Explore onboarding ideas', exact: true }), backlog.getByTestId('card').last(), .8);
  await expect.poll(() => cardIds(backlog)).toEqual(['card-0-1', 'card-0-2', 'card-0-0']);
  await drag(page, page.getByRole('button', { name: 'Move Explore onboarding ideas', exact: true }), backlog.getByTestId('card').first(), .2);
  await expect.poll(() => cardIds(backlog)).toEqual(['card-0-0', 'card-0-1', 'card-0-2']);
  await drag(page, page.getByRole('button', { name: 'Move Explore onboarding ideas', exact: true }), page.getByTestId('column-1').getByTestId('card').first(), .2);
  await expect(page.getByTestId('column-1').getByRole('button', { name: 'Edit Explore onboarding ideas', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Edit Define the product vision', exact: true }).click();
  await page.getByRole('button', { name: 'Delete card', exact: true }).click();
  await page.getByRole('button', { name: 'Delete card', exact: true }).click();
  await drag(page, page.getByRole('button', { name: 'Move Explore onboarding ideas', exact: true }), page.getByTestId('column-4').locator('.empty-column'));
  await expect(page.getByTestId('column-4').getByRole('button', { name: 'Edit Explore onboarding ideas', exact: true })).toBeVisible();
  await expect(page.getByTestId('card')).toHaveCount(11);
  expect(new Set(await page.getByTestId('card').evaluateAll(cards => cards.map(c => c.getAttribute('data-card-id')))).size).toBe(11);
});

test('keyboard moves and cancellation preserve content and order', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Keyboard tested on desktop browsers.');
  const backlog = page.getByTestId('column-0');
  const handle = page.getByRole('button', { name: 'Move Explore onboarding ideas', exact: true });
  await handle.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(250);
  await page.keyboard.press('Space');
  await expect.poll(() => cardIds(backlog)).toEqual(['card-0-1', 'card-0-0', 'card-0-2']);
  await handle.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(250);
  await page.keyboard.press('Space');
  await expect(page.getByTestId('column-1').getByRole('button', { name: 'Edit Explore onboarding ideas', exact: true })).toBeVisible();
  await expect(handle).toBeFocused();
  await expect(page.getByTestId('card')).toHaveCount(12);
  const before = await page.getByTestId('card').evaluateAll(cards => cards.map(c => c.getAttribute('data-card-id')));
  await handle.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  await expect.poll(() => page.getByTestId('card').evaluateAll(cards => cards.map(c => c.getAttribute('data-card-id')))).toEqual(before);
  await expect(page.getByTestId('card')).toHaveCount(12);
});

test('dropping outside the board leaves the order unchanged', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Pointer case.');
  const before = await cardIds(page.getByTestId('column-0'));
  await drag(page, page.getByRole('button', { name: 'Move Explore onboarding ideas', exact: true }), page.locator('.topbar'));
  await expect.poll(() => cardIds(page.getByTestId('column-0'))).toEqual(before);
});

test('touch reorders cards on a narrow screen', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Touch scenario.');
  await page.getByTestId('column-0').getByTestId('card').last().scrollIntoViewIfNeeded();
  const handle = await page.getByRole('button', { name: 'Move Explore onboarding ideas', exact: true }).boundingBox();
  const target = await page.getByTestId('column-0').getByTestId('card').last().boundingBox();
  if (!handle || !target) throw new Error('Missing touch geometry');
  const session = await page.context().newCDPSession(page);
  const x = handle.x + handle.width / 2, y = handle.y + handle.height / 2;
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await page.waitForTimeout(300);
  for (let step = 1; step <= 15; step++) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y + (target.y + target.height * .8 - y) * step / 15 }] });
    await page.waitForTimeout(20);
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(() => cardIds(page.getByTestId('column-0'))).toEqual(['card-0-1', 'card-0-2', 'card-0-0']);
});

test('keyboard drops into an empty column and cancels a cross-column move', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Keyboard scenario.');
  await page.getByRole('button', { name: 'Edit Define the product vision', exact: true }).click();
  await page.getByRole('button', { name: 'Delete card', exact: true }).click();
  await page.getByRole('button', { name: 'Delete card', exact: true }).click();
  const handle = page.getByRole('button', { name: 'Move Test the signup flow', exact: true });
  await handle.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.press('Space');
  await expect(page.getByTestId('column-4').getByRole('button', { name: 'Edit Test the signup flow', exact: true })).toBeVisible();
  await expect(page.getByTestId('card')).toHaveCount(11);
  await handle.focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(300);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('column-4').getByRole('button', { name: 'Edit Test the signup flow', exact: true })).toBeVisible();
  await expect(page.getByTestId('card')).toHaveCount(11);
});

test('delete directly from a card with confirmation and focus restoration', async ({ page }) => {
  const remove = page.getByRole('button', { name: 'Delete Explore onboarding ideas', exact: true });
  await remove.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Delete this card?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Keep card' })).toBeFocused();
  await page.getByRole('button', { name: 'Keep card' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(remove).toBeFocused();
  await expect(page.getByTestId('card')).toHaveCount(12);
  await remove.click();
  await page.getByRole('button', { name: 'Delete card', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Edit Explore onboarding ideas', exact: true })).toHaveCount(0);
  await expect(page.getByTestId('card')).toHaveCount(11);
  await expect(page.getByRole('button', { name: 'New card', exact: true })).toBeFocused();
});

test('pencil beside the title opens the editor and restores focus', async ({ page }) => {
  const pencil = page.getByRole('button', { name: 'Edit card: Explore onboarding ideas', exact: true });
  await pencil.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByLabel('Title', { exact: false })).toHaveValue('Explore onboarding ideas');
  await page.getByLabel('Title', { exact: false }).fill('A refined onboarding idea');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('button', { name: 'Edit card: A refined onboarding idea', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Edit A refined onboarding idea', exact: true }).click();
  await expect(page.getByLabel('Title', { exact: false })).toHaveValue('A refined onboarding idea');
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('card')).toHaveCount(12);
});
