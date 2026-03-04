import { useState } from 'react'

export default function ExamplesLab() {
  const [question, setQuestion] = useState("Can Waymo become a $1T company by 2035?")
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [showExamples, setShowExamples] = useState(false)
  const [error, setError] = useState("")
  const [snippets, setSnippets] = useState<any[]>([])
  const [showSnippets, setShowSnippets] = useState(true)
  const [retrievalStatus, setRetrievalStatus] = useState<any>(null)

  const examples = [
    "Valuation ladder: Company A $1T by 2035",
    "City fleet capacity: SF 15K robotaxis",
    "Market scale: 500M trips/week by 2040",
    "Launch readiness: City X driverless in 6 weeks",
    "Edge cases: 15% utilization drop from weather",
    "Fleet ops efficiency: 20% improvement without headcount",
    "Teleops scaling: When does teleops dominate costs?",
    "Demand saturation: LA 100K robotaxis",
    "Break-even: Miles per vehicle per year",
    "Infrastructure bottleneck: 3M deliveries/day"
  ]

  function updateRetrievalStatus(snippetsData: any[]) {
    if (snippetsData && snippetsData.length > 0) {
      const provider = snippetsData[0].source_domain || 'Unknown'
      const lastFetch = snippetsData[0].fetched_at || new Date().toISOString()
      
      setRetrievalStatus({
        status: '✅ Working',
        provider,
        lastFetch,
        count: snippetsData.length
      })
    } else {
      setRetrievalStatus({
        status: '❌ Not configured',
        provider: 'Unknown',
        lastFetch: null,
        count: 0
      })
    }
  }

  const analyze = async () => {
    if (!question.trim()) {
      setError('Please enter a question')
      return
    }

    setError('')
    setAnswer('')
    setSnippets([])
    setLoading(true)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      })

      if (!response.ok) {
        const error = await response.json()
        
        if (response.status === 503) {
          setError(`Retrieval is required. Configure a real search provider or this tool will not run. Details: ${JSON.stringify(error.details, null, 2)}`)
          updateRetrievalStatus([])
          return
        }
        
        throw new Error(error.error || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setAnswer(data.answer)
      setSnippets(data.snippets || [])
      updateRetrievalStatus(data.snippets || [])
    } catch (error: any) {
      setError(error.message)
      updateRetrievalStatus([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Strategic Analysis Lab</h1>
      <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '2rem' }}>Model: gpt-4.1</p>

      {retrievalStatus && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1rem', marginBottom: '2rem', backgroundColor: '#f9fafb' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>Retrieval Status</h3>
          <div>
            <div style={{ color: retrievalStatus.status.includes('✅') ? '#059669' : '#dc2626', fontWeight: 'bold' }}>
              {retrievalStatus.status}
            </div>
            {retrievalStatus.provider !== 'Unknown' && (
              <div>Provider: {retrievalStatus.provider}</div>
            )}
            {retrievalStatus.lastFetch && (
              <div>Last fetch: {new Date(retrievalStatus.lastFetch).toLocaleString()}</div>
            )}
            <div>Snippets found: {retrievalStatus.count}</div>
          </div>
        </div>
      )}

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem', backgroundColor: '#fef3c7' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Strategic Analysis Lab (AI-assisted analysis)</div>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>Uses domain examples</li>
          <li>Uses public benchmark sanity checks</li>
          <li>No deterministic compute engine</li>
        </ul>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold' }}>Question</label>
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px', resize: 'vertical' }}
        />
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={analyze}
            disabled={loading}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
          <button
            onClick={() => setShowExamples(!showExamples)}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            {showExamples ? 'Hide examples' : 'Show examples'}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#dc2626' }}>
            {error}
          </div>
        )}
      </div>

      {showExamples && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Reference Examples</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {examples.map((example, i) => (
              <li key={i} style={{ marginBottom: '0.25rem' }}>
                <button
                  onClick={() => setQuestion(example)}
                  style={{ 
                    background: 'none', 
                    border: 'none', 
                    color: '#3b82f6', 
                    textDecoration: 'underline', 
                    cursor: 'pointer',
                    padding: 0,
                    fontSize: 'inherit',
                    fontFamily: 'inherit'
                  }}
                >
                  {example}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {snippets.length > 0 && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1rem' }}>Public snippets used</h3>
            <button
              onClick={() => setShowSnippets(!showSnippets)}
              style={{ padding: '0.25rem 0.5rem', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              {showSnippets ? 'Hide' : 'Show'}
            </button>
          </div>
          {showSnippets && (
            <div>
              {snippets.map((snippet, i) => (
                <div key={i} style={{ marginBottom: '0.75rem' }}>
                  <div style={{ fontWeight: 'bold', color: '#1f2937' }}>[{i + 1}] {snippet.title}</div>
                  <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>{snippet.snippet}</div>
                  <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                    Source: <a href={snippet.url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>{snippet.source_domain}</a>
                  </div>
                  <div style={{ color: '#9ca3af', fontSize: '0.75rem' }}>
                    Fetched: {new Date(snippet.fetched_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {answer && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem' }}>Analysis</h3>
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.875rem', lineHeight: '1.5', color: '#374151', margin: 0 }}>
            {answer}
          </pre>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
          Analyzing...
        </div>
      )}
    </div>
  )
}
