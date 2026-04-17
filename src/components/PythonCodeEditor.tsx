import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import type { editor as MonacoEditor } from "monaco-editor";
import {
  CPPTOOLS_PYTHON_THEME,
  ensureCpptoolsPythonMonaco,
} from "../monaco/cpptoolsPythonTheme";
import { monaco } from "../monaco/monacoLoader";
import type { LoopPulseRange } from "../lib/mockTrace";
import { strings } from "../strings";
import { PanelSkeleton } from "./LoadingState";

type Props = {
  value: string;
  onChange: (v: string) => void;
  activeLine: number;
  stepIndex: number;
  loopPulseRange: LoopPulseRange | null;
  onReadyChange?: (ready: boolean) => void;
};

const LOOP_PULSE_MS = 450;

const editorOptions: MonacoEditor.IStandaloneEditorConstructionOptions = {
  ariaLabel: strings.panels.codeEditor,
  automaticLayout: true,
  cursorBlinking: "solid",
  fontFamily: '"Cascadia Code", "Fira Code", ui-monospace, monospace',
  fontLigatures: false,
  fontSize: 15,
  guides: {
    indentation: true,
    highlightActiveIndentation: true,
  },
  lineDecorationsWidth: 14,
  lineNumbers: "on",
  lineNumbersMinChars: 3,
  matchBrackets: "always",
  minimap: { enabled: false },
  overviewRulerBorder: false,
  padding: { top: 10, bottom: 10 },
  renderLineHighlight: "none",
  roundedSelection: false,
  scrollBeyondLastLine: false,
  selectOnLineNumbers: true,
  "semanticHighlighting.enabled": true,
  stickyScroll: { enabled: false },
  tabSize: 4,
  wordWrap: "off",
};

function setExecutionLineDecoration(
  editor: MonacoEditor.IStandaloneCodeEditor | null,
  decorations: MonacoEditor.IEditorDecorationsCollection | null,
  activeLine: number
) {
  if (!editor || !decorations) return;
  const model = editor.getModel();
  if (!model || activeLine < 1 || activeLine > model.getLineCount()) {
    decorations.set([]);
    return;
  }

  decorations.set([
    {
      range: new monaco.Range(
        activeLine,
        1,
        activeLine,
        model.getLineMaxColumn(activeLine)
      ),
      options: {
        isWholeLine: true,
        className: "cpptools-execution-line",
        marginClassName: "cpptools-execution-line-margin",
      },
    },
  ]);

  editor.revealLineInCenterIfOutsideViewport(activeLine);
}

function setLoopPulseDecorations(
  editor: MonacoEditor.IStandaloneCodeEditor | null,
  decorations: MonacoEditor.IEditorDecorationsCollection | null,
  range: LoopPulseRange | null
) {
  if (!editor || !decorations) return;
  const model = editor.getModel();
  if (!model || !range) {
    decorations.set([]);
    return;
  }
  const lineCount = model.getLineCount();
  const start = Math.max(1, range.startLine);
  const end = Math.min(lineCount, range.endLine);
  if (start > end) {
    decorations.set([]);
    return;
  }
  const items: MonacoEditor.IModelDeltaDecoration[] = [];
  for (let line = start; line <= end; line++) {
    items.push({
      range: new monaco.Range(line, 1, line, model.getLineMaxColumn(line)),
      options: {
        isWholeLine: true,
        className:
          range.kind === "not-entered-loop" ||
          range.kind === "not-entered-if"
            ? "cpptools-loop-pulse-not-entered"
            : "cpptools-loop-pulse",
        marginClassName:
          range.kind === "not-entered-loop" ||
          range.kind === "not-entered-if"
            ? "cpptools-loop-pulse-not-entered-margin"
            : "cpptools-loop-pulse-margin",
      },
    });
  }
  decorations.set(items);
}

export function PythonCodeEditor({
  value,
  onChange,
  activeLine,
  stepIndex,
  loopPulseRange,
  onReadyChange,
}: Props) {
  const [ready, setReady] = useState(false);
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<MonacoEditor.IEditorDecorationsCollection | null>(
    null
  );
  const loopPulseDecorationsRef =
    useRef<MonacoEditor.IEditorDecorationsCollection | null>(null);

  useEffect(() => {
    onReadyChange?.(ready);
  }, [onReadyChange, ready]);

  useEffect(() => {
    let cancelled = false;

    void ensureCpptoolsPythonMonaco(monaco).then(() => {
      if (!cancelled) {
        setReady(true);
      }
    }).catch((error: unknown) => {
      console.error("Failed to initialize Monaco Python highlighting.", error);
      if (!cancelled) {
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    decorationsRef.current = editor.createDecorationsCollection();
    loopPulseDecorationsRef.current = editor.createDecorationsCollection();
    setExecutionLineDecoration(editor, decorationsRef.current, activeLine);
  };

  useEffect(() => {
    setExecutionLineDecoration(
      editorRef.current,
      decorationsRef.current,
      activeLine
    );
  }, [activeLine]);

  useEffect(() => {
    const editor = editorRef.current;
    const pulseColl = loopPulseDecorationsRef.current;
    if (!loopPulseRange) {
      setLoopPulseDecorations(editor, pulseColl, null);
      return;
    }
    setLoopPulseDecorations(editor, pulseColl, loopPulseRange);
    const id = window.setTimeout(() => {
      setLoopPulseDecorations(editor, pulseColl, null);
    }, LOOP_PULSE_MS);
    return () => {
      window.clearTimeout(id);
    };
  }, [stepIndex, loopPulseRange]);

  useEffect(
    () => () => {
      decorationsRef.current?.clear();
      decorationsRef.current = null;
      loopPulseDecorationsRef.current?.clear();
      loopPulseDecorationsRef.current = null;
      editorRef.current = null;
    },
    []
  );

  if (!ready) {
    return (
      <div className="monaco-full monaco-loading" aria-busy="true">
        <PanelSkeleton label={strings.loading.editorInit} rows={5} />
      </div>
    );
  }

  return (
    <Editor
      value={value}
      onChange={(nextValue) => onChange(nextValue ?? "")}
      height="100%"
      defaultLanguage="python"
      language="python"
      theme={CPPTOOLS_PYTHON_THEME}
      options={editorOptions}
      onMount={handleMount}
      className="monaco-full"
      loading={null}
    />
  );
}
