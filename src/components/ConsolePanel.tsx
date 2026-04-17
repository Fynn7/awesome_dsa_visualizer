import { useEffect, useState } from "react";
import { strings } from "../strings";
import { InlineLoading } from "./LoadingState";

type Props = {
  lines: string[];
  loadingKey: number;
};

export function ConsolePanel({ lines, loadingKey }: Props) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setIsRefreshing(true);
    const timer = window.setTimeout(() => setIsRefreshing(false), 120);
    return () => window.clearTimeout(timer);
  }, [loadingKey]);

  return (
    <div className="panel panel-full">
      <div className="panel-head">{strings.panels.console}</div>
      <div className="panel-body">
        {isRefreshing ? (
          <InlineLoading label={strings.loading.consoleRefresh} />
        ) : null}
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
