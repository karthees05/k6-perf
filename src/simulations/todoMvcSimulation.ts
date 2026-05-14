import { browser } from "k6/browser";
import type { Options } from "k6/options";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";
import { getRuntimeConfig } from "../config/runtime.js";
import { buildOptionsFromPlan, buildProfileGraphHtml, buildProfilePlan } from "../core/loadProfiles.js";
import {
  createTodos,
  editSecondTodo,
  filterAndClearCompleted,
  openApplication,
  toggleTodoCompletion
} from "../journeys/uiJourneys.js";

// Runtime and profile plan are resolved once per process and reused.
const runtime = getRuntimeConfig();
const profilePlan = buildProfilePlan(runtime);

// Main k6 options used to control scenario execution and thresholds.
export const options: Options = {
  ...buildOptionsFromPlan(profilePlan),
  thresholds: {
    checks: ["rate>=0.95"],
    iteration_duration: ["p(95)<10000"]
  }
};

/** Executes the complete TodoMVC journey for one virtual user iteration. */
export async function runTodoMvcJourney(): Promise<void> {
  const page = await browser.newPage();

  try {
    await openApplication(page, runtime.baseUrl);
    await createTodos(page, ["Read k6 docs", "Create performance flow", "Review summary"]);
    await toggleTodoCompletion(page);
    await editSecondTodo(page, "Create reusable performance flow");
    await filterAndClearCompleted(page);
  } finally {
    await page.close();
  }
}

/** Default k6 entrypoint delegates to the named journey function. */
export default async function defaultScenario(): Promise<void> {
  await runTodoMvcJourney();
}

/** Writes console, JSON, HTML summary, and profile graph artifacts after each run. */
export function handleSummary(data: Record<string, unknown>) {
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "k6-summary.html": htmlReport(data),
    "k6-summary.json": JSON.stringify(data, null, 2),
    "k6-profile-graph.html": buildProfileGraphHtml(profilePlan)
  };
}
