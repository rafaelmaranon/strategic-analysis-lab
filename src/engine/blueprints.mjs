export const BLUEPRINTS = {
  valuation_ladder: {
    required_variables: [
      "target_valuation_usd",
      "revenue_multiple", 
      "revenue_per_mile_usd",
      "miles_per_vehicle_per_year"
    ],
    required_nodes: [
      "required_revenue_usd_per_year",
      "required_miles_per_year", 
      "required_fleet_vehicles"
    ],
    required_outputs: [
      "required_revenue_usd_per_year",
      "required_miles_per_year",
      "required_fleet_vehicles"
    ],
    required_sensitivity: {
      input: "revenue_per_mile_usd",
      range: [1, 3],
      steps: 9,
      output: "required_fleet_vehicles"
    }
  }
};
