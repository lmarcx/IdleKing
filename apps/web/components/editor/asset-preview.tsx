import type { GeometricAsset, PrimitivePart } from "@idleking/game-core/level-editor";

function partElement(part: PrimitivePart) {
  const common = {
    fill: part.fill,
    opacity: part.opacity,
    stroke: part.stroke,
    strokeWidth: part.strokeWidth,
    transform: `rotate(${part.rotation} ${part.x} ${part.y})`,
  };

  if (part.shape === "rect") {
    return <rect key={part.id} x={part.x} y={part.y} width={part.width ?? 24} height={part.height ?? 24} {...common} />;
  }

  if (part.shape === "circle") {
    return <circle key={part.id} cx={part.x} cy={part.y} r={part.radius ?? Math.max(part.width ?? 16, part.height ?? 16) / 2} {...common} />;
  }

  if (part.shape === "triangle") {
    const width = part.width ?? 32;
    const height = part.height ?? 32;
    const points = `${part.x},${part.y} ${part.x - width / 2},${part.y + height} ${part.x + width / 2},${part.y + height}`;
    return <polygon key={part.id} points={points} {...common} />;
  }

  if (part.shape === "line") {
    return (
      <line
        key={part.id}
        x1={part.x}
        y1={part.y}
        x2={part.x + (part.width ?? 24)}
        y2={part.y + (part.height ?? 0)}
        {...common}
        fill="none"
      />
    );
  }

  const points = (part.points ?? []).map((point) => `${point.x},${point.y}`).join(" ");
  return <polygon key={part.id} points={points} {...common} />;
}

export function AssetPreview({ asset, className = "" }: { asset: GeometricAsset; className?: string }) {
  return (
    <svg className={className} viewBox="-12 -12 128 128" role="img" aria-label={asset.name}>
      <rect x="-12" y="-12" width="128" height="128" fill="#090909" />
      {[...asset.parts].sort((a, b) => a.layer - b.layer).map(partElement)}
    </svg>
  );
}
