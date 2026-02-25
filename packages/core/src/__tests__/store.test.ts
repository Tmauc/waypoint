import { beforeEach, describe, expect, it } from "vitest";

import { useWaypointStore } from "../store";
import type { JourneyTreeType } from "../types";

const tree: JourneyTreeType = [
  {
    category: "steps",
    steps: [
      { step: "step1", url: "/journey/step1" },
      { step: "step2", url: "/journey/step2" },
      { step: "step3", url: "/journey/step3" },
    ],
  },
];

beforeEach(() => {
  useWaypointStore.getState().resetAll();
});

describe("createJourney", () => {
  it("creates a journey with the given tree", () => {
    useWaypointStore.getState().createJourney("j1", tree);
    const journey = useWaypointStore.getState().getJourney("j1");
    expect(journey).toBeDefined();
    expect(journey!.tree).toEqual(tree);
    expect(journey!.currentStep).toBeNull();
    expect(journey!.history).toEqual([]);
    expect(journey!.progress).toBe(0);
  });

  it("returns the journey ID", () => {
    const id = useWaypointStore.getState().createJourney("j2", tree);
    expect(id).toBe("j2");
  });

  it("sets canResumeToDeepestStep when provided", () => {
    useWaypointStore.getState().createJourney("j3", tree, true);
    expect(
      useWaypointStore.getState().getJourney("j3")!.canResumeToDeepestStep
    ).toBe(true);
  });
});

describe("deleteJourney", () => {
  it("removes the journey", () => {
    useWaypointStore.getState().createJourney("j1", tree);
    useWaypointStore.getState().deleteJourney("j1");
    expect(useWaypointStore.getState().hasJourney("j1")).toBe(false);
  });

  it("clears activeJourneyId when deleting the active journey", () => {
    useWaypointStore.getState().createJourney("j1", tree);
    useWaypointStore.getState().setActiveJourney("j1");
    useWaypointStore.getState().deleteJourney("j1");
    expect(useWaypointStore.getState().activeJourneyId).toBeNull();
  });
});

describe("setActiveJourney", () => {
  it("sets the active journey", () => {
    useWaypointStore.getState().createJourney("j1", tree);
    useWaypointStore.getState().setActiveJourney("j1");
    expect(useWaypointStore.getState().activeJourneyId).toBe("j1");
  });

  it("warns and ignores when journey does not exist", () => {
    useWaypointStore.getState().setActiveJourney("nonexistent");
    expect(useWaypointStore.getState().activeJourneyId).toBeNull();
  });

  it("clears active journey when null is passed", () => {
    useWaypointStore.getState().createJourney("j1", tree);
    useWaypointStore.getState().setActiveJourney("j1");
    useWaypointStore.getState().setActiveJourney(null);
    expect(useWaypointStore.getState().activeJourneyId).toBeNull();
  });
});

describe("markJourneyForDeletion / cleanMarkedJourneys", () => {
  it("marks and then cleans journeys", () => {
    useWaypointStore.getState().createJourney("j1", tree);
    useWaypointStore.getState().createJourney("j2", tree);
    useWaypointStore.getState().markJourneyForDeletion("j1");
    useWaypointStore.getState().cleanMarkedJourneys();

    expect(useWaypointStore.getState().hasJourney("j1")).toBe(false);
    expect(useWaypointStore.getState().hasJourney("j2")).toBe(true);
    expect(useWaypointStore.getState().journeysToDelete).toEqual([]);
  });

  it("does not add duplicates to journeysToDelete", () => {
    useWaypointStore.getState().createJourney("j1", tree);
    useWaypointStore.getState().markJourneyForDeletion("j1");
    useWaypointStore.getState().markJourneyForDeletion("j1");
    expect(useWaypointStore.getState().journeysToDelete).toHaveLength(1);
  });
});

describe("setProgress", () => {
  it("clamps progress to 0–100", () => {
    useWaypointStore.getState().createJourney("j1", tree);
    useWaypointStore.getState().setProgress("j1", 150);
    expect(useWaypointStore.getState().getJourney("j1")!.progress).toBe(100);

    useWaypointStore.getState().setProgress("j1", -10);
    expect(useWaypointStore.getState().getJourney("j1")!.progress).toBe(0);
  });
});

describe("resetJourney", () => {
  it("resets state but preserves tree", () => {
    useWaypointStore.getState().createJourney("j1", tree);
    useWaypointStore.getState().setCurrentStep("j1", "step2");
    useWaypointStore.getState().setProgress("j1", 50);
    useWaypointStore.getState().resetJourney("j1");

    const j = useWaypointStore.getState().getJourney("j1")!;
    expect(j.currentStep).toBeNull();
    expect(j.progress).toBe(0);
    expect(j.tree).toEqual(tree);
  });
});

describe("getAllJourneyIds", () => {
  it("returns all journey IDs", () => {
    useWaypointStore.getState().createJourney("a", tree);
    useWaypointStore.getState().createJourney("b", tree);
    expect(useWaypointStore.getState().getAllJourneyIds()).toEqual(
      expect.arrayContaining(["a", "b"])
    );
  });
});
