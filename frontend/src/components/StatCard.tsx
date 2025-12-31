interface StatCardProps {
  title: string;
  value: string;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange' | 'gray';
  subtitle?: string;
  icon?: string;
}

export default function StatCard({
  title,
  value,
  color = 'blue',
  subtitle,
  icon,
}: StatCardProps) {
  const colorMap = {
    blue: '#3498db',
    green: '#27ae60',
    red: '#e74c3c',
    purple: '#9b59b6',
    orange: '#e67e22',
    gray: '#95a5a6',
  };

  return (
    <div className="stat-card" style={{ borderTopColor: colorMap[color] }}>
      <div className="stat-header">
        {icon && <span className="stat-icon">{icon}</span>}
        <h3 className="stat-title">{title}</h3>
      </div>
      <div className="stat-value">{value}</div>
      {subtitle && <p className="stat-subtitle">{subtitle}</p>}
    </div>
  );
}
