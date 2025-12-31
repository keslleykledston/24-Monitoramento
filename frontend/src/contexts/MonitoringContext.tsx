import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { targets, probes, incidents } from '../services/api';
import { wsService } from '../services/websocket';
import type { Target, Probe, Incident, WSMessage } from '../types';

interface TargetStatus {
  [key: string]: {
    up: boolean;
    rtt_ms: number | null;
    timestamp: string;
  };
}

interface ChartDataPoint {
  timestamp: string;
  value: number;
  target: string;
}

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

interface MonitoringContextType {
  targetList: Target[];
  probeList: Probe[];
  incidentList: Incident[];
  targetStatus: TargetStatus;
  chartData: ChartDataPoint[];
  targetMetrics: TargetMetrics;
  loadData: () => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const [targetList, setTargetList] = useState<Target[]>([]);
  const [probeList, setProbeList] = useState<Probe[]>([]);
  const [incidentList, setIncidentList] = useState<Incident[]>([]);
  const [targetStatus, setTargetStatus] = useState<TargetStatus>({});
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [targetMetrics, setTargetMetrics] = useState<TargetMetrics>({});

  const loadData = useCallback(async () => {
    try {
      const [t, p, i] = await Promise.all([
        targets.list(true), // Only get active targets for monitoring
        probes.list(),
        incidents.list('open'),
      ]);
      setTargetList(t);
      setProbeList(p);
      setIncidentList(i);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  const handleWSMessage = useCallback((message: WSMessage) => {
    const key = `${message.target_id}-${message.probe_id}`;
    setTargetStatus((prev) => ({
      ...prev,
      [key]: {
        up: message.up,
        rtt_ms: message.rtt_ms,
        timestamp: message.timestamp,
      },
    }));

    // Update chart data (keep last 100 points)
    if (message.rtt_ms !== null) {
      const target = targetList.find(t => t.id === message.target_id);
      if (target) {
        setChartData((prev) => {
          const newData = [...prev, {
            timestamp: message.timestamp,
            value: message.rtt_ms!,
            target: target.name
          }];
          // Keep only last 100 points
          return newData.slice(-100);
        });

        // Update target metrics
        setTargetMetrics((prev) => {
          const existing = prev[target.name] || {
            history: [],
            historyWithTime: [],
            min: Infinity,
            max: 0,
            avg: 0,
            current: 0,
            loss: 0
          };

          const newHistory = [...existing.history, message.rtt_ms!].slice(-60); // Last 60 points for mini chart

          // Keep 1 hour of data (3600 points at 1s interval)
          const newHistoryWithTime = [
            ...existing.historyWithTime,
            { time: message.timestamp, value: message.rtt_ms! }
          ].slice(-3600);

          const min = Math.min(existing.min, message.rtt_ms!);
          const max = Math.max(existing.max, message.rtt_ms!);
          const avg = newHistory.reduce((a, b) => a + b, 0) / newHistory.length;

          return {
            ...prev,
            [target.name]: {
              history: newHistory,
              historyWithTime: newHistoryWithTime,
              min,
              max,
              avg,
              current: message.rtt_ms!,
              loss: message.up ? 0 : 100
            }
          };
        });
      }
    }
  }, [targetList]);

  useEffect(() => {
    // Initial data load
    loadData();

    // Connect to WebSocket once for the entire app lifecycle
    wsService.connect();
    const unsubscribe = wsService.subscribe(handleWSMessage);

    // Keep connection alive even when component unmounts
    return () => {
      unsubscribe();
      // Note: We don't disconnect WebSocket here to keep it running in background
    };
  }, [loadData, handleWSMessage]);

  return (
    <MonitoringContext.Provider
      value={{
        targetList,
        probeList,
        incidentList,
        targetStatus,
        chartData,
        targetMetrics,
        loadData
      }}
    >
      {children}
    </MonitoringContext.Provider>
  );
}

export function useMonitoring() {
  const context = useContext(MonitoringContext);
  if (context === undefined) {
    throw new Error('useMonitoring must be used within a MonitoringProvider');
  }
  return context;
}
