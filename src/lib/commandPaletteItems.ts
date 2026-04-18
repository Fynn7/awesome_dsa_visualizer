import type { AlgorithmId } from "./mockTrace";
import { getAlgorithmSpecs } from "./algorithmSpecs";
import type { FuzzyScore } from "./vscodeFuzzyScore";
import { fuzzyScore, strictFuzzyScoreOptions } from "./vscodeFuzzyScore";

export type PaletteItem = {
  id: AlgorithmId;
  title: string;
  /** Lowercase searchable aliases in addition to the display title. */
  searchBlob: string;
};

const PALETTE_ITEMS: PaletteItem[] = getAlgorithmSpecs().map((spec) => ({
  id: spec.id,
  title: spec.title,
  searchBlob: spec.searchBlob,
}));

function getSearchCandidates(item: PaletteItem): string[] {
  return [item.title, ...item.searchBlob.split(/\s+/).filter((piece) => piece.length > 0)];
}

function bestFuzzyForPiece(
  piece: string,
  candidates: string[]
): { score: number; result: FuzzyScore; candidate: string } | undefined {
  const pieceLower = piece.toLowerCase();
  let best: { score: number; result: FuzzyScore; candidate: string } | undefined;

  for (const candidate of candidates) {
    const result = fuzzyScore(
      piece,
      pieceLower,
      0,
      candidate,
      candidate.toLowerCase(),
      0,
      strictFuzzyScoreOptions
    );
    if (result && (!best || result[0] > best.score)) {
      best = { score: result[0], result, candidate };
    }
  }

  return best;
}

function scorePaletteItem(queryPieces: string[], item: PaletteItem): number | undefined {
  const candidates = getSearchCandidates(item);
  const title = item.title;
  const titleLower = title.toLowerCase();
  let totalScore = 0;

  for (const piece of queryPieces) {
    const pieceLower = piece.toLowerCase();
    const titleResult = fuzzyScore(
      piece,
      pieceLower,
      0,
      title,
      titleLower,
      0,
      strictFuzzyScoreOptions
    );
    if (!titleResult) {
      return undefined;
    }
    const best = bestFuzzyForPiece(piece, candidates);
    if (!best) {
      return undefined;
    }
    totalScore += best.score;
  }

  return totalScore;
}

/** 0-based indices into `item.title` for characters matched by each query piece (title-only; pieces that do not fuzzy-match the title contribute nothing). */
export function getTitleMatchIndices(query: string, item: PaletteItem): number[] {
  const raw = query.trim();
  if (raw === "") {
    return [];
  }

  const queryPieces = raw.split(/\s+/).filter((piece) => piece.length > 0);
  const title = item.title;
  const titleLower = title.toLowerCase();
  const indices = new Set<number>();

  for (const piece of queryPieces) {
    const pieceLower = piece.toLowerCase();
    const result = fuzzyScore(
      piece,
      pieceLower,
      0,
      title,
      titleLower,
      0,
      strictFuzzyScoreOptions
    );
    if (!result) {
      continue;
    }

    for (let i = 2; i < result.length; i += 1) {
      indices.add(result[i]!);
    }
  }

  return Array.from(indices).sort((a, b) => a - b);
}

export function getFilteredPaletteItems(query: string): {
  item: PaletteItem;
  score: number;
}[] {
  const raw = query.trim();
  if (raw === "") {
    return PALETTE_ITEMS.map((item) => ({ item, score: 1 }));
  }

  const queryPieces = raw.split(/\s+/).filter((piece) => piece.length > 0);

  const ranked = PALETTE_ITEMS.map((item, index) => {
    const score = scorePaletteItem(queryPieces, item);
    if (score === undefined) {
      return undefined;
    }

    return { item, score, index };
  })
    .filter((entry) => entry !== undefined)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map(({ item, score }) => {
      return { item, score };
    });

  return ranked;
}

/** Display title for header / chrome (single source of truth with palette list). */
export function getAlgorithmTitle(id: AlgorithmId): string {
  const found = PALETTE_ITEMS.find((item) => item.id === id);
  return found?.title ?? id;
}
