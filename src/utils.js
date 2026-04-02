export const fmt = (n) => {
  // Use toLocaleString with fraction options instead of Math.round
  return (
    "₹" +
    Math.abs(n).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
};

export const fmtPct = (n) => (n >= 0 ? "+" : "") + n.toFixed(2) + "%";

export const fmtSign = (n) => (n >= 0 ? "+" : "-") + fmt(n);

/** Tiny deterministic sparkline path for a holding */
export function sparkPath(id, positive, w = 60, h = 24) {
  const pts = Array.from({ length: 8 }, (_, i) => {
    const seed = ((id * 9301 + i * 49297 + 49297) % 233280) / 233280;
    return seed * 18 + 3;
  });
  if (positive) pts[pts.length - 1] = Math.max(...pts) * 0.96;
  else pts[pts.length - 1] = Math.min(...pts) * 1.04;

  const max = Math.max(...pts),
    min = Math.min(...pts);
  const norm = pts.map(
    (p) => h - ((p - min) / (max - min + 0.01)) * (h - 4) - 2,
  );
  return norm
    .map((y, i) => `${i === 0 ? "M" : "L"}${(i / (pts.length - 1)) * w},${y}`)
    .join(" ");
}

/** Generate portfolio chart data for a given time range */
export function generateChartData(totalValue, range) {
  const points =
    { "1W": 7, "1M": 30, "3M": 90, "1Y": 252, ALL: 365 }[range] ?? 90;
  const data = [];
  const labels = [];
  let v = totalValue * 0.8;
  const step = (totalValue - v) / points;
  for (let i = 0; i <= points; i++) {
    const seed = ((i * 9301 + 49297) % 233280) / 233280;
    v += step + (seed - 0.43) * totalValue * 0.007;
    data.push(Math.max(0, v));
    labels.push("");
  }
  data[data.length - 1] = totalValue;
  return { data, labels };
}
