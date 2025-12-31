import { useState, useEffect } from 'react';
import { useMonitoring } from '../contexts/MonitoringContext';
import LatencyChart from '../components/latency/LatencyChart';
import TargetCard from '../components/latency/TargetCard';
import '../styles/latency-monitor.css';

interface LatencyDataPoint {
  timestamp: string;
  value: number;
}

interface LocalTargetMetrics {
  current: number;
  average: number;
  max: number;
  history: number[];
  online: boolean;
  loss: number;
}

export default function LatencyMonitor() {
  const { targetList, targetMetrics, targetStatus, probeList } = useMonitoring();
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null);

  // Auto-select first target when list loads
  useEffect(() => {
    if (targetList.length > 0 && selectedTargetId === null) {
      setSelectedTargetId(targetList[0].id);
    }
  }, [targetList, selectedTargetId]);

  // Get selected target data
  const selectedTarget = targetList.find((t) => t.id === selectedTargetId);
  const selectedMetrics = selectedTarget ? targetMetrics[selectedTarget.name] : null;

  // Convert to LatencyDataPoint format for chart
  const selectedData: LatencyDataPoint[] = selectedMetrics?.historyWithTime?.map((item) => ({
    timestamp: new Date(item.time).toLocaleString('pt-BR'),
    value: item.value,
  })) || [];

  if (targetList.length === 0) {
    return (
      <div className="latency-monitor">
        <div className="latency-monitor-header">
          <h1 className="latency-monitor-title">Monitor de Latência ICMP (Ping)</h1>
          <p className="latency-monitor-subtitle">
            Monitoramento em tempo real - Atualiza a cada segundo - ICMP Ping
          </p>
        </div>
        <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
            Nenhum alvo configurado. Vá em <strong>Settings</strong> para adicionar alvos de monitoramento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="latency-monitor">
      {/* Header */}
      <div className="latency-monitor-header">
        <h1 className="latency-monitor-title">Monitor de Latência ICMP (Ping)</h1>
        <p className="latency-monitor-subtitle">
          Monitoramento em tempo real - Atualiza a cada segundo - ICMP Ping
        </p>
      </div>

      {/* Main Chart Section */}
      <div className="main-chart-section">
        <div className="chart-header">
          <h2 className="chart-title">Latency Over Time</h2>
          <div className="target-selector">
            <span className="target-selector-label">Target:</span>
            <select
              value={selectedTargetId || ''}
              onChange={(e) => setSelectedTargetId(Number(e.target.value))}
            >
              {targetList.map((target) => (
                <option key={target.id} value={target.id}>
                  {target.name} {target.type === 'ping' ? '(PING)' : '(HTTP+PING)'}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="main-chart-container">
          {selectedData.length > 0 ? (
            <LatencyChart
              data={selectedData}
              targetName={selectedTarget?.name || ''}
            />
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Waiting for data... The chart will appear as measurements arrive.
            </div>
          )}
        </div>
      </div>

      {/* Targets Overview */}
      <div className="targets-overview-section">
        <h2 className="section-title">Visão Geral dos Alvos - Monitoramento ICMP</h2>
        <div className="latency-targets-grid">
          {targetList.map((target) => {
            const metrics = targetMetrics[target.name];
            const status = targetStatus[`${target.id}-${probeList[0]?.id}`];

            // Convert metrics to LocalTargetMetrics format
            const localMetrics: LocalTargetMetrics = {
              current: metrics?.current || 0,
              average: metrics?.avg || 0,
              max: metrics?.max || 0,
              history: metrics?.history || [],
              online: status?.up || false,
              loss: metrics?.loss || 0,
            };

            return (
              <TargetCard
                key={target.id}
                name={`${target.name} ${target.type === 'ping' ? '(PING)' : '(HTTP+PING)'}`}
                url={target.url}
                metrics={localMetrics}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
