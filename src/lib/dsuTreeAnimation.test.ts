import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  animateDsuTreeStep,
  easeOutEmphasized,
  snapDsuTree,
  type DsuEdgeDescriptor,
  type DsuPoint,
} from "./dsuTreeAnimation";
import { DSU_NODE_RADIUS_PX, pointOnCircleToward } from "./dsuGraphLayout";

type StyleStub = {
  left: string;
  top: string;
};

type NodeSlotStub = { style: StyleStub };

type LineStub = {
  attrs: Record<string, string>;
  setAttribute: (name: string, value: string) => void;
};

function createNodeSlot(): NodeSlotStub {
  return { style: { left: "", top: "" } };
}

function createLine(): LineStub {
  const line: LineStub = {
    attrs: {},
    setAttribute(name: string, value: string) {
      this.attrs[name] = value;
    },
  };
  return line;
}

function asNodeMap(entries: ReadonlyArray<[number, NodeSlotStub]>) {
  return new Map(
    entries.map(([id, stub]) => [id, stub as unknown as HTMLElement])
  );
}

function asLineMap(entries: ReadonlyArray<[string, LineStub]>) {
  return new Map(
    entries.map(([key, stub]) => [key, stub as unknown as SVGLineElement])
  );
}

function attrFloat(line: LineStub, name: string): number {
  return Number(line.attrs[name]);
}

describe("easeOutEmphasized", () => {
  it("maps the endpoints exactly", () => {
    expect(easeOutEmphasized(0)).toBe(0);
    expect(easeOutEmphasized(1)).toBe(1);
  });

  it("clamps below 0 and above 1", () => {
    expect(easeOutEmphasized(-0.5)).toBe(0);
    expect(easeOutEmphasized(1.5)).toBe(1);
  });

  it("is strictly increasing on (0, 1)", () => {
    const samples = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];
    for (let i = 1; i < samples.length; i += 1) {
      const prev = easeOutEmphasized(samples[i - 1]!);
      const curr = easeOutEmphasized(samples[i]!);
      expect(curr).toBeGreaterThan(prev);
    }
  });

  it("front-loads progress (curve accelerates early)", () => {
    // Characteristic of cubic-bezier(0.22, 1, 0.36, 1): significant
    // progress by t = 0.3, near-saturation by t = 0.6.
    expect(easeOutEmphasized(0.3)).toBeGreaterThan(0.6);
    expect(easeOutEmphasized(0.6)).toBeGreaterThan(0.9);
  });
});

describe("snapDsuTree", () => {
  it("writes left/top on every node slot and endpoint attrs on every edge", () => {
    const slots = [createNodeSlot(), createNodeSlot()];
    const line = createLine();
    const positions = new Map<number, DsuPoint>([
      [0, { x: 100, y: 50 }],
      [1, { x: 300, y: 200 }],
    ]);
    const edges: DsuEdgeDescriptor[] = [
      { key: "e", from: 0, to: 1 },
    ];

    snapDsuTree(
      {
        nodeSlots: asNodeMap([
          [0, slots[0]!],
          [1, slots[1]!],
        ]),
        edgeLines: asLineMap([["e", line]]),
      },
      positions,
      edges,
      DSU_NODE_RADIUS_PX
    );

    expect(slots[0]!.style.left).toBe("100px");
    expect(slots[0]!.style.top).toBe("50px");
    expect(slots[1]!.style.left).toBe("300px");
    expect(slots[1]!.style.top).toBe("200px");
    expect(line.attrs.x1).toBeDefined();
    expect(line.attrs.x2).toBeDefined();
  });

  it("writes x1/y1 on the edge.to circle (parent) and x2/y2 on the edge.from circle (child)", () => {
    const fromPos: DsuPoint = { x: 100, y: 50 };
    const toPos: DsuPoint = { x: 300, y: 200 };
    const expectedParentSide = pointOnCircleToward(toPos, fromPos, DSU_NODE_RADIUS_PX);
    const expectedChildSide = pointOnCircleToward(fromPos, toPos, DSU_NODE_RADIUS_PX);

    const line = createLine();
    snapDsuTree(
      {
        nodeSlots: new Map(),
        edgeLines: asLineMap([["e", line]]),
      },
      new Map([
        [0, fromPos],
        [1, toPos],
      ]),
      [{ key: "e", from: 0, to: 1 }],
      DSU_NODE_RADIUS_PX
    );

    expect(attrFloat(line, "x1")).toBeCloseTo(expectedParentSide.x, 6);
    expect(attrFloat(line, "y1")).toBeCloseTo(expectedParentSide.y, 6);
    expect(attrFloat(line, "x2")).toBeCloseTo(expectedChildSide.x, 6);
    expect(attrFloat(line, "y2")).toBeCloseTo(expectedChildSide.y, 6);
  });

  it("skips edges whose endpoint positions are missing", () => {
    const line = createLine();
    snapDsuTree(
      {
        nodeSlots: new Map(),
        edgeLines: asLineMap([["e", line]]),
      },
      new Map<number, DsuPoint>([[0, { x: 0, y: 0 }]]),
      [{ key: "e", from: 0, to: 1 }],
      DSU_NODE_RADIUS_PX
    );
    expect(line.attrs.x1).toBeUndefined();
  });

  it("is a no-op for ids/keys without a registered ref", () => {
    expect(() =>
      snapDsuTree(
        { nodeSlots: new Map(), edgeLines: new Map() },
        new Map<number, DsuPoint>([[0, { x: 10, y: 10 }]]),
        [{ key: "missing", from: 0, to: 1 }],
        DSU_NODE_RADIUS_PX
      )
    ).not.toThrow();
  });
});

describe("animateDsuTreeStep", () => {
  beforeEach(() => {
    // The driver depends on global requestAnimationFrame / cancelAnimationFrame.
    // Under the node vitest environment these are not defined; stub them with
    // no-ops so the RAF path can be exercised without actually advancing.
    vi.stubGlobal("requestAnimationFrame", () => 0);
    vi.stubGlobal("cancelAnimationFrame", () => {});
  });

  it("snaps to nextPositions immediately when durationMs <= 0", () => {
    const slot = createNodeSlot();
    const line = createLine();
    const cancel = animateDsuTreeStep(
      {
        nodeSlots: asNodeMap([[0, slot], [1, createNodeSlot()]]),
        edgeLines: asLineMap([["e", line]]),
      },
      {
        prevPositions: new Map([
          [0, { x: 0, y: 0 }],
          [1, { x: 0, y: 0 }],
        ]),
        nextPositions: new Map([
          [0, { x: 100, y: 50 }],
          [1, { x: 300, y: 200 }],
        ]),
        edges: [{ key: "e", from: 0, to: 1 }],
        durationMs: 0,
        nodeRadiusPx: DSU_NODE_RADIUS_PX,
      }
    );

    expect(slot.style.left).toBe("100px");
    expect(slot.style.top).toBe("50px");
    expect(cancel).toBeTypeOf("function");
    // Safe to call and be idempotent.
    expect(() => cancel()).not.toThrow();
  });

  it("synchronously paints the t=0 frame at prevPositions before the RAF loop runs", () => {
    const slot = createNodeSlot();
    const otherSlot = createNodeSlot();
    const line = createLine();

    const cancel = animateDsuTreeStep(
      {
        nodeSlots: asNodeMap([[0, slot], [1, otherSlot]]),
        edgeLines: asLineMap([["e", line]]),
      },
      {
        prevPositions: new Map([
          [0, { x: 10, y: 20 }],
          [1, { x: 50, y: 60 }],
        ]),
        nextPositions: new Map([
          [0, { x: 100, y: 200 }],
          [1, { x: 500, y: 600 }],
        ]),
        edges: [{ key: "e", from: 0, to: 1 }],
        durationMs: 500,
        nodeRadiusPx: DSU_NODE_RADIUS_PX,
      }
    );

    // The t=0 prime must leave slots at prev positions so the first paint
    // after React's commit does not flash the target state.
    expect(slot.style.left).toBe("10px");
    expect(slot.style.top).toBe("20px");
    expect(otherSlot.style.left).toBe("50px");
    expect(otherSlot.style.top).toBe("60px");
    expect(line.attrs.x1).toBeDefined();

    cancel();
  });

  it("returns a cancel handle that stops the scheduled RAF without throwing", () => {
    const cancel = animateDsuTreeStep(
      { nodeSlots: new Map(), edgeLines: new Map() },
      {
        prevPositions: new Map([[0, { x: 0, y: 0 }]]),
        nextPositions: new Map([[0, { x: 10, y: 10 }]]),
        edges: [],
        durationMs: 500,
        nodeRadiusPx: DSU_NODE_RADIUS_PX,
      }
    );
    expect(() => cancel()).not.toThrow();
    // Calling a second time is safe.
    expect(() => cancel()).not.toThrow();
  });

  it("falls back to nextPos when prevPositions lacks an id (new node entering)", () => {
    const slot = createNodeSlot();
    animateDsuTreeStep(
      {
        nodeSlots: asNodeMap([[0, slot]]),
        edgeLines: new Map(),
      },
      {
        prevPositions: new Map(), // no prev for id 0
        nextPositions: new Map([[0, { x: 100, y: 50 }]]),
        edges: [],
        durationMs: 500,
        nodeRadiusPx: DSU_NODE_RADIUS_PX,
      }
    );

    // With prev falling back to next, the t=0 prime writes next directly.
    expect(slot.style.left).toBe("100px");
    expect(slot.style.top).toBe("50px");
  });
});
