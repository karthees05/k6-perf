import http from "k6/http";
import { check } from "k6";
import type { Options } from "k6/options";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.1.0/index.js";
import { getRuntimeConfig } from "../config/runtime.js";
import { buildOptionsFromPlan, buildProfileGraphHtml, buildProfilePlan } from "../core/loadProfiles.js";
import { normalizeHttpRequestMetric } from "../core/summaryHelpers.js";

const runtime = getRuntimeConfig();
const profilePlan = buildProfilePlan(runtime);

export const options: Options = {
  ...buildOptionsFromPlan(profilePlan, "defaultScenario", false),
  thresholds: {
    checks: ["rate>=0.95"],
    iteration_duration: ["p(95)<60000"]
  }
};

export function defaultScenario(): void {
  const response = http.get(runtime.baseUrl);
  check(response, {
    "virtual run - home page returns 200": (res) => res.status === 200
  });
}

export function handleSummary(data: Record<string, unknown>) {
  normalizeHttpRequestMetric(data as any);
  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    "k6-summary.html": htmlReport(data),
    "k6-summary.json": JSON.stringify(data, null, 2),
    "k6-profile-graph.html": buildProfileGraphHtml(profilePlan)
  };
}
