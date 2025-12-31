import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface LatencyDataPoint {
  timestamp: string;
  value: number;
}

interface LatencyChartProps {
  data: LatencyDataPoint[];
  targetName: string;
}

export default function LatencyChart({ data, targetName }: LatencyChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Get theme colors from CSS variables
    const getThemeColor = (variable: string) => {
      return getComputedStyle(document.documentElement).getPropertyValue(variable).trim() || '#888888';
    };

    const textColor = getThemeColor('--text-color');
    const textLight = getThemeColor('--text-light');
    const borderColor = getThemeColor('--border-color');

    // Initialize chart if not exists
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, null, {
        renderer: 'canvas',
      });
    }

    const chart = chartInstance.current;

    // Prepare data
    const timestamps = data.map(d => d.timestamp);
    const values = data.map(d => d.value);

    // Chart options
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: {
        left: 60,
        right: 30,
        top: 30,
        bottom: 40,
        containLabel: false,
      },
      xAxis: {
        type: 'category',
        data: timestamps,
        boundaryGap: false,
        axisLine: {
          lineStyle: {
            color: borderColor,
          },
        },
        axisLabel: {
          color: textLight,
          fontSize: 11,
          formatter: (value: string) => {
            // Show only time (HH:MM:SS)
            const parts = value.split(' ');
            return parts[1] || value;
          },
          interval: Math.floor(timestamps.length / 12) || 0,
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: borderColor,
            type: 'solid',
            opacity: 0.3,
          },
        },
      },
      yAxis: {
        type: 'value',
        name: 'Latency (ms)',
        nameTextStyle: {
          color: textLight,
          fontSize: 12,
          padding: [0, 0, 0, -50],
        },
        min: 0,
        max: 350,
        interval: 50,
        axisLine: {
          show: true,
          lineStyle: {
            color: borderColor,
          },
        },
        axisLabel: {
          color: textLight,
          fontSize: 11,
        },
        splitLine: {
          lineStyle: {
            color: borderColor,
            type: 'solid',
            opacity: 0.3,
          },
        },
      },
      series: [
        {
          name: targetName,
          type: 'line',
          data: values,
          smooth: true,
          symbol: 'none',
          sampling: 'lttb',
          lineStyle: {
            color: '#00D4FF',
            width: 2,
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: 'rgba(0, 212, 255, 0.4)',
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
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        borderColor: '#00D4FF',
        borderWidth: 1,
        textStyle: {
          color: textColor,
          fontSize: 12,
        },
        formatter: (params: any) => {
          const param = params[0];
          const latencyValue = typeof param.value === 'number' ? param.value.toFixed(2) : param.value;
          return `
            <div style="padding: 4px;">
              <strong>${targetName}</strong><br/>
              <span style="color: #888888;">Time:</span> ${param.axisValue}<br/>
              <span style="color: #00D4FF;">Latency:</span> <strong>${latencyValue}ms</strong>
            </div>
          `;
        },
      },
      animation: true,
      animationDuration: 300,
      animationEasing: 'linear',
    };

    chart.setOption(option, { notMerge: false });

    // Handle resize
    const handleResize = () => {
      chart.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data, targetName]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  return <div ref={chartRef} style={{ width: '100%', height: '100%' }} />;
}
