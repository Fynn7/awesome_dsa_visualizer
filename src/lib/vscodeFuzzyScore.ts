/*---------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 *
 * Adapted from:
 * https://github.com/microsoft/vscode/blob/main/src/vs/base/common/filters.ts
 *--------------------------------------------------------------------------------------------*/

const MAX_LEN = 128;

const enum Arrow {
  Diag = 1,
  Left = 2,
  LeftLeft = 3,
}

export type FuzzyScore = [score: number, wordStart: number, ...matches: number[]];

export type FuzzyScoreOptions = {
  firstMatchCanBeWeak: boolean;
  boostFullMatch: boolean;
};

export const strictFuzzyScoreOptions: FuzzyScoreOptions = {
  firstMatchCanBeWeak: false,
  boostFullMatch: true,
};

function initTable(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

function isSeparatorAtPos(value: string, index: number): boolean {
  if (index < 0 || index >= value.length) {
    return false;
  }

  switch (value.charCodeAt(index)) {
    case 32: // Space
    case 34: // "
    case 36: // $
    case 39: // '
    case 40: // (
    case 41: // )
    case 45: // -
    case 46: // .
    case 47: // /
    case 58: // :
    case 60: // <
    case 62: // >
    case 91: // [
    case 92: // \
    case 93: // ]
    case 95: // _
    case 123: // {
    case 125: // }
      return true;
    default:
      return false;
  }
}

function isWhitespaceAtPos(value: string, index: number): boolean {
  if (index < 0 || index >= value.length) {
    return false;
  }

  const code = value.charCodeAt(index);
  return code === 32 || code === 9;
}

function isUpperCaseAtPos(pos: number, word: string, wordLower: string): boolean {
  return word[pos] !== wordLower[pos];
}

function isPatternInWord(
  patternLower: string,
  patternStart: number,
  patternLen: number,
  wordLower: string,
  wordStart: number,
  wordLen: number,
  minWordMatchPos?: number[]
): boolean {
  let patternPos = patternStart;
  let wordPos = wordStart;

  while (patternPos < patternLen && wordPos < wordLen) {
    if (patternLower[patternPos] === wordLower[wordPos]) {
      if (minWordMatchPos) {
        minWordMatchPos[patternPos] = wordPos;
      }
      patternPos += 1;
    }
    wordPos += 1;
  }

  return patternPos === patternLen;
}

function fillInMaxWordMatchPos(
  patternLen: number,
  wordLen: number,
  patternStart: number,
  wordStart: number,
  patternLower: string,
  wordLower: string
): number[] {
  const maxWordMatchPos = Array(patternLen).fill(0);
  let patternPos = patternLen - 1;
  let wordPos = wordLen - 1;

  while (patternPos >= patternStart && wordPos >= wordStart) {
    if (patternLower[patternPos] === wordLower[wordPos]) {
      maxWordMatchPos[patternPos] = wordPos;
      patternPos -= 1;
    }
    wordPos -= 1;
  }

  return maxWordMatchPos;
}

function doScore(
  pattern: string,
  patternLower: string,
  patternPos: number,
  patternStart: number,
  word: string,
  wordLower: string,
  wordPos: number,
  wordLen: number,
  wordStart: number,
  newMatchStart: boolean,
  outFirstMatchStrong: boolean[]
): number {
  if (patternLower[patternPos] !== wordLower[wordPos]) {
    return Number.MIN_SAFE_INTEGER;
  }

  let score = 1;
  let isGapLocation = false;

  if (wordPos === patternPos - patternStart) {
    score = pattern[patternPos] === word[wordPos] ? 7 : 5;
  } else if (
    isUpperCaseAtPos(wordPos, word, wordLower) &&
    (wordPos === 0 || !isUpperCaseAtPos(wordPos - 1, word, wordLower))
  ) {
    score = pattern[patternPos] === word[wordPos] ? 7 : 5;
    isGapLocation = true;
  } else if (
    isSeparatorAtPos(wordLower, wordPos) &&
    (wordPos === 0 || !isSeparatorAtPos(wordLower, wordPos - 1))
  ) {
    score = 5;
  } else if (
    isSeparatorAtPos(wordLower, wordPos - 1) ||
    isWhitespaceAtPos(wordLower, wordPos - 1)
  ) {
    score = 5;
    isGapLocation = true;
  }

  if (score > 1 && patternPos === patternStart) {
    outFirstMatchStrong[0] = true;
  }

  if (!isGapLocation) {
    isGapLocation =
      isUpperCaseAtPos(wordPos, word, wordLower) ||
      isSeparatorAtPos(wordLower, wordPos - 1) ||
      isWhitespaceAtPos(wordLower, wordPos - 1);
  }

  if (patternPos === patternStart) {
    if (wordPos > wordStart) {
      score -= isGapLocation ? 3 : 5;
    }
  } else if (newMatchStart) {
    score += isGapLocation ? 2 : 0;
  } else {
    score += isGapLocation ? 0 : 1;
  }

  if (wordPos + 1 === wordLen) {
    score -= isGapLocation ? 3 : 5;
  }

  return score;
}

export function fuzzyScore(
  pattern: string,
  patternLower: string,
  patternStart: number,
  word: string,
  wordLower: string,
  wordStart: number,
  options: FuzzyScoreOptions = strictFuzzyScoreOptions
): FuzzyScore | undefined {
  const patternLen = Math.min(pattern.length, MAX_LEN);
  const wordLen = Math.min(word.length, MAX_LEN);

  if (
    patternStart >= patternLen ||
    wordStart >= wordLen ||
    patternLen - patternStart > wordLen - wordStart
  ) {
    return undefined;
  }

  const minWordMatchPos = Array(patternLen).fill(0);
  if (
    !isPatternInWord(
      patternLower,
      patternStart,
      patternLen,
      wordLower,
      wordStart,
      wordLen,
      minWordMatchPos
    )
  ) {
    return undefined;
  }

  const maxWordMatchPos = fillInMaxWordMatchPos(
    patternLen,
    wordLen,
    patternStart,
    wordStart,
    patternLower,
    wordLower
  );

  const rowCount = patternLen - patternStart + 1;
  const colCount = wordLen - wordStart + 1;
  const table = initTable(rowCount, colCount);
  const arrows = initTable(rowCount, colCount);
  const diag = initTable(rowCount, colCount);
  const hasStrongFirstMatch = [false];

  let row = 1;
  let column = 1;

  for (row = 1; row < rowCount; row += 1) {
    const patternPos = patternStart + row - 1;
    const minMatchPos = minWordMatchPos[patternPos]!;
    const maxMatchPos = maxWordMatchPos[patternPos]!;
    const nextMaxMatchPos =
      patternPos + 1 < patternLen ? maxWordMatchPos[patternPos + 1]! : wordLen;

    for (
      column = minMatchPos - wordStart + 1;
      column < nextMaxMatchPos - wordStart + 1;
      column += 1
    ) {
      const wordPos = wordStart + column - 1;
      let score = Number.MIN_SAFE_INTEGER;
      let canComeDiag = false;

      if (wordPos <= maxMatchPos) {
        score = doScore(
          pattern,
          patternLower,
          patternPos,
          patternStart,
          word,
          wordLower,
          wordPos,
          wordLen,
          wordStart,
          diag[row - 1][column - 1] === 0,
          hasStrongFirstMatch
        );
      }

      let diagScore = 0;
      if (score !== Number.MIN_SAFE_INTEGER) {
        canComeDiag = true;
        diagScore = score + table[row - 1][column - 1];
      }

      const canComeLeft = wordPos > minMatchPos;
      const leftScore = canComeLeft
        ? table[row][column - 1] + (diag[row][column - 1] > 0 ? -5 : 0)
        : 0;

      const canComeLeftLeft = wordPos > minMatchPos + 1 && diag[row][column - 1] > 0;
      const leftLeftScore = canComeLeftLeft
        ? table[row][column - 2] + (diag[row][column - 2] > 0 ? -5 : 0)
        : 0;

      if (
        canComeLeftLeft &&
        (!canComeLeft || leftLeftScore >= leftScore) &&
        (!canComeDiag || leftLeftScore >= diagScore)
      ) {
        table[row][column] = leftLeftScore;
        arrows[row][column] = Arrow.LeftLeft;
        diag[row][column] = 0;
      } else if (canComeLeft && (!canComeDiag || leftScore >= diagScore)) {
        table[row][column] = leftScore;
        arrows[row][column] = Arrow.Left;
        diag[row][column] = 0;
      } else if (canComeDiag) {
        table[row][column] = diagScore;
        arrows[row][column] = Arrow.Diag;
        diag[row][column] = diag[row - 1][column - 1] + 1;
      } else {
        throw new Error("Unexpected fuzzy score state");
      }
    }
  }

  if (!hasStrongFirstMatch[0] && !options.firstMatchCanBeWeak) {
    return undefined;
  }

  row -= 1;
  column -= 1;

  const result: FuzzyScore = [table[row][column], wordStart];
  let backwardsDiagLength = 0;
  let maxMatchColumn = 0;

  while (row >= 1) {
    let diagColumn = column;
    while (diagColumn >= 1) {
      const arrow = arrows[row][diagColumn];
      if (arrow === Arrow.LeftLeft) {
        diagColumn -= 2;
      } else if (arrow === Arrow.Left) {
        diagColumn -= 1;
      } else {
        break;
      }
    }

    if (
      backwardsDiagLength > 1 &&
      patternLower[patternStart + row - 1] === wordLower[wordStart + column - 1] &&
      !isUpperCaseAtPos(diagColumn + wordStart - 1, word, wordLower) &&
      backwardsDiagLength + 1 > diag[row][diagColumn]
    ) {
      diagColumn = column;
    }

    if (diagColumn === column) {
      backwardsDiagLength += 1;
    } else {
      backwardsDiagLength = 1;
    }

    if (!maxMatchColumn) {
      maxMatchColumn = diagColumn;
    }

    row -= 1;
    column = diagColumn - 1;
    result.push(column);
  }

  if (wordLen - wordStart === patternLen && options.boostFullMatch) {
    result[0] += 2;
  }

  const skippedCharsCount = maxMatchColumn - patternLen;
  result[0] -= skippedCharsCount;

  return result;
}
