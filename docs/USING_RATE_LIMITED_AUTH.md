# Using Rate-Limited Authentication

## Overview

Your app now uses enterprise-grade rate-limited authentication endpoints. This guide shows you how to use them.

## ✅ What You Get

- **Rate Limiting**: 5 attempts per 15 minutes per IP/user
- **Brute-Force Protection**: Failed attempts count immediately
- **User-Friendly**: Countdown timers, warnings, progress bars
- **Automatic**: Just use the auth service - it works!

---

## 📖 Usage Guide

### 1. **LoginForm Component** (Recommended)

The `LoginForm` component automatically uses rate-limited authentication. Just use it:

```tsx
import { LoginForm } from "@/components/auth/LoginForm";

export function LoginPage() {
  return <LoginForm />;
}
```

**Features:**
- ✅ Countdown timer when rate limited
- ✅ Warning when ≤2 attempts remaining
- ✅ Progress bar showing lockout duration
- ✅ Automatic error messages

### 2. **Direct Service Usage**

Use the auth service in any component:

```tsx
import { authService } from "@/services/authService";

// Rate-limited login (RECOMMENDED)
const response = await authService.loginWithEdgeFunction({
  email: "user@example.com",
  password: "password123"
});

console.log(response.profile); // Full user profile
console.log(response.session); // Session tokens
```

### 3. **Custom Hook**

Create a reusable hook:

```tsx
// src/hooks/useLogin.ts
import { useState } from "react";
import { authService } from "@/services/authService";

export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authService.loginWithEdgeFunction({
        email,
        password
      });
      
      return response;
    } catch (err: any) {
      const message = err.message;
      setError(message);
      
      // Parse rate limit info from error
      if (message.includes("Too many login attempts")) {
        const match = message.match(/(\d+) seconds/);
        if (match) {
          setRemainingAttempts(0);
        }
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { login, isLoading, error, remainingAttempts };
}

// Usage
const { login, isLoading, error } = useLogin();
const handleLogin = async () => {
  try {
    const data = await login("user@example.com", "password");
  } catch (err) {
    // Error already in state
  }
};
```

---

## 🎯 API Reference

### `loginWithEdgeFunction(credentials)`

**Rate-Limited Login (Recommended)**

```typescript
const response = await authService.loginWithEdgeFunction({
  email: string;
  password: string;
});
```

**Returns:**
```typescript
{
  user: {
    id: string;
    email: string;
    created_at: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    expires_at: number;
  };
  profile: Profile;
  message: string;
}
```

**Errors:**
- `400` - Missing/invalid credentials
- `401` - Invalid email or password
- `429` - Rate limited (includes "X seconds" message)
- `500` - Server error

---

### `loginWithSupabase(credentials)`

**Fallback Login (No Rate Limiting)**

```typescript
const response = await authService.loginWithSupabase({
  email: string;
  password: string;
});
```

Use this only if the edge function is unavailable.

---

### `signOut()`

```typescript
await authService.signOut();
```

---

### `getCurrentSession()`

```typescript
const session = await authService.getCurrentSession();
```

---

### `refreshSession()`

```typescript
const session = await authService.refreshSession();
```

---

### `getCurrentProfile()`

```typescript
const profile = await authService.getCurrentProfile();
```

---

## ⚠️ Error Handling

### Rate Limit Error

```typescript
try {
  await authService.loginWithEdgeFunction({ email, password });
} catch (error) {
  if (error.message.includes("Too many login attempts")) {
    // Extract remaining time
    const match = error.message.match(/(\d+) seconds/);
    const retryAfter = match ? parseInt(match[1]) : 900;
    
    console.log(`Please wait ${retryAfter} seconds`);
    
    // Show countdown timer
    showCountdown(retryAfter);
  }
}
```

### Invalid Credentials

```typescript
try {
  await authService.loginWithEdgeFunction({ email, password });
} catch (error) {
  if (error.message === "Invalid email or password") {
    // Show generic error - don't reveal if user exists
    showError("Invalid email or password");
  }
}
```

---

## 🧪 Testing

### Test Rate Limiting

```bash
# Deploy functions first
supabase functions deploy login

# Then in browser console
const authService = require("@/services/authService").authService;

// Attempt 1-5: Success
for (let i = 0; i < 5; i++) {
  await authService.loginWithEdgeFunction({
    email: "test@example.com",
    password: "wrong"
  }).catch(e => console.log(`Attempt ${i+1}: ${e.message}`));
}

# Attempt 6: Rate limited!
await authService.loginWithEdgeFunction({
  email: "test@example.com",
  password: "wrong"
}).catch(e => console.log(e.message));
// Output: "Too many login attempts. Please try again in 854 seconds."
```

### Manual Test

1. Go to login page
2. Enter any email/password
3. Click "Sign In" 5 times quickly
4. On 6th attempt, see: "Too many login attempts. Please wait..."
5. See countdown timer
6. Timer counts down from ~15 minutes

---

## 🔐 Security Best Practices

### ✅ Do

- Use rate-limited endpoints for all authentication
- Handle 429 errors gracefully
- Show generic error messages (don't reveal if user exists)
- Store tokens securely
- Use HTTPS only
- Implement logout on token expiry

### ❌ Don't

- Use the fallback `loginWithSupabase` in production
- Show detailed error messages (prevents user enumeration)
- Store passwords in state or localStorage
- Re-attempt immediately after rate limit
- Log sensitive data

---

## 🚀 Deployment

### Prerequisites

```bash
# Ensure you have Supabase CLI
npm install -g supabase

# Login to your project
supabase login
```

### Deploy

```bash
# Deploy all functions
supabase functions deploy

# Or specific function
supabase functions deploy login

# View logs
supabase functions list
supabase functions logs login
```

### Environment Variables

```bash
# .env (frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...

# No additional env vars needed - auth is handled by edge functions!
```

---

## 🐛 Troubleshooting

### "Function not found" error

```
Error: Failed to fetch https://your-project.supabase.co/functions/v1/login
```

**Solution:** Deploy the function
```bash
supabase functions deploy login
```

### CORS error in browser

```
Access to XMLHttpRequest blocked by CORS
```

**Solution:** Already handled! The edge functions have CORS headers configured.

### Always getting "Too many attempts" even after waiting

Clear your browser cookies/storage and try again with a different IP.

### 429 error but no countdown timer

The edge function returned rate limit but couldn't parse the retry-after. This shouldn't happen - check the response headers:

```typescript
const response = await fetch("...login", { ... });
console.log(response.headers.get("Retry-After")); // Should be a number
```

---

## 📊 Monitor Rate Limits

Check Supabase dashboard for:
- Function invocation counts
- Error rates
- Execution logs

```bash
# View logs
supabase functions logs login --tail
```

---

## 🎓 Examples

### Login Form with Custom Error Handling

```tsx
import React, { useState } from "react";
import { authService } from "@/services/authService";

export function CustomLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "locked">("idle");
  const [lockoutTime, setLockoutTime] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setStatus("loading");
      await authService.loginWithEdgeFunction({ email, password });
      // User is now logged in!
    } catch (error: any) {
      if (error.message.includes("Too many")) {
        const match = error.message.match(/(\d+) seconds/);
        if (match) {
          setStatus("locked");
          setLockoutTime(parseInt(match[1]));
        }
      }
    } finally {
      setStatus("idle");
    }
  };

  if (status === "locked") {
    return <div>Too many attempts. Please wait {lockoutTime} seconds.</div>;
  }

  return (
    <form onSubmit={handleLogin}>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input value={password} onChange={e => setPassword(e.target.value)} type="password" />
      <button disabled={status === "loading"}>{status === "loading" ? "Logging in..." : "Login"}</button>
    </form>
  );
}
```

### Check Rate Limit Status

```typescript
// Function to check if user is rate limited (before even trying)
async function isRateLimited(email: string): Promise<boolean> {
  // This would require a separate endpoint - not implemented yet
  // For now, just attempt login and catch the error
  return false;
}
```

---

## 📚 Related Documentation

- [Rate Limiting Overview](./RATE_LIMITING.md)
- [Edge Functions Deployment](https://supabase.com/docs/guides/functions/deploy)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

## 💬 Need Help?

Check the error message in your browser console. Most issues are:

1. Function not deployed → Deploy with `supabase functions deploy login`
2. Wrong environment variables → Check `.env` file
3. CORS issues → Shouldn't happen, but check browser Network tab
4. Session not persisting → Supabase client handles this automatically

