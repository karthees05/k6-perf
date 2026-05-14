export interface K6SummaryData {
  metrics?: Record<string, any>;
  state?: {
    testRunDurationMs?: number;
  };
}

/**
 * Ensures the summary contains an http_reqs metric when only browser HTTP metrics are present.
 * This allows htmlReport() to populate the standard Total Requests field.
 */
export function normalizeHttpRequestMetric(data: K6SummaryData): void {
  const metrics = data.metrics;
  if (!metrics || metrics.http_reqs) {
    return;
  }

  const browserHttpReqFailed = metrics.browser_http_req_failed;
  if (!browserHttpReqFailed?.values) {
    return;
  }

  const passes = Number(browserHttpReqFailed.values.passes ?? 0);
  const fails = Number(browserHttpReqFailed.values.fails ?? 0);
  const totalRequests = passes + fails;
  if (totalRequests <= 0) {
    return;
  }

  const durationSeconds = Number(data.state?.testRunDurationMs ?? 0) / 1000 || 1;
  const requestRate = totalRequests / durationSeconds;

  metrics.http_reqs = {
    type: "counter",
    contains: "default",
    values: {
      count: totalRequests,
      rate: Number(requestRate.toFixed(3))
    }
  };
}
