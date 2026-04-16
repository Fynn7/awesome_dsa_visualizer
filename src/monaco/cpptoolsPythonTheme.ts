import { textmateThemeToMonacoTheme } from "@shikijs/monaco";
import type { StateStack } from "@shikijs/vscode-textmate";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import getWasmInstance from "shiki/wasm";
import {
  CPPTOOLS_PYTHON_THEME,
  cpptoolsThemeRegistration,
  magicPythonLanguage,
} from "./cpptoolsThemeSource";
import { classifyPythonSemanticSymbols } from "./pythonSymbolClassifier";

type MonacoNamespace = (typeof import("./monacoLoader"))["monaco"];
type ImportPhase = "none" | "from-module" | "import-target" | "alias";
type MonacoThemeData = Parameters<MonacoNamespace["editor"]["defineTheme"]>[1];
type ParameterKind = "parameter" | "self" | "cls";
type ClassContext = {
  baseIndent: number;
};
type FunctionContext = {
  baseIndent: number;
  parameters: Readonly<Record<string, ParameterKind>>;
};

const builtinTypeNames = new Set([
  "bool",
  "bytearray",
  "bytes",
  "complex",
  "dict",
  "float",
  "frozenset",
  "int",
  "list",
  "object",
  "set",
  "str",
  "tuple",
  "type",
]);

let configuredPromise: Promise<string> | null = null;
const semanticTokenLegend = {
  tokenTypes: ["class", "function"],
  tokenModifiers: [],
};

class TextMateLineState {
  constructor(
    readonly ruleStack: StateStack | null,
    readonly classContexts: readonly ClassContext[],
    readonly functionContexts: readonly FunctionContext[]
  ) {}

  clone() {
    return new TextMateLineState(
      this.ruleStack,
      this.classContexts,
      this.functionContexts
    );
  }

  equals(other: TextMateLineState) {
    if (this === other) return true;
    if (this.ruleStack !== other.ruleStack) return false;
    if (this.classContexts.length !== other.classContexts.length) return false;
    if (this.functionContexts.length !== other.functionContexts.length) return false;

    if (
      !this.classContexts.every(
        (context, index) => context.baseIndent === other.classContexts[index]?.baseIndent
      )
    ) {
      return false;
    }

    return this.functionContexts.every((context, index) => {
      const otherContext = other.functionContexts[index];
      if (!otherContext || context.baseIndent !== otherContext.baseIndent) {
        return false;
      }

      const keys = Object.keys(context.parameters);
      if (keys.length !== Object.keys(otherContext.parameters).length) {
        return false;
      }

      return keys.every(
        (key) => context.parameters[key] === otherContext.parameters[key]
      );
    });
  }
}

function isIdentifier(text: string) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(text);
}

function getLineIndent(line: string) {
  let width = 0;
  for (const char of line) {
    if (char === " ") {
      width += 1;
      continue;
    }
    if (char === "\t") {
      width += 4;
      continue;
    }
    break;
  }
  return width;
}

function isBlankOrCommentLine(line: string) {
  const trimmed = line.trim();
  return trimmed.length === 0 || trimmed.startsWith("#");
}

function isUpperConstant(text: string) {
  return /^[A-Z][A-Z0-9_]*$/.test(text);
}

function hasStringScope(scopes: string[]) {
  return scopes.some(
    (scope) =>
      scope === "string" ||
      scope.startsWith("string.") ||
      scope === "meta.fstring.python"
  );
}

function hasLexicalScope(scopes: string[]) {
  return scopes.some(
    (scope) =>
      scope.startsWith("comment") ||
      scope.startsWith("constant") ||
      scope.startsWith("entity") ||
      scope.startsWith("invalid") ||
      scope.startsWith("keyword") ||
      scope.startsWith("storage") ||
      scope.startsWith("string") ||
      scope.startsWith("support") ||
      scope.startsWith("variable")
  );
}

function getParameterKind(
  identifier: string,
  functionContexts: readonly FunctionContext[]
) {
  for (let index = functionContexts.length - 1; index >= 0; index -= 1) {
    const kind = functionContexts[index].parameters[identifier];
    if (kind) {
      return kind;
    }
  }
  return null;
}

function getActiveFunctionContexts(
  line: string,
  previousContexts: readonly FunctionContext[]
) {
  if (isBlankOrCommentLine(line)) {
    return previousContexts;
  }

  const lineIndent = getLineIndent(line);
  return previousContexts.filter((context) => lineIndent > context.baseIndent);
}

function getActiveClassContexts(
  line: string,
  previousContexts: readonly ClassContext[]
) {
  if (isBlankOrCommentLine(line)) {
    return previousContexts;
  }

  const lineIndent = getLineIndent(line);
  return previousContexts.filter((context) => lineIndent > context.baseIndent);
}

function buildClassContext(
  line: string,
  rawTokens: readonly { scopes: string[] }[]
) {
  if (!rawTokens.some((token) => token.scopes.includes("storage.type.class.python"))) {
    return null;
  }

  return {
    baseIndent: getLineIndent(line),
  } satisfies ClassContext;
}

function getFirstAssignmentIndex(
  rawTokens: readonly { startIndex: number; endIndex: number; scopes: string[] }[],
  line: string
) {
  for (const token of rawTokens) {
    if (!token.scopes.includes("keyword.operator.assignment.python")) {
      continue;
    }

    const content = line.slice(token.startIndex, token.endIndex);
    if (content.includes("=")) {
      return token.startIndex;
    }
  }

  return null;
}

function buildFunctionContext(
  line: string,
  rawTokens: readonly { startIndex: number; endIndex: number; scopes: string[] }[]
) {
  if (!rawTokens.some((token) => token.scopes.includes("storage.type.function.python"))) {
    return null;
  }

  const parameters: Record<string, ParameterKind> = {};
  for (const token of rawTokens) {
    const content = line.slice(token.startIndex, token.endIndex).trim();
    if (!isIdentifier(content)) {
      continue;
    }

    if (
      token.scopes.includes("variable.parameter.function.language.special.self.python")
    ) {
      parameters[content] = "self";
      continue;
    }

    if (
      token.scopes.includes("variable.parameter.function.language.special.cls.python")
    ) {
      parameters[content] = "cls";
      continue;
    }

    if (token.scopes.includes("variable.parameter.function.language.python")) {
      parameters[content] = "parameter";
    }
  }

  return {
    baseIndent: getLineIndent(line),
    parameters,
  } satisfies FunctionContext;
}

function resolvePythonScope(
  content: string,
  scopes: string[],
  importPhase: ImportPhase,
  parameterKind: ParameterKind | null,
  isClassMemberDefinition: boolean
) {
  const leafScope = scopes.at(-1) ?? "";
  const trimmed = content.trim();
  const inDecorator = scopes.includes("meta.function.decorator.python");
  const inFString = scopes.includes("meta.fstring.python");

  if (!trimmed) {
    return leafScope;
  }

  if (inDecorator) {
    if (
      leafScope === "punctuation.definition.decorator.python" ||
      leafScope === "support.type.python" ||
      leafScope === "entity.name.function.decorator.python"
    ) {
      return "entity.name.function.decorator.python";
    }
  }

  if (leafScope === "variable.language.special.self.python") {
    return "variable.parameter.function.language.special.self.python";
  }

  if (leafScope === "variable.language.special.cls.python") {
    return "variable.parameter.function.language.special.cls.python";
  }

  if (
    hasStringScope(scopes) &&
    (leafScope.startsWith("punctuation.definition.string.") ||
      leafScope === "storage.type.string.python")
  ) {
    return "string";
  }

  if (inFString) {
    if (
      leafScope === "constant.character.format.placeholder.other.python" ||
      leafScope === "storage.type.format.python"
    ) {
      return "constant.other.placeholder";
    }
  }

  if (leafScope === "constant.other.caps.python") {
    return isClassMemberDefinition ? "variable.other.property" : "variable";
  }

  if (leafScope === "meta.attribute.python") {
    return "variable.other.property";
  }

  if (hasLexicalScope(scopes)) {
    return leafScope;
  }

  if (!isIdentifier(trimmed)) {
    return leafScope;
  }

  if (parameterKind === "self") {
    return "variable.parameter.function.language.special.self.python";
  }

  if (parameterKind === "cls") {
    return "variable.parameter.function.language.special.cls.python";
  }

  if (parameterKind === "parameter") {
    return "variable.parameter.function.language.python";
  }

  if (importPhase === "from-module" || importPhase === "import-target") {
    return "entity.name.namespace";
  }

  if (importPhase === "alias") {
    return "variable";
  }

  if (isClassMemberDefinition) {
    return "variable.other.property";
  }

  if (
    builtinTypeNames.has(trimmed) &&
    (leafScope === "meta.indexed-name.python" ||
      leafScope === "meta.item-access.arguments.python")
  ) {
    return "support.type.python";
  }

  if (leafScope === "source.python") {
    return isUpperConstant(trimmed) ? "variable.other.constant" : "variable";
  }

  if (leafScope === "meta.function-call.python") {
    return leafScope;
  }

  if (
    leafScope === "meta.indexed-name.python" ||
    leafScope === "meta.item-access.arguments.python" ||
    leafScope === "meta.function-call.arguments.python"
  ) {
    return isUpperConstant(trimmed) ? "variable.other.constant" : "variable";
  }

  if (leafScope.startsWith("meta.") && !hasLexicalScope(scopes)) {
    return isUpperConstant(trimmed) ? "variable.other.constant" : "variable";
  }

  return leafScope;
}

function advanceImportPhase(
  currentPhase: ImportPhase,
  content: string,
  scopes: string[]
): ImportPhase {
  const trimmed = content.trim();
  if (!trimmed) {
    return currentPhase;
  }

  const leafScope = scopes.at(-1) ?? "";
  if (leafScope === "keyword.control.import.python") {
    if (trimmed === "from") {
      return "from-module";
    }
    if (trimmed === "import") {
      return "import-target";
    }
    if (trimmed === "as") {
      return "alias";
    }
  }

  if (trimmed === "," && currentPhase !== "none") {
    return currentPhase === "from-module" ? "from-module" : "import-target";
  }

  if (currentPhase === "alias" && isIdentifier(trimmed)) {
    return "import-target";
  }

  return currentPhase;
}

async function configureCpptoolsPythonMonaco(monaco: MonacoNamespace) {
  const highlighter = await createHighlighterCore({
    engine: createOnigurumaEngine(getWasmInstance),
    themes: [cpptoolsThemeRegistration],
    langs: [magicPythonLanguage],
  });

  const grammar = highlighter.getLanguage("python");
  const monacoTheme =
    textmateThemeToMonacoTheme(cpptoolsThemeRegistration) as MonacoThemeData;

  monacoTheme.rules = [
    ...monacoTheme.rules,
    { token: "keyword.control", foreground: "df769b", fontStyle: "bold" },
    {
      token: "keyword.control.flow.python",
      foreground: "df769b",
      fontStyle: "bold",
    },
    {
      token: "keyword.control.import.python",
      foreground: "df769b",
      fontStyle: "bold",
    },
    {
      token: "keyword.operator.logical.python",
      foreground: "df769b",
      fontStyle: "bold",
    },
    {
      token: "storage.type.function.python",
      foreground: "df769b",
      fontStyle: "bold",
    },
    {
      token: "storage.type.function.async.python",
      foreground: "df769b",
      fontStyle: "bold",
    },
    {
      token: "storage.type.class.python",
      foreground: "df769b",
      fontStyle: "bold",
    },
    { token: "class", foreground: "4EC9B0" },
    { token: "function", foreground: "c3c37a" },
  ];

  monaco.editor.defineTheme(
    CPPTOOLS_PYTHON_THEME,
    monacoTheme
  );

  monaco.languages.setTokensProvider("python", {
    getInitialState() {
      return new TextMateLineState(null, [], []);
    },
    tokenize(line, state: TextMateLineState) {
      const result = grammar.tokenizeLine(line, state.ruleStack);
      const activeClassContexts = getActiveClassContexts(line, state.classContexts);
      const activeFunctionContexts = getActiveFunctionContexts(
        line,
        state.functionContexts
      );
      const firstAssignmentIndex = getFirstAssignmentIndex(result.tokens, line);
      let importPhase: ImportPhase = "none";
      const tokens = result.tokens.map((token) => {
        const content = line.slice(token.startIndex, token.endIndex);
        const isClassMemberDefinition =
          activeClassContexts.length > 0 &&
          activeFunctionContexts.length === 0 &&
          firstAssignmentIndex !== null &&
          token.startIndex < firstAssignmentIndex &&
          isIdentifier(content.trim());
        const scopes = resolvePythonScope(
          content,
          token.scopes,
          importPhase,
          getParameterKind(content.trim(), activeFunctionContexts),
          isClassMemberDefinition
        );
        importPhase = advanceImportPhase(importPhase, content, token.scopes);
        return {
          startIndex: token.startIndex,
          scopes,
        };
      });

      const nextClassContext = buildClassContext(line, result.tokens);
      const nextClassContexts = nextClassContext
        ? [...activeClassContexts, nextClassContext]
        : activeClassContexts;
      const nextFunctionContext = buildFunctionContext(line, result.tokens);
      const nextFunctionContexts = nextFunctionContext
        ? [...activeFunctionContexts, nextFunctionContext]
        : activeFunctionContexts;

      return {
        endState: new TextMateLineState(
          result.ruleStack,
          nextClassContexts,
          nextFunctionContexts
        ),
        tokens,
      };
    },
  });
  monaco.languages.registerDocumentSemanticTokensProvider("python", {
    getLegend() {
      return semanticTokenLegend;
    },
    provideDocumentSemanticTokens(model) {
      const occurrences = classifyPythonSemanticSymbols(model.getValue());
      const sorted = [...occurrences].sort((a, b) =>
        a.line === b.line ? a.start - b.start : a.line - b.line
      );
      const encoded: number[] = [];
      let prevLine = 0;
      let prevStart = 0;

      for (const token of sorted) {
        const lineDelta = token.line - prevLine;
        const startDelta =
          lineDelta === 0 ? token.start - prevStart : token.start;
        const tokenType =
          token.kind === "class"
            ? semanticTokenLegend.tokenTypes.indexOf("class")
            : semanticTokenLegend.tokenTypes.indexOf("function");
        if (tokenType < 0) continue;

        encoded.push(lineDelta, startDelta, token.length, tokenType, 0);
        prevLine = token.line;
        prevStart = token.start;
      }

      return {
        data: new Uint32Array(encoded),
      };
    },
    releaseDocumentSemanticTokens() {
      // No cache to release.
    },
  });

  monaco.editor.setTheme(CPPTOOLS_PYTHON_THEME);
  return CPPTOOLS_PYTHON_THEME;
}

export { CPPTOOLS_PYTHON_THEME };

export function ensureCpptoolsPythonMonaco(monaco: MonacoNamespace) {
  configuredPromise ??= configureCpptoolsPythonMonaco(monaco);
  return configuredPromise;
}
