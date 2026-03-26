import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export type RateLimitScope =
  | "public_booking_submission"
  | "admin_signin"
  | "admin_booking_mutation"
  | "admin_availability_mutation"
  | "admin_pricing_mutation"
  | "admin_settings_mutation";

type RateLimitPolicy = {
  limit: number;
  window: `${number} ${"s" | "m" | "h"}`;
  windowMs: number;
  prefix: string;
};

type MemoryRateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitPolicies: Record<RateLimitScope, RateLimitPolicy> = {
  public_booking_submission: {
    limit: 5,
    window: "10 m",
    windowMs: 10 * 60 * 1000,
    prefix: "public-booking"
  },
  admin_signin: {
    limit: 5,
    window: "10 m",
    windowMs: 10 * 60 * 1000,
    prefix: "admin-signin"
  },
  admin_booking_mutation: {
    limit: 20,
    window: "5 m",
    windowMs: 5 * 60 * 1000,
    prefix: "admin-booking"
  },
  admin_availability_mutation: {
    limit: 20,
    window: "5 m",
    windowMs: 5 * 60 * 1000,
    prefix: "admin-availability"
  },
  admin_pricing_mutation: {
    limit: 20,
    window: "5 m",
    windowMs: 5 * 60 * 1000,
    prefix: "admin-pricing"
  },
  admin_settings_mutation: {
    limit: 10,
    window: "5 m",
    windowMs: 5 * 60 * 1000,
    prefix: "admin-settings"
  }
};

const globalForRateLimit = globalThis as typeof globalThis & {
  boatRateLimitMemoryStore?: Map<string, MemoryRateLimitEntry>;
  boatRateLimitRedis?: Redis;
  boatRateLimiters?: Partial<Record<RateLimitScope, Ratelimit>>;
};

export class RateLimitExceededError extends Error {
  readonly scope: RateLimitScope;
  readonly resetAt: number;

  constructor(scope: RateLimitScope, resetAt: number) {
    super(`Rate limit exceeded for ${scope}.`);
    this.name = "RateLimitExceededError";
    this.scope = scope;
    this.resetAt = resetAt;
  }
}

function getMemoryStore() {
  if (!globalForRateLimit.boatRateLimitMemoryStore) {
    globalForRateLimit.boatRateLimitMemoryStore = new Map();
  }

  return globalForRateLimit.boatRateLimitMemoryStore;
}

function getUpstashRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  if (!globalForRateLimit.boatRateLimitRedis) {
    globalForRateLimit.boatRateLimitRedis = new Redis({ url, token });
  }

  return globalForRateLimit.boatRateLimitRedis;
}

function getUpstashRatelimiter(scope: RateLimitScope): Ratelimit | null {
  const redis = getUpstashRedisClient();

  if (!redis) {
    return null;
  }

  if (!globalForRateLimit.boatRateLimiters) {
    globalForRateLimit.boatRateLimiters = {};
  }

  const existingLimiter = globalForRateLimit.boatRateLimiters[scope];

  if (existingLimiter) {
    return existingLimiter;
  }

  const policy = rateLimitPolicies[scope];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(policy.limit, policy.window),
    prefix: `boat-rental:${policy.prefix}`
  });

  globalForRateLimit.boatRateLimiters[scope] = limiter;

  return limiter;
}

function getRateLimitKey(scope: RateLimitScope, identifier: string): string {
  return `${scope}:${identifier}`;
}

function applyInMemoryRateLimit(scope: RateLimitScope, identifier: string) {
  const policy = rateLimitPolicies[scope];
  const now = Date.now();
  const key = getRateLimitKey(scope, identifier);
  const memoryStore = getMemoryStore();

  for (const [entryKey, entryValue] of memoryStore.entries()) {
    if (entryValue.resetAt <= now) {
      memoryStore.delete(entryKey);
    }
  }

  const currentEntry = memoryStore.get(key);

  if (!currentEntry || currentEntry.resetAt <= now) {
    memoryStore.set(key, {
      count: 1,
      resetAt: now + policy.windowMs
    });

    return {
      success: true,
      resetAt: now + policy.windowMs
    };
  }

  if (currentEntry.count >= policy.limit) {
    return {
      success: false,
      resetAt: currentEntry.resetAt
    };
  }

  memoryStore.set(key, {
    count: currentEntry.count + 1,
    resetAt: currentEntry.resetAt
  });

  return {
    success: true,
    resetAt: currentEntry.resetAt
  };
}

export function isUpstashRateLimitConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

export function getRateLimitBackend(): "upstash" | "memory" {
  return isUpstashRateLimitConfigured() ? "upstash" : "memory";
}

export function getClientIpAddress(requestHeaders: Headers): string {
  const forwardedFor = requestHeaders.get("x-forwarded-for");

  if (forwardedFor) {
    const forwardedIp = forwardedFor.split(",")[0]?.trim();

    if (forwardedIp) {
      return forwardedIp;
    }
  }

  const fallbackHeaders = ["x-real-ip", "cf-connecting-ip", "fly-client-ip"];

  for (const headerName of fallbackHeaders) {
    const headerValue = requestHeaders.get(headerName)?.trim();

    if (headerValue) {
      return headerValue;
    }
  }

  return "unknown";
}

export async function assertRateLimit(input: {
  scope: RateLimitScope;
  identifier: string;
}) {
  const normalizedIdentifier = input.identifier.trim().toLowerCase();

  if (!normalizedIdentifier) {
    throw new RateLimitExceededError(input.scope, Date.now());
  }

  const upstashLimiter = getUpstashRatelimiter(input.scope);

  if (upstashLimiter) {
    const result = await upstashLimiter.limit(normalizedIdentifier);

    if (!result.success) {
      throw new RateLimitExceededError(input.scope, result.reset);
    }

    return {
      backend: "upstash" as const,
      resetAt: result.reset
    };
  }

  const result = applyInMemoryRateLimit(input.scope, normalizedIdentifier);

  if (!result.success) {
    throw new RateLimitExceededError(input.scope, result.resetAt);
  }

  return {
    backend: "memory" as const,
    resetAt: result.resetAt
  };
}
