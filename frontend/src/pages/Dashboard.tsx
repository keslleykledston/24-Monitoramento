import { useEffect, useState } from 'react';
import { useMonitoring } from '../contexts/MonitoringContext';
import { buildSmoothPath, smoothValues, downsampleValues } from '../utils/chart';

export default function Dashboard() {
  const { httpTargets, targetMetrics, targetStatus, probeList } = useMonitoring();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderSparkline = (values: number[], isUp: boolean, id: number) => {
    if (values.length < 2) {
      return null;
    }

    const smoothed = smoothValues(values, 7);
    const sampled = downsampleValues(smoothed, 140);
    const maxValue = Math.max(...sampled, 100);
    const width = 200;
    const height = 70;
    const points = sampled.map((value, index) => ({
      x: (index / (sampled.length - 1 || 1)) * width,
      y: height - (value / maxValue) * height,
    }));

    const path = buildSmoothPath(points, 0.8);
    if (!path) {
      return null;
    }

    const areaPath = `${path} L ${width} ${height} L 0 ${height} Z`;
    const gradientId = `sparkline-${id}`;
    const lineColor = isUp ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)';
    const glowColor = isUp ? 'rgba(46, 204, 113, 0.18)' : 'rgba(231, 76, 60, 0.18)';

    return (
      <svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="sparkline-card"
        style={{ filter: `drop-shadow(0 6px 10px ${glowColor})` }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.4" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#${gradientId})`} />
        <path
          d={path}
          fill="none"
          stroke={lineColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Monitoramento HTTP/HTTPS em Tempo Real</h2>
        <p className="timestamp">{currentTime.toLocaleString('pt-BR')}</p>
      </div>

      {httpTargets.length === 0 ? (
        <div className="empty-state">
          <p>Nenhum alvo HTTP/HTTPS configurado. Vá em Settings para adicionar alvos de monitoramento HTTP/HTTPS.</p>
        </div>
      ) : (
        <div className="targets-grid">
          {httpTargets.map((target) => {
            const metrics = targetMetrics[target.name];
            const status = targetStatus[`${target.id}-${probeList[0]?.id}`];
            const isUp = status?.up || false;
            const currentRtt = status?.rtt_ms || 0;

            // Get last hour of data (3600 points at 1s interval)
            const historyData = metrics?.historyWithTime || [];
            const sparklineData = historyData.slice(-3600).map(d => d.value);

            return (
              <div key={target.id} className={`target-card ${isUp ? 'online' : 'offline'}`}>
                <div className="target-card-background">
                  {renderSparkline(sparklineData, isUp, target.id)}
                </div>

                <div className="target-card-content">
                  <div className="target-header">
                    <h3>{target.name}</h3>
                    <span className={`status-indicator ${isUp ? 'up' : 'down'}`}>
                      {isUp ? '●' : '○'}
                    </span>
                  </div>

                  <div className="target-url">{target.url}</div>

                  <div className="target-metrics">
                    {metrics && (
                      <>
                        <div className="metric">
                          <span className="metric-label">Atual</span>
                          <span className="metric-value">{currentRtt ? `${currentRtt.toFixed(2)}ms` : '-'}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Média</span>
                          <span className="metric-value">{metrics.avg ? `${metrics.avg.toFixed(2)}ms` : '-'}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Min/Max</span>
                          <span className="metric-value">
                            {metrics.min !== Infinity ? `${metrics.min.toFixed(2)}/${metrics.max.toFixed(2)}ms` : '-'}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
