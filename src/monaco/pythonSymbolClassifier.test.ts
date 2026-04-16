import { describe, expect, it } from "vitest";

import { classifyPythonSemanticSymbols } from "./pythonSymbolClassifier";

function kindsFor(source: string, identifier: string) {
  return classifyPythonSemanticSymbols(source)
    .filter((entry) => source.split(/\r?\n/)[entry.line]?.slice(entry.start, entry.start + entry.length) === identifier)
    .map((entry) => entry.kind);
}

describe("classifyPythonSemanticSymbols", () => {
  it("marks class declarations and usages as class", () => {
    const source = `class Stack:
    class Node:
        pass

s = Stack()`;
    expect(kindsFor(source, "Stack")).toContain("class");
    expect(kindsFor(source, "Node")).toContain("class");
  });

  it("marks local function definitions and calls as function", () => {
    const source = `def insertion_sort(arr):
    return arr

insertion_sort(data)`;
    expect(kindsFor(source, "insertion_sort")).toEqual([
      "function",
      "function",
    ]);
  });

  it("promotes from-import names to function only when called", () => {
    const source = `from DSA import intArray, exch
from mod import CONST, ClassName

data = intArray(4)
exch(data, 1, 0)`;
    expect(kindsFor(source, "intArray")).toEqual(["function", "function"]);
    expect(kindsFor(source, "exch")).toEqual(["function", "function"]);
    expect(kindsFor(source, "CONST")).toEqual([]);
    expect(kindsFor(source, "ClassName")).toEqual([]);
  });

  it("keeps builtin calls unresolved when not imported/local-def", () => {
    const source = `for i in range(5):
    print(i)`;
    expect(kindsFor(source, "range")).toEqual([]);
    expect(kindsFor(source, "print")).toEqual([]);
  });
});
