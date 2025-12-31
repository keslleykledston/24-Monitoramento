import { useState, useEffect } from 'react';
import { useMonitoring } from '../contexts/MonitoringContext';
import { targets as targetsAPI } from '../services/api';
import UptimeBar, { UptimeSegment } from '../components/history/UptimeBar';
import '../styles/history.css';

type TimeRange = 7 | 30 | 90;

interface HistoricalData {
  targetId: number;
  targetName: string;
  segments: UptimeSegment[];
}

export default function History() {
  const { targetList } = useMonitoring();
  const [timeRange, setTimeRange] = useState<TimeRange>(7);
  const [historyData, setHistoryData] = useState<HistoricalData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load real historical data from API
  useEffect(() => {
    if (targetList.length === 0) return;

    const loadHistoricalData = async () => {
      setIsLoading(true);
      try {
        const dataPromises = targetList.map(async (target) => {
          try {
            const response = await targetsAPI.getHistory(target.id, timeRange);
            const aggregates = response?.aggregates || [];

            // Convert aggregates to segments
            const segments: UptimeSegment[] = aggregates.map((agg: any) => {
              // Determine status based on data
              let status: 'up' | 'down' | 'degraded' = 'up';

              if (agg.avg_rtt_ms === null || agg.packet_loss > 50) {
                status = 'down';
              } else if (agg.packet_loss > 0 || agg.avg_rtt_ms > 150) {
                status = 'degraded';
              }

              return {
                timestamp: new Date(agg.bucket),
                status,
                duration: 60, // 1 minute buckets
                latency: agg.avg_rtt_ms || 0,
              };
            });

            return {
              targetId: target.id,
              targetName: target.name,
              segments,
            };
          } catch (error) {
            console.error(`Failed to load history for ${target.name}:`, error);
            return {
              targetId: target.id,
              targetName: target.name,
              segments: [],
            };
          }
        });

        const results = await Promise.all(dataPromises);
        setHistoryData(results);
      } catch (error) {
        console.error('Failed to load historical data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadHistoricalData();
  }, [targetList, timeRange]);

  // Calculate overall statistics
  const calculateStats = () => {
    let totalUptime = 0;
    let totalDowntime = 0;
    let totalDegraded = 0;
    let totalIncidents = 0;
    let latencies: number[] = [];

    historyData.forEach((data) => {
      data.segments.forEach((segment) => {
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
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading historical data...
          </div>
        ) : targetList.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
              No targets configured yet. Go to <strong>Settings</strong> to add monitoring targets.
            </p>
          </div>
        ) : historyData.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No historical data available for the selected time range.
          </div>
        ) : (
          historyData.map((data) => (
            <UptimeBar
              key={data.targetId}
              segments={data.segments}
              days={timeRange}
              targetName={data.targetName}
            />
          ))
        )}
      </div>
    </div>
  );
}
