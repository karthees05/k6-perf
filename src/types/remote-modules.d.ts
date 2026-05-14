declare module "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js" {
  export function htmlReport(data: unknown): string;
}

declare module "https://jslib.k6.io/k6-summary/0.1.0/index.js" {
  export function textSummary(
    data: unknown,
    options?: {
      indent?: string;
      enableColors?: boolean;
    }
  ): string;
}
