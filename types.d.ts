declare module '../../../src/server/rate_limit.mjs' {
  export function checkRateLimit(ip: string, route: string, limitPerHour?: number): Promise<{
    allowed: boolean;
    resetTime?: string;
  }>;
  export function getClientIP(req: any): string;
}

declare module '../../../src/examples_lab/openai_call.mjs' {
  export function runExamplesLab(question: string): Promise<{
    answer: string;
    snippets?: any[];
  }>;
}
