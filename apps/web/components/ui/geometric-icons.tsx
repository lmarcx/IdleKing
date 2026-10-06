import type { SVGProps } from "react";

/**
 * Minimalist B&W icon primitives (DOM side of the geometry vocabulary).
 *
 * Every icon is composed from these few shapes, stroke-first, on a 24x24
 * viewBox. `stroke="currentColor"` everywhere so icons inherit the theme
 * (white on black) from CSS.
 */

export type GeoIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function Base({ size = 24, children, ...props }: GeoIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      shapeRendering="crispEdges"
      {...props}
    >
      {children}
    </svg>
  );
}

export function GeoRing(props: GeoIconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="8" />
    </Base>
  );
}

export function GeoDot(props: GeoIconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function GeoSquare(props: GeoIconProps) {
  return (
    <Base {...props}>
      <rect x="5" y="5" width="14" height="14" />
    </Base>
  );
}

export function GeoTriangle(props: GeoIconProps) {
  return (
    <Base {...props}>
      <path d="M12 4 L21 20 L3 20 Z" />
    </Base>
  );
}

export function GeoDiamond(props: GeoIconProps) {
  return (
    <Base {...props}>
      <path d="M12 3 L21 12 L12 21 L3 12 Z" />
    </Base>
  );
}

export function GeoCross(props: GeoIconProps) {
  return (
    <Base {...props}>
      <path d="M12 4 V20 M4 12 H20" />
    </Base>
  );
}

export function GeoBars(props: GeoIconProps) {
  return (
    <Base {...props}>
      <path d="M5 20 V14 M12 20 V8 M19 20 V4" />
    </Base>
  );
}

export function GeoHex(props: GeoIconProps) {
  return (
    <Base {...props}>
      <path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z" />
    </Base>
  );
}
