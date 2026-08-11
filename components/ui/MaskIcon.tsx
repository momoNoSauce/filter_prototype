import type { CSSProperties } from "react";

/**
 * Renders a monochrome exported asset as a tintable glyph.
 *
 * The sheet rows need their icon to change colour with selection state, which
 * an <img> can't do. Painting the asset as a mask over a background colour
 * keeps the exact exported artwork while letting the colour follow state.
 */
export function MaskIcon({
  src,
  className,
  style,
  color,
}: {
  src: string;
  className?: string;
  style?: CSSProperties;
  color: string;
}) {
  return (
    <span
      aria-hidden
      className={`block ${className ?? ""}`}
      style={{
        backgroundColor: color,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        ...style,
      }}
    />
  );
}
