import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels";
import { useMemo, type Dispatch, type ReactNode } from "react";
import type { ExecutionState } from "../lib/executionReducer";
import type { ExecutionAction } from "../lib/executionReducer";
import { getCurrentStep } from "../lib/executionReducer";
import { getLoopPulseRange } from "../lib/mockTrace";
import { strings } from "../strings";
import { AnimationPanel } from "./AnimationPanel";
import { CodeEditorPanel } from "./CodeEditorPanel";
import { ConsolePanel } from "./ConsolePanel";
import { PdfPanel } from "./PdfPanel";
import { VariablesPanel } from "./VariablesPanel";

type PresentationMode = "off" | "native" | "overlay";

type Props = {
  state: ExecutionState;
  dispatch: Dispatch<ExecutionAction>;
  presentationMode: PresentationMode;
  onPresentNative: () => void;
  onPresentOverlay: () => void;
};

type Item = { id: string; node: ReactNode; size: number; order: number };

/** Stable `order` when panels mount/unmount (required by react-resizable-panels). */
const LEFT_STACK_ORDER = { editor: 1, console: 2 } as const;
const RIGHT_STACK_ORDER = { animation: 1, variables: 2, pdf: 3 } as const;

function VerticalStacks({
  items,
  groupId,
}: {
  items: Item[];
  groupId: string;
}) {
  if (items.length === 0) return null;
  const children: ReactNode[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0) {
      children.push(
        <PanelResizeHandle
          key={`h-${items[i]!.id}`}
          id={`${groupId}-before-${items[i]!.id}`}
          className="resize-handle"
        />
      );
    }
    children.push(
      <Panel
        key={items[i]!.id}
        id={`${groupId}-${items[i]!.id}`}
        order={items[i]!.order}
        defaultSize={items[i]!.size}
        minSize={8}
        collapsible
      >
        {items[i]!.node}
      </Panel>
    );
  }
  return (
    <PanelGroup direction="vertical" className="workspace-stack" id={groupId}>
      {children}
    </PanelGroup>
  );
}

export function Workspace({
  state,
  dispatch,
  presentationMode,
  onPresentNative,
  onPresentOverlay,
}: Props) {
  const { panels } = state;
  const step = getCurrentStep(state);
  const traceLastIndex = Math.max(0, state.trace.length - 1);
  const stepPointerNavigation = useMemo(
    () => ({
      canStepForward: state.stepIndex < traceLastIndex,
      canStepBack: state.stepIndex > 0,
      onStepForward: () => dispatch({ type: "STEP" }),
      onStepBack: () => dispatch({ type: "STEP_BACK" }),
    }),
    [dispatch, state.stepIndex, traceLastIndex]
  );
  const loopPulseRange = useMemo(
    () =>
      getLoopPulseRange(state.trace, state.stepIndex, state.loopPulseRules),
    [state.trace, state.stepIndex, state.loopPulseRules]
  );

  const leftItems: Item[] = [];
  if (panels.editor) {
    leftItems.push({
      id: "editor",
      order: LEFT_STACK_ORDER.editor,
      size: panels.console ? 58 : 100,
      node: (
        <CodeEditorPanel
          value={state.source}
          onChange={(v) => dispatch({ type: "SET_SOURCE", value: v })}
          activeLine={step.line}
          stepIndex={state.stepIndex}
          loopPulseRange={loopPulseRange}
        />
      ),
    });
  }
  if (panels.console) {
    leftItems.push({
      id: "console",
      order: LEFT_STACK_ORDER.console,
      size: panels.editor ? 42 : 100,
      node: <ConsolePanel lines={state.consoleLines} />,
    });
  }

  const rightRaw: Omit<Item, "size">[] = [];
  if (panels.animation && presentationMode === "off") {
    rightRaw.push({
      id: "animation",
      order: RIGHT_STACK_ORDER.animation,
      node: (
        <AnimationPanel
          trace={state.trace}
          viz={step.viz}
          variables={step.variables}
          algorithmId={state.algorithmId}
          stepLine={step.line}
          showArrayIndices={state.showArrayIndices}
          enableAnimationScroll={state.enableAnimationScroll}
          animationFitAllowUpscale={state.animationFitAllowUpscale}
          speedMs={state.speedMs}
          isAutoPlayingStep={state.playing}
          onPresentNative={onPresentNative}
          onPresentOverlay={onPresentOverlay}
          stepPointerNavigation={stepPointerNavigation}
        />
      ),
    });
  }
  if (panels.variables) {
    rightRaw.push({
      id: "variables",
      order: RIGHT_STACK_ORDER.variables,
      node: <VariablesPanel step={step} />,
    });
  }
  if (panels.pdf) {
    rightRaw.push({
      id: "pdf",
      order: RIGHT_STACK_ORDER.pdf,
      node: <PdfPanel />,
    });
  }

  const rightItems: Item[] = rightRaw.map((r) => {
    // Keep the default animation height aligned with the left code editor area
    // when the default two-panel stack (Animation + Variables) is visible.
    if (
      rightRaw.length === 2 &&
      rightRaw.some((item) => item.id === "animation") &&
      rightRaw.some((item) => item.id === "variables")
    ) {
      return {
        ...r,
        size: r.id === "animation" ? 58 : 42,
      };
    }
    return {
      ...r,
      size: rightRaw.length > 0 ? 100 / rightRaw.length : 100,
    };
  });

  const showLeft = leftItems.length > 0;
  const showRight = rightItems.length > 0;

  if (!showLeft && !showRight) {
    return (
      <div className="empty-hint workspace-empty">
        {strings.emptyAllPanels}
      </div>
    );
  }

  const inner: ReactNode[] = [];
  if (showLeft) {
    inner.push(
      <Panel
        key="left"
        id="workspace-root-left"
        order={1}
        defaultSize={showRight ? 38 : 100}
        minSize={12}
        collapsible
      >
        <VerticalStacks groupId="workspace-left-stack" items={leftItems} />
      </Panel>
    );
  }
  if (showLeft && showRight) {
    inner.push(
      <PanelResizeHandle
        key="hr"
        id="workspace-root-hr"
        className="resize-handle"
      />
    );
  }
  if (showRight) {
    inner.push(
      <Panel
        key="right"
        id="workspace-root-right"
        order={showLeft ? 2 : 1}
        defaultSize={showLeft ? 62 : 100}
        minSize={15}
        collapsible
      >
        <VerticalStacks groupId="workspace-right-stack" items={rightItems} />
      </Panel>
    );
  }

  return (
    <PanelGroup
      direction="horizontal"
      className="workspace-root"
      id="workspace-root"
    >
      {inner}
    </PanelGroup>
  );
}
