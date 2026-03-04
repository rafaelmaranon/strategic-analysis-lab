import { runExamplesLab } from "../../../examples_lab/openai_call.mjs";

export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { question } = await req.json();
    
    if (!question) {
      return Response.json({ error: "Missing question" }, { status: 400 });
    }

    const answer = await runExamplesLab(question);
    
    return Response.json({ answer });
  } catch (error) {
    console.error("Examples Lab API error:", error);
    return Response.json({ 
      error: error.message || "Internal server error" 
    }, { status: 500 });
  }
}
