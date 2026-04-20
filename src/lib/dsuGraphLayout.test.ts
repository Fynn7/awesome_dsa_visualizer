import { describe, expect, it } from "vitest";
import {
  buildDsuOrthogonalPolylinePoints,
  dsuBelowRow1LaneIndex,
  dsuRow0LaneIndex,
  dsuRow1LongEdgeGutterY,
  dsuEdgeEuclideanLength,
  dsuPointsToSmoothPathD,
  DSU_ROW0_LONG_EDGE_BASE_Y,
  DSU_ROW1_LONG_EDGE_LANE_GAP,
  DSU_ROW1_LONG_EDGE_NARROW_NUDGE_PX,
  DSU_ROW1_LONG_EDGE_UPPER_BASE_Y,
  DSU_ROW_GUTTER_Y,
  getDsuNodePosition,
} from "./dsuGraphLayout";

describe("dsuGraphLayout", () => {
  it("places nodes on a 5x2 grid", () => {
    expect(getDsuNodePosition(0)).toEqual({ x: 70, y: 62 });
    expect(getDsuNodePosition(9)).toEqual({ x: 406, y: 174 });
  });

  it("uses a short horizontal segment for adjacent same-row nodes", () => {
    const p = buildDsuOrthogonalPolylinePoints(0, 1);
    expect(p).toHaveLength(2);
    expect(p[0]!.y).toBe(p[1]!.y);
  });

  it("routes non-adjacent top-row pairs between the top row and the mid gutter (e.g. 0 and 3)", () => {
    const p = buildDsuOrthogonalPolylinePoints(0, 3);
    expect(p).toHaveLength(4);
    expect(p[1]!.y).toBe(DSU_ROW0_LONG_EDGE_BASE_Y);
    expect(p[2]!.y).toBe(DSU_ROW0_LONG_EDGE_BASE_Y);
    expect(p[1]!.y).toBeLessThan(DSU_ROW_GUTTER_Y);
    expect(p[1]!.y).toBeGreaterThan(getDsuNodePosition(0).y);
  });

  it("stacks wider row-0 long edges on a lower lane than narrower ones", () => {
    const edges = [
      { from: 0, to: 3 },
      { from: 2, to: 4 },
    ];
    expect(dsuRow0LaneIndex(edges, 0)).toBe(1);
    expect(dsuRow0LaneIndex(edges, 1)).toBe(0);
    const wide = buildDsuOrthogonalPolylinePoints(0, 3, undefined, {
      row0LaneIndex: 1,
    });
    expect(wide[1]!.y).toBe(
      DSU_ROW0_LONG_EDGE_BASE_Y + DSU_ROW1_LONG_EDGE_LANE_GAP
    );
    const narrow = buildDsuOrthogonalPolylinePoints(2, 4, undefined, {
      row0LaneIndex: 0,
    });
    expect(narrow[1]!.y).toBe(DSU_ROW0_LONG_EDGE_BASE_Y);
    expect(wide[1]!.y).toBeGreaterThan(narrow[1]!.y);
  });

  it("keeps row-0 lane selection stable even when narrower peers are absent", () => {
    const onlyWide = [{ from: 0, to: 3 }];
    expect(dsuRow0LaneIndex(onlyWide, 0)).toBe(1);
    const p = buildDsuOrthogonalPolylinePoints(0, 3, undefined, {
      row0LaneIndex: dsuRow0LaneIndex(onlyWide, 0),
    });
    expect(p[1]!.y).toBe(DSU_ROW0_LONG_EDGE_BASE_Y + DSU_ROW1_LONG_EDGE_LANE_GAP);
  });

  it("routes non-adjacent bottom-row pairs above the row in an upper channel (e.g. 5 and 8)", () => {
    const p = buildDsuOrthogonalPolylinePoints(5, 8);
    expect(p).toHaveLength(4);
    expect(p[1]!.y).toBe(DSU_ROW1_LONG_EDGE_UPPER_BASE_Y);
    expect(p[2]!.y).toBe(DSU_ROW1_LONG_EDGE_UPPER_BASE_Y);
    expect(p[1]!.y).toBeGreaterThan(DSU_ROW_GUTTER_Y);
    expect(p[1]!.y).toBeLessThan(getDsuNodePosition(5).y);
    expect(p[0]!.y).not.toBe(p[1]!.y);
  });

  it("stacks wider row-1 long edges on a lower lane and nudges the narrower edge down without moving the wider y", () => {
    const edges = [
      { from: 5, to: 8 },
      { from: 5, to: 7 },
    ];
    expect(dsuBelowRow1LaneIndex(edges, 0)).toBe(0);
    expect(dsuBelowRow1LaneIndex(edges, 1)).toBe(1);
    const wideY = DSU_ROW1_LONG_EDGE_UPPER_BASE_Y;
    expect(dsuRow1LongEdgeGutterY(edges, 0)).toBe(wideY);
    expect(dsuRow1LongEdgeGutterY(edges, 1)).toBe(
      DSU_ROW1_LONG_EDGE_UPPER_BASE_Y +
        DSU_ROW1_LONG_EDGE_LANE_GAP +
        DSU_ROW1_LONG_EDGE_NARROW_NUDGE_PX
    );
    const wide = buildDsuOrthogonalPolylinePoints(5, 8, undefined, {
      row1LongEdgeGutterY: dsuRow1LongEdgeGutterY(edges, 0),
    });
    expect(wide[1]!.y).toBe(wideY);
    const narrow = buildDsuOrthogonalPolylinePoints(5, 7, undefined, {
      row1LongEdgeGutterY: dsuRow1LongEdgeGutterY(edges, 1),
    });
    expect(narrow[1]!.y).toBe(
      DSU_ROW1_LONG_EDGE_UPPER_BASE_Y +
        DSU_ROW1_LONG_EDGE_LANE_GAP +
        DSU_ROW1_LONG_EDGE_NARROW_NUDGE_PX
    );
    expect(narrow[1]!.y).toBeGreaterThan(wide[1]!.y);
  });

  it("keeps row-1 lane selection stable even when narrower peers are absent", () => {
    const onlyWide = [{ from: 5, to: 8 }];
    expect(dsuBelowRow1LaneIndex(onlyWide, 0)).toBe(0);
    expect(dsuRow1LongEdgeGutterY(onlyWide, 0)).toBe(
      DSU_ROW1_LONG_EDGE_UPPER_BASE_Y
    );
  });

  it("routes cross-row/column edges through the inter-row gutter (not along a node row)", () => {
    const p09 = buildDsuOrthogonalPolylinePoints(0, 9);
    expect(p09).toHaveLength(4);
    expect(p09[1]!.y).toBe(DSU_ROW_GUTTER_Y);
    expect(p09[2]!.y).toBe(DSU_ROW_GUTTER_Y);
    expect(p09[1]!.y).not.toBe(62);
    expect(p09[1]!.y).not.toBe(174);

    const p90 = buildDsuOrthogonalPolylinePoints(9, 0);
    expect(p90).toHaveLength(4);
    expect(p90[1]!.y).toBe(DSU_ROW_GUTTER_Y);
    expect(p90[2]!.y).toBe(DSU_ROW_GUTTER_Y);
    expect(p90[1]!.x).toBe(getDsuNodePosition(9).x);
    expect(p90[2]!.x).toBe(getDsuNodePosition(0).x);
  });

  it("reports Euclidean span for long-edge styling", () => {
    expect(dsuEdgeEuclideanLength(0, 9)).toBeGreaterThan(300);
    expect(dsuEdgeEuclideanLength(0, 1)).toBeLessThan(100);
  });

  it("renders edges as rounded polylines (L plus Q at corners, straight two-point edges)", () => {
    const p2 = buildDsuOrthogonalPolylinePoints(0, 1);
    const d2 = dsuPointsToSmoothPathD(p2);
    expect(d2.startsWith("M ")).toBe(true);
    expect(d2.includes(" L ")).toBe(true);
    expect(d2.includes(" Q ")).toBe(false);

    const p4 = buildDsuOrthogonalPolylinePoints(0, 9);
    const d4 = dsuPointsToSmoothPathD(p4);
    expect((d4.match(/ Q /g) ?? []).length).toBe(2);
    expect(d4.includes(" C ")).toBe(false);
  });
});
