import { strings } from "../strings";

type Props = {
  lines: string[];
};

export function ConsolePanel({ lines }: Props) {
  return (
    <div className="panel panel-full">
      <div className="panel-head">{strings.panels.console}</div>
      <div className="panel-body">
        {lines.length === 0 ? (
          <p className="empty-hint">
            {strings.panels.emptyConsole}
          </p>
        ) : (
          <pre className="console-out">
            {lines.map((line, i) => (
              <p key={i} className="console-line">
                {line}
              </p>
            ))}
          </pre>
        )}
      </div>
    </div>
  );
}
