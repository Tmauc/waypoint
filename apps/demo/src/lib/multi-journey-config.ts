import type { JourneyTreeType } from "@waypointjs/core";

export const JOURNEY_A_ID = "journey-a";
export const JOURNEY_B_ID = "journey-b";

export const JOURNEY_A_TREE: JourneyTreeType = [
  {
    category: "account",
    steps: [
      { step: "a-credentials", url: "/multi-journey/journey-a/step1" },
      { step: "a-profile", url: "/multi-journey/journey-a/step2" },
      { step: "a-confirm", url: "/multi-journey/journey-a/step3" },
    ],
  },
];

export const JOURNEY_B_TREE: JourneyTreeType = [
  {
    category: "subscription",
    steps: [
      { step: "b-plan", url: "/multi-journey/journey-b/step1" },
      { step: "b-payment", url: "/multi-journey/journey-b/step2" },
      { step: "b-confirm", url: "/multi-journey/journey-b/step3" },
    ],
  },
];
