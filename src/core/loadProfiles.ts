import type { Options } from "k6/options";
import type { RuntimeConfig } from "../config/runtime.js";

export interface ProfileStage {
  durationSeconds: number;
  target: number;
}

export interface ProfilePlan {
  profile: RuntimeConfig["loadProfile"];
  startVUs: number;
  stages: ProfileStage[];
  description: string;
  totalDurationSeconds: number;
}

/** Converts a numeric second value into k6 duration syntax (for example, 30s). */
function toDuration(seconds: number): string {
  return `${seconds}s`;
}

/** Formats duration text used in human-readable profile descriptions. */
function formatSeconds(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (remainder === 0) {
    return `${minutes} minutes`;
  }
  if (minutes === 0) {
    return `${remainder} seconds`;
  }
  return `${minutes}:${String(remainder).padStart(2, "0")} minutes`;
}

/** Sums all stage durations to calculate total scenario duration. */
function totalDuration(stages: ProfileStage[]): number {
  return stages.reduce((sum, stage) => sum + stage.durationSeconds, 0);
}

/**
 * Creates an abstract load plan from runtime config.
 * The same plan powers both k6 execution options and graph rendering.
 */
export function buildProfilePlan(config: RuntimeConfig): ProfilePlan {
  if (config.loadProfile === "fixed") {
    return {
      profile: "fixed",
      startVUs: config.users,
      stages: [{ durationSeconds: config.durationSeconds, target: config.users }],
      totalDurationSeconds: config.durationSeconds,
      description: `Fixed: ${config.users} virtual users run for ${formatSeconds(config.durationSeconds)}, each executing all requests sequentially.`
    };
  }

  if (config.loadProfile === "ramp-up") {
    const stages: ProfileStage[] = [
      { durationSeconds: config.rampUpBaseDurationSeconds, target: config.rampUpInitialUsers },
      { durationSeconds: config.rampUpRampDurationSeconds, target: config.rampUpTargetUsers },
      { durationSeconds: config.rampUpHoldDurationSeconds, target: config.rampUpTargetUsers }
    ];
    return {
      profile: "ramp-up",
      startVUs: config.rampUpInitialUsers,
      stages,
      totalDurationSeconds: totalDuration(stages),
      description:
        `Ramp-up: ${config.rampUpInitialUsers} virtual users run for ${formatSeconds(config.rampUpBaseDurationSeconds)}, ` +
        `ramp up to ${config.rampUpTargetUsers} for ${formatSeconds(config.rampUpRampDurationSeconds)}, then maintain ${config.rampUpTargetUsers} ` +
        `for ${formatSeconds(config.rampUpHoldDurationSeconds)}, each executing all requests sequentially.`
    };
  }

  if (config.loadProfile === "spike") {
    const stages: ProfileStage[] = [
      { durationSeconds: config.spikeBaseBeforeSeconds, target: config.spikeBaseUsers },
      { durationSeconds: config.spikeRampUpSeconds, target: config.spikePeakUsers },
      { durationSeconds: config.spikeRampDownSeconds, target: config.spikeBaseUsers },
      { durationSeconds: config.spikeBaseAfterSeconds, target: config.spikeBaseUsers }
    ];
    return {
      profile: "spike",
      startVUs: config.spikeBaseUsers,
      stages,
      totalDurationSeconds: totalDuration(stages),
      description:
        `Spike: ${config.spikeBaseUsers} virtual users run for ${formatSeconds(config.spikeBaseBeforeSeconds)}, spikes to ${config.spikePeakUsers} ` +
        `over ${formatSeconds(config.spikeRampUpSeconds)}, drops to ${config.spikeBaseUsers} over ${formatSeconds(config.spikeRampDownSeconds)}, ` +
        `maintains ${config.spikeBaseUsers} for ${formatSeconds(config.spikeBaseAfterSeconds)}, each executing all requests sequentially.`
    };
  }

  const stages: ProfileStage[] = [
    { durationSeconds: config.peakBaseBeforeSeconds, target: config.peakBaseUsers },
    { durationSeconds: config.peakRampUpSeconds, target: config.peakPeakUsers },
    { durationSeconds: config.peakPeakHoldSeconds, target: config.peakPeakUsers },
    { durationSeconds: config.peakRampDownSeconds, target: config.peakBaseUsers },
    { durationSeconds: config.peakBaseAfterSeconds, target: config.peakBaseUsers }
  ];
  return {
    profile: "peak",
    startVUs: config.peakBaseUsers,
    stages,
    totalDurationSeconds: totalDuration(stages),
    description:
      `Peak: ${config.peakBaseUsers} virtual users run for ${formatSeconds(config.peakBaseBeforeSeconds)}, ramp up to ${config.peakPeakUsers} ` +
      `over ${formatSeconds(config.peakRampUpSeconds)}, maintains ${config.peakPeakUsers} for ${formatSeconds(config.peakPeakHoldSeconds)}, ` +
      `decrease to ${config.peakBaseUsers} over ${formatSeconds(config.peakRampDownSeconds)}, maintains ${config.peakBaseUsers} ` +
      `for ${formatSeconds(config.peakBaseAfterSeconds)}, each executing all requests sequentially.`
  };
}

/** Converts a profile plan into k6 `options.scenarios` configuration. */
export function buildOptionsFromPlan(
  plan: ProfilePlan,
  execName = "runTodoMvcJourney",
  enableBrowser = true
): Options {
  const browserOptions = enableBrowser
    ? {
        options: {
          browser: {
            type: "chromium"
          }
        }
      }
    : {};

  if (plan.profile === "fixed") {
    return {
      scenarios: {
        ui_flow: {
          executor: "constant-vus",
          vus: plan.startVUs,
          duration: toDuration(plan.totalDurationSeconds),
          exec: execName,
          ...browserOptions
        }
      }
    };
  }

  return {
    scenarios: {
      ui_flow: {
        executor: "ramping-vus",
        startVUs: plan.startVUs,
        stages: plan.stages.map((stage) => ({ duration: toDuration(stage.durationSeconds), target: stage.target })),
        exec: execName,
        ...browserOptions
      }
    }
  };
}

/** Escapes dynamic text inserted into generated HTML content. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates a standalone HTML report describing and plotting users over time
 * for the selected profile plan.
 */
export function buildProfileGraphHtml(plan: ProfilePlan): string {
  const points: Array<{ time: number; vus: number }> = [{ time: 0, vus: plan.startVUs }];
  let elapsed = 0;
  let current = plan.startVUs;
  for (const stage of plan.stages) {
    elapsed += stage.durationSeconds;
    current = stage.target;
    points.push({ time: elapsed, vus: current });
  }

  const totalSeconds = Math.max(plan.totalDurationSeconds, 1);
  const maxVUs = Math.max(...points.map((point) => point.vus), 1);
  const chartWidth = 980;
  const chartHeight = 420;
  const left = 70;
  const right = 30;
  const top = 30;
  const bottom = 50;
  const innerWidth = chartWidth - left - right;
  const innerHeight = chartHeight - top - bottom;
  const toX = (t: number) => left + (t / totalSeconds) * innerWidth;
  const toY = (v: number) => top + innerHeight - (v / maxVUs) * innerHeight;

  const path = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${toX(point.time).toFixed(2)},${toY(point.vus).toFixed(2)}`)
    .join(" ");

  const rows = plan.stages
    .map(
      (stage, index) =>
        `<tr><td>${index + 1}</td><td>${stage.durationSeconds}s</td><td>${stage.target}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>k6 Load Profile Graph</title>
  <style>
    body { font-family: Segoe UI, Tahoma, sans-serif; margin: 24px; background: #f6f8fb; color: #1a202c; }
    .card { background: #fff; border: 1px solid #d9e2ef; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { margin: 8px 0; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 14px; }
    th { background: #f1f5f9; }
    .axis { stroke: #94a3b8; stroke-width: 1; }
    .line { fill: none; stroke: #0284c7; stroke-width: 3; }
  </style>
</head>
<body>
  <div class="card">
    <h1>k6 Profile Graph: ${escapeHtml(plan.profile)}</h1>
    <p>${escapeHtml(plan.description)}</p>
    <p>Total duration: ${plan.totalDurationSeconds}s | Start users: ${plan.startVUs} | Peak users: ${maxVUs}</p>
  </div>

  <div class="card">
    <svg viewBox="0 0 ${chartWidth} ${chartHeight}" width="100%" role="img" aria-label="Load profile graph">
      <line class="axis" x1="${left}" y1="${top}" x2="${left}" y2="${chartHeight - bottom}" />
      <line class="axis" x1="${left}" y1="${chartHeight - bottom}" x2="${chartWidth - right}" y2="${chartHeight - bottom}" />
      <path class="line" d="${path}" />
      <text x="${left}" y="${top - 8}" font-size="12" fill="#475569">Virtual users</text>
      <text x="${chartWidth - right - 70}" y="${chartHeight - 12}" font-size="12" fill="#475569">Time (seconds)</text>
    </svg>
  </div>

  <div class="card">
    <h2>Stage Breakdown</h2>
    <table>
      <thead>
        <tr><th>Stage</th><th>Duration</th><th>Target users</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
</body>
</html>`;
}
