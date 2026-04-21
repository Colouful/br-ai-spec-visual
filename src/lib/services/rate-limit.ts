const RATE_BUCKETS = new Map<string, { count: number; resetAt: number }>();
const RATE_WINDOW_MS = 1_000;
const RATE_MAX = 5;

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const bucket = RATE_BUCKETS.get(key);
  if (!bucket || bucket.resetAt <= now) {
    RATE_BUCKETS.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_MAX) return false;
  bucket.count += 1;
  return true;
}
