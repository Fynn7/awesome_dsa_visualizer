import { describe, expect, it } from "vitest";

import {
  getAlgorithmEnvelopeTraces,
  getAlgorithmSpec,
  getAlgorithmSpecs,
} from "./algorithmSpecs";
import { getAlgorithmDemo, getAlgorithmIds } from "./mockTrace";

describe("algorithmSpecs", () => {
  it("covers every algorithm id from the demo registry", () => {
    const specIds = getAlgorithmSpecs().map((spec) => spec.id);
    expect(specIds).toEqual(getAlgorithmIds());
  });

  it("keeps insertion-specific visual behavior", () => {
    const insertion = getAlgorithmSpec("insertion");

    expect(insertion.visual.inferJMinus1FromHighlights).toBe(true);
    expect(
      insertion.visual.getSortedExclusiveEnd({
        stepLine: 18,
        variables: {},
        valuesLength: 4,
      })
    ).toBe(4);
    expect(
      insertion.visual.getSortedExclusiveEnd({
        stepLine: 7,
        variables: {},
        valuesLength: 4,
      })
    ).toBeUndefined();
    expect(
      insertion.visual.isJInactivePhase({ stepLine: 10, jIndex: 3 })
    ).toBe(false);
  });

  it("keeps selection-specific visual behavior", () => {
    const selection = getAlgorithmSpec("selection");

    expect(selection.visual.inferJMinus1FromHighlights).toBe(false);
    expect(
      selection.visual.getSortedExclusiveEnd({
        stepLine: 5,
        variables: { i: "2" },
        valuesLength: 4,
      })
    ).toBe(2);
    expect(
      selection.visual.isJInactivePhase({ stepLine: 10, jIndex: 3 })
    ).toBe(true);
    expect(
      selection.visual.isJInactivePhase({ stepLine: 9, jIndex: 3 })
    ).toBe(false);
  });

  it("uses the shared bar-sort envelope traces", () => {
    const insertionEnvelope = getAlgorithmEnvelopeTraces("insertion", [], getAlgorithmDemo);
    const selectionEnvelope = getAlgorithmEnvelopeTraces("selection", [], getAlgorithmDemo);

    expect(insertionEnvelope.map((entry) => entry.id)).toEqual([
      "insertion",
      "selection",
    ]);
    expect(selectionEnvelope.map((entry) => entry.id)).toEqual([
      "insertion",
      "selection",
    ]);
    expect(insertionEnvelope[0]?.trace.length).toBeGreaterThan(0);
    expect(selectionEnvelope[1]?.trace.length).toBeGreaterThan(0);
  });
});
