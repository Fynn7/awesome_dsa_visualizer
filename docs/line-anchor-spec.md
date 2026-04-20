# Line Anchor Specification

This document is the authoritative source for code-line anchoring rules used by traces, editor highlighting, and related visualization policies.

## Rule: No hardcoded trace line numbers

- Do not hardcode business line numbers directly in trace builders, animation policies, or algorithm-specific visual logic.
- Resolve all line numbers from source text anchors using shared utilities (`lineAnchors` and `algorithmLineAnchors`).
- If an anchor cannot be resolved uniquely, fail fast with a clear error that includes algorithm id and anchor key.

## Anchor model

- Anchors are exact source-line texts that must match one line uniquely within the corresponding source string.
- Use semantic anchor names (`unionDef`, `findWhile`, `outerFor`, `swap`, `callSort`) instead of numeric names.
- Prefer offset derivation from a nearby semantic anchor only when a dedicated exact anchor would be redundant.

## Required implementation pattern

1. Add source text in `algorithmSources`.
2. Add or update anchor definitions in `algorithmLineAnchors`.
3. Consume anchors via `resolveAlgorithmAnchorLine()` or `resolveAlgorithmAnchorOffset()` in:
   - trace construction (`mockTrace`)
   - loop pulse rules
   - visual behavior helpers (sorted range, inactive pointer phase, etc.)
4. Add/adjust tests in `lineAnchors.test.ts` and affected algorithm tests.

## Adding a new algorithm

1. Define source text in `src/lib/algorithmSources.ts`.
2. Add an anchor key set and exact anchor map in `src/lib/algorithmLineAnchors.ts`.
3. Use anchor lookups everywhere line numbers are needed.
4. Add ordering and coverage assertions in `src/lib/lineAnchors.test.ts`.

## Troubleshooting

- **Missing exact anchor**: the source line text changed; update the anchor text or replace with a stable semantic anchor.
- **Ambiguous anchor**: the same line text appears multiple times; refine anchor definitions so each key is unique.
- **Unexpected highlight drift**: verify the affected trace step uses anchor resolution rather than literal line numbers.
