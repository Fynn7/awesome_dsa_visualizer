import type { MockStep } from "../lib/mockTrace";
import { strings } from "../strings";

type Props = {
  step: MockStep;
};

export function VariablesPanel({ step }: Props) {
  const entries = Object.entries(step.variables);
  return (
    <div className="panel panel-full">
      <div className="panel-head">{strings.panels.variables}</div>
      <div className="panel-body">
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
