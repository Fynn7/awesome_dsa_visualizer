import { parse } from "jsonc-parser";
import type { LanguageRegistration, ThemeRegistrationResolved } from "shiki";

import magicPythonGrammarText from "@codingame/monaco-vscode-python-default-extension/resources/MagicPython.tmLanguage.json?raw";
import cpptoolsThemeText from "../../cpptools_dark_vs_new.json?raw";

export const CPPTOOLS_PYTHON_THEME = "cpptools-python-dark";

type CpptoolsThemeJson = {
  $schema?: string;
  name?: string;
  colors?: Record<string, string>;
  tokenColors?: ThemeRegistrationResolved["settings"];
  semanticHighlighting?: boolean;
  semanticTokenColors?: Record<string, string>;
};

type PythonAuditEntry = {
  label: string;
  examples: string[];
  scopes: string[];
  foreground: string;
  fontStyle?: string;
};

const parsedTheme = parse(cpptoolsThemeText) as CpptoolsThemeJson;
const parsedMagicPython = JSON.parse(
  magicPythonGrammarText
) as Omit<LanguageRegistration, "name" | "aliases" | "displayName">;

export const cpptoolsThemeRegistration: ThemeRegistrationResolved = {
  ...parsedTheme,
  name: CPPTOOLS_PYTHON_THEME,
  type: "dark",
  fg: parsedTheme.colors?.["editor.foreground"] ?? "#b2cacd",
  bg: parsedTheme.colors?.["editor.background"] ?? "#031417",
  settings: parsedTheme.tokenColors ?? [],
};

export const magicPythonLanguage: LanguageRegistration = {
  ...parsedMagicPython,
  name: "python",
  displayName: "Python",
  aliases: ["py"],
  scopeName: "source.python",
};

// These entries capture the key Python-facing expectations we are validating
// against the cpptools theme's final tokenColors ordering.
export const CPPTTOOLS_PYTHON_STYLE_AUDIT: readonly PythonAuditEntry[] = [
  {
    label: "control-keywords",
    examples: ["for", "in", "if", "return", "import", "from"],
    scopes: [
      "keyword.control",
      "storage.type.function.python",
      "storage.type.class.python",
      "storage.type.function.async.python",
    ],
    foreground: "#df769b",
    fontStyle: "bold",
  },
  {
    label: "logical-keywords",
    examples: ["and", "or", "not"],
    scopes: ["keyword.operator.logical.python"],
    foreground: "#df769b",
    fontStyle: "bold",
  },
  {
    label: "variables",
    examples: ["arr", "j", "result", "outer"],
    scopes: ["variable", "entity.name.variable"],
    foreground: "#75b4e8",
  },
  {
    label: "parameters",
    examples: ["args", "kwargs", "kwonly", "kwrest"],
    scopes: ["variable.parameter"],
    foreground: "#ff53ffdc",
    fontStyle: "italic",
  },
  {
    label: "self-cls",
    examples: ["self", "cls"],
    scopes: [
      "variable.parameter.function.language.special.self.python",
      "variable.parameter.function.language.special.cls.python",
    ],
    foreground: "#f07178",
    fontStyle: "italic",
  },
  {
    label: "function-declarations",
    examples: ["insertion_sort", "complex_scoping", "inner"],
    scopes: ["entity.name.function"],
    foreground: "#c3c37a",
  },
  {
    label: "function-calls",
    examples: ["range", "enumerate", "sqrt", "sleep"],
    scopes: ["meta.function-call"],
    foreground: "#a5a5a5",
  },
  {
    label: "properties",
    examples: ["x", "y", "CLASS_VAR", "_hidden"],
    scopes: [
      "variable.other.property",
      "variable.other.object.property",
      "entity.name.variable.property",
    ],
    foreground: "#2ab4ff",
  },
  {
    label: "builtin-types",
    examples: ["int", "str", "dict", "bool"],
    scopes: ["support.type.python", "support.class.builtin.python"],
    foreground: "#4EC9B0",
    fontStyle: "bold italic",
  },
  {
    label: "magic-methods",
    examples: ["__init__", "__str__"],
    scopes: ["support.function.magic.python"],
    foreground: "#e1e161",
    fontStyle: "bold",
  },
  {
    label: "modules",
    examples: ["math", "asyncio"],
    scopes: ["entity.name.namespace"],
    foreground: "#75c94e",
    fontStyle: "bold",
  },
  {
    label: "strings-comments-numbers",
    examples: ['"default"', "# type alias", "42", "True"],
    scopes: ["string", "comment", "constant.numeric", "constant.language"],
    foreground: "mixed",
  },
];
