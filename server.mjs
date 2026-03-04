import express from "express";
import { checkRateLimit, getClientIP } from "./src/server/rate_limit.mjs";

const app = express();
app.use(express.json());

// Kill switch check
function checkKillSwitch(req, res, next) {
  if (process.env.API_DISABLED === "true") {
    return res.status(503).json({ 
      error: "API temporarily disabled by operator." 
    });
  }
  next();
}

app.use(checkKillSwitch);
app.use(express.static("public"));

// Clean API - single analyze endpoint
app.post("/api/analyze", async (req, res) => {
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

    const { runExamplesLab } = await import('./src/examples_lab/openai_call.mjs');
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
});

// Serve Examples Lab HTML as default
app.get("/", (req, res) => {
  res.sendFile("examples-lab.html", { root: "." });
});

app.get("/index.html", (req, res) => {
  res.sendFile("examples-lab.html", { root: "." });
});

app.get("/examples-lab", (req, res) => {
  res.sendFile("examples-lab.html", { root: "." });
});

app.listen(3000, () => {
  console.log("Strategic Analysis Lab running on http://localhost:3000");
  console.log("Examples Lab: http://localhost:3000/examples-lab");
});
