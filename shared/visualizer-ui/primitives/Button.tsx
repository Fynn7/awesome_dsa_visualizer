import type { ButtonHTMLAttributes, ForwardedRef } from "react";
import { forwardRef } from "react";

/**
 * Button primitive. Replaces scattered `<button className="btn">` usage.
 * Variant + size + iconOnly are the only supported style axes; any other
 * visual tweak must go through CSS variable overrides, never inline color.
 */
export type ButtonVariant = "default" | "primary";
export type ButtonSize = "md" | "sm";

export type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Layout-only: renders a square icon button. */
  iconOnly?: boolean;
  className?: string;
};

const CLASS_VARIANT: Record<ButtonVariant, string> = {
  default: "btn",
  primary: "btn btn-primary",
};

const CLASS_SIZE: Record<ButtonSize, string> = {
  md: "",
  sm: "btn-sm",
};

export const Button = forwardRef(function Button(
  {
    variant = "default",
    size = "md",
    iconOnly = false,
    className,
    type = "button",
    ...rest
  }: ButtonProps,
  ref: ForwardedRef<HTMLButtonElement>
) {
  const classes = [
    CLASS_VARIANT[variant],
    CLASS_SIZE[size],
    iconOnly ? "btn-icon" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button
      {...rest}
      ref={ref}
      type={type}
      className={classes}
    />
  );
});
