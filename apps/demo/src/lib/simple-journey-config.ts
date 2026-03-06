import type { JourneyTreeType } from "@waypointjs/core";

export const SIMPLE_JOURNEY_ID = "simple-demo";

export const SIMPLE_JOURNEY_TREE: JourneyTreeType = [
  {
    category: "personal",
    steps: [
      { step: "name", url: "/simple-journey/step1" },
      { step: "address", url: "/simple-journey/step2" },
    ],
  },
  {
    category: "financial",
    steps: [
      { step: "income", url: "/simple-journey/step3" },
      { step: "savings", url: "/simple-journey/step4" },
    ],
  },
  {
    category: "review",
    steps: [{ step: "summary", url: "/simple-journey/step5" }],
  },
];

export const STEP_LABELS: Record<string, string> = {
  name: "Your Name",
  address: "Your Address",
  income: "Your Income",
  savings: "Your Savings",
  summary: "Summary",
};
