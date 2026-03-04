"use client";

import { useState } from "react";

export default function ExamplesLabClient() {
  const [question, setQuestion] = useState("Can Company B become a $1T company by 2035?");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [showExamples, setShowExamples] = useState(false);
  const [error, setError] = useState("");

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
  ];

  const handleAnalyze = async () => {
    if (!question.trim()) {
      setError("Please enter a question");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setAnswer(data.answer);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-2">
          Question
        </label>
        <textarea
          id="question"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter your autonomy scale question..."
        />
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showExamples ? "Hide" : "Show"} examples
          </button>
        </div>
        {error && (
          <div className="mt-2 text-sm text-red-600">
            Error: {error}
          </div>
        )}
      </div>

      {/* Examples Toggle */}
      {showExamples && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Reference Examples</h3>
          <ul className="space-y-1">
            {examples.map((example, index) => (
              <li key={index} className="text-sm text-gray-600">
                {index + 1}. {example}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Output Section */}
      {answer && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Analysis</h3>
          <div className="prose prose-sm max-w-none">
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
              {answer}
            </pre>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-gray-600">Analyzing question...</div>
        </div>
      )}
    </div>
  );
}
