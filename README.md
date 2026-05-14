# K6 TypeScript UI Performance Framework

This project is a K6-based TypeScript framework for UI performance testing with the k6 browser module. It uses the open-source TodoMVC UI at https://demo.playwright.dev/todomvc as a sample target and supports parameterized environments, base URL overrides, reusable UI journeys, multiple load profiles, and GitHub Actions execution.

## Features

- TypeScript source with `npm run build` compilation to runnable K6 JavaScript
- Parameterized environment selection with `ENV` and optional `BASE_URL` override
- Configurable load profiles: `fixed`, `ramp-up`, `spike`, `peak`
- Configurable virtual users with `USERS`
- Configurable duration with `DURATION_SECONDS`
- Reusable K6 load-profile helpers
- Reusable UI journey methods for browser-based user flows
- Scenario structure based on a user journey instead of isolated actions
- HTML and JSON reports after each K6 run
- GitHub Actions workflow for build, K6 execution, and report artifact upload

## Project Structure

- `src/config`: environment and runtime parameter handling
- `src/core`: load-profile generation
- `src/journeys`: reusable UI user journeys
- `src/simulations`: runnable K6 simulations
- `.github/workflows/k6-performance.yml`: CI build and execution workflow
- `dist`: generated JavaScript output after `npm run build`

## Environment Configuration

Default environments are configured in `src/config/environments.ts`:

```ts
dev.baseUrl = 'https://demo.playwright.dev/todomvc';
qa.baseUrl = 'https://demo.playwright.dev/todomvc';
prod.baseUrl = 'https://demo.playwright.dev/todomvc';
```

You can override the URL at runtime with `-e BASE_URL=https://example.com`.

Additional profile parameters are available for `ramp-up`, `spike`, and `peak`.

### Ramp-up Parameters

- `RAMP_UP_INITIAL_USERS`
- `RAMP_UP_TARGET_USERS`
- `RAMP_UP_BASE_DURATION_SECONDS`
- `RAMP_UP_RAMP_DURATION_SECONDS`
- `RAMP_UP_HOLD_DURATION_SECONDS`

### Spike Parameters

- `SPIKE_BASE_USERS`
- `SPIKE_PEAK_USERS`
- `SPIKE_BASE_BEFORE_SECONDS`
- `SPIKE_RAMP_UP_SECONDS`
- `SPIKE_RAMP_DOWN_SECONDS`
- `SPIKE_BASE_AFTER_SECONDS`

### Peak Parameters

- `PEAK_BASE_USERS`
- `PEAK_PEAK_USERS`
- `PEAK_BASE_BEFORE_SECONDS`
- `PEAK_RAMP_UP_SECONDS`
- `PEAK_PEAK_HOLD_SECONDS`
- `PEAK_RAMP_DOWN_SECONDS`
- `PEAK_BASE_AFTER_SECONDS`

## Install

```bash
npm install
```

K6 must also be installed locally to execute tests.

Examples:

```bash
brew install k6
```

```bash
choco install k6
```

## Build

```bash
npm run build
```

The runnable K6 script is generated at:

```bash
dist/simulations/todoMvcSimulation.js
```

## Profile Commands

Smoke test:

```bash
npm run smokeTest
```

Ramp-up profile:

```bash
npm run rampTest
```

Spike profile:

```bash
npm run spikeTest
```

Peak profile:

```bash
npm run peakTest
```

## Virtual versus browser UI runs

- `src/simulations/todoMvcSimulation.ts` is a browser-based UI journey and uses `k6/browser`.
- It runs headless when configured with `headless: true`, but it still launches Chromium processes.
- For no-browser execution, use the virtual script:

```bash
k6 run dist/simulations/todoMvcSimulationVirtual.js -e ENV=dev -e LOAD_PROFILE=fixed -e USERS=1 -e DURATION_SECONDS=10
```

Use the virtual simulation for higher-concurrency load tests and the browser simulation for real UI journey validation.

## Hover details on the profile graph

The generated `k6-profile-graph.html` now supports hover tooltips on each stage point.
When you hover over a point, it shows:

- Stage number
- Time in seconds
- Target user count

The graph does not include request counts because it is generated from the load profile plan only. Request metrics are available in `k6-summary.html`.

## Example Commands

Build only:

```bash
npm run build
```

Smoke test with defaults:

```bash
npm run smokeTest
```

Direct K6 run with custom environment and duration:

```bash
npm run build
k6 run dist/simulations/todoMvcSimulation.js \
  -e ENV=qa \
  -e LOAD_PROFILE=fixed \
  -e USERS=5 \
  -e DURATION_SECONDS=30
```

Ramp-up with custom users and duration:

```bash
k6 run dist/simulations/todoMvcSimulation.js \
  -e ENV=qa \
  -e LOAD_PROFILE=ramp-up \
  -e USERS=50 \
  -e DURATION_SECONDS=180
```

Spike with higher load:

```bash
k6 run dist/simulations/todoMvcSimulation.js \
  -e ENV=prod \
  -e LOAD_PROFILE=spike \
  -e USERS=100 \
  -e DURATION_SECONDS=120
```

Peak with a controlled rise and fall:

```bash
k6 run dist/simulations/todoMvcSimulation.js \
  -e ENV=prod \
  -e LOAD_PROFILE=peak \
  -e USERS=80 \
  -e DURATION_SECONDS=240
```

Ramp-up with explicit stage parameters (example requested):

```bash
k6 run dist/simulations/todoMvcSimulation.js \
  -e LOAD_PROFILE=ramp-up \
  -e RAMP_UP_INITIAL_USERS=5 \
  -e RAMP_UP_TARGET_USERS=10 \
  -e RAMP_UP_BASE_DURATION_SECONDS=150 \
  -e RAMP_UP_RAMP_DURATION_SECONDS=150 \
  -e RAMP_UP_HOLD_DURATION_SECONDS=300
```

Spike with explicit stage parameters (example requested):

```bash
k6 run dist/simulations/todoMvcSimulation.js \
  -e LOAD_PROFILE=spike \
  -e SPIKE_BASE_USERS=1 \
  -e SPIKE_PEAK_USERS=10 \
  -e SPIKE_BASE_BEFORE_SECONDS=240 \
  -e SPIKE_RAMP_UP_SECONDS=60 \
  -e SPIKE_RAMP_DOWN_SECONDS=60 \
  -e SPIKE_BASE_AFTER_SECONDS=240
```

Peak with explicit stage parameters (example requested):

```bash
k6 run dist/simulations/todoMvcSimulation.js \
  -e LOAD_PROFILE=peak \
  -e PEAK_BASE_USERS=2 \
  -e PEAK_PEAK_USERS=10 \
  -e PEAK_BASE_BEFORE_SECONDS=120 \
  -e PEAK_RAMP_UP_SECONDS=120 \
  -e PEAK_PEAK_HOLD_SECONDS=120 \
  -e PEAK_RAMP_DOWN_SECONDS=120 \
  -e PEAK_BASE_AFTER_SECONDS=120
```

Override the target UI:

```bash
k6 run dist/simulations/todoMvcSimulation.js \
  -e BASE_URL=https://demo.playwright.dev/todomvc \
  -e LOAD_PROFILE=fixed \
  -e USERS=10 \
  -e DURATION_SECONDS=60
```

## Load Profile Semantics

- `fixed`: keeps the requested number of virtual users constant for the whole test
- `ramp-up`: ramps from 1 virtual user to the requested number during the whole test
- `spike`: stays quiet first, surges quickly to the requested number of users, holds, then ramps down
- `peak`: ramps up, sustains the peak, then ramps back down

## UI Journey (5 User Flows)

The sample journey in `src/journeys/uiJourneys.ts` exercises TodoMVC as a realistic flow:

1. Open app and validate shell rendering
2. Create multiple todo items
3. Toggle completion and uncompletion of a task
4. Edit an existing task in place
5. Filter active/completed tasks and clear completed

## Reusing This Framework For Your UI

To adapt this framework for a real UI:

1. Replace selectors and flows in `src/journeys/uiJourneys.ts`
2. Add authentication flow handling if login is required
3. Add realistic user data and business validations
4. Tune thresholds in `src/simulations/todoMvcSimulation.ts`
5. Create separate journeys for flows such as login, search, checkout, booking, order tracking, or profile updates

## HTML Report

Every K6 run writes these files in the repository root:

```bash
k6-summary.html
k6-summary.json
k6-profile-graph.html
```

Open `k6-summary.html` in a browser for a static report with headline metrics and checks.

Example:

```bash
npm run build
k6 run dist/simulations/todoMvcSimulation.js -e USERS=5 -e DURATION_SECONDS=30
```

In GitHub Actions, download the artifact named `k6-reports` from the workflow run. It contains `k6-summary.html`, `k6-summary.json`, and `k6-profile-graph.html`.

`k6-profile-graph.html` is a separate HTML artifact that visualizes the selected load profile as a users-versus-time graph and includes a plain-language description of what happens in that profile.

## Reports And Metrics

Every run writes a K6 summary to stdout, `k6-summary.html`, and `k6-summary.json`.

Useful metrics to review:

- Success and failure percentages
- Check pass rate
- Browser/UI iteration duration
- p50, p90, p95, and p99 durations
- Error distribution and failed checks
- Active users versus response time under each load profile

## GitHub Actions

The workflow at `.github/workflows/k6-performance.yml` runs on pushes to `main`, pull requests, and manual dispatch.

### Manual Workflow Inputs

**Basic Parameters**

- `environment`: `dev`, `qa`, or `prod`
- `load_profile`: `fixed`, `ramp-up`, `spike`, or `peak`
- `users`: virtual users (for simple tests)
- `duration_seconds`: test duration
- `base_url`: optional target URL override

**Ramp-up Profile Parameters**

- `ramp_up_initial_users`: starting virtual users (default: 1)
- `ramp_up_target_users`: peak virtual users (default: 10)
- `ramp_up_base_duration_seconds`: initial base duration (default: 60)
- `ramp_up_ramp_duration_seconds`: ramp up phase duration (default: 60)
- `ramp_up_hold_duration_seconds`: hold at peak duration (default: 60)

**Spike Profile Parameters**

- `spike_base_users`: base virtual users (default: 1)
- `spike_peak_users`: peak during spike (default: 10)
- `spike_base_before_seconds`: base duration before spike (default: 60)
- `spike_ramp_up_seconds`: ramp to peak duration (default: 30)
- `spike_ramp_down_seconds`: ramp from peak duration (default: 30)
- `spike_base_after_seconds`: base duration after spike (default: 60)

**Peak Profile Parameters**

- `peak_base_users`: base virtual users (default: 2)
- `peak_peak_users`: peak virtual users (default: 10)
- `peak_base_before_seconds`: base duration before ramp (default: 60)
- `peak_ramp_up_seconds`: ramp up phase duration (default: 60)
- `peak_peak_hold_seconds`: hold at peak duration (default: 60)
- `peak_ramp_down_seconds`: ramp down phase duration (default: 60)
- `peak_base_after_seconds`: base duration after ramp (default: 60)

The workflow installs dependencies with `npm ci`, builds the TypeScript suite with `npm run build`, installs K6 using `grafana/setup-k6-action@v1`, runs the bundled simulation with `grafana/run-k6-action@v1`, and uploads `k6-summary.html`, `k6-summary.json`, and `k6-profile-graph.html` as the `k6-reports` artifact.

## Notes

- TodoMVC used here is from the Playwright demo site: https://demo.playwright.dev/todomvc
- Local execution requires K6 to be installed.
- CI execution installs K6 automatically through GitHub Actions.
