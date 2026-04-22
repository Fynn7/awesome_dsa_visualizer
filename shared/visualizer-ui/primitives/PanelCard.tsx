import type { HTMLAttributes, ReactNode } from "react";

/**
 * PanelCard primitive encapsulates the recurring `.panel` / `.panel-head` /
 * `.panel-body` shell used by Code / Console / Animation / Variables / PDF
 * panels. Business components compose `<PanelCard>` + header action slots
 * instead of re-writing the same shell markup.
 */
export type PanelCardProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  /** Right-side action slot in the panel header. */
  actions?: ReactNode;
  /** Additional class on the outer `.panel` container. */
  className?: string;
  /** Fills the parent block (`panel-full` class). Defaults to true. */
  fill?: boolean;
  /** Disables internal body scroll. Defaults to false (scroll allowed). */
  noScroll?: boolean;
  /** Forces the body to use column flex layout (fills vertical space). */
  fillBody?: boolean;
  children: ReactNode;
};

export function PanelCard({
  title,
  actions,
  className,
  fill = true,
  noScroll = false,
  fillBody = false,
  children,
  ...rest
}: PanelCardProps) {
  const rootClass = [
    "panel",
    fill ? "panel-full" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const bodyClass = [
    "panel-body",
    noScroll ? "panel-body--no-scroll" : "",
    fillBody ? "panel-body--fill" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <div {...rest} className={rootClass}>
      <div className="panel-head">
        <span className="panel-head-title">{title}</span>
        {actions ? <div className="panel-head-actions">{actions}</div> : null}
      </div>
      <div className={bodyClass}>{children}</div>
    </div>
  );
}
