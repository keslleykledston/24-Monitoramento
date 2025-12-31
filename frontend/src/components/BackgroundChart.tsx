import { buildSmoothPath, smoothValues } from '../utils/chart';

interface TargetMetrics {
  [key: string]: {
    history: number[];
    historyWithTime: { time: string; value: number }[];
    min: number;
    max: number;
    avg: number;
    current: number;
    loss: number;
  };
}

interface BackgroundChartProps {
  data: TargetMetrics;
}

export default function BackgroundChart({ data }: BackgroundChartProps) {
  const entries = Object.entries(data);

  const renderMiniChart = (values: number[]) => {
    if (values.length === 0) return null;

    const maxValue = Math.max(...values, 100);
    const smoothedValues = smoothValues(values, 5);
    const width = 200;
    const height = 48;
    const points = smoothedValues.map((value, i) => ({
      x: (i / (smoothedValues.length - 1 || 1)) * width,
      y: height - (value / maxValue) * height,
    }));
    const path = buildSmoothPath(points);
    const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;

    return (
      <svg
        width="100%"
        height={height}
        className="mini-chart"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <path
          d={path}
          fill="none"
          stroke="#3498db"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d={areaPath} fill="#3498db" opacity="0.25" />
      </svg>
    );
  };

  return (
    <div className="background-chart">
      {entries.length === 0 ? (
        <div className="chart-empty">
          <p>No target metrics available</p>
        </div>
      ) : (
        <div className="metrics-grid">
          {entries.map(([targetName, metrics]) => (
            <div key={targetName} className="metric-card">
              <h4 className="metric-name">{targetName}</h4>

              <div className="metric-chart">
                {renderMiniChart(metrics.history)}
              </div>

              <div className="metric-details">
                <div className="metric-stat">
                  <span className="label">Min:</span>
                  <span className="value">
                    {metrics.min === Infinity ? '—' : `${Math.round(metrics.min)}ms`}
                  </span>
                </div>
                <div className="metric-stat">
                  <span className="label">Avg:</span>
                  <span className="value">{Math.round(metrics.avg)}ms</span>
                </div>
                <div className="metric-stat">
                  <span className="label">Max:</span>
                  <span className="value">
                    {metrics.max === 0 ? '—' : `${Math.round(metrics.max)}ms`}
                  </span>
                </div>
                <div className="metric-stat">
                  <span className="label">Loss:</span>
                  <span
                    className="value"
                    style={{
                      color: metrics.loss > 0 ? '#e74c3c' : '#27ae60',
                    }}
                  >
                    {metrics.loss.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="metric-status">
                <span
                  className="status-indicator"
                  style={{
                    backgroundColor: metrics.loss > 0 ? '#e74c3c' : '#27ae60',
                  }}
                ></span>
                <span className="status-text">
                  {metrics.loss > 0 ? 'Packet Loss' : 'Healthy'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
