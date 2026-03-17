export function DonutChart({
  data,
  size = 160,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const radius = size / 2 - 8;
  const innerRadius = radius * 0.6;

  if (total === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={(radius + innerRadius) / 2}
          fill="none"
          stroke="currentColor"
          strokeWidth={radius - innerRadius}
          opacity={0.08}
        />
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          fill="currentColor"
          opacity={0.3}
          fontSize={24}
          fontWeight={300}
        >
          0
        </text>
        <text
          x={size / 2}
          y={size / 2 + 12}
          textAnchor="middle"
          fill="currentColor"
          opacity={0.2}
          fontSize={8}
          letterSpacing={2}
          style={{ textTransform: "uppercase" }}
        >
          NO DATA
        </text>
      </svg>
    );
  }

  let currentAngle = -Math.PI / 2;

  const segments = data.map((d) => {
    const angle = (d.value / total) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const largeArc = angle > Math.PI ? 1 : 0;
    const x1 = size / 2 + radius * Math.cos(startAngle);
    const y1 = size / 2 + radius * Math.sin(startAngle);
    const x2 = size / 2 + radius * Math.cos(endAngle);
    const y2 = size / 2 + radius * Math.sin(endAngle);
    const ix1 = size / 2 + innerRadius * Math.cos(startAngle);
    const iy1 = size / 2 + innerRadius * Math.sin(startAngle);
    const ix2 = size / 2 + innerRadius * Math.cos(endAngle);
    const iy2 = size / 2 + innerRadius * Math.sin(endAngle);

    const path = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `L ${ix2} ${iy2}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1}`,
      "Z",
    ].join(" ");

    return { ...d, path };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg) => (
        <path
          key={seg.label}
          d={seg.path}
          fill={seg.color}
          opacity={0.7}
          stroke="var(--background)"
          strokeWidth={1}
        />
      ))}
      <text
        x={size / 2}
        y={size / 2 + 1}
        textAnchor="middle"
        fill="currentColor"
        opacity={0.7}
        fontSize={size <= 120 ? 20 : 24}
        fontWeight={300}
      >
        {total}
      </text>
      <text
        x={size / 2}
        y={size / 2 + (size <= 120 ? 14 : 18)}
        textAnchor="middle"
        fill="currentColor"
        opacity={0.3}
        fontSize={size <= 120 ? 7 : 8}
        letterSpacing={2}
        style={{ textTransform: "uppercase" }}
      >
        TOTAL
      </text>
    </svg>
  );
}
