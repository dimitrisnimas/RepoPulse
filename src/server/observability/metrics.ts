type MetricName = "requests" | "cacheHit" | "cacheMiss" | "cacheStale" | "errors" | "rateLimited" | "githubRequests" | "githubErrors" | "svgRendered" | "pngRendered";
interface MetricsState { startedAt: number; counters: Record<MetricName, number>; renderDurationMs: number[]; githubDurationMs: number[] }
const initialCounters = (): Record<MetricName, number> => ({ requests: 0, cacheHit: 0, cacheMiss: 0, cacheStale: 0, errors: 0, rateLimited: 0, githubRequests: 0, githubErrors: 0, svgRendered: 0, pngRendered: 0 });
const root = globalThis as typeof globalThis & { __repopulseMetrics?: MetricsState };
const state = root.__repopulseMetrics ??= { startedAt: Date.now(), counters: initialCounters(), renderDurationMs: [], githubDurationMs: [] };
const SAMPLE_LIMIT = 1_000;
export function incrementMetric(name: MetricName, amount = 1) { state.counters[name] += amount; }
export function observeMetric(name: "renderDurationMs" | "githubDurationMs", value: number) { const samples = state[name]; samples.push(Math.max(0, value)); if (samples.length > SAMPLE_LIMIT) samples.splice(0, samples.length - SAMPLE_LIMIT); }
function summary(samples: number[]) { if (!samples.length) return { count: 0, average: 0, p95: 0, max: 0 }; const sorted = [...samples].sort((a,b)=>a-b); return { count: samples.length, average: Math.round(samples.reduce((a,b)=>a+b,0)/samples.length), p95: Math.round(sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]), max: Math.round(sorted.at(-1) ?? 0) }; }
export function metricsSnapshot() { const cacheTotal = state.counters.cacheHit + state.counters.cacheMiss + state.counters.cacheStale; return { uptimeSeconds: Math.floor((Date.now()-state.startedAt)/1000), counters: { ...state.counters }, cache: { total: cacheTotal, hitRatio: cacheTotal ? Number((state.counters.cacheHit/cacheTotal).toFixed(4)) : 0, missRatio: cacheTotal ? Number((state.counters.cacheMiss/cacheTotal).toFixed(4)) : 0 }, latencyMs: { render: summary(state.renderDurationMs), github: summary(state.githubDurationMs) } }; }
export function resetMetricsForTests() { state.startedAt=Date.now(); state.counters=initialCounters(); state.renderDurationMs=[]; state.githubDurationMs=[]; }
