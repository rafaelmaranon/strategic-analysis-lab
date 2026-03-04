import fetch from "node-fetch";

const QUESTION = "Can Company A become a $1T company by 2035?";
const RUNS = 20;

function validate(spec) {
  try {
    if (spec.blueprint !== "valuation_ladder") return "blueprint";

    const requiredVars = [
      "target_valuation_usd",
      "revenue_multiple",
      "revenue_per_mile_usd",
      "miles_per_vehicle_per_year"
    ];

    for (const v of requiredVars) {
      if (typeof spec.variables?.[v] !== "number") return "variables";
    }

    const requiredNodes = [
      "required_revenue_usd_per_year",
      "required_miles_per_year",
      "required_fleet_vehicles"
    ];

    const nodeIds = spec.nodes?.map(n => n.id) || [];
    for (const id of requiredNodes) {
      if (!nodeIds.includes(id)) return "nodes";
    }

    if (!Array.isArray(spec.outputs)) return "outputs";

    if (!spec.sensitivity) return "sensitivity";

    return null; // valid
  } catch (e) {
    return "exception";
  }
}

async function run() {
  let success = 0;
  const failures = {};

  for (let i = 1; i <= RUNS; i++) {
    const res = await fetch("http://localhost:3000/modelspec", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: QUESTION })
    });

    const json = await res.json();
    const error = validate(json);

    if (!error) {
      success++;
      console.log(`Run ${i}: ✅`);
    } else {
      failures[error] = (failures[error] || 0) + 1;
      console.log(`Run ${i}: ❌ (${error})`);
    }
  }

  console.log("\n==== RESULT ====");
  console.log(`Success Rate: ${success}/${RUNS}`);
  console.log("Failure breakdown:", failures);
}

run();
