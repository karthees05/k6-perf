import { environments, EnvironmentName } from "./environments.js";

export type LoadProfile = "fixed" | "ramp-up" | "spike" | "peak";

export interface RuntimeConfig {
  environment: EnvironmentName;
  baseUrl: string;
  loadProfile: LoadProfile;
  users: number;
  durationSeconds: number;
  rampUpInitialUsers: number;
  rampUpTargetUsers: number;
  rampUpBaseDurationSeconds: number;
  rampUpRampDurationSeconds: number;
  rampUpHoldDurationSeconds: number;
  spikeBaseUsers: number;
  spikePeakUsers: number;
  spikeBaseBeforeSeconds: number;
  spikeRampUpSeconds: number;
  spikeRampDownSeconds: number;
  spikeBaseAfterSeconds: number;
  peakBaseUsers: number;
  peakPeakUsers: number;
  peakBaseBeforeSeconds: number;
  peakRampUpSeconds: number;
  peakPeakHoldSeconds: number;
  peakRampDownSeconds: number;
  peakBaseAfterSeconds: number;
}

/** Validates ENV and narrows it to a supported environment key. */
function parseEnvironment(value: string | undefined): EnvironmentName {
  const env = (value ?? "dev") as EnvironmentName;
  if (env === "dev" || env === "qa" || env === "prod") {
    return env;
  }
  throw new Error(`Unsupported ENV value: ${value}`);
}

/** Validates LOAD_PROFILE and narrows it to a supported profile type. */
function parseLoadProfile(value: string | undefined): LoadProfile {
  const profile = (value ?? "fixed") as LoadProfile;
  if (profile === "fixed" || profile === "ramp-up" || profile === "spike" || profile === "peak") {
    return profile;
  }
  throw new Error(`Unsupported LOAD_PROFILE value: ${value}`);
}

/** Parses a positive integer from environment input with a fallback default. */
function parsePositiveInteger(value: string | undefined, fallback: number, key: string): number {
  const numeric = value ? Number(value) : fallback;
  if (!Number.isFinite(numeric) || numeric <= 0 || !Number.isInteger(numeric)) {
    throw new Error(`${key} must be a positive integer. Received: ${value}`);
  }
  return numeric;
}

/**
 * Builds a fully validated runtime configuration from k6 environment variables.
 * This is the single source of truth for profile parameters used by simulation code.
 */
export function getRuntimeConfig(): RuntimeConfig {
  const environment = parseEnvironment(__ENV.ENV);
  const loadProfile = parseLoadProfile(__ENV.LOAD_PROFILE);
  const users = parsePositiveInteger(__ENV.USERS, 5, "USERS");
  const durationSeconds = parsePositiveInteger(__ENV.DURATION_SECONDS, 60, "DURATION_SECONDS");

  const rampUpInitialUsers = parsePositiveInteger(__ENV.RAMP_UP_INITIAL_USERS, 1, "RAMP_UP_INITIAL_USERS");
  const rampUpTargetUsers = parsePositiveInteger(__ENV.RAMP_UP_TARGET_USERS, users, "RAMP_UP_TARGET_USERS");
  const rampUpBaseDurationSeconds = parsePositiveInteger(
    __ENV.RAMP_UP_BASE_DURATION_SECONDS,
    Math.max(1, Math.floor(durationSeconds / 3)),
    "RAMP_UP_BASE_DURATION_SECONDS"
  );
  const rampUpRampDurationSeconds = parsePositiveInteger(
    __ENV.RAMP_UP_RAMP_DURATION_SECONDS,
    Math.max(1, Math.floor(durationSeconds / 3)),
    "RAMP_UP_RAMP_DURATION_SECONDS"
  );
  const rampUpHoldDurationSeconds = parsePositiveInteger(
    __ENV.RAMP_UP_HOLD_DURATION_SECONDS,
    Math.max(1, durationSeconds - rampUpBaseDurationSeconds - rampUpRampDurationSeconds),
    "RAMP_UP_HOLD_DURATION_SECONDS"
  );

  const spikeBaseUsers = parsePositiveInteger(__ENV.SPIKE_BASE_USERS, 1, "SPIKE_BASE_USERS");
  const spikePeakUsers = parsePositiveInteger(__ENV.SPIKE_PEAK_USERS, users, "SPIKE_PEAK_USERS");
  const spikeBaseBeforeSeconds = parsePositiveInteger(
    __ENV.SPIKE_BASE_BEFORE_SECONDS,
    Math.max(1, Math.floor(durationSeconds / 3)),
    "SPIKE_BASE_BEFORE_SECONDS"
  );
  const spikeRampUpSeconds = parsePositiveInteger(
    __ENV.SPIKE_RAMP_UP_SECONDS,
    Math.max(1, Math.floor(durationSeconds / 6)),
    "SPIKE_RAMP_UP_SECONDS"
  );
  const spikeRampDownSeconds = parsePositiveInteger(
    __ENV.SPIKE_RAMP_DOWN_SECONDS,
    Math.max(1, Math.floor(durationSeconds / 6)),
    "SPIKE_RAMP_DOWN_SECONDS"
  );
  const spikeBaseAfterSeconds = parsePositiveInteger(
    __ENV.SPIKE_BASE_AFTER_SECONDS,
    Math.max(1, durationSeconds - spikeBaseBeforeSeconds - spikeRampUpSeconds - spikeRampDownSeconds),
    "SPIKE_BASE_AFTER_SECONDS"
  );

  const peakBaseUsers = parsePositiveInteger(__ENV.PEAK_BASE_USERS, 2, "PEAK_BASE_USERS");
  const peakPeakUsers = parsePositiveInteger(__ENV.PEAK_PEAK_USERS, users, "PEAK_PEAK_USERS");
  const peakBaseBeforeSeconds = parsePositiveInteger(
    __ENV.PEAK_BASE_BEFORE_SECONDS,
    Math.max(1, Math.floor(durationSeconds / 5)),
    "PEAK_BASE_BEFORE_SECONDS"
  );
  const peakRampUpSeconds = parsePositiveInteger(
    __ENV.PEAK_RAMP_UP_SECONDS,
    Math.max(1, Math.floor(durationSeconds / 5)),
    "PEAK_RAMP_UP_SECONDS"
  );
  const peakPeakHoldSeconds = parsePositiveInteger(
    __ENV.PEAK_PEAK_HOLD_SECONDS,
    Math.max(1, Math.floor(durationSeconds / 5)),
    "PEAK_PEAK_HOLD_SECONDS"
  );
  const peakRampDownSeconds = parsePositiveInteger(
    __ENV.PEAK_RAMP_DOWN_SECONDS,
    Math.max(1, Math.floor(durationSeconds / 5)),
    "PEAK_RAMP_DOWN_SECONDS"
  );
  const peakBaseAfterSeconds = parsePositiveInteger(
    __ENV.PEAK_BASE_AFTER_SECONDS,
    Math.max(1, durationSeconds - peakBaseBeforeSeconds - peakRampUpSeconds - peakPeakHoldSeconds - peakRampDownSeconds),
    "PEAK_BASE_AFTER_SECONDS"
  );

  return {
    environment,
    loadProfile,
    users,
    durationSeconds,
    baseUrl: __ENV.BASE_URL ?? environments[environment].baseUrl,
    rampUpInitialUsers,
    rampUpTargetUsers,
    rampUpBaseDurationSeconds,
    rampUpRampDurationSeconds,
    rampUpHoldDurationSeconds,
    spikeBaseUsers,
    spikePeakUsers,
    spikeBaseBeforeSeconds,
    spikeRampUpSeconds,
    spikeRampDownSeconds,
    spikeBaseAfterSeconds,
    peakBaseUsers,
    peakPeakUsers,
    peakBaseBeforeSeconds,
    peakRampUpSeconds,
    peakPeakHoldSeconds,
    peakRampDownSeconds,
    peakBaseAfterSeconds
  };
}
