import express from "express";
import OpenAI from "openai";
import { checkRateLimit, getClientIP } from "./src/server/rate_limit.mjs";

const app = express();
app.use(express.json());

// Kill switch check
function checkKillSwitch(req, res, next) {
  if (process.env.API_DISABLED === "true") {
    return res.status(503).json({ 
      error: "API temporarily disabled by operator." 
    });
  }
  next();
}
app.use(checkKillSwitch);
app.use(checkRateLimit);
app.use(express.static("public"));

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Intent classifier schema
const INTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    intent: {
      type: "string",
      enum: ["city_support", "teleops_dominance", "valuation_ladder"]
    },
    confidence: { type: "number", minimum: 0, maximum: 1 }
  },
  required: ["intent", "confidence"]
};

// Valuation ladder schema
const VALUATION_LADDER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    blueprint: { type: "string" },
    variables: {
      type: "object",
      additionalProperties: false,
      required: [
        "target_valuation_usd",
        "revenue_multiple",
        "revenue_per_mile_usd",
        "miles_per_vehicle_per_year"
      ],
      properties: {
        target_valuation_usd: { type: "number" },
        revenue_multiple: { type: "number" },
        revenue_per_mile_usd: { type: "number" },
        miles_per_vehicle_per_year: { type: "number" }
      }
    },
    nodes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "op", "args"],
        properties: {
          id: { type: "string" },
          op: {
            type: "string",
            enum: ["add", "subtract", "multiply", "divide", "min", "max", "pow", "identity"]
          },
          args: {
            type: "array",
            items: {
              anyOf: [{ type: "string" }, { type: "number" }]
            }
          }
        }
      }
    },
    outputs: { type: "array", items: { type: "string" } },
    sensitivity: {
      type: "object",
      additionalProperties: false,
      required: ["input", "range", "steps", "output"],
      properties: {
        input: { type: "string" },
        range: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: { type: "number" }
        },
        steps: { type: "number" },
        output: { type: "string" }
      }
    }
  },
  required: ["blueprint", "variables", "nodes", "outputs", "sensitivity"]
};

// City support schema
const CITY_SUPPORT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    blueprint: { type: "string" },
    variables: {
      type: "object",
      additionalProperties: false,
      required: [
        "target_fleet_vehicles",
        "daily_city_trips",
        "robotaxi_capture_rate",
        "trips_per_vehicle_per_day",
        "available_fast_chargers",
        "vehicles_per_charger",
        "vehicles_per_operator",
        "operators_available"
      ],
      properties: {
        target_fleet_vehicles: { type: "number" },
        daily_city_trips: { type: "number" },
        robotaxi_capture_rate: { type: "number" },
        trips_per_vehicle_per_day: { type: "number" },
        available_fast_chargers: { type: "number" },
        vehicles_per_charger: { type: "number" },
        vehicles_per_operator: { type: "number" },
        operators_available: { type: "number" }
      }
    },
    nodes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "op", "args"],
        properties: {
          id: { type: "string" },
          op: {
            type: "string",
            enum: ["add", "subtract", "multiply", "divide", "min", "max", "pow", "identity"]
          },
          args: {
            type: "array",
            items: {
              anyOf: [{ type: "string" }, { type: "number" }]
            }
          }
        }
      }
    },
    outputs: { type: "array", items: { type: "string" } },
    sensitivity: {
      type: "object",
      additionalProperties: false,
      required: ["input", "range", "steps", "output"],
      properties: {
        input: { type: "string" },
        range: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: { type: "number" }
        },
        steps: { type: "number" },
        output: { type: "string" }
      }
    }
  },
  required: ["blueprint", "variables", "nodes", "outputs", "sensitivity"]
};

// Teleops dominance schema
const TELEOPS_DOMINANCE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    blueprint: { type: "string" },
    variables: {
      type: "object",
      additionalProperties: false,
      required: [
        "fleet_size",
        "miles_per_vehicle_per_year",
        "teleop_hourly_cost_usd",
        "vehicles_per_teleop",
        "avg_speed_mph",
        "maintenance_cost_per_mile_usd",
        "energy_cost_per_mile_usd",
        "depreciation_cost_per_mile_usd",
        "overhead_fixed_usd_per_year"
      ],
      properties: {
        fleet_size: { type: "number" },
        miles_per_vehicle_per_year: { type: "number" },
        teleop_hourly_cost_usd: { type: "number" },
        vehicles_per_teleop: { type: "number" },
        avg_speed_mph: { type: "number" },
        maintenance_cost_per_mile_usd: { type: "number" },
        energy_cost_per_mile_usd: { type: "number" },
        depreciation_cost_per_mile_usd: { type: "number" },
        overhead_fixed_usd_per_year: { type: "number" }
      }
    },
    nodes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "op", "args"],
        properties: {
          id: { type: "string" },
          op: {
            type: "string",
            enum: ["add", "subtract", "multiply", "divide", "min", "max", "pow", "identity"]
          },
          args: {
            type: "array",
            items: {
              anyOf: [{ type: "string" }, { type: "number" }]
            }
          }
        }
      }
    },
    outputs: { type: "array", items: { type: "string" } },
    sensitivity: {
      type: "object",
      additionalProperties: false,
      required: ["input", "range", "steps", "output"],
      properties: {
        input: { type: "string" },
        range: {
          type: "array",
          minItems: 2,
          maxItems: 2,
          items: { type: "number" }
        },
        steps: { type: "number" },
        output: { type: "string" }
      }
    }
  },
  required: ["blueprint", "variables", "nodes", "outputs", "sensitivity"]
};

// Compute engine functions
function evalOp(op, vals) {
  switch (op) {
    case "identity":
      return vals[0];
    case "add":
      return vals.reduce((a, b) => a + b, 0);
    case "subtract":
      return vals.slice(1).reduce((a, b) => a - b, vals[0] ?? 0);
    case "multiply":
      return vals.reduce((a, b) => a * b, 1);
    case "divide":
      return (vals[0] ?? 0) / (vals[1] ?? 1);
    case "min":
      return Math.min(...vals);
    case "max":
      return Math.max(...vals);
    case "pow":
      return Math.pow(vals[0] ?? 0, vals[1] ?? 1);
    default:
      throw new Error(`Unsupported op: ${op}`);
  }
}

function topoSortNodes(variables, nodes) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const varSet = new Set(Object.keys(variables));

  const deps = new Map();
  const indegree = new Map();
  const reverse = new Map();

  for (const n of nodes) {
    deps.set(n.id, new Set());
    indegree.set(n.id, 0);
    reverse.set(n.id, new Set());
  }

  for (const n of nodes) {
    for (const a of n.args || []) {
      if (typeof a !== "string") continue;
      if (varSet.has(a)) continue;
      if (!nodeMap.has(a)) throw new Error(`Unresolved reference "${a}" in node "${n.id}"`);
      deps.get(n.id).add(a);
      reverse.get(a).add(n.id);
    }
  }

  for (const [id, set] of deps.entries()) indegree.set(id, set.size);

  const q = [];
  for (const [id, d] of indegree.entries()) if (d === 0) q.push(id);

  const ordered = [];
  while (q.length) {
    const id = q.shift();
    ordered.push(nodeMap.get(id));
    for (const child of reverse.get(id)) {
      indegree.set(child, indegree.get(child) - 1);
      if (indegree.get(child) === 0) q.push(child);
    }
  }

  if (ordered.length !== nodes.length) {
    throw new Error(`Cycle detected (ordered=${ordered.length}, total=${nodes.length})`);
  }
  return ordered;
}

function compute(spec, overrides = {}) {
  const variables = { ...spec.variables, ...(overrides || {}) };
  const ordered = topoSortNodes(variables, spec.nodes);

  const computed = {};
  const getVal = (x) => {
    if (typeof x === "number") return x;
    if (x in computed) return computed[x];
    if (x in variables) return variables[x];
    throw new Error(`Missing value for "${x}"`);
  };

  for (const n of ordered) {
    const vals = n.args.map(getVal);
    computed[n.id] = evalOp(n.op, vals);
  }

  const outputs = {};
  for (const k of spec.outputs) outputs[k] = getVal(k);
  return { variables, computed, outputs };
}

function sensitivityTable(spec, overrides = {}) {
  if (!spec.sensitivity) return null;
  const { input, range, steps, output } = spec.sensitivity;
  const [a, b] = range;
  const n = Math.max(2, Math.floor(steps));

  const rows = [];
  for (let i = 0; i < n; i++) {
    const v = a + ((b - a) * i) / (n - 1);
    const res = compute(spec, { ...(overrides || {}), [input]: v });
    rows.push({ x: v, y: res.outputs[output] ?? res.computed[output] });
  }
  return rows;
}

function computeCitySupportExtras(spec, results) {
  const constraints = [
    { name: "demand", value: results.outputs.fleet_supported_by_demand },
    { name: "charging", value: results.outputs.fleet_supported_by_charging },
    { name: "teleops", value: results.outputs.fleet_supported_by_teleops }
  ].sort((a, b) => a.value - b.value);
  
  return {
    binding_constraint: constraints[0].name,
    ranked_constraints: constraints
  };
}

function computeTeleopsCrossover(sensitivity) {
  if (!sensitivity) return null;
  
  // Find sign change point
  for (let i = 0; i < sensitivity.length - 1; i++) {
    const curr = sensitivity[i];
    const next = sensitivity[i + 1];
    
    if (curr.y <= 0 && next.y > 0) {
      // Linear interpolation
      const ratio = -curr.y / (next.y - curr.y);
      return curr.x + ratio * (next.x - curr.x);
    }
  }
  
  return sensitivity[sensitivity.length - 1].x > 0 ? 
    sensitivity[0].x : null;
}

// Intent classifier
async function classifyIntent(question) {
  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "Classify the user question into exactly one intent. Return JSON only." },
      { role: "user", content: question }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "Intent",
        schema: INTENT_SCHEMA
      }
    }
  });
  
  return JSON.parse(resp.choices[0].message.content);
}

// Model spec generators
async function generateModelSpec(question, intent) {
  let schema, systemPrompt;
  
  switch (intent) {
    case "valuation_ladder":
      schema = VALUATION_LADDER_SCHEMA;
      systemPrompt = [
        "Return executable ModelSpec JSON only. No explanation, no markdown.",
        "",
        "Set blueprint = \"valuation_ladder\".",
        "",
        "Variables (all numeric, use reasonable defaults):",
        "  target_valuation_usd, revenue_multiple, revenue_per_mile_usd, miles_per_vehicle_per_year",
        "",
        "Nodes (exactly 3, in this order):",
        "  1. id=\"required_revenue_usd_per_year\", op=\"divide\", args=[\"target_valuation_usd\", \"revenue_multiple\"]",
        "  2. id=\"required_miles_per_year\", op=\"divide\", args=[\"required_revenue_usd_per_year\", \"revenue_per_mile_usd\"]",
        "  3. id=\"required_fleet_vehicles\", op=\"divide\", args=[\"required_miles_per_year\", \"miles_per_vehicle_per_year\"]",
        "",
        "outputs = [\"required_revenue_usd_per_year\", \"required_miles_per_year\", \"required_fleet_vehicles\"]",
        "",
        "sensitivity:",
        "  input = \"revenue_per_mile_usd\"",
        "  range = [1, 3]",
        "  steps = 9",
        "  output = \"required_fleet_vehicles\""
      ].join("\n");
      break;
      
    case "city_support":
      schema = CITY_SUPPORT_SCHEMA;
      systemPrompt = [
        "Return executable ModelSpec JSON only. No explanation, no markdown.",
        "",
        "Set blueprint = \"city_support\".",
        "",
        "Variables (all numeric, use reasonable defaults):",
        "  target_fleet_vehicles, daily_city_trips, robotaxi_capture_rate, trips_per_vehicle_per_day,",
        "  available_fast_chargers, vehicles_per_charger, vehicles_per_operator, operators_available",
        "",
        "Nodes (exactly 6, in this order):",
        "  1. id=\"robotaxi_daily_trips\", op=\"multiply\", args=[\"daily_city_trips\", \"robotaxi_capture_rate\"]",
        "  2. id=\"fleet_supported_by_demand\", op=\"divide\", args=[\"robotaxi_daily_trips\", \"trips_per_vehicle_per_day\"]",
        "  3. id=\"fleet_supported_by_charging\", op=\"multiply\", args=[\"available_fast_chargers\", \"vehicles_per_charger\"]",
        "  4. id=\"fleet_supported_by_teleops\", op=\"multiply\", args=[\"vehicles_per_operator\", \"operators_available\"]",
        "  5. id=\"max_fleet_supported\", op=\"min\", args=[\"fleet_supported_by_demand\", \"fleet_supported_by_charging\", \"fleet_supported_by_teleops\"]",
        "  6. id=\"gap_to_target\", op=\"subtract\", args=[\"max_fleet_supported\", \"target_fleet_vehicles\"]",
        "",
        "outputs = [\"target_fleet_vehicles\", \"fleet_supported_by_demand\", \"fleet_supported_by_charging\", \"fleet_supported_by_teleops\", \"max_fleet_supported\", \"gap_to_target\"]",
        "",
        "sensitivity:",
        "  input = \"vehicles_per_operator\"",
        "  range = [20, 80]",
        "  steps = 9",
        "  output = \"max_fleet_supported\""
      ].join("\n");
      break;
      
    case "teleops_dominance":
      schema = TELEOPS_DOMINANCE_SCHEMA;
      systemPrompt = [
        "Return executable ModelSpec JSON only. No explanation, no markdown.",
        "",
        "Set blueprint = \"teleops_dominance\".",
        "",
        "Variables (all numeric, use reasonable defaults):",
        "  fleet_size, miles_per_vehicle_per_year, teleop_hourly_cost_usd, vehicles_per_teleop,",
        "  avg_speed_mph, maintenance_cost_per_mile_usd, energy_cost_per_mile_usd,",
        "  depreciation_cost_per_mile_usd, overhead_fixed_usd_per_year",
        "",
        "Nodes (exactly 5, in this order):",
        "  1. id=\"teleops_cost_per_mile_usd\", op=\"divide\", args=[\"teleop_hourly_cost_usd\", \"multiply(vehicles_per_teleop, avg_speed_mph)\"]",
        "  2. id=\"overhead_cost_per_mile_usd\", op=\"divide\", args=[\"overhead_fixed_usd_per_year\", \"multiply(fleet_size, miles_per_vehicle_per_year)\"]",
        "  3. id=\"other_non_overhead_cost_per_mile_usd\", op=\"add\", args=[\"depreciation_cost_per_mile_usd\", \"maintenance_cost_per_mile_usd\", \"energy_cost_per_mile_usd\"]",
        "  4. id=\"max_other_cost_per_mile_usd\", op=\"max\", args=[\"overhead_cost_per_mile_usd\", \"other_non_overhead_cost_per_mile_usd\"]",
        "  5. id=\"teleops_minus_max_other_usd_per_mile\", op=\"subtract\", args=[\"teleops_cost_per_mile_usd\", \"max_other_cost_per_mile_usd\"]",
        "",
        "outputs = [\"teleops_cost_per_mile_usd\", \"overhead_cost_per_mile_usd\", \"other_non_overhead_cost_per_mile_usd\", \"max_other_cost_per_mile_usd\", \"teleops_minus_max_other_usd_per_mile\"]",
        "",
        "sensitivity:",
        "  input = \"fleet_size\"",
        "  range = [1000, 100000]",
        "  steps = 9",
        "  output = \"teleops_minus_max_other_usd_per_mile\""
      ].join("\n");
      break;
      
    default:
      throw new Error(`Unknown intent: ${intent}`);
  }

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question }
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ModelSpec",
        schema
      }
    }
  });

  return JSON.parse(resp.choices[0].message.content);
}

async function generateInsight(question, intent, variables, outputs, extras, sensitivity) {
  const context = {
    question,
    intent,
    variables,
    outputs,
    sensitivity_summary: sensitivity ? {
      input: sensitivity[0]?.x,
      output: sensitivity[0]?.y,
      range: `${sensitivity[0]?.x} → ${sensitivity[sensitivity.length - 1]?.x}`,
      output_range: `${sensitivity[0]?.y} → ${sensitivity[sensitivity.length - 1]?.y}`
    } : null,
    ...extras
  };

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { 
        role: "system", 
        content: "Use ONLY the provided values. Do not compute new numbers. Provide a concise insight about the question based on the results." 
      },
      { 
        role: "user", 
        content: JSON.stringify(context, null, 2) 
      }
    ]
  try {
    const { question } = req.body ?? {};
    if (!question) return res.status(400).json({ error: "Missing question" });

    // Rate limiting check
    const ip = getClientIP(req);
    const rateLimitResult = await checkRateLimit(ip, 'analyze', 10);
    
    if (!rateLimitResult.allowed) {
      return res.status(429).json({ 
        error: "Rate limit exceeded. Try again later.",
        limit_per_hour: 10,
        reset_time: rateLimitResult.resetTime
      });
    }

    // Classify intent
    const intentResult = await classifyIntent(question);
    
    // Generate ModelSpec
    const spec = await generateModelSpec(question, intentResult.intent);
    
    // Compute results
    const results = compute(spec);
    
    // Compute sensitivity
    const sensitivity = sensitivityTable(spec);
    
    // Compute extras based on intent
    let extras = {};
    if (intentResult.intent === "city_support") {
      extras = computeCitySupportExtras(spec, results);
    } else if (intentResult.intent === "teleops_dominance") {
      extras.crossover_fleet_size = computeTeleopsCrossover(sensitivity);
    }
    
    // Generate insight
    const insight = await generateInsight(
      question, 
      intentResult.intent, 
      results.variables, 
      results.outputs, 
      extras, 
      sensitivity
    );

    return res.json({
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      spec,
      outputs: results.outputs,
      sensitivity,
      extras,
      insight
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

// Serve Examples Lab HTML
app.get("/", (req, res) => {
  res.sendFile("examples-lab.html", { root: "." });
});

app.get("/examples-lab", (req, res) => {
  res.sendFile("examples-lab.html", { root: "." });
});

app.listen(3000, () => {
  console.log("Open http://localhost:3000");
  console.log("Examples Lab: http://localhost:3000/examples-lab");
});
