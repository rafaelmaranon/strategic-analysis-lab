export function deriveInsights(modelSpec, values, sensitivitySeries) {
  const derived = {};

  // Find binding output (minimum numeric output)
  const outputValues = modelSpec.outputs.map(outputId => values[outputId]);
  const minOutputValue = Math.min(...outputValues);
  const bindingOutputIndex = outputValues.indexOf(minOutputValue);
  derived.binding_output_name = modelSpec.outputs[bindingOutputIndex];
  derived.binding_output_value = minOutputValue;

  // Sensitivity summary
  const yValues = sensitivitySeries.map(point => point.y);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues);
  derived.sensitivity_minY = minY;
  derived.sensitivity_maxY = maxY;
  derived.sensitivity_is_flat = Math.abs(maxY - minY) < 1e-9;

  // Optional gap calculations
  if (values.teleops_ratio !== undefined && values.target_teleops_ratio !== undefined) {
    derived.teleops_ratio_gap = values.target_teleops_ratio - values.teleops_ratio;
  }

  if (values.validation_coverage !== undefined && values.target_coverage !== undefined) {
    derived.coverage_gap = values.target_coverage - values.validation_coverage;
  }

  if (values.safety_case_complete !== undefined && values.target_safety_case !== undefined) {
    derived.safety_gap = values.target_safety_case - values.safety_case_complete;
  }

  if (values.regulatory_approval !== undefined) {
    derived.regulatory_gap = 1 - values.regulatory_approval;
  }

  return derived;
}
