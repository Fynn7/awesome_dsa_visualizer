import type { ForwardedRef } from "react";
import { forwardRef } from "react";
import { Button, type ButtonProps } from "./Button";

export type IconButtonProps = Omit<ButtonProps, "iconOnly">;

/**
 * Convenience wrapper for icon-only buttons. Enforces `iconOnly` layout and
 * requires an `aria-label` at the call site to satisfy accessibility.
 */
export const IconButton = forwardRef(function IconButton(
  props: IconButtonProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  return <Button {...props} ref={ref} iconOnly />;
});
