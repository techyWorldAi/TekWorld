import React from "react";

interface LogoProps {
  size?: number;
  light?: boolean;
}

const HEX_VERTICES = [
  [40, 6], [66, 21], [66, 51],
  [40, 66], [14, 51], [14, 21],
] as const;

export const Logo: React.FC<LogoProps> = ({ size = 40, light = false }) => {
  const c = light ? "#ffffff" : "#0d0d0d";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="TekWorld logo"
    >
      {/* Outer hexagon */}
      <polygon
        points="40,6 66,21 66,51 40,66 14,51 14,21"
        stroke={c}
        strokeWidth="2"
        fill="none"
      />
      {/* Inner hexagon */}
      <polygon
        points="40,18 56,27 56,46 40,55 24,46 24,27"
        stroke={c}
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      {/* Cross-lines */}
      <line x1="14" y1="21" x2="66" y2="51" stroke={c} strokeWidth="0.7" opacity="0.25" />
      <line x1="66" y1="21" x2="14" y2="51" stroke={c} strokeWidth="0.7" opacity="0.25" />
      <line x1="40" y1="6"  x2="40" y2="66" stroke={c} strokeWidth="0.7" opacity="0.25" />
      {/* Central diamond */}
      <polygon points="40,30 47,35 47,45 40,50 33,45 33,35" fill={c} />
      {/* Vertex dots */}
      {HEX_VERTICES.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={c} />
      ))}
      {/* Precision ticks */}
      <line x1="40" y1="0"  x2="40" y2="4"  stroke={c} strokeWidth="1.5" />
      <line x1="40" y1="68" x2="40" y2="72" stroke={c} strokeWidth="1.5" />
      <line x1="4"  y1="40" x2="8"  y2="40" stroke={c} strokeWidth="1.5" />
      <line x1="72" y1="40" x2="76" y2="40" stroke={c} strokeWidth="1.5" />
    </svg>
  );
};
