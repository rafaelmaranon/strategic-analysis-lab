import { Redis } from '@upstash/redis';
import OpenAI from "openai";

// Initialize Redis for rate limiting
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Initialize OpenAI
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Rate limiting functions
async function checkRateLimit(ip, route, limitPerHour = 10) {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
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

    await redis.set(key, count + 1, { ex: 3600 });
    
    return { allowed: true, remaining: limitPerHour - count - 1 };
  } catch (error) {
    console.error('Rate limiting error:', error);
    return { allowed: true, remaining: limitPerHour };
  }
}

function getClientIP(request) {
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIP = request.headers['x-real-ip'];
  if (realIP) {
    return realIP.trim();
  }
  
  const cfConnectingIP = request.headers['cf-connecting-ip'];
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }
  
  return 'unknown';
}

// Simplified OpenAI call function
async function runExamplesLab(userQuestion) {
  // For now, return a simple response without public context
  // to avoid import issues with public_context.mjs
  const systemPrompt = `You are a strategic analysis assistant. Answer the user's question concisely and accurately.`;
  const userPrompt = `Question: ${userQuestion}`;

  const modelName = "gpt-4";
  console.log("Examples Lab model:", modelName);

  const resp = await client.chat.completions.create({
    model: modelName,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.2,
    top_p: 1,
    max_tokens: 800
  });

  return {
    answer: resp.choices[0].message.content,
    snippets: [] // No snippets for now due to import issues
  };
}

export default async function handler(req, res) {
  try {
    // Rate limiting check
    const ip = getClientIP(req);
    const rateLimitResult = await checkRateLimit(ip, 'analyze', 10);
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({ 
        error: "Rate limit exceeded. Try again later.",
        limit_per_hour: 10,
        reset_time: rateLimitResult.resetTime
      });
    }

    const { question } = req.body ?? {};
    if (!question) return res.status(400).json({ error: "Missing question" });

    const result = await runExamplesLab(question);
    
    return res.json(result);
  } catch (e) {
    console.error(e);
    
    // Check if it's a retrieval failure
    if (e.message.includes('Search API') || e.message.includes('Insufficient') || e.message.includes('retrieval failed')) {
      return res.status(503).json({ 
        error: "Public source retrieval not configured or failed. This app does not run without real sources.",
        details: {
          snippets_found: 0,
          required: 3,
          message: e.message
        }
      });
    }
    
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
