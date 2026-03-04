// Rate limiting helper using Upstash Redis
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function checkRateLimit(ip, route, limitPerHour = 10) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    // If Redis not configured, allow all requests (development mode)
    console.log('Rate limiting disabled - Redis not configured');
    return { allowed: true, remaining: limitPerHour };
  }

  const now = new Date();
  const hourKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}`;
  const key = `ratelimit:${route}:${ip}:${hourKey}`;

  try {
    const current = await redis.get(key);
    const count = current ? parseInt(current) : 0;
    
    if (count >= limitPerHour) {
      return { allowed: false, remaining: 0, resetTime: new Date(now.getTime() + (60 - now.getMinutes()) * 60 * 1000) };
    }

    // Increment counter with 1 hour expiry
    await redis.set(key, count + 1, { ex: 3600 });
    
    return { allowed: true, remaining: limitPerHour - count - 1 };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // If Redis fails, allow the request (fail open)
    return { allowed: true, remaining: limitPerHour };
  }
}

export function getClientIP(request) {
  // Try to get real IP from various headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }
  
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  return 'unknown';
}
