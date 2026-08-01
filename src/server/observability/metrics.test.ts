import { beforeEach, describe, expect, it } from "vitest";
import { incrementMetric, metricsSnapshot, observeMetric, resetMetricsForTests } from "./metrics";
describe("internal metrics", () => { beforeEach(resetMetricsForTests); it("calculates cache ratios and bounded latency summaries", () => { incrementMetric("cacheHit", 3); incrementMetric("cacheMiss"); observeMetric("renderDurationMs", 10); observeMetric("renderDurationMs", 20); const value=metricsSnapshot(); expect(value.cache.hitRatio).toBe(.75); expect(value.latencyMs.render).toMatchObject({count:2,average:15,max:20}); }); });
