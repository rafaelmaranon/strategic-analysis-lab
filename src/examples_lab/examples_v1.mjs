export const EXAMPLES = [
  {
    id: "valuation_ladder",
    title: "Valuation ladder: Company A $1T by 2035",
    question: "Can Company A become a $1T company by 2035?",
    assumptions: [
      "Revenue multiple: 10x (autonomous mobility premium)",
      "Revenue per mile: $2.00 (rideshare + logistics)",
      "Miles per vehicle per year: 100k (high utilization)",
      "10-year growth horizon to 2035"
    ],
    sanity_check: "Taxi fleets typically drive 40k–70k miles/year. Robotaxi projections suggest 80k–120k miles/year under high utilization. The 100k assumption is optimistic but within projected range.",
    analysis: "Company A would need to achieve $200B annual revenue at 10x revenue multiple. This requires 1M vehicles driving 100K miles/year at $2/mile revenue. The bottleneck is revenue per mile - current estimates are $1-1.50/mile.",
    output_example: [
      "Required: 1M vehicles, $200B revenue, 100B miles/year",
      "Key lever: Increase revenue per mile from $1.50 to $2.00",
      "Validate: Market demand at $2/mile, vehicle production scale"
    ]
  },
  {
    id: "city_fleet_capacity",
    title: "City fleet capacity: SF 15K robotaxis",
    question: "Can SF support 15,000 robotaxis by 2032?",
    assumptions: [
      "1.8M daily city trips baseline",
      "25% robotaxi market capture rate",
      "40 trips/vehicle/day utilization",
      "600 fast chargers available",
      "30 vehicles per teleops operator"
    ],
    sanity_check: "SF taxi industry supports ~5K vehicles today. 15K represents 3x expansion but within city density targets. 40 trips/day aligns with high-utilization targets.",
    analysis: "SF can support ~12K robotaxis based on demand ceiling (450K daily trips at 25% capture), charging infrastructure (600 chargers at 15 vehicles/charger), and teleops constraints (250 operators at 30 vehicles/operator). Teleops is the binding constraint.",
    output_example: [
      "Max supported: 12K vehicles (teleops bottleneck)",
      "Gap: Need 3K more vehicles or better teleops ratio",
      "Validate: Teleops training programs, charger deployment"
    ]
  },
  {
    id: "market_scale",
    title: "Market scale: 500M trips/week by 2040",
    question: "Can robotaxis reach 500M trips/week by 2040?",
    assumptions: [
      "20 trips/vehicle/week utilization",
      "50% urban market capture in target cities",
      "15-year adoption timeline",
      "Current auto production: 80M vehicles/year"
    ],
    sanity_check: "Global ride-hailing currently does ~200M trips/week. 500M represents 2.5x growth but within 15-year adoption curve for disruptive tech.",
    analysis: "500M trips/week requires ~25M vehicles globally at 20 trips/vehicle/week. This assumes 50% urban adoption in top 100 cities. The constraint is vehicle production capacity - current auto industry produces ~80M vehicles/year total.",
    output_example: [
      "Required: 25M vehicles globally",
      "Production constraint: Need 1.7M vehicles/year for robotaxis",
      "Validate: Manufacturing partnerships, city rollout timing"
    ]
  },
  {
    id: "launch_readiness",
    title: "Launch readiness: City X driverless in 6 weeks",
    question: "Is City X ready for driverless launch in 6 weeks?",
    assumptions: [
      "200 miles mapped for operational domain",
      "500 operators trained and certified",
      "Regulatory permit secured",
      "70% edge case coverage achieved"
    ],
    sanity_check: "Typical driverless launches require 6-12 months preparation. 6-week timeline is aggressive but possible for limited geofenced areas with existing mapping.",
    analysis: "City X meets minimum requirements with 200 mapped miles, 500 operators trained, and regulatory approval. However, edge case coverage is only 70% and weather testing incomplete. Recommend 4-week extension for validation.",
    output_example: [
      "Status: 80% ready, needs 4-week extension",
      "Blocking: Edge case coverage, weather validation",
      "Validate: Additional mapping, simulation testing"
    ]
  },
  {
    id: "edge_cases",
    title: "Edge cases: 15% utilization drop from weather",
    question: "What if utilization drops 15% due to weather volatility?",
    assumptions: [
      "Baseline: 40 trips/vehicle/day at $15/trip",
      "$40K vehicle cost, 5-year depreciation",
      "85% utilization threshold for profitability",
      "Weather events: 30 days/year impact"
    ],
    sanity_check: "Weather typically impacts ride-hailing 10-20% seasonally. 15% drop is realistic for severe weather regions and should be planned for in fleet economics.",
    analysis: "15% utilization drop reduces revenue per vehicle by $6K/year and increases break-even by 2K miles/year. Fleet economics remain viable above 85% utilization but margins thin significantly. Need weather resilience protocols.",
    output_example: [
      "Impact: $6K less revenue/vehicle/year",
      "New break-even: 42K miles/year (vs 40K)",
      "Mitigate: Weather routing, dynamic pricing"
    ]
  },
  {
    id: "fleet_ops_efficiency",
    title: "Fleet ops efficiency: 20% improvement without headcount",
    question: "How can we improve fleet ops efficiency by 20% without adding headcount?",
    assumptions: [
      "Current: 40 trips/vehicle/day baseline",
      "Automated dispatch reduces idle time 15%",
      "Predictive maintenance reduces downtime 10%",
      "Smart charging reduces charging time 20%"
    ],
    sanity_check: "Industry benchmarks show 15-25% efficiency gains possible through software optimization. 20% target is ambitious but achievable with integrated systems.",
    analysis: "20% efficiency gain achievable through automated dispatch (8%), predictive maintenance (5%), optimized charging (4%), and dynamic rebalancing (3%). Requires software upgrades but no additional operators.",
    output_example: [
      "Gains: 8 trips/vehicle/day additional",
      "Investment: $2M software deployment",
      "ROI: 18 months via increased revenue"
    ]
  },
  {
    id: "teleops_scaling",
    title: "Teleops scaling: When does teleops dominate costs?",
    question: "When does teleops become the dominant cost lever?",
    assumptions: [
      "$35/hour teleops labor cost",
      "30 vehicles per teleops operator",
      "$0.20/mile maintenance, $0.35/mile depreciation",
      "$0.10/mile energy costs"
    ],
    sanity_check: "Teleops costs typically dominate at 30-50K vehicle scale. $35/hour aligns with skilled operator rates in major markets.",
    analysis: "Teleops becomes dominant cost at ~50K vehicles when $35/hour teleops cost exceeds $0.65/mile total other costs. Below 30K vehicles, depreciation dominates; above 80K, overhead dominates.",
    output_example: [
      "Crossover: 50K vehicles fleet size",
      "Below 30K: Depreciation dominates",
      "Above 80K: Overhead becomes primary"
    ]
  },
  {
    id: "demand_saturation",
    title: "Demand saturation: LA 100K robotaxis",
    question: "Can LA support 100,000 robotaxis without saturating demand?",
    assumptions: [
      "LA: 5M daily trips baseline",
      "30% max robotaxi capture rate",
      "40 trips/vehicle/day economic threshold",
      "Current utilization: 35 trips/day"
    ],
    sanity_check: "LA currently supports ~2K taxis. 100K represents 50x expansion but LA's size and population density could theoretically support it with price elasticity.",
    analysis: "LA can support ~85K robotaxis before demand saturation at current trip patterns. 100K vehicles would reduce utilization to 25 trips/day, making economics marginal. Need demand generation through lower prices.",
    output_example: [
      "Max viable: 85K vehicles at 30 trips/day",
      "100K vehicles: 25 trips/day (marginal)",
      "Solution: Price reduction to stimulate demand"
    ]
  },
  {
    id: "break_even",
    title: "Break-even: Miles per vehicle per year",
    question: "How many miles/year must each robotaxi drive to break even?",
    assumptions: [
      "$40K vehicle cost, 5-year lifespan",
      "$12K/year teleops cost per vehicle",
      "$0.30/mile operating costs",
      "$1.50/mile average revenue"
    ],
    sanity_check: "Taxi break-even typically 30-40K miles/year. Robotaxi should achieve better economics due to automation, so 45K target is reasonable.",
    analysis: "Break-even requires 45K miles/year at $1.50/mile revenue. Below 35K miles/year, vehicles lose money. Key drivers are vehicle cost ($40K) and teleops cost ($12K/year).",
    output_example: [
      "Break-even: 45K miles/year",
      "Marginal: Below 35K miles/year",
      "Leverage: Increase utilization, reduce costs"
    ]
  },
  {
    id: "infrastructure_bottleneck",
    title: "Infrastructure bottleneck: 3M deliveries/day",
    question: "What is the infrastructure bottleneck for 3M autonomous deliveries/day?",
    assumptions: [
      "20 deliveries/robot/day capacity",
      "10 robots per charging station",
      "30-minute charge time",
      "Current charger density: 3K urban chargers"
    ],
    sanity_check: "Current delivery robots do ~50-100 deliveries/day. 20 deliveries/robot is conservative for autonomous systems with optimized routing.",
    analysis: "3M deliveries/day requires 150K delivery robots. Charging infrastructure is the bottleneck - need 15K chargers at 10 robots/charger. Current urban charger deployment is only 3K units.",
    output_example: [
      "Required: 150K robots, 15K chargers",
      "Bottleneck: Charging infrastructure (12K shortage)",
      "Timeline: 3 years for charger deployment"
    ]
  }
];
