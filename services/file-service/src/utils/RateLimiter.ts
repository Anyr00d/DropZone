//token bucket algo
export interface Bucket {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private buckets: Map<string, Bucket>;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second

  constructor(capacity: number, refillRatePerMinute: number) {
    this.buckets = new Map();
    this.capacity = capacity;
    this.refillRate = refillRatePerMinute / 60; // convert to per second
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? {
      tokens: this.capacity,
      lastRefill: now,
    };

    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    const refillAmount = elapsedSeconds * this.refillRate;

    bucket.tokens = Math.min(this.capacity, bucket.tokens + refillAmount);
    bucket.tokens = Math.floor(bucket.tokens);
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      this.buckets.set(key, bucket);
      return true;
    }

    this.buckets.set(key, bucket);
    return false;
  }
}
