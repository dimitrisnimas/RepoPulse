export interface CacheEntry<T> { value: T; freshUntil: number; staleUntil: number }
export interface CacheResult<T> { value: T; state: "HIT" | "STALE"; fresh: boolean }
