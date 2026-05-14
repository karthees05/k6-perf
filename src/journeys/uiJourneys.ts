import { check } from "k6";
import type { Page } from "k6/browser";

const selectors = {
  appRoot: ".todoapp",
  title: ".header h1",
  input: ".new-todo",
  todoItems: ".todo-list li",
  completedItem: ".todo-list li.completed",
  clearCompleted: ".clear-completed"
};

export async function openApplication(page: Page, baseUrl: string): Promise<void> {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForSelector(selectors.appRoot);

  const titleText = await page.locator(selectors.title).textContent();
  check(titleText, {
    "flow 1 - app title is visible": (text) => (text ?? "").toLowerCase().includes("todos")
  });
}

export async function createTodos(page: Page, todos: string[]): Promise<void> {
  for (const todo of todos) {
    const input = page.locator(selectors.input);
    await input.fill(todo);
    await input.press("Enter");
  }

  const todoCount = (await page.$$(selectors.todoItems)).length;
  check(todoCount, {
    "flow 2 - todos are created": (count) => count >= todos.length
  });
}

export async function toggleTodoCompletion(page: Page): Promise<void> {
  const firstCheckbox = page.locator(`${selectors.todoItems}:nth-child(1) .toggle`);
  await firstCheckbox.click();

  let completedCount = (await page.$$(selectors.completedItem)).length;
  check(completedCount, {
    "flow 3 - todo completed": (count) => count >= 1
  });

  await firstCheckbox.click();
  completedCount = (await page.$$(selectors.completedItem)).length;
  check(completedCount, {
    "flow 3 - todo uncompleted": (count) => count === 0
  });
}

export async function editSecondTodo(page: Page, updatedText: string): Promise<void> {
  const secondTodoLabel = page.locator(`${selectors.todoItems}:nth-child(2) label`);
  await secondTodoLabel.dblclick();

  const secondTodoEdit = page.locator(`${selectors.todoItems}:nth-child(2) .edit`);
  await secondTodoEdit.fill(updatedText);
  await secondTodoEdit.press("Enter");

  const secondTodoUpdatedLabel = await page.locator(`${selectors.todoItems}:nth-child(2) label`).textContent();
  check(secondTodoUpdatedLabel, {
    "flow 4 - todo text updated": (text) => text === updatedText
  });
}

export async function filterAndClearCompleted(page: Page): Promise<void> {
  const firstCheckbox = page.locator(`${selectors.todoItems}:nth-child(1) .toggle`);
  await firstCheckbox.click();

  await page.locator('a[href="#/active"]').click();
  const activeCount = (await page.$$(selectors.todoItems)).length;
  check(activeCount, {
    "flow 5 - active filter hides completed": (count) => count >= 1
  });

  await page.locator('a[href="#/completed"]').click();
  const completedCount = (await page.$$(selectors.todoItems)).length;
  check(completedCount, {
    "flow 5 - completed filter shows completed": (count) => count >= 1
  });

  await page.locator(selectors.clearCompleted).click();
  await page.waitForSelector(selectors.completedItem, { state: "detached" });
  await page.locator('a[href="#/"]').click();
  const remainingCompleted = (await page.$$(selectors.completedItem)).length;
  check(remainingCompleted, {
    "flow 5 - clear completed removed one item": (count) => count === 0
  });
}
