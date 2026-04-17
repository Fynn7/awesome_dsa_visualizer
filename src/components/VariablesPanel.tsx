import { useEffect, useState } from "react";
import type { MockStep } from "../lib/mockTrace";
import { strings } from "../strings";
import { InlineLoading } from "./LoadingState";

type Props = {
  step: MockStep;
  loadingKey: number;
};

export function VariablesPanel({ step, loadingKey }: Props) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setIsRefreshing(true);
    const timer = window.setTimeout(() => setIsRefreshing(false), 120);
    return () => window.clearTimeout(timer);
  }, [loadingKey]);

  const entries = Object.entries(step.variables);
  return (
    <div className="panel panel-full">
      <div className="panel-head">{strings.panels.variables}</div>
      <div className="panel-body">
        {isRefreshing ? (
          <InlineLoading label={strings.loading.variablesRefresh} />
        ) : null}
        {entries.length === 0 ? (
          <p className="empty-hint">
            {strings.panels.noVariables}
          </p>
        ) : (
          <table className="vars-table">
            <tbody>
              {entries.map(([k, v]) => (
                <tr key={k}>
                  <th scope="row">{k}</th>
                  <td>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
