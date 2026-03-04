import "dotenv/config";
import OpenAI from "openai";
import { BLUEPRINTS } from './blueprints.mjs';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function detectBlueprint(question) {
  const lowerQuestion = question.toLowerCase();
  if (lowerQuestion.includes("$") || lowerQuestion.includes("valuation") || 
      lowerQuestion.includes("market cap") || lowerQuestion.includes("trillion") || 
      lowerQuestion.includes("1t") || lowerQuestion.includes("1 trillion")) {
    return "valuation_ladder";
  }
  return "generic";
}

export const MODEL_SPEC_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    variables: {
      type: "object",
      additionalProperties: { type: "number" }
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
  required: ["variables", "nodes", "outputs", "sensitivity"]
};

const ALLOWED_OPS = ["add", "subtract", "multiply", "divide", "min", "max", "pow", "identity"];

export function semanticValidate(modelSpec, blueprintType) {
  const blueprint = BLUEPRINTS[blueprintType];
  if (!blueprint) {
    return { valid: true, reason: "No semantic validation for this blueprint" };
  }

  // Check required variables
  for (const requiredVar of blueprint.required_variables) {
    if (!modelSpec.variables || !(requiredVar in modelSpec.variables)) {
      return { 
        valid: false, 
        reason: `Missing required variable: ${requiredVar}` 
      };
    }
  }

  // Check required outputs
  for (const requiredOutput of blueprint.required_outputs) {
    if (!modelSpec.outputs || !modelSpec.outputs.includes(requiredOutput)) {
      return { 
        valid: false, 
        reason: `Missing required output: ${requiredOutput}` 
      };
    }
  }

  // Check required nodes exist
  const nodeIds = modelSpec.nodes.map(n => n.id);
  for (const requiredNode of blueprint.required_nodes) {
    if (!nodeIds.includes(requiredNode)) {
      return { 
        valid: false, 
        reason: `Missing required node: ${requiredNode}` 
      };
    }
  }

  // Check sensitivity matches exactly
  if (!modelSpec.sensitivity) {
    return { valid: false, reason: "Missing sensitivity configuration" };
  }

  const sens = modelSpec.sensitivity;
  const reqSens = blueprint.required_sensitivity;
  
  if (sens.input !== reqSens.input ||
      sens.steps !== reqSens.steps ||
      sens.output !== reqSens.output ||
      !Array.isArray(sens.range) ||
      sens.range.length !== 2 ||
      sens.range[0] !== reqSens.range[0] ||
      sens.range[1] !== reqSens.range[1]) {
    return { 
      valid: false, 
      reason: `Sensitivity configuration mismatch. Required: ${JSON.stringify(reqSens)}` 
    };
  }

  // Disallow placeholder naming
  for (const varName of Object.keys(modelSpec.variables || {})) {
    if (/node\d+|current_value/i.test(varName)) {
      return { valid: false, reason: `Placeholder variable name detected: ${varName}` };
    }
  }

  for (const node of modelSpec.nodes || []) {
    if (/node\d+/i.test(node.id)) {
      return { valid: false, reason: `Placeholder node id detected: ${node.id}` };
    }
  }

  return { valid: true, reason: "Semantic validation passed" };
}

function validateModelSpec(modelSpec) {
  // Check operators
  for (const node of modelSpec.nodes) {
    if (!ALLOWED_OPS.includes(node.op)) {
      throw new Error(`Invalid operator: ${node.op}`);
    }
  }

  // Check that all string args reference existing variables or prior nodes
  const knownIds = new Set(Object.keys(modelSpec.variables));
  
  for (const node of modelSpec.nodes) {
    for (const arg of node.args) {
      if (typeof arg === "string") {
        if (!knownIds.has(arg)) {
          throw new Error(`Unknown reference: ${arg}`);
        }
      }
    }
    knownIds.add(node.id); // Add this node for future references
  }

  return true;
}

export async function generateModelSpec(question, retryCount = 0) {
  const blueprint = detectBlueprint(question);
  
  let systemPrompt;
  if (retryCount === 0) {
    if (blueprint === "valuation_ladder") {
      systemPrompt = "Generate a valuation ladder ModelSpec JSON. Variables: target_valuation_usd, revenue_multiple, revenue_per_mile_usd, miles_per_vehicle_per_year. Nodes in this exact order: required_revenue_usd_per_year = target_valuation_usd / revenue_multiple; required_miles_per_year = required_revenue_usd_per_year / revenue_per_mile_usd; required_fleet_vehicles = required_miles_per_year / miles_per_vehicle_per_year. Outputs: those 3 node IDs. Sensitivity: input=revenue_per_mile_usd, range=[1,3], steps=9, output=required_fleet_vehicles. Use reasonable default values.";
    } else {
      systemPrompt = "You generate executable ModelSpec JSON only. Use only allowed ops. Use simple, minimal graphs. Include variables with reasonable defaults. Include outputs and sensitivity when useful.";
    }
  } else {
    systemPrompt = `Regenerate using EXACT required variable names, node ids, outputs, and sensitivity. Blueprint spec: ${JSON.stringify(BLUEPRINTS[blueprint])}. IMPORTANT: Nodes must be defined in dependency order - a node can only reference variables or nodes defined BEFORE it.`;
  }

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "ModelSpec",
          schema: MODEL_SPEC_SCHEMA
        }
      }
    });

    const modelSpec = JSON.parse(res.choices[0].message.content);
    
    // Validate the generated spec
    validateModelSpec(modelSpec);
    
    // Semantic validation for blueprints
    if (blueprint !== "generic") {
      const semanticResult = semanticValidate(modelSpec, blueprint);
      if (!semanticResult.valid) {
        console.log(`Semantic validation failed: ${semanticResult.reason}`);
        throw new Error(semanticResult.reason);
      }
      console.log(`Semantic validation passed: ${semanticResult.reason}`);
    }
    
    return modelSpec;
  } catch (error) {
    if (retryCount < 2) {
      console.log(`Validation failed (attempt ${retryCount + 1}), retrying with correction prompt...`);
      return generateModelSpec(question, retryCount + 1);
    }
    throw error;
  }
}

export async function generateInsight(question, modelSpec, values, sensitivitySeries, derived) {
  // Prepare computed outputs (outputs + key variables)
  const computed_outputs = {};
  
  // Add outputs
  for (const outputId of modelSpec.outputs) {
    computed_outputs[outputId] = values[outputId];
  }
  
  // Add key variables
  for (const [key, value] of Object.entries(modelSpec.variables)) {
    computed_outputs[key] = value;
  }

  const payload = {
    question,
    modelSpec,
    computed_outputs,
    sensitivitySeries,
    derived
  };

  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Use ONLY numbers in the provided payload. Do not invent facts. Do not compute new numbers beyond restating provided fields. If missing, say not provided. Output 5 bullets: Executive answer, Model ladder, Sensitivity, Bottleneck, Next validations."
      },
      {
        role: "user",
        content: JSON.stringify(payload, null, 2)
      }
    ]
  });

  return res.choices[0].message.content;
}
