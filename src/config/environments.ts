export type EnvironmentName = "dev" | "qa" | "prod";

export interface EnvironmentConfig {
  baseUrl: string;
}

export const environments: Record<EnvironmentName, EnvironmentConfig> = {
  dev: { baseUrl: "https://demo.playwright.dev/todomvc" },
  qa: { baseUrl: "https://demo.playwright.dev/todomvc" },
  prod: { baseUrl: "https://demo.playwright.dev/todomvc" }
};
