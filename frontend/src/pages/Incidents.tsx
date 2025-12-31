import { useState, useEffect } from 'react';
import { useMonitoring } from '../contexts/MonitoringContext';
import { incidents as incidentsAPI } from '../services/api';
import type { Incident } from '../types';

export default function Incidents() {
  const { incidentList, targetList, probeList } = useMonitoring();
  const [filteredIncidents, setFilteredIncidents] = useState<Incident[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('open');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Helper functions to get names
  const getTargetName = (targetId: number): string => {
    const target = targetList.find(t => t.id === targetId);
    return target ? target.name : `Target #${targetId}`;
  };

  const getProbeName = (probeId: number): string => {
    const probe = probeList.find(p => p.id === probeId);
    return probe ? probe.name : `Probe #${probeId}`;
  };

  useEffect(() => {
    let filtered = [...incidentList];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }

    // Apply severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter((i) => i.severity === severityFilter);
    }

    // Sort by date descending
    filtered.sort(
      (a, b) =>
        new Date(b.last_occurrence).getTime() -
        new Date(a.last_occurrence).getTime()
    );

    setFilteredIncidents(filtered);
  }, [incidentList, statusFilter, severityFilter]);

  const handleAcknowledge = async (incidentId: number) => {
    setIsLoading(true);
    try {
      const username = localStorage.getItem('username') || 'Unknown';
      await incidentsAPI.acknowledge(incidentId, username);
      // Trigger a refresh (in real app, would update context)
      window.location.reload();
    } catch (error) {
      console.error('Failed to acknowledge incident:', error);
      alert('Failed to acknowledge incident');
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical':
        return '#e74c3c';
      case 'high':
        return '#e67e22';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const getStatusBadge = (status: string): string => {
    switch (status) {
      case 'open':
        return 'badge-danger';
      case 'acknowledged':
        return 'badge-warning';
      case 'resolved':
        return 'badge-success';
      default:
        return 'badge-info';
    }
  };

  return (
    <div className="incidents-page">
      <div className="incidents-header">
        <h2>Incidents</h2>
        <p className="subtitle">View and manage monitoring incidents</p>
      </div>

      <div className="incidents-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="severity-filter">Severity:</label>
          <select
            id="severity-filter"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-info">
          Found {filteredIncidents.length} incident{filteredIncidents.length !== 1 ? 's' : ''}
        </div>
      </div>

      {filteredIncidents.length === 0 ? (
        <div className="empty-state">
          <p>No incidents found</p>
          {statusFilter === 'open' && (
            <p className="text-muted">Great! All systems are healthy.</p>
          )}
        </div>
      ) : (
        <div className="incidents-list">
          {filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className="incident-card"
              onClick={() => setSelectedIncident(incident)}
              style={{ borderLeftColor: getSeverityColor(incident.severity) }}
            >
              <div className="incident-header">
                <div className="incident-title">
                  <h3>{getTargetName(incident.target_id)} - {getProbeName(incident.probe_id)}</h3>
                  <div className="badges">
                    <span className={`badge ${getStatusBadge(incident.status)}`}>
                      {incident.status.toUpperCase()}
                    </span>
                    <span className="badge badge-severity" style={{ backgroundColor: getSeverityColor(incident.severity) }}>
                      {incident.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="incident-time">
                  {new Date(incident.last_occurrence).toLocaleString('pt-BR')}
                </div>
              </div>

              <div className="incident-message">
                <p>{incident.error_message || 'Target is unreachable'}</p>
              </div>

              <div className="incident-details">
                <span className="detail-item">
                  <strong>First Occurrence:</strong>{' '}
                  {new Date(incident.first_occurrence).toLocaleString()}
                </span>
                {incident.acked_by && (
                  <span className="detail-item">
                    <strong>Acknowledged by:</strong> {incident.acked_by}
                  </span>
                )}
              </div>

              {incident.status === 'open' && (
                <div className="incident-actions">
                  <button
                    className="button button-small button-warning"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAcknowledge(incident.id);
                    }}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Acknowledge'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedIncident && (
        <div className="modal-overlay" onClick={() => setSelectedIncident(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setSelectedIncident(null)}
            >
              ×
            </button>
            <h3>Incident Details</h3>
            <div className="modal-body">
              <p>
                <strong>Target:</strong> {getTargetName(selectedIncident.target_id)}
              </p>
              <p>
                <strong>Probe:</strong> {getProbeName(selectedIncident.probe_id)}
              </p>
              <p>
                <strong>Status:</strong> {selectedIncident.status}
              </p>
              <p>
                <strong>Severity:</strong> {selectedIncident.severity}
              </p>
              <p>
                <strong>Error:</strong> {selectedIncident.error_message}
              </p>
              <p>
                <strong>First Occurrence:</strong>{' '}
                {new Date(selectedIncident.first_occurrence).toLocaleString('pt-BR')}
              </p>
              <p>
                <strong>Last Occurrence:</strong>{' '}
                {new Date(selectedIncident.last_occurrence).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
