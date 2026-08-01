import { performance } from "node:perf_hooks";
const base = process.env.STRESS_URL ?? "http://localhost:3000/api/cards/overview?username=octocat";
const total = Math.max(1, Math.min(5000, Number(process.env.STRESS_REQUESTS ?? 100)));
const concurrency = Math.max(1, Math.min(250, Number(process.env.STRESS_CONCURRENCY ?? 25)));
const latencies = []; const statuses = new Map(); let cursor = 0;
async function worker() { while (cursor < total) { cursor += 1; const started=performance.now(); try { const response=await fetch(base,{signal:AbortSignal.timeout(15000)}); await response.arrayBuffer(); statuses.set(response.status,(statuses.get(response.status)??0)+1); } catch { statuses.set(0,(statuses.get(0)??0)+1); } latencies.push(performance.now()-started); } }
const started=performance.now(); await Promise.all(Array.from({length:Math.min(concurrency,total)},worker)); latencies.sort((a,b)=>a-b);
const percentile=(p)=>Math.round(latencies[Math.min(latencies.length-1,Math.floor(latencies.length*p))]??0);
const elapsed=performance.now()-started; console.log(JSON.stringify({url:base,requests:total,concurrency,statuses:Object.fromEntries(statuses),durationMs:Math.round(elapsed),requestsPerSecond:Number((total/(elapsed/1000)).toFixed(2)),latencyMs:{p50:percentile(.5),p95:percentile(.95),p99:percentile(.99),max:percentile(1)}},null,2));
if ([...statuses].some(([status])=>status===0||status>=500)) process.exitCode=1;
