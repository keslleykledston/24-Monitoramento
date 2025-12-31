import { useState, useEffect } from 'react';
import LatencyChart from '../components/latency/LatencyChart';
import TargetCard from '../components/latency/TargetCard';
import '../styles/latency-monitor.css';

// Target definitions
const TARGETS = [
  { id: 1, name: 'Globo', url: 'https://globo.com' },
  { id: 2, name: 'UOL', url: 'https://uol.com.br' },
  { id: 3, name: 'Mercado Livre', url: 'https://mercadolivre.com.br' },
  { id: 4, name: 'Gov.br', url: 'https://gov.br' },
  { id: 5, name: 'Reclame Aqui', url: 'https://reclameaqui.com.br' },
  { id: 6, name: 'Google', url: 'https://google.com' },
  { id: 7, name: 'YouTube', url: 'https://youtube.com' },
  { id: 8, name: 'Facebook', url: 'https://facebook.com' },
  { id: 9, name: 'Instagram', url: 'https://instagram.com' },
  { id: 10, name: 'Wikipedia', url: 'https://wikipedia.org' },
];

interface LatencyDataPoint {
  timestamp: string;
  value: number;
}

interface TargetMetrics {
  current: number;
  average: number;
  max: number;
  history: number[];
  online: boolean;
}

// Generate mock latency value with occasional spikes (PING - 30-100ms normal)
const generateLatency = (baseLatency: number, spikeChance: number = 0.05): number => {
  const isSpike = Math.random() < spikeChance;
  if (isSpike) {
    // Spike between 150-250ms (50-150% above normal)
    return Math.floor(Math.random() * 100) + 150;
  }
  // Normal latency with small variation (30-100ms range)
  const variation = (Math.random() - 0.5) * 15;
  return Math.max(30, Math.min(100, Math.floor(baseLatency + variation)));
};

// Format timestamp
const formatTimestamp = (date: Date): string => {
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${date.toLocaleDateString()} ${hours}:${minutes}:${seconds}`;
};

export default function LatencyMonitor() {
  const [selectedTargetId, setSelectedTargetId] = useState<number>(1);
  const [targetData, setTargetData] = useState<Map<number, LatencyDataPoint[]>>(new Map());
  const [targetMetrics, setTargetMetrics] = useState<Map<number, TargetMetrics>>(new Map());

  // Initialize data
  useEffect(() => {
    const initialData = new Map<number, LatencyDataPoint[]>();
    const initialMetrics = new Map<number, TargetMetrics>();

    TARGETS.forEach((target) => {
      const history: number[] = [];
      const dataPoints: LatencyDataPoint[] = [];
      const now = new Date();

      // Generate 20 minutes of historical data (1200 points)
      for (let i = 1200; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 1000);
        const baseLatency = 40 + (target.id * 3); // Different base for each target (40-70ms)
        const value = generateLatency(baseLatency, 0.03);

        dataPoints.push({
          timestamp: formatTimestamp(timestamp),
          value,
        });
        history.push(value);
      }

      initialData.set(target.id, dataPoints);

      // Calculate initial metrics
      const current = history[history.length - 1];
      const average = Math.floor(history.reduce((a, b) => a + b, 0) / history.length);
      const max = Math.max(...history);

      initialMetrics.set(target.id, {
        current,
        average,
        max,
        history,
        online: true,
      });
    });

    setTargetData(initialData);
    setTargetMetrics(initialMetrics);
  }, []);

  // Real-time updates (every second)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();

      setTargetData((prevData) => {
        const newData = new Map(prevData);

        TARGETS.forEach((target) => {
          const targetHistory = newData.get(target.id) || [];
          const baseLatency = 40 + (target.id * 3); // 40-70ms base
          const newValue = generateLatency(baseLatency, 0.03);

          const newPoint: LatencyDataPoint = {
            timestamp: formatTimestamp(now),
            value: newValue,
          };

          // Keep last 1200 points (20 minutes)
          const updatedHistory = [...targetHistory.slice(-1199), newPoint];
          newData.set(target.id, updatedHistory);
        });

        return newData;
      });

      setTargetMetrics((prevMetrics) => {
        const newMetrics = new Map(prevMetrics);

        TARGETS.forEach((target) => {
          const targetHistory = targetData.get(target.id) || [];
          const values = targetHistory.map((d) => d.value);

          if (values.length > 0) {
            const current = values[values.length - 1];
            const average = Math.floor(values.reduce((a, b) => a + b, 0) / values.length);
            const max = Math.max(...values);

            newMetrics.set(target.id, {
              current,
              average,
              max,
              history: values,
              online: Math.random() > 0.02, // 98% uptime
            });
          }
        });

        return newMetrics;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetData]);

  const selectedTarget = TARGETS.find((t) => t.id === selectedTargetId);
  const selectedData = targetData.get(selectedTargetId) || [];

  return (
    <div className="latency-monitor">
      {/* Header */}
      <div className="latency-monitor-header">
        <h1 className="latency-monitor-title">Real-Time Latency Monitor</h1>
        <p className="latency-monitor-subtitle">
          Live - Updates every second - 20 minutes history
        </p>
      </div>

      {/* Main Chart Section */}
      <div className="main-chart-section">
        <div className="chart-header">
          <h2 className="chart-title">Latency Over Time</h2>
          <div className="target-selector">
            <span className="target-selector-label">Target:</span>
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(Number(e.target.value))}
            >
              {TARGETS.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="main-chart-container">
          <LatencyChart
            data={selectedData}
            targetName={selectedTarget?.name || ''}
          />
        </div>
      </div>

      {/* Targets Overview */}
      <div className="targets-overview-section">
        <h2 className="section-title">Targets Overview</h2>
        <div className="latency-targets-grid">
          {TARGETS.map((target) => {
            const metrics = targetMetrics.get(target.id);
            if (!metrics) return null;

            return (
              <TargetCard
                key={target.id}
                name={target.name}
                url={target.url}
                metrics={metrics}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
