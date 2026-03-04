# Examples Lab (Isolated)

LLM-only autonomy scale analysis with real web retrieval + citations. No deterministic compute engine.

## What this is

- **Examples Lab**: ChatGPT-style analysis using 10 curated autonomy scale examples
- **Real retrieval**: Fetches live web sources for fact-checking and citations
- **Isolated**: Completely separate from the compute engine and ModelSpec logic
- **Citation-based**: All analysis must cite provided web sources

## What it is NOT

- ❌ Not financial advice
- ❌ Not guaranteed accurate  
- ❌ Uses web sources; sources can conflict
- ❌ Not a replacement for professional analysis

## How it works

1. **Question** → User asks about autonomy scale topics
2. **Retrieval** → Search API fetches relevant web sources
3. **Snippets** → Sources are ranked by quality (factual > opinion)
4. **LLM analysis** → GPT-4.1 analyzes using examples + citations
5. **Output** → Structured analysis with required citations

## Model paths

The system automatically chooses one of four analysis paths:

- **Corporate valuation** (Company B, Apple, etc.)
- **Robotaxi network** (per-mile economics)
- **Unit economics** (break-even, costs)
- **Launch readiness** (deployment timing)

## Setup (local)

```bash
# Install dependencies
npm install

# Add environment variables to .env.local
OPENAI_API_KEY=your_openai_key_here
TAVILY_API_KEY=your_tavily_key_here
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
API_DISABLED=false

# Run development server
npm run dev

# Visit Examples Lab
http://localhost:3000/examples-lab
```

## Safety controls

- **Rate limiting**: 10 requests/hour per IP
- **Output caps**: 800 tokens max per response
- **Kill switch**: `API_DISABLED=true` disables all API calls
- **Source ranking**: Factual domains prioritized over opinion sites
- **Required citations**: Analysis must cite provided sources

## Source quality ranking

**Weight 3 (Preferred factual):**
- stockanalysis.com, companiesmarketcap.com, sec.gov
- nasdaq.com, macrotrends.net

**Weight 2 (Medium quality):**
- reuters.com, bloomberg.com, wsj.com
- finance.yahoo.com

**Weight 1 (Lower quality):**
- tradingview.com, opinion blogs

## Example usage

Try these questions:

- "Can Company B become a $1T company by 2035?"
- "How many robotaxis would Company B need to generate $100B revenue?"
- "How many miles/year must each robotaxi drive to break even?"

## API endpoints

- `POST /examples-lab` - Main analysis endpoint
- `GET /examples-lab` - UI page

## Rate limits

- **Examples Lab**: 10 requests/hour per IP
- **Fallback search**: 1 additional call if baseline data missing
- **Max search calls**: 3 per request (reduced to control costs)

## Deployment (Vercel)

1. Import repository into Vercel
2. Set environment variables in Vercel dashboard:
   ```
   OPENAI_API_KEY=your_key
   TAVILY_API_KEY=your_key
   UPSTASH_REDIS_REST_URL=your_url
   UPSTASH_REDIS_REST_TOKEN=your_token
   API_DISABLED=false
   ```
3. Deploy
4. Test `/examples-lab` endpoint
5. Verify rate limiting (429 after limit)
6. Test kill switch (`API_DISABLED=true` → 503)

## Troubleshooting

**503 Error**: "Public source retrieval not configured"
- Add `TAVILY_API_KEY` to environment variables

**429 Error**: "Rate limit exceeded"
- Wait 1 hour or use different IP

**503 Error**: "API temporarily disabled"
- Set `API_DISABLED=false` or wait for operator

## License

MIT License - see LICENSE file for details.
