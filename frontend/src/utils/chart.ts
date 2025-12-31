export type ChartPoint = { x: number; y: number };

export const smoothValues = (values: number[], windowSize = 5): number[] => {
  if (values.length < 3 || windowSize <= 1) {
    return values;
  }

  const halfWindow = Math.floor(windowSize / 2);
  const prefix: number[] = new Array(values.length + 1);
  prefix[0] = 0;
  for (let i = 0; i < values.length; i += 1) {
    prefix[i + 1] = prefix[i] + values[i];
  }

  return values.map((_, idx) => {
    const start = Math.max(0, idx - halfWindow);
    const end = Math.min(values.length - 1, idx + halfWindow);
    const sum = prefix[end + 1] - prefix[start];
    return sum / (end - start + 1);
  });
};

export const downsampleValues = (values: number[], maxPoints = 120): number[] => {
  if (values.length <= maxPoints) {
    return values;
  }

  const step = Math.ceil(values.length / maxPoints);
  const sampled: number[] = [];
  for (let i = 0; i < values.length; i += step) {
    sampled.push(values[i]);
  }
  return sampled;
};

export const buildSmoothPath = (points: ChartPoint[], tension = 0.7): string => {
  if (points.length === 0) {
    return '';
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;

    const cp1x = p1.x + ((p2.x - p0.x) / 6) * tension;
    const cp1y = p1.y + ((p2.y - p0.y) / 6) * tension;
    const cp2x = p2.x - ((p3.x - p1.x) / 6) * tension;
    const cp2y = p2.y - ((p3.y - p1.y) / 6) * tension;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }

  return d;
};
