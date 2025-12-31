import { useState, useEffect } from 'react';
import UptimeBar, { UptimeSegment } from '../components/history/UptimeBar';
import '../styles/history.css';

// Target definitions (same as LatencyMonitor)
const TARGETS = [
  { id: 1, name: 'Globo', url: 'https://globo.com', baseLatency: 43 },
  { id: 2, name: 'UOL', url: 'https://uol.com.br', baseLatency: 46 },
  { id: 3, name: 'Mercado Livre', url: 'https://mercadolivre.com.br', baseLatency: 49 },
  { id: 4, name: 'Gov.br', url: 'https://gov.br', baseLatency: 52 },
  { id: 5, name: 'Reclame Aqui', url: 'https://reclameaqui.com.br', baseLatency: 55 },
  { id: 6, name: 'Google', url: 'https://google.com', baseLatency: 58 },
  { id: 7, name: 'YouTube', url: 'https://youtube.com', baseLatency: 61 },
  { id: 8, name: 'Facebook', url: 'https://facebook.com', baseLatency: 64 },
  { id: 9, name: 'Instagram', url: 'https://instagram.com', baseLatency: 67 },
  { id: 10, name: 'Wikipedia', url: 'https://wikipedia.org', baseLatency: 70 },
];

type TimeRange = 7 | 30 | 90;

export default function History() {
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const [historyData, setHistoryData] = useState<Map<number, UptimeSegment[]>>(new Map());

  // Generate mock history data
  useEffect(() => {
    const data = new Map<number, UptimeSegment[]>();

    TARGETS.forEach((target) => {
      const segments: UptimeSegment[] = [];
      const now = new Date();
      const startTime = new Date(now.getTime() - timeRange * 24 * 60 * 60 * 1000);

      let currentTime = startTime;

      while (currentTime < now) {
        // Generate random segment
        const random = Math.random();
        let status: 'up' | 'down' | 'degraded';
        let duration: number;
        let latency: number;

        if (random < 0.02) {
          // 2% chance of downtime
          status = 'down';
          duration = Math.floor(Math.random() * 1800) + 300; // 5-35 minutes
          latency = 0;
        } else if (random < 0.12) {
          // 10% chance of degraded performance
          status = 'degraded';
          duration = Math.floor(Math.random() * 3600) + 600; // 10-70 minutes
          // Degraded = latency > 50% above baseline
          latency = target.baseLatency * (1.5 + Math.random() * 0.8); // 150-230% of baseline
        } else {
          // 88% operational
          status = 'up';
          duration = Math.floor(Math.random() * 14400) + 3600; // 1-5 hours
          latency = target.baseLatency + (Math.random() - 0.5) * 15; // Normal variation
        }

        segments.push({
          timestamp: new Date(currentTime),
          status,
          duration,
          latency,
        });

        currentTime = new Date(currentTime.getTime() + duration * 1000);
      }

      data.set(target.id, segments);
    });

    setHistoryData(data);
  }, [timeRange]);

  // Calculate overall statistics
  const calculateStats = () => {
    let totalUptime = 0;
    let totalDowntime = 0;
    let totalDegraded = 0;
    let totalIncidents = 0;
    let latencies: number[] = [];

    historyData.forEach((segments) => {
      segments.forEach((segment) => {
        if (segment.status === 'up') {
          totalUptime += segment.duration;
          if (segment.latency) latencies.push(segment.latency);
        } else if (segment.status === 'down') {
          totalDowntime += segment.duration;
          totalIncidents++;
        } else {
          totalDegraded += segment.duration;
          if (segment.latency) latencies.push(segment.latency);
        }
      });
    });

    const totalTime = totalUptime + totalDowntime + totalDegraded;
    const uptimePercent = totalTime > 0 ? (totalUptime / totalTime) * 100 : 100;
    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;

    return {
      uptimePercent: uptimePercent.toFixed(2),
      totalIncidents,
      avgLatency: avgLatency.toFixed(1),
      totalDowntimeMinutes: Math.floor(totalDowntime / 60),
    };
  };

  const stats = calculateStats();

  return (
    <div className="history-page">
      {/* Header */}
      <div className="history-header">
        <h1>Uptime History</h1>
        <p className="history-subtitle">
          Historical uptime and performance data for all monitored targets
        </p>
      </div>

      {/* Filters */}
      <div className="history-filters">
        <span className="filter-label">Time Range:</span>
        <div className="filter-button-group">
          <button
            className={`filter-button ${timeRange === 7 ? 'active' : ''}`}
            onClick={() => setTimeRange(7)}
          >
            Last 7 Days
          </button>
          <button
            className={`filter-button ${timeRange === 30 ? 'active' : ''}`}
            onClick={() => setTimeRange(30)}
          >
            Last 30 Days
          </button>
          <button
            className={`filter-button ${timeRange === 90 ? 'active' : ''}`}
            onClick={() => setTimeRange(90)}
          >
            Last 90 Days
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="history-summary">
        <div className="summary-card success">
          <div className="summary-card-label">Overall Uptime</div>
          <div className="summary-card-value">{stats.uptimePercent}%</div>
          <div className="summary-card-subtitle">Last {timeRange} days</div>
        </div>

        <div className="summary-card danger">
          <div className="summary-card-label">Total Incidents</div>
          <div className="summary-card-value">{stats.totalIncidents}</div>
          <div className="summary-card-subtitle">Downtime events</div>
        </div>

        <div className="summary-card warning">
          <div className="summary-card-label">Avg Latency</div>
          <div className="summary-card-value">{stats.avgLatency}ms</div>
          <div className="summary-card-subtitle">Across all targets</div>
        </div>

        <div className="summary-card">
          <div className="summary-card-label">Total Downtime</div>
          <div className="summary-card-value">{stats.totalDowntimeMinutes}</div>
          <div className="summary-card-subtitle">Minutes offline</div>
        </div>
      </div>

      {/* Uptime Bars for Each Target */}
      <div className="uptime-bars-container">
        {TARGETS.map((target) => {
          const segments = historyData.get(target.id) || [];
          return (
            <UptimeBar
              key={target.id}
              segments={segments}
              days={timeRange}
              targetName={target.name}
            />
          );
        })}
      </div>
    </div>
  );
}
