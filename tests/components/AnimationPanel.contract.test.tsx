import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import { AnimationPanel } from "../../src/components/AnimationPanel";
import { getAlgorithmDemo } from "../../src/lib/mockTrace";
import type {
  AlgorithmId,
  MockStep,
  MockVizModel,
} from "../../src/lib/mockTrace";
import type { StepDirection } from "../../src/lib/executionReducer";

/**
 * AnimationPanel behavior contract. These assertions are expressed against
 * DOM class names, data-* attributes, and element counts — never pixel
 * snapshots — so they survive the upcoming component split (see Plan stage D).
 *
 * The guarantee we lock here: given the same algorithm id + step index +
 * prefs, the rendered DOM shape after the split must match the pre-split
 * baseline produced here. If the split changes structural tags or class
 * names, update this test AND document it in docs/ui-design.md.
 */

type PanelProps = Parameters<typeof AnimationPanel>[0];

function mkProps(
  algorithmId: AlgorithmId,
  stepIndex: number,
  overrides: Partial<PanelProps> = {}
): PanelProps {
  const demo = getAlgorithmDemo(algorithmId);
  const step: MockStep = demo.trace[stepIndex] ?? demo.trace[0]!;
  return {
    trace: demo.trace,
    viz: step.viz as MockVizModel,
    variables: step.variables,
    algorithmId,
    stepLine: step.line,
    stepIndex,
    lastStepDirection: "forward" as StepDirection,
    replayAnimationsOnStepBack: false,
    showArrayIndices: true,
    enableAnimationScroll: true,
    animationFitAllowUpscale: true,
    displayConnections: false,
    onDisplayConnectionsChange: () => {},
    speedMs: 650,
    isAutoPlayingStep: false,
    ...overrides,
  };
}

/**
 * AnimationPanel delays its real content by one animation frame via an
 * internal `isPanelReady` state (Skeleton -> real content). Helper that
 * waits for the skeleton to disappear before we query the real DOM.
 */
async function waitForReady(container: HTMLElement): Promise<void> {
  await waitFor(() => {
    expect(container.querySelector(".loading-panel-skeleton")).toBeNull();
  });
}

afterEach(() => {
  cleanup();
});

describe("AnimationPanel DOM contract", () => {
  it("quick-find at stepIndex=0: renders 10 DSU nodes and a caption", async () => {
    const { container } = render(<AnimationPanel {...mkProps("quick-find", 0)} />);
    await waitForReady(container);
    const nodes = container.querySelectorAll(".viz-dsu-node");
    expect(nodes.length).toBe(10);
    const caption = container.querySelector(".viz-caption");
    expect(caption).not.toBeNull();
  });

  it("quick-find at stepIndex=0: no union edges when displayConnections=false", async () => {
    const { container } = render(
      <AnimationPanel
        {...mkProps("quick-find", 0, { displayConnections: false })}
      />
    );
    await waitForReady(container);
    const edges = container.querySelectorAll(".viz-dsu-edge");
    expect(edges.length).toBe(0);
  });

  it("insertion at stepIndex=3: renders bar columns and pointer layer", async () => {
    const props = mkProps("insertion", 3);
    const { container } = render(<AnimationPanel {...props} />);
    await waitForReady(container);
    const bars = container.querySelectorAll(".viz-bar-col");
    const expectedCount = (props.viz as { values: number[] }).values.length;
    expect(bars.length).toBe(expectedCount);
    const pointerLayer = container.querySelector(".viz-pointers-layer");
    expect(pointerLayer).not.toBeNull();
  });

  it("quick-union at a step with activeEdge: the edge carries the active class", async () => {
    const demo = getAlgorithmDemo("quick-union");
    const activeStepIndex = demo.trace.findIndex((s) => {
      const viz = s.viz as MockVizModel;
      return viz.kind === "dsuGraph" && viz.activeEdge !== undefined;
    });
    expect(activeStepIndex).toBeGreaterThan(-1);
    const { container } = render(
      <AnimationPanel {...mkProps("quick-union", activeStepIndex)} />
    );
    await waitForReady(container);
    const activeEdges = container.querySelectorAll(".viz-dsu-edge--active");
    expect(activeEdges.length).toBeGreaterThanOrEqual(1);
  });

  it("display connections toggle: visible in Quick Find, hidden in Quick Union", async () => {
    const qf = render(<AnimationPanel {...mkProps("quick-find", 0)} />);
    await waitForReady(qf.container);
    expect(qf.container.querySelector(".ui-switch")).not.toBeNull();
    cleanup();

    const qu = render(<AnimationPanel {...mkProps("quick-union", 0)} />);
    await waitForReady(qu.container);
    expect(qu.container.querySelector(".ui-switch")).toBeNull();
  });
});
