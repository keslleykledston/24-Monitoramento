import { useState } from 'react';
import type { Target } from '../types';

interface EditTargetModalProps {
  target: Target;
  onClose: () => void;
  onSave: (updatedTarget: Partial<Target>) => Promise<void>;
}

export default function EditTargetModal({ target, onClose, onSave }: EditTargetModalProps) {
  const [name, setName] = useState(target.name);
  const [url, setUrl] = useState(target.url);
  const [ipAddress, setIpAddress] = useState(target.ip_address || '');
  const [type, setType] = useState(target.type || 'https');
  const [isActive, setIsActive] = useState(target.is_active);

  // Threshold settings
  const [latencyThreshold, setLatencyThreshold] = useState(target.latency_threshold || 0);
  const [timeoutThreshold, setTimeoutThreshold] = useState(target.timeout_threshold || 1000);
  const [packetLossThreshold, setPacketLossThreshold] = useState(target.packet_loss_threshold || 2);
  const [oscillationPercentage, setOscillationPercentage] = useState(target.oscillation_percentage || 30);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedData: Partial<Target> = {
        name,
        url,
        ip_address: ipAddress.trim() || null,
        type,
        is_active: isActive,
        latency_threshold: latencyThreshold,
        timeout_threshold: timeoutThreshold,
        packet_loss_threshold: packetLossThreshold,
        oscillation_percentage: oscillationPercentage,
      };
      await onSave(updatedData);
      onClose();
    } catch (error) {
      console.error('Error saving target:', error);
      alert('Failed to save target');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content edit-target-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>

        <h2>Edit Target: {target.name}</h2>

        <div className="modal-body">
          {/* Basic Information */}
          <div className="form-section">
            <h3>Basic Information</h3>

            <div className="form-group">
              <label htmlFor="edit-name">Target Name</label>
              <input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Google"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-url">URL</label>
              <input
                id="edit-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="e.g., https://www.google.com"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-ip">IP Address (optional)</label>
              <input
                id="edit-ip"
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                placeholder="e.g., 8.8.8.8"
                disabled={isSaving}
              />
              <small>Used for ICMP ping monitoring</small>
            </div>

            <div className="form-group">
              <label htmlFor="edit-type">Monitoring Type</label>
              <select
                id="edit-type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                disabled={isSaving}
              >
                <option value="https">HTTPS</option>
                <option value="http">HTTP</option>
                <option value="ping">ICMP Ping</option>
              </select>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={isSaving}
                />
                <span>Active (Enable monitoring)</span>
              </label>
            </div>
          </div>

          {/* Threshold Settings */}
          <div className="form-section">
            <h3>Detection Thresholds</h3>
            <p className="section-description">
              Configure when to trigger alerts and detect issues
            </p>

            <div className="form-group">
              <label htmlFor="edit-latency-threshold">
                High Latency Threshold (ms)
              </label>
              <input
                id="edit-latency-threshold"
                type="number"
                min="0"
                value={latencyThreshold}
                onChange={(e) => setLatencyThreshold(Number(e.target.value))}
                placeholder="0 = auto (30% above average)"
                disabled={isSaving}
              />
              <small>
                Set to 0 for automatic detection (30% above average).
                Custom value overrides automatic detection.
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="edit-timeout-threshold">
                Timeout Threshold (ms)
              </label>
              <input
                id="edit-timeout-threshold"
                type="number"
                min="100"
                max="10000"
                value={timeoutThreshold}
                onChange={(e) => setTimeoutThreshold(Number(e.target.value))}
                placeholder="1000"
                disabled={isSaving}
              />
              <small>
                Latency above this value is considered packet loss (down). Default: 1000ms
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="edit-packet-loss">
                Packet Loss Threshold
              </label>
              <input
                id="edit-packet-loss"
                type="number"
                min="1"
                max="10"
                value={packetLossThreshold}
                onChange={(e) => setPacketLossThreshold(Number(e.target.value))}
                placeholder="2"
                disabled={isSaving}
              />
              <small>
                Number of consecutive lost packets to consider target down. Default: 2
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="edit-oscillation">
                Oscillation Detection (%)
              </label>
              <input
                id="edit-oscillation"
                type="number"
                min="10"
                max="100"
                value={oscillationPercentage}
                onChange={(e) => setOscillationPercentage(Number(e.target.value))}
                placeholder="30"
                disabled={isSaving}
              />
              <small>
                Percentage above average latency to trigger oscillation warning. Default: 30%
              </small>
            </div>
          </div>

          {/* Detection Logic Summary */}
          <div className="detection-summary">
            <h4>Detection Logic Summary</h4>
            <ul>
              <li>
                <strong>Down:</strong> ICMP ping with {packetLossThreshold}+ consecutive packet losses OR latency &gt; {timeoutThreshold}ms
              </li>
              <li>
                <strong>Degraded:</strong> Latency &gt; {oscillationPercentage}% above current average
              </li>
              <li>
                <strong>High Latency:</strong> {latencyThreshold > 0 ? `${latencyThreshold}ms` : '30% above average (auto)'}
              </li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="button button-primary"
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !url.trim()}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            className="button"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>

        <style>{`
          .edit-target-modal {
            max-width: 700px;
            max-height: 90vh;
            overflow-y: auto;
          }

          .form-section {
            margin-bottom: 2rem;
            padding-bottom: 2rem;
            border-bottom: 1px solid var(--border-color);
          }

          .form-section:last-of-type {
            border-bottom: none;
          }

          .form-section h3 {
            margin: 0 0 0.5rem 0;
            color: var(--text-color);
            font-size: 1.1rem;
          }

          .section-description {
            margin: 0 0 1rem 0;
            color: var(--text-light);
            font-size: 0.875rem;
          }

          .form-group {
            margin-bottom: 1.25rem;
          }

          .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--text-color);
            font-size: 0.9rem;
          }

          .form-group small {
            display: block;
            margin-top: 0.25rem;
            color: var(--text-light);
            font-size: 0.8rem;
            font-style: italic;
          }

          .form-group input[type="number"],
          .form-group input[type="text"],
          .form-group select {
            width: 100%;
          }

          .checkbox-label {
            display: flex !important;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            margin: 0 !important;
          }

          .checkbox-label input[type="checkbox"] {
            width: auto;
            margin: 0;
            cursor: pointer;
          }

          .checkbox-label span {
            font-weight: 500;
            color: var(--text-color);
          }

          .detection-summary {
            background-color: var(--bg-tertiary);
            padding: 1rem;
            border-radius: 6px;
            border-left: 4px solid var(--primary-color);
          }

          .detection-summary h4 {
            margin: 0 0 0.75rem 0;
            color: var(--text-color);
            font-size: 1rem;
          }

          .detection-summary ul {
            margin: 0;
            padding-left: 1.5rem;
          }

          .detection-summary li {
            margin-bottom: 0.5rem;
            color: var(--text-color);
            font-size: 0.875rem;
          }

          .detection-summary li:last-child {
            margin-bottom: 0;
          }

          .modal-footer {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 2rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--border-color);
          }

          @media (max-width: 768px) {
            .edit-target-modal {
              max-width: 95%;
              padding: 1.5rem;
            }

            .modal-footer {
              flex-direction: column-reverse;
            }

            .modal-footer button {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
