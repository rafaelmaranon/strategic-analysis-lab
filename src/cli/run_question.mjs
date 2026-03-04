import { generateModelSpec, generateInsight, detectBlueprint } from '../engine/openai_models.mjs';
import { executeModel } from '../engine/compute.mjs';
import { runSensitivity } from '../engine/sensitivity.mjs';
import { deriveInsights } from '../engine/derive.mjs';

const DEFAULT_QUESTION = "Can Company A become a $1T company by 2035?";

async function runQuestion(question) {
  console.log(`\n🔍 Processing question: "${question}"\n`);
  
  const blueprint = detectBlueprint(question);
  console.log(`📋 Blueprint: ${blueprint}\n`);

  try {
    // 1. Generate ModelSpec
    console.log("📝 Generating ModelSpec...");
    const modelSpec = await generateModelSpec(question);
    console.log("✅ ModelSpec generated");
    console.log("📊 ModelSpec JSON:");
    console.log(JSON.stringify(modelSpec, null, 2));
    console.log();

    // 2. Execute model
    console.log("⚙️  Executing model...");
    const values = executeModel(modelSpec);
    console.log("✅ Model executed");
    console.log("📈 Computed outputs:");
    for (const outputId of modelSpec.outputs) {
      console.log(`  ${outputId}: ${values[outputId]}`);
    }
    console.log();

    // 3. Run sensitivity analysis
    console.log("📊 Running sensitivity analysis...");
    const sensitivitySeries = runSensitivity(modelSpec);
    console.log("✅ Sensitivity analysis complete");
    console.log("📉 Sensitivity series:");
    console.log(JSON.stringify(sensitivitySeries, null, 2));
    console.log();

    // 4. Derive insights
    console.log("🧠 Deriving insights...");
    const derived = deriveInsights(modelSpec, values, sensitivitySeries);
    console.log("✅ Insights derived");
    console.log("🔍 Derived metrics:");
    console.log(JSON.stringify(derived, null, 2));
    console.log();

    // 5. Generate insight text
    console.log("💭 Generating insight text...");
    const insight = await generateInsight(question, modelSpec, values, sensitivitySeries, derived);
    console.log("✅ Insight generated");
    console.log();
    console.log("🎯 INSIGHT SUMMARY:");
    console.log("==================");
    console.log(insight);
    console.log("==================");

  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Get question from CLI args
const question = process.argv.slice(2).join(" ") || DEFAULT_QUESTION;

runQuestion(question);
