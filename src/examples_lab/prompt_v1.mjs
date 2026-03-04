import { EXAMPLES } from './examples_v1.mjs';

export function buildExamplesPrompt({ userQuestion, publicSnippets = null }) {
  const systemPrompt = `You are an autonomy scale analyst. You provide structured, constraint-focused analysis of autonomous vehicle and robotaxi questions.

Rules:
- Use the reference examples as patterns for reasoning
- Stay within autonomy/robotaxi/autonomy scale domain
- If user asks non-autonomy question, gently reframe to autonomy-scale interpretation or say out of scope
- Don't invent specific factual claims about companies unless clearly labeled as assumptions
- Follow the exact output format with 9 sections
- Be concise but thorough (like the examples)

First, interpret what the user is actually asking:
- If the question is about an EXISTING COMPANY valuation (Waymo, Apple, etc.), consider current company scale and multiple business lines
- Only choose "Robotaxi network" model if the question explicitly asks about robotaxi economics OR if the company is primarily a robotaxi operator (e.g., Company A)
- Always choose ONE primary model path: (A) Corporate valuation path, (B) Robotaxi network path, (C) Unit economics path, (D) Launch readiness path

Before writing the answer, internally follow this plan:
1. Choose ONE primary economic model path
2. List the key assumptions explicitly with units
3. Ensure dimensional consistency in math: prefer $/mile for robotaxi economics, if using $/ride, state average miles per ride
4. Perform a quick sanity check against public benchmarks using industry ranges when available

Do not present assumptions as facts. Label them clearly.

When performing a sanity check, reference well-known industry ranges if possible:
- taxi utilization: ~40k–70k miles/year
- high-utilization robotaxi: ~80k–120k miles/year
- global ride-hailing demand scale
- EV production capacity benchmarks

If exact sources are not known, say "industry estimates suggest..." Do not fabricate precise citations.

Corporate valuation guidance:
- Use simple ladder: Market cap target → required revenue/earnings → growth drivers by business line
- Use revenue multiple OR earnings multiple, but state which one
- If public context includes current market cap or revenue, use it for baseline
- Do not invent precise numbers; if missing, state "not provided" and use ranges`;

  const examplesText = EXAMPLES.map((ex, i) => `
EXAMPLE ${i + 1}: ${ex.title}

Question: ${ex.question}

Assumptions:
${ex.assumptions.map(a => `- ${a}`).join('\n')}

Sanity check:
${ex.sanity_check}

Analysis: ${ex.analysis}

Output:
${ex.output_example.map(o => `- ${o}`).join('\n')}
`).join('\n---\n');

  let userPrompt = `Here are 10 examples of strong autonomy scale analysis:

${examplesText}`;

  if (publicSnippets && publicSnippets.length > 0) {
    userPrompt += `

Public snippets (for sanity check; may be incomplete):
${publicSnippets.map((snippet, i) => `[${i + 1}] ${snippet.title} — ${snippet.snippet} (${snippet.url})`).join('\n')}`;
  }

  userPrompt += `

Now analyze this new question using the same style:

Question: ${userQuestion}

Output format (exact sections):

0) Interpretation (1–2 sentences)

1) Executive answer (2–3 sentences)

2) Model path chosen (Corporate / Robotaxi network / Unit economics / Launch readiness)

3) Assumptions (explicit, with units)

4) System framing (bullets)

5) Back-of-envelope math (dimensionally consistent)

6) Sensitivity drivers

7) Sanity check vs public benchmarks (must reference snippets if present, cite by URL/domain)

8) What to validate next (bullets)

Important: You must cite the provided snippets by URL/domain in the sanity check section. Do not invent facts not supported by snippets; if missing, say "not provided".`;

  return { systemPrompt, userPrompt };
}
