import { executeModel } from './compute.mjs';

export function runSensitivity(modelSpec) {
  const sensitivity = modelSpec.sensitivity;
  const [min, max] = sensitivity.range;
  const steps = sensitivity.steps;

  // Generate evenly spaced points
  const series = [];
  for (let i = 0; i < steps; i++) {
    const pointValue = min + (max - min) * (i / (steps - 1));
    
    // Override the sensitivity input variable
    const variableOverrides = {
      [sensitivity.input]: pointValue
    };
    
    // Execute model with override
    const sensitivityValues = executeModel(modelSpec, variableOverrides);
    
    series.push({
      x: pointValue,
      y: sensitivityValues[sensitivity.output]
    });
  }
  
  return series;
}
