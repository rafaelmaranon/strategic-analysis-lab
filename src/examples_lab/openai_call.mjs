import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function runExamplesLab(userQuestion) {
  const { buildExamplesPrompt } = await import('./prompt_v1.mjs');
  
  // Fetch public context for sanity checks
  const { buildSearchQueries, fetchPublicSnippets } = await import('./public_context.mjs');
  const queries = buildSearchQueries(userQuestion);
  const publicSnippets = await fetchPublicSnippets(queries);
  
  const { systemPrompt, userPrompt } = buildExamplesPrompt({ 
    userQuestion, 
    publicSnippets 
  });

  const modelName = "gpt-4.1";
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
    snippets: publicSnippets
  };
}
