export type PythonSymbolKind = "function" | "class";

export type PythonSemanticOccurrence = {
  line: number;
  start: number;
  length: number;
  kind: PythonSymbolKind;
};

const IDENTIFIER_RE = /[A-Za-z_][A-Za-z0-9_]*/g;
const CALL_RE = /\b([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;
const PYTHON_KEYWORDS = new Set([
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "case",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "False",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "match",
  "None",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "True",
  "try",
  "while",
  "with",
  "yield",
]);

function trimTrailingComment(line: string) {
  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  for (let index = 0; index < line.length; index += 1) {
    const ch = line[index];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      continue;
    }
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle;
      continue;
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble;
      continue;
    }
    if (ch === "#" && !inSingle && !inDouble) {
      return line.slice(0, index);
    }
  }
  return line;
}

function parseImportedNames(raw: string) {
  const names: string[] = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    const aliasSplit = trimmed.split(/\s+as\s+/);
    const localName = (aliasSplit[1] ?? aliasSplit[0] ?? "").trim();
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(localName)) {
      names.push(localName);
    }
  }
  return names;
}

export function classifyPythonSemanticSymbols(source: string) {
  const lines = source.split(/\r?\n/);
  const functionSymbols = new Set<string>();
  const classSymbols = new Set<string>();
  const unresolvedImportedSymbols = new Set<string>();

  for (const line of lines) {
    const code = trimTrailingComment(line);
    const classMatch = code.match(/^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
    if (classMatch?.[1]) {
      classSymbols.add(classMatch[1]);
    }

    const functionMatch = code.match(/^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)\b/);
    if (functionMatch?.[1]) {
      functionSymbols.add(functionMatch[1]);
    }

    const importMatch = code.match(
      /^\s*from\s+[A-Za-z_][A-Za-z0-9_\.]*\s+import\s+(.+)$/
    );
    if (importMatch?.[1]) {
      for (const importedName of parseImportedNames(importMatch[1])) {
        unresolvedImportedSymbols.add(importedName);
      }
    }
  }

  for (const line of lines) {
    const code = trimTrailingComment(line);
    for (const callMatch of code.matchAll(CALL_RE)) {
      const callee = callMatch[1];
      if (!callee || PYTHON_KEYWORDS.has(callee)) {
        continue;
      }
      if (unresolvedImportedSymbols.has(callee)) {
        functionSymbols.add(callee);
      }
    }
  }

  const semanticSymbols = new Map<string, PythonSymbolKind>();
  classSymbols.forEach((symbol) => semanticSymbols.set(symbol, "class"));
  functionSymbols.forEach((symbol) => semanticSymbols.set(symbol, "function"));

  const occurrences: PythonSemanticOccurrence[] = [];
  lines.forEach((line, lineNumber) => {
    const code = trimTrailingComment(line);
    for (const match of code.matchAll(IDENTIFIER_RE)) {
      const identifier = match[0];
      const start = match.index;
      if (start === undefined) continue;
      const kind = semanticSymbols.get(identifier);
      if (!kind) continue;
      occurrences.push({
        line: lineNumber,
        start,
        length: identifier.length,
        kind,
      });
    }
  });

  return occurrences;
}
