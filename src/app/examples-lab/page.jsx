import ExamplesLabClient from "./ExamplesLabClient.jsx";

export default function ExamplesLabPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Examples Lab (Isolated)
        </h1>
        <p className="text-gray-600 mb-8">
          ChatGPT + 10 Autonomy Scale Examples. No compute engine.
        </p>
        <ExamplesLabClient />
      </div>
    </div>
  );
}
