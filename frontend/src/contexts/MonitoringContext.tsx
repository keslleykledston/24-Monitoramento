import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
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
  httpTargets: Target[];
  pingTargets: Target[];
  probeList: Probe[];
  incidentList: Incident[];
  targetStatus: TargetStatus;
  chartData: ChartDataPoint[];
  targetMetrics: TargetMetrics;
  httpMetrics: TargetMetrics;
  icmpMetrics: TargetMetrics;
  loadData: () => void;
}

const MonitoringContext = createContext<MonitoringContextType | undefined>(undefined);

export function MonitoringProvider({ children }: { children: ReactNode }) {
  const [targetList, setTargetList] = useState<Target[]>([]);
  const [httpTargets, setHttpTargets] = useState<Target[]>([]);
  const [pingTargets, setPingTargets] = useState<Target[]>([]);
  const [probeList, setProbeList] = useState<Probe[]>([]);
  const [incidentList, setIncidentList] = useState<Incident[]>([]);
  const [targetStatus, setTargetStatus] = useState<TargetStatus>({});
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [targetMetrics, setTargetMetrics] = useState<TargetMetrics>({});
  const [httpMetrics, setHttpMetrics] = useState<TargetMetrics>({});
  const [icmpMetrics, setIcmpMetrics] = useState<TargetMetrics>({});

  // Use ref to avoid recreating handleWSMessage when targetList changes
  const targetListRef = useRef<Target[]>([]);

  // Keep ref in sync with state
  useEffect(() => {
    targetListRef.current = targetList;
  }, [targetList]);

  // Separate targets by type whenever targetList changes
  useEffect(() => {
    const http = targetList.filter(t => t.type === 'http' || t.type === 'https');
    const ping = targetList.filter(t => t.type === 'ping');
    setHttpTargets(http);
    setPingTargets(ping);
  }, [targetList]);

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

      // Load initial historical data for each target
      if (t.length > 0) {
        const metricsPromises = t.map(async (target) => {
          try {
            // Get last 15 minutes of live data
            const response = await targets.getLive(target.id, 15);

            // API returns { target: {...}, measurements: [...] }
            const measurements = response?.measurements || [];

            if (measurements.length > 0) {
              const values = measurements
                .map((m: any) => m.rtt_ms)
                .filter((v: number) => v !== null && v !== undefined);

              const historyWithTime = measurements.map((m: any) => ({
                time: m.timestamp,
                value: m.rtt_ms
              }));

              return {
                targetName: target.name,
                metrics: {
                  history: values.slice(-60),
                  historyWithTime: historyWithTime,
                  min: values.length > 0 ? Math.min(...values) : Infinity,
                  max: values.length > 0 ? Math.max(...values) : 0,
                  avg: values.length > 0 ? values.reduce((a: number, b: number) => a + b, 0) / values.length : 0,
                  current: values[values.length - 1] || 0,
                  loss: 0
                }
              };
            }
          } catch (error) {
            console.error(`Failed to load metrics for ${target.name}:`, error);
          }
          return null;
        });

        const metricsResults = await Promise.all(metricsPromises);
        const initialMetrics: TargetMetrics = {};

        metricsResults.forEach((result) => {
          if (result) {
            initialMetrics[result.targetName] = result.metrics;
          }
        });

        if (Object.keys(initialMetrics).length > 0) {
          setTargetMetrics(initialMetrics);
          console.log('Loaded initial metrics for targets:', Object.keys(initialMetrics));
        }
      }
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
      // Use ref to get current target list without dependency
      const target = targetListRef.current.find(t => t.id === message.target_id);
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

        // Helper function to update metrics
        const updateMetrics = (setMetricsFn: React.Dispatch<React.SetStateAction<TargetMetrics>>) => {
          setMetricsFn((prev) => {
            const existing = prev[target.name] || {
              history: [],
              historyWithTime: [],
              min: Infinity,
              max: 0,
              avg: 0,
              current: 0,
              loss: 0
            };

            const newHistory = [...existing.history, message.rtt_ms!].slice(-60);
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
        };

        // Update all target metrics (legacy - for compatibility)
        updateMetrics(setTargetMetrics);

        // Update type-specific metrics based on measurement_type
        if (message.measurement_type === 'http') {
          updateMetrics(setHttpMetrics);
        } else if (message.measurement_type === 'icmp') {
          updateMetrics(setIcmpMetrics);
        } else {
          // Fallback: if no measurement_type, assume ICMP (for backwards compatibility)
          updateMetrics(setIcmpMetrics);
        }
      }
    }
  }, []); // No dependencies - uses ref instead

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
        httpTargets,
        pingTargets,
        probeList,
        incidentList,
        targetStatus,
        chartData,
        targetMetrics,
        httpMetrics,
        icmpMetrics,
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
