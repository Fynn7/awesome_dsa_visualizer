import { PythonCodeEditor } from "./PythonCodeEditor";
import type { LoopPulseRange } from "../lib/mockTrace";
import { strings } from "../strings";

type Props = {
  value: string;
  onChange: (v: string) => void;
  activeLine: number;
  stepIndex: number;
  loopPulseRange: LoopPulseRange | null;
};

export function CodeEditorPanel({
  value,
  onChange,
  activeLine,
  stepIndex,
  loopPulseRange,
}: Props) {
  return (
    <div className="panel panel-full">
      <div className="panel-head">{strings.panels.codeEditor}</div>
      <div className="panel-body panel-body--fill">
        <PythonCodeEditor
          value={value}
          onChange={onChange}
          activeLine={activeLine}
          stepIndex={stepIndex}
          loopPulseRange={loopPulseRange}
        />
      </div>
    </div>
  );
}
