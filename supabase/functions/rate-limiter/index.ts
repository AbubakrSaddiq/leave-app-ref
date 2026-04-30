// Rate limiter middleware for Supabase Edge Functions
// Supports both in-memory and Redis-based rate limiting

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix?: string; // Prefix for rate limit keys
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// Simple in-memory store (suitable for development/low traffic)
// For production, consider using Redis
const inMemoryStore: RateLimitStore = {};

/**
 * Clean up expired entries from in-memory store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const key in inMemoryStore) {
    if (inMemoryStore[key].resetTime < now) {
      delete inMemoryStore[key];
    }
  }
}

/**
 * Generate rate limit key
 */
function generateKey(identifier: string, prefix: string = "rl"): string {
  return `${prefix}:${identifier}`;
}

/**
 * Check and update rate limit
 * Returns { allowed: boolean, remaining: number, resetTime: number }
 */
function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; retryAfter: number } {
  const key = generateKey(identifier, config.keyPrefix);
  const now = Date.now();

  // Clean up periodically
  if (Math.random() < 0.01) {
    cleanupExpiredEntries();
  }

  // Initialize or get existing record
  if (!inMemoryStore[key]) {
    inMemoryStore[key] = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  const record = inMemoryStore[key];

  // Check if window has expired
  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + config.windowMs;
  }

  // Increment count
  record.count++;

  const allowed = record.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - record.count);
  const retryAfter = Math.ceil((record.resetTime - now) / 1000);

  return {
    allowed,
    remaining,
    resetTime: record.resetTime,
    retryAfter,
  };
}

/**
 * Create rate limit middleware response headers
 */
function getRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number
): Record<string, string> {
  return {
    "X-RateLimit-Limit": limit.toString(),
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": Math.ceil(resetTime / 1000).toString(),
  };
}

/**
 * Rate limit middleware for Deno serve functions
 */
function createRateLimitMiddleware(config: RateLimitConfig) {
  return async (
    req: Request,
    handler: (req: Request) => Promise<Response>
  ): Promise<Response> => {
    // Extract identifier (IP, user ID, or custom key)
    const identifier = getClientIdentifier(req);

    const rateLimitResult = checkRateLimit(identifier, config);

    const headers = getRateLimitHeaders(
      config.maxRequests,
      rateLimitResult.remaining,
      rateLimitResult.resetTime
    );

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...headers,
            "Retry-After": rateLimitResult.retryAfter.toString(),
            "Content-Type": "application/json",
          },
        }
      );
    }

    const response = await handler(req);
    
    // Add rate limit headers to response
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}

/**
 * Get client identifier for rate limiting
 * Priority: User ID from token > IP address
 */
function getClientIdentifier(req: Request): string {
  // Try to extract user ID from Authorization header
  const authHeader = req.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.replace("Bearer ", "");
      // Extract user ID from JWT (sub claim)
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.sub) {
          return `user:${payload.sub}`;
        }
      }
    } catch (e) {
      console.error("Failed to extract user ID from token:", e);
    }
  }

  // Fallback to IP address
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0] ||
    "unknown";

  return `ip:${ip}`;
}

/**
 * Reset rate limit for a specific identifier (admin use)
 */
function resetRateLimit(identifier: string, prefix: string = "rl"): void {
  const key = generateKey(identifier, prefix);
  delete inMemoryStore[key];
}

export {
  checkRateLimit,
  createRateLimitMiddleware,
  generateKey,
  getRateLimitHeaders,
  getClientIdentifier,
  resetRateLimit,
  type RateLimitConfig,
};
