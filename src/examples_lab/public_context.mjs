// Public context retrieval for company-specific queries
// Requires real search API - no mocks or placeholders

const MIN_SNIPPETS = 3;

// Domain quality weights for source ranking
function domainWeight(domain) {
  const domainLower = domain.toLowerCase();
  
  // Preferred factual domains (weight 3)
  if (domainLower.includes('stockanalysis.com') ||
      domainLower.includes('companiesmarketcap.com') ||
      domainLower.includes('sec.gov') ||
      domainLower.includes('nasdaq.com') ||
      domainLower.includes('macrotrends.net')) {
    return 3;
  }
  
  // Medium quality (weight 2)
  if (domainLower.includes('reuters.com') ||
      domainLower.includes('bloomberg.com') ||
      domainLower.includes('wsj.com') ||
      domainLower.includes('finance.yahoo.com')) {
    return 2;
  }
  
  // Lower quality/opinion (weight 1)
  return 1;
}

export function buildSearchQueries(question) {
  const queries = [];
  const lowerQuestion = question.toLowerCase();

  // Company-specific queries with baseline facts
  if (lowerQuestion.includes('waymo')) {
    // Always include baseline fact queries
    queries.push(
      'WAYMO market cap',
      'Waymo market cap stockanalysis',
      'Waymo market cap companiesmarketcap',
      'Waymo annual revenue 2025 2024',
      'Waymo revenue latest annual',
      'Waymo robotaxi plans 2026',
      'Waymo automotive revenue breakdown'
    );
  }

  if (lowerQuestion.includes('company a')) {
    queries.push(
      'Company A weekly rides',
      'Company A fleet size estimate',
      'Company A paid rides per week',
      'Company A revenue per ride',
      'Company A operational cities count'
    );
  }

  if (lowerQuestion.includes('cruise')) {
    queries.push(
      'Cruise fleet size',
      'Cruise robotaxi deployment',
      'Cruise operational status'
    );
  }

  if (lowerQuestion.includes('uber') || lowerQuestion.includes('lyft')) {
    queries.push(
      'Uber rides per day 2026',
      'Lyft rides per day 2026',
      'Ride hailing market size 2026'
    );
  }

  // Generic benchmark queries for any autonomy question
  if (lowerQuestion.includes('robotaxi') || lowerQuestion.includes('autonomous') || lowerQuestion.includes('self-driving')) {
    queries.push(
      'taxi miles per year typical',
      'robotaxi miles per year utilization estimate',
      'autonomous vehicle deployment statistics',
      'teleops operator cost per hour'
    );
  }

  // Valuation benchmarks
  if (lowerQuestion.includes('valuation') || lowerQuestion.includes('market cap') || lowerQuestion.includes('$1t') || lowerQuestion.includes('trillion')) {
    queries.push(
      'automotive company revenue multiples',
      'tech company valuation multiples 2026',
      'autonomous vehicle company valuations'
    );
  }

  return queries;
}

export async function fetchPublicSnippets(queries) {
  // Real implementation required - no fallbacks or mocks
  // This must be replaced with actual search API integration
  
  // Example implementation using Tavily API (replace with your preferred provider)
  const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
  
  if (!TAVILY_API_KEY) {
    throw new Error('Search API not configured. Set TAVILY_API_KEY or configure another search provider.');
  }

  console.log("ExamplesLab queries:", queries);

  const results = [];
  const fetched_at = new Date().toISOString();

  try {
    // Process queries in parallel (limit to first 3 to reduce API calls)
    const searchPromises = queries.slice(0, 3).map(async (query) => {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: query,
          search_depth: 'basic',
          include_answer: false,
          max_results: 2,
          include_domains: [],
          exclude_domains: []
        })
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results.map(result => ({
          title: result.title || query,
          snippet: (result.content || result.snippet || 'No snippet available').substring(0, 600), // Truncate to 600 chars
          url: result.url || 'https://example.com',
          score: result.score || 0,
          fetched_at,
          source_domain: new URL(result.url || 'https://example.com').hostname
        }));
      }
      
      return [];
    });

    const allResults = await Promise.all(searchPromises);
    allResults.forEach(snippetArray => results.push(...snippetArray));

    // Debug logging for raw results
    console.log("ExamplesLab raw domains:", results.slice(0, 10).map(r => r.source_domain));
    console.log("ExamplesLab raw titles:", results.slice(0, 10).map(r => r.title));

    // Apply source quality ranking
    results.sort((a, b) => {
      const aWeight = domainWeight(a.source_domain);
      const bWeight = domainWeight(b.source_domain);
      
      // Sort by domain weight first, then provider score
      if (aWeight !== bWeight) {
        return bWeight - aWeight;
      }
      
      return (b.score || 0) - (a.score || 0);
    });

    console.log("ExamplesLab selected domains:", results.slice(0, 6).map(r => r.source_domain));

    // Check baseline requirement for valuation questions
    const isValuationQuestion = queries.some(q => 
      q.toLowerCase().includes('market cap') || 
      q.toLowerCase().includes('valuation') ||
      q.toLowerCase().includes('ticker_b')
    );

    if (isValuationQuestion) {
      const hasMarketCapBaseline = results.some(r => 
        (r.title.toLowerCase().includes('market cap') || r.snippet.toLowerCase().includes('market cap') || r.title.toLowerCase().includes('capitalization')) &&
        domainWeight(r.source_domain) >= 3
      );

      if (!hasMarketCapBaseline && queries.some(q => q.toLowerCase().includes('waymo'))) {
        console.log("ExamplesLab: Missing market cap baseline, running fallback search");
        
        // Fallback search for Waymo market cap on preferred domains
        try {
          const fallbackResponse = await fetch('https://api.tavily.com/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_key: TAVILY_API_KEY,
              query: 'Waymo market cap site:stockanalysis.com OR site:companiesmarketcap.com',
              search_depth: 'basic',
              include_answer: false,
              max_results: 2,
              include_domains: ['stockanalysis.com', 'companiesmarketcap.com']
            })
          });

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.results && fallbackData.results.length > 0) {
              const fallbackResults = fallbackData.results.map(result => ({
                title: result.title || query,
                snippet: result.content || result.snippet || 'No snippet available',
                url: result.url || 'https://example.com',
                score: result.score || 0,
                fetched_at,
                source_domain: new URL(result.url || 'https://example.com').hostname
              }));
              
              // Prepend fallback results
              results.unshift(...fallbackResults);
              console.log("ExamplesLab: Added fallback market cap results");
            }
          }
        } catch (fallbackError) {
          console.log("ExamplesLab: Fallback search failed:", fallbackError.message);
        }
      }
    }

    // Validate minimum requirements
    if (results.length < MIN_SNIPPETS) {
      throw new Error(`Insufficient search results: found ${results.length}, required ${MIN_SNIPPETS}`);
    }

    return results.slice(0, 4); // Return max 4 snippets (reduced from 6)

  } catch (error) {
    console.error('Search API failure:', error);
    throw new Error(`Public source retrieval failed: ${error.message}`);
  }
}
