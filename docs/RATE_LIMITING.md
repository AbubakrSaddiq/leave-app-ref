# Rate Limiting Implementation Guide

## Overview

Rate limiting has been implemented across your Supabase Edge Functions to protect against abuse and brute-force attacks. The implementation includes:

1. **Rate Limiter Module** (`supabase/functions/rate-limiter/index.ts`) - Reusable middleware
2. **Auth Endpoint Protection** - 5 attempts per 15 minutes
3. **General Endpoint Protection** - 30 attempts per minute (configurable)

## Architecture

### Rate Limiter Module

Located at: `supabase/functions/rate-limiter/index.ts`

**Features:**
- In-memory rate limit store (suitable for serverless environment)
- Automatic cleanup of expired entries
- Client identification by user ID (from JWT) or IP address
- Standard rate limit response headers (`X-RateLimit-*`)
- Configurable windows and limits per endpoint

**Exports:**
```typescript
export {
  checkRateLimit,              // Check and update rate limit status
  createRateLimitMiddleware,   // Middleware factory (for future use)
  generateKey,                 // Generate rate limit cache key
  getRateLimitHeaders,         // Get HTTP headers for response
  getClientIdentifier,         // Extract client ID from request
  resetRateLimit,              // Admin function to reset limits
  type RateLimitConfig,        // Configuration type
};
```

### Configuration

#### Authentication Routes (login, signup, password reset)
```typescript
{
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 5,             // Max 5 attempts
  keyPrefix: "auth"           // Key prefix for store
}
```

#### General Endpoints (business logic)
```typescript
{
  windowMs: 60 * 1000,        // 1 minute
  maxRequests: 30,            // Max 30 attempts
  keyPrefix: "general"        // Key prefix for store
}
```

## Usage

### Adding Rate Limiting to a Function

1. **Import the rate limiter:**
```typescript
import {
  checkRateLimit,
  getRateLimitHeaders,
  getClientIdentifier,
  type RateLimitConfig,
} from "../rate-limiter/index.ts";
```

2. **Define your rate limit config:**
```typescript
const YOUR_RATE_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,  // 15 minutes
  maxRequests: 5,             // 5 requests max
  keyPrefix: "your-endpoint"
};
```

3. **Add check in your handler:**
```typescript
Deno.serve(async (req) => {
  // ... CORS and method checks ...

  // Check rate limit
  const identifier = getClientIdentifier(req);
  const rateLimitResult = checkRateLimit(identifier, YOUR_RATE_LIMIT);

  const rateLimitHeaders = getRateLimitHeaders(
    YOUR_RATE_LIMIT.maxRequests,
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
          ...corsHeaders,
          ...rateLimitHeaders,
          "Retry-After": rateLimitResult.retryAfter.toString(),
          "Content-Type": "application/json",
        },
      }
    );
  }

  // Include rate limit headers in all responses
  // ... rest of your handler ...
  
  return new Response(
    JSON.stringify(result),
    {
      status: 200,
      headers: {
        ...corsHeaders,
        ...rateLimitHeaders,
        "Content-Type": "application/json",
      },
    }
  );
});
```

## Response Headers

When rate limited, the response includes:

```
X-RateLimit-Limit: 5              // Max requests in window
X-RateLimit-Remaining: 2          // Requests remaining
X-RateLimit-Reset: 1714521234     // Unix timestamp when limit resets
Retry-After: 845                  // Seconds to wait before retrying
```

## Error Response (429 Too Many Requests)

```json
{
  "error": "Rate limit exceeded",
  "message": "Too many authentication attempts. Please try again in 845 seconds.",
  "retryAfter": 845
}
```

## Client Identification

The rate limiter identifies clients by priority:

1. **User ID** (preferred) - Extracted from JWT `sub` claim
   - Format: `user:uuid`
   - More accurate for authenticated requests

2. **IP Address** (fallback) - Extracted from headers
   - Priority: `cf-connecting-ip` → `x-forwarded-for` → `unknown`
   - Format: `ip:address`

## Implementation Status

### ✅ Completed
- Rate limiter module
- Protection on `admin-create-user` endpoint (5 attempts/15min)
- Standard rate limit headers
- Client identification

### 📋 Recommended Next Steps
1. Add rate limiting to authentication endpoints:
   - Sign up/register
   - Login/signin
   - Password reset
   - Token refresh

2. Add rate limiting to other critical endpoints:
   - Leave application submission
   - Approval operations
   - Notification retrieval

3. Consider Redis integration for:
   - Multi-instance deployments
   - Persistent rate limit tracking
   - Distributed rate limiting

## Testing Rate Limits

### Via cURL
```bash
# First 5 requests will succeed
for i in {1..6}; do
  curl -X POST https://your-function.supabase.co/functions/v1/admin-create-user \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"pass","full_name":"Test"}'
  echo "Request $i"
done

# The 6th request will return 429
```

### Check response headers
```bash
curl -i -X POST https://your-function.supabase.co/functions/v1/admin-create-user \
  -H "Authorization: Bearer YOUR_TOKEN"

# Look for:
# HTTP/1.1 429 Too Many Requests
# X-RateLimit-Limit: 5
# X-RateLimit-Remaining: 0
# Retry-After: 892
```

## Configuration Notes

- **In-Memory Storage**: Currently uses in-memory store suitable for serverless
- **Automatic Cleanup**: Runs probabilistically (1% chance per request)
- **Per-Instance**: Each instance maintains its own rate limit store
- **Stateless**: No database calls for rate limiting checks

## Security Considerations

- Rate limits are per-client (user or IP), not per function
- Failed attempts count toward the limit (important for brute-force protection)
- Authentication failures trigger rate limiting immediately
- IP-based limiting for unauthenticated requests
- User-based limiting for authenticated requests (more granular)

## Future Enhancements

1. **Redis Backend**: For distributed rate limiting
2. **Granular Limits**: Different limits per user role
3. **Dynamic Adjustment**: Increase limits for trusted users
4. **Monitoring**: Track rate limit violations
5. **Bypass Mechanism**: Admin override capability
6. **Sliding Window**: Alternative algorithm for smoother limits
