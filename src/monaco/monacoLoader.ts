import { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api.js";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution.js";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

type MonacoEnvironment = typeof globalThis & {
  MonacoEnvironment?: {
    getWorker: (workerId: string, label: string) => Worker;
  };
};

const monacoGlobal = globalThis as MonacoEnvironment;

monacoGlobal.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};

loader.config({ monaco });

export { monaco };
