import { strings } from "../strings";

export function PdfPanel() {
  return (
    <div className="panel panel-full">
      <div className="panel-head">{strings.panels.pdf}</div>
      <div className="panel-body pdf-placeholder">
        {strings.panels.pdfPlaceholder}
      </div>
    </div>
  );
}
