import { evalOp } from './ops.mjs';

export function orderNodesByDependencies(nodes, variableKeys) {
  const ordered = [];
  const remaining = [...nodes];
  const availableIds = new Set(variableKeys);
  
  while (remaining.length > 0) {
    let found = false;
    
    for (let i = 0; i < remaining.length; i++) {
      const node = remaining[i];
      
      // Check if all dependencies are available
      const canExecute = node.args.every(arg => {
        if (typeof arg === "number") return true;
        if (typeof arg === "string") return availableIds.has(arg);
        return false;
      });
      
      if (canExecute) {
        // Move this node to ordered list
        ordered.push(node);
        availableIds.add(node.id);
        remaining.splice(i, 1);
        found = true;
        break;
      }
    }
    
    if (!found) {
      // Cycle detected or missing dependencies
      const pendingIds = remaining.map(n => n.id);
      throw new Error(`Unresolvable dependencies: ${pendingIds.join(", ")}`);
    }
  }
  
  return ordered;
}

export function executeModel(modelSpec, variableOverrides = {}) {
  // Start with variables, applying any overrides
  const values = { ...modelSpec.variables, ...variableOverrides };
  
  // Order nodes by dependencies
  const originalOrder = modelSpec.nodes.map(n => n.id);
  const orderedNodes = orderNodesByDependencies(modelSpec.nodes, Object.keys(modelSpec.variables));
  const newOrder = orderedNodes.map(n => n.id);
  
  if (JSON.stringify(originalOrder) !== JSON.stringify(newOrder)) {
    console.log("🔄 Reordered nodes to satisfy dependencies.");
  }
  
  // Execute nodes in order
  for (const node of orderedNodes) {
    // Resolve arguments
    const resolvedArgs = node.args.map(arg => {
      if (typeof arg === "number") {
        return arg;
      } else if (typeof arg === "string") {
        if (values[arg] !== undefined) {
          return values[arg];
        } else {
          throw new Error(`Unknown reference: ${arg}`);
        }
      } else {
        throw new Error(`Invalid argument type: ${typeof arg}`);
      }
    });
    
    // Compute node value
    const computedValue = evalOp(node.op, resolvedArgs);
    values[node.id] = computedValue;
  }
  
  return values;
}
