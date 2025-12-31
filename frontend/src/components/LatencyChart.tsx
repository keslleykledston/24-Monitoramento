import { useMemo } from 'react';
import { buildSmoothPath, smoothValues } from '../utils/chart';

interface ChartDataPoint {
  timestamp: string;
  value: number;
  target: string;
}

interface LatencyChartProps {
  data: ChartDataPoint[];
}

export default function LatencyChart({ data }: LatencyChartProps) {
  const stats = useMemo(() => {
    if (data.length === 0) {
      return {
        min: 0,
        max: 0,
        avg: 0,
        current: 0,
        count: 0,
      };
    }

    const values = data.map((d) => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const current = values[values.length - 1];

    return {
      min,
      max,
      avg,
      current,
      count: values.length,
    };
  }, [data]);

  // Simple ASCII-style chart visualization
  const maxValue = Math.max(stats.max, 100);
  const chartHeight = 100;

  const renderSparkline = () => {
    if (data.length === 0) return null;

    // Get last points and smooth for a cleaner curve
    const rawPoints = data.slice(-80).map((point) => point.value);
    const smoothedValues = smoothValues(rawPoints, 5);
    const width = Math.max(80, smoothedValues.length);
    const points = smoothedValues.map((value, i) => ({
      x: (i / (smoothedValues.length - 1 || 1)) * width,
      y: chartHeight - (value / maxValue) * chartHeight,
    }));
    const path = buildSmoothPath(points);
    const areaPath = `${path} L ${width} ${chartHeight} L 0 ${chartHeight} Z`;

    return (
      <svg
        width="100%"
        height={chartHeight}
        className="sparkline"
        viewBox={`0 0 ${width} ${chartHeight}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        <line
          x1="0"
          y1={chartHeight * 0.5}
          x2={width}
          y2={chartHeight * 0.5}
          stroke="#e0e0e0"
          strokeDasharray="5,5"
          strokeWidth="0.5"
        />

        {/* Data line */}
        <path
          d={path}
          fill="none"
          stroke="#3498db"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Fill under line */}
        <path d={areaPath} fill="#3498db" opacity="0.15" />

        {/* Current point marker */}
        {points.length > 0 && (
          <circle
            cx={width}
            cy={points[points.length - 1].y}
            r="3.5"
            fill="#e74c3c"
          />
        )}
      </svg>
    );
  };

  return (
    <div className="latency-chart">
      {data.length === 0 ? (
        <div className="chart-empty">
          <p>No data available</p>
          <p className="text-muted">Waiting for probe results...</p>
        </div>
      ) : (
        <>
          <div className="chart-content">{renderSparkline()}</div>

          <div className="chart-stats">
            <div className="stat-item">
              <span className="stat-label">Min</span>
              <span className="stat-value">{stats.min}ms</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Avg</span>
              <span className="stat-value">{stats.avg}ms</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Max</span>
              <span className="stat-value">{stats.max}ms</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Current</span>
              <span className="stat-value" style={{ color: '#e74c3c' }}>
                {stats.current}ms
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
