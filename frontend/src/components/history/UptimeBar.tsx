export interface UptimeSegment {
  timestamp: Date;
  status: 'up' | 'down' | 'degraded'; // degraded = latency > 50% above baseline
  duration: number; // in seconds
  latency?: number;
}

interface UptimeBarProps {
  segments: UptimeSegment[];
  days: number; // 7, 30, 90
  targetName: string;
}

export default function UptimeBar({ segments, days, targetName }: UptimeBarProps) {
  // Calculate uptime percentage
  const totalSeconds = days * 24 * 60 * 60;
  const upSeconds = segments
    .filter(s => s.status === 'up')
    .reduce((sum, s) => sum + s.duration, 0);
  const uptimePercentage = ((upSeconds / totalSeconds) * 100).toFixed(2);

  // Group segments by day for visualization
  const segmentsByDay = groupSegmentsByDay(segments, days);

  return (
    <div className="uptime-bar-container">
      <div className="uptime-bar-header">
        <h3 className="uptime-target-name">{targetName}</h3>
        <span className="uptime-percentage">{uptimePercentage}% uptime</span>
      </div>

      <div className="uptime-bar-chart">
        {segmentsByDay.map((dayData, index) => (
          <div
            key={index}
            className="uptime-day-bar"
            title={`${dayData.date.toLocaleDateString()}\nUptime: ${dayData.uptimePercent.toFixed(1)}%\nAvg Latency: ${dayData.avgLatency.toFixed(0)}ms`}
          >
            {dayData.segments.map((segment, segIndex) => (
              <div
                key={segIndex}
                className={`uptime-segment uptime-segment-${segment.status}`}
                style={{
                  width: `${segment.percentage}%`,
                }}
                title={getSegmentTooltip(segment)}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="uptime-bar-legend">
        <div className="legend-item">
          <span className="legend-color legend-up"></span>
          <span className="legend-label">Operational</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-degraded"></span>
          <span className="legend-label">Degraded (&gt;50% above baseline)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color legend-down"></span>
          <span className="legend-label">Down</span>
        </div>
      </div>
    </div>
  );
}

interface DayData {
  date: Date;
  segments: Array<UptimeSegment & { percentage: number }>;
  uptimePercent: number;
  avgLatency: number;
}

function groupSegmentsByDay(segments: UptimeSegment[], days: number): DayData[] {
  const now = new Date();
  const result: DayData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    // Filter segments for this day
    const daySegments = segments.filter(
      s => s.timestamp >= dayStart && s.timestamp <= dayEnd
    );

    if (daySegments.length === 0) {
      // No data for this day - assume up
      result.push({
        date: dayStart,
        segments: [{
          timestamp: dayStart,
          status: 'up',
          duration: 86400,
          percentage: 100
        }],
        uptimePercent: 100,
        avgLatency: 50,
      });
      continue;
    }

    // Calculate total duration for percentage
    const totalDuration = daySegments.reduce((sum, s) => sum + s.duration, 0);

    // Add percentage to segments
    const segmentsWithPercentage = daySegments.map(s => ({
      ...s,
      percentage: (s.duration / totalDuration) * 100,
    }));

    // Calculate metrics
    const upTime = daySegments
      .filter(s => s.status === 'up')
      .reduce((sum, s) => sum + s.duration, 0);
    const uptimePercent = (upTime / totalDuration) * 100;

    const latencies = daySegments
      .filter(s => s.latency !== undefined)
      .map(s => s.latency!);
    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 50;

    result.push({
      date: dayStart,
      segments: segmentsWithPercentage,
      uptimePercent,
      avgLatency,
    });
  }

  return result;
}

function getSegmentTooltip(segment: UptimeSegment & { percentage: number }): string {
  const statusText = {
    up: 'Operational',
    degraded: 'Degraded Performance',
    down: 'Down',
  }[segment.status];

  const durationMinutes = Math.floor(segment.duration / 60);
  const latencyText = segment.latency ? `\nLatency: ${segment.latency.toFixed(0)}ms` : '';

  return `${statusText}\nDuration: ${durationMinutes} min${latencyText}`;
}
