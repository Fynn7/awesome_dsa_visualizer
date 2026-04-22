import {
  splitCaptionByBackticks,
  type CaptionSegment,
} from "../../lib/captionUtils";

/**
 * Renders an animation caption line, parsing backtick-delimited segments
 * into `<code class="viz-caption-code">` blocks while leaving non-code text
 * as plain spans. Caller controls the containing `<p>` styling via the
 * `fitMode` prop (used by the viz-fit-* layout system).
 */
export type CaptionLineProps = {
  caption: string;
  fitMode: boolean;
};

export function CaptionLine({ caption, fitMode }: CaptionLineProps) {
  const segments: CaptionSegment[] = splitCaptionByBackticks(caption);
  return (
    <p className={`viz-caption${fitMode ? " viz-caption--fit" : ""}`}>
      {segments.map((seg, idx) =>
        seg.code ? (
          <code key={idx} className="viz-caption-code">
            {seg.text}
          </code>
        ) : (
          <span key={idx}>{seg.text}</span>
        )
      )}
    </p>
  );
}
