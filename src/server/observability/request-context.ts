export function createRequestContext() { return { requestId: crypto.randomUUID(), startedAt: performance.now() }; }
