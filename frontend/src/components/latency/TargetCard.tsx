import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface TargetMetrics {
  current: number;
  average: number;
  max: number;
  history: number[];
  online: boolean;
  loss: number;
}

interface TargetCardProps {
  name: string;
  url: string;
  metrics: TargetMetrics;
}

export default function TargetCard({ name, url, metrics }: TargetCardProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current || metrics.history.length === 0) return;

    // Initialize chart if not exists
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const chart = chartInstance.current;

    // Prepare sparkline data (last 60 points for mini chart)
    const sparklineData = metrics.history.slice(-60);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: 5,
        right: 5,
        top: 5,
        bottom: 5,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        show: false,
        boundaryGap: false,
      },
      yAxis: {
        type: 'value',
        show: false,
        min: 0,
        max: (value: any) => value.max * 1.2,
      },
      series: [
        {
          type: 'line',
          data: sparklineData,
          smooth: true,
          symbol: 'none',
          sampling: 'lttb',
          lineStyle: {
            color: '#00D4FF',
            width: 1.5,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(0, 212, 255, 0.3)',
              },
              {
                offset: 1,
                color: 'rgba(0, 212, 255, 0)',
              },
            ]),
          },
          emphasis: {
            disabled: true,
          },
        },
      ],
      animation: true,
      animationDuration: 200,
      animationEasing: 'linear',
    };

    chart.setOption(option, { notMerge: false });

    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [metrics.history]);

  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return (
    <div className={`latency-target-card ${metrics.online ? 'online' : 'offline'}`}>
      {/* Card Header */}
      <div className="card-header">
        <h3 className="card-target-name">{name}</h3>
        <span className={metrics.online ? 'online-badge' : 'offline-badge'}>
          {metrics.online ? 'ONLINE' : 'OFFLINE'}
        </span>
      </div>

      {/* Mini Chart */}
      <div className="mini-chart-container">
        <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {/* Metrics */}
      <div className="card-metrics">
        <div className="metric-item">
          <span className="metric-label">Latência Atual</span>
          <span className="metric-value current">{metrics.current.toFixed(2)}ms</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Latência Média</span>
          <span className="metric-value average">{metrics.average.toFixed(2)}ms</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Latência Máxima</span>
          <span className="metric-value max">{metrics.max.toFixed(2)}ms</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Perda de Pacotes</span>
          <span className="metric-value loss" style={{ color: metrics.loss > 0 ? '#e74c3c' : '#2ecc71' }}>
            {metrics.loss.toFixed(2)}%
          </span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Disponibilidade</span>
          <span className="metric-value availability" style={{ color: metrics.online ? '#2ecc71' : '#e74c3c' }}>
            {metrics.online ? '100%' : '0%'}
          </span>
        </div>
      </div>

      {/* URL */}
      <div className="card-target-url">{url}</div>
    </div>
  );
}
