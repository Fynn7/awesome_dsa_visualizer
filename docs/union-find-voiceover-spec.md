# Union-Find exercise voiceover specification (Exercises 1 and 2)

This document is the **single source of truth** for step outcomes, array semantics, and **array access** totals used by the in-app demos. It is written in English to match the repository language policy. Use it to align any translated narration (for example, German classroom voiceover) with the animation and the Variables panel.

Canonical data lives in [`src/lib/mockTrace.ts`](../src/lib/mockTrace.ts) (`QUICK_FIND_STEP_INPUTS`, `QUICK_UNION_STEP_INPUTS`).

## Terminology (locked for narration)

- **Vertex / node**: indices `0..9` on screen; call them **indices** when pointing at `id[i]`, or **nodes (vertices)** when referring to the graph circles.
- **`id[i]`**: array entry at index `i`.
- **Quick-find meaning**: `id[i]` is the **component id** (representative value). All vertices in one component share the same `id[i]` value.
- **Quick-union meaning**: `id[i]` is a **parent pointer** (self-loop at a **root**). The graph draws a directed edge `i -> id[i]` when `id[i] != i`.
- **Array accesses (`array_accesses`)**: matches the visualizer counters (see counting rules below).

## Operation sequence (both exercises)

Same eight calls in order:

`union(9,0)`, `union(3,4)`, `union(5,8)`, `union(7,2)`, `union(2,1)`, `union(5,7)`, `union(0,3)`, `union(4,2)`.

The Python source shown in-app follows Sedgewick-style APIs; **the precomputed traces apply these unions in order** (the exercise table style), not conditional on a separate `connected` pre-check.

## Exercise 1 — Quick-find

### Code semantics (must match narration)

From [`src/lib/algorithmSources.ts`](../src/lib/algorithmSources.ts) / `QuickFindUF.union`:

1. Read `pid = id[p]` (one access).
2. Read `qid = id[q]` (one access).
3. For each `i` from `0` to `n-1`: read `id[i]` (one access per `i`).
4. If `id[i] == pid`, write `id[i] = qid` (one access per matching `i`).

So for `n = 10`, baseline cost is **2 + 10 reads**, plus **one write per index** whose value equals `pid` before the loop.

**Merge direction**: every entry that equals **`pid`** becomes **`qid`** (the `q` side’s representative at the moment of the reads wins).

### Step table (official)

| Step | `id[]` before | `id[]` after | `array_accesses` |
|------|---------------|--------------|------------------|
| `union(9,0)` | `[0,1,2,3,4,5,6,7,8,9]` | `[0,1,2,3,4,5,6,7,8,0]` | 13 |
| `union(3,4)` | `[0,1,2,3,4,5,6,7,8,0]` | `[0,1,2,4,4,5,6,7,8,0]` | 13 |
| `union(5,8)` | `[0,1,2,4,4,5,6,7,8,0]` | `[0,1,2,4,4,8,6,7,8,0]` | 13 |
| `union(7,2)` | `[0,1,2,4,4,8,6,7,8,0]` | `[0,1,2,4,4,8,6,2,8,0]` | 13 |
| `union(2,1)` | `[0,1,2,4,4,8,6,2,8,0]` | `[0,1,1,4,4,8,6,1,8,0]` | 14 |
| `union(5,7)` | `[0,1,1,4,4,8,6,1,8,0]` | `[0,1,1,4,4,1,6,1,1,0]` | 14 |
| `union(0,3)` | `[0,1,1,4,4,1,6,1,1,0]` | `[4,1,1,4,4,1,6,1,1,4]` | 14 |
| `union(4,2)` | `[4,1,1,4,4,1,6,1,1,4]` | `[1,1,1,1,1,1,6,1,1,1]` | 16 |

### Quick-find pitfalls (for closing remarks)

- **Find** is a single read (`id[p]`), but **union** can touch the whole array.
- Students sometimes confuse **`p` and `q`** with **`pid` and `qid`**: the scan uses **`pid`**, the new label is **`qid`**.

## Exercise 2 — Quick-union

### Code semantics (must match narration)

From `QuickUnionUF`:

- **`find(i)`** (as counted in [`runQuickUnionFind`](../src/lib/mockTrace.ts)): repeatedly read `id[i]` for the loop test; if `i != id[i]`, read `id[i]` again to advance `i` toward the parent. At the root, the final equality test uses **one** read.
- **`union(p,q)`**: `i = find(p)`, `j = find(q)`, then **one write** `id[i] = j` (link **root of `p`** to **root of `q`**). Roots equal → the write would be a no-op; the trace still reflects the algorithm body as used in the exercise answer.

### Step table (official)

| Step | `id[]` before | `id[]` after | `array_accesses` |
|------|---------------|--------------|------------------|
| `union(9,0)` | `[0,1,2,3,4,5,6,7,8,9]` | `[0,1,2,3,4,5,6,7,8,0]` | 3 |
| `union(3,4)` | `[0,1,2,3,4,5,6,7,8,0]` | `[0,1,2,4,4,5,6,7,8,0]` | 3 |
| `union(5,8)` | `[0,1,2,4,4,5,6,7,8,0]` | `[0,1,2,4,4,8,6,7,8,0]` | 3 |
| `union(7,2)` | `[0,1,2,4,4,8,6,7,8,0]` | `[0,1,2,4,4,8,6,2,8,0]` | 3 |
| `union(2,1)` | `[0,1,2,4,4,8,6,2,8,0]` | `[0,1,1,4,4,8,6,2,8,0]` | 3 |
| `union(5,7)` | `[0,1,1,4,4,8,6,2,8,0]` | `[0,1,1,4,4,8,6,2,1,0]` | 9 |
| `union(0,3)` | `[0,1,1,4,4,8,6,2,1,0]` | `[4,1,1,4,4,8,6,2,1,0]` | 5 |
| `union(4,2)` | `[4,1,1,4,4,8,6,2,1,0]` | `[4,1,1,4,1,8,6,2,1,0]` | 5 |

### Parent-pointer forest after each step (for tree talk)

Edges are **`child -> parent`** (`i -> id[i]` when `id[i] != i`).

1. After `union(9,0)`: `9 -> 0`; other roots singletons.
2. After `union(3,4)`: add `3 -> 4`.
3. After `union(5,8)`: add `5 -> 8`.
4. After `union(7,2)`: add `7 -> 2`.
5. After `union(2,1)`: add `2 -> 1` (chain `7 -> 2 -> 1`, root `1`).
6. After `union(5,7)`: `find(5)` ends at `8`, `find(7)` ends at `1`; write `id[8]=1`, so add `8 -> 1` (longer chain from `5`).
7. After `union(0,3)`: roots `0` and `4`; `id[0]=4`, add `0 -> 4`.
8. After `union(4,2)`: roots `4` and `1`; `id[4]=1`, add `4 -> 1`.

### Quick-union pitfalls (for closing remarks)

- **Union** is cheap (one link), but **find** cost grows with **path length** to the root.
- The forest can become **unbalanced**; that is expected in the basic version.

## UI alignment hints

- **Quick Find** demo: pre-union cue shows **Watch these!** (pulse on `p` and `q`); result step shows inline `` `union(p,q)` `` only; `array_accesses` on the result step matches the table above.
- **Quick Union** demo: tree edges follow **`i -> id[i]`**; active union edge highlights **root of `p` -> root of `q`** when roots differ.

## Non-English narration

Full German classroom scripts that follow this spec are **not stored in this repository** (English-only policy). Generate or paste them using this file as the numeric and semantic reference.
