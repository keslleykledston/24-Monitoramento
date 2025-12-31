import { useState, useEffect } from 'react';
import { useMonitoring } from '../contexts/MonitoringContext';
import { targets as targetsAPI } from '../services/api';
import type { Target } from '../types';
import EditTargetModal from './EditTargetModal';

export default function Settings() {
    const { targetList, loadData } = useMonitoring();
    const [targets, setTargets] = useState<Target[]>([]);
    const [newTargetName, setNewTargetName] = useState('');
    const [newTargetUrl, setNewTargetUrl] = useState('');
    const [newTargetIp, setNewTargetIp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingTarget, setEditingTarget] = useState<Target | null>(null);

    useEffect(() => {
        setTargets(targetList);
    }, [targetList]);

    const addTarget = async () => {
        if (!newTargetName.trim() || !newTargetUrl.trim()) {
            alert('Please fill in all fields');
            return;
        }

        setIsLoading(true);
        try {
            const payload = {
                name: newTargetName,
                url: newTargetUrl,
                ...(newTargetIp.trim() ? { ip_address: newTargetIp.trim() } : {}),
            };
            const newTarget = await targetsAPI.create(payload);
            setTargets([...targets, newTarget]);
            setNewTargetName('');
            setNewTargetUrl('');
            setNewTargetIp('');
            loadData(); // Refresh data
        } catch (error) {
            console.error('Error adding target:', error);
            alert('Failed to add target');
        } finally {
            setIsLoading(false);
        }
    };

    const removeTarget = async (id: number) => {
        if (!confirm('Are you sure you want to delete this target?')) {
            return;
        }

        setIsLoading(true);
        try {
            await targetsAPI.delete(id);
            setTargets(targets.filter((target) => target.id !== id));
            loadData(); // Refresh data
        } catch (error) {
            console.error('Error removing target:', error);
            alert('Failed to delete target');
        } finally {
            setIsLoading(false);
        }
    };

    const updateTarget = async (id: number, updatedData: Partial<Target>) => {
        try {
            const updated = await targetsAPI.update(id, updatedData);
            setTargets(targets.map((t) => (t.id === id ? updated : t)));
            loadData(); // Refresh data
        } catch (error) {
            console.error('Error updating target:', error);
            throw error;
        }
    };

    return (
        <>
            {editingTarget && (
                <EditTargetModal
                    target={editingTarget}
                    onClose={() => setEditingTarget(null)}
                    onSave={(updatedData) => updateTarget(editingTarget.id, updatedData)}
                />
            )}
            <div className="settings-container">
            <div className="settings-section">
                <h3>Add New Target</h3>
                <div className="add-target-form">
                    <div className="form-group">
                        <label htmlFor="target-name">Target Name</label>
                        <input
                            id="target-name"
                            type="text"
                            value={newTargetName}
                            onChange={(e) => setNewTargetName(e.target.value)}
                            placeholder="e.g., Google"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="target-url">Target URL</label>
                        <input
                            id="target-url"
                            type="text"
                            value={newTargetUrl}
                            onChange={(e) => setNewTargetUrl(e.target.value)}
                            placeholder="e.g., https://www.google.com"
                            disabled={isLoading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="target-ip">Target IP (optional)</label>
                        <input
                            id="target-ip"
                            type="text"
                            value={newTargetIp}
                            onChange={(e) => setNewTargetIp(e.target.value)}
                            placeholder="e.g., 186.192.83.12"
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        className="button button-primary button-small"
                        onClick={addTarget}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Adding...' : 'Add Target'}
                    </button>
                </div>
            </div>

            <div className="settings-section">
                <h3>Manage Targets</h3>
                {targets.length === 0 ? (
                    <p>No targets configured yet.</p>
                ) : (
                    <div className="targets-table">
                        <div className="table-header">
                            <div className="table-cell">Name</div>
                            <div className="table-cell">URL</div>
                            <div className="table-cell">IP</div>
                            <div className="table-cell">Type</div>
                            <div className="table-cell">Status</div>
                            <div className="table-cell">Actions</div>
                        </div>
                        {targets.map((target) => (
                            <div key={target.id} className="table-row">
                                <div className="table-cell">{target.name}</div>
                                <div className="table-cell">{target.url}</div>
                                <div className="table-cell">{target.ip_address || '—'}</div>
                                <div className="table-cell">
                                    <span
                                        className="badge"
                                        style={{
                                            backgroundColor: '#3498db',
                                            color: 'white',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '12px',
                                            fontSize: '0.7rem',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {target.type || 'https'}
                                    </span>
                                </div>
                                <div className="table-cell">
                                    <span
                                        className="badge"
                                        style={{
                                            backgroundColor: target.is_active
                                                ? '#27ae60'
                                                : '#95a5a6',
                                            color: 'white',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '20px',
                                            fontSize: '0.75rem',
                                        }}
                                    >
                                        {target.is_active ? 'ACTIVE' : 'INACTIVE'}
                                    </span>
                                </div>
                                <div className="table-cell actions-cell">
                                    <button
                                        className="button button-primary button-small"
                                        onClick={() => setEditingTarget(target)}
                                        disabled={isLoading}
                                        style={{ marginRight: '0.5rem' }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="button button-danger button-small"
                                        onClick={() => removeTarget(target.id)}
                                        disabled={isLoading}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .settings-container {
                    background: var(--bg-primary);
                    border-radius: 8px;
                    box-shadow: var(--shadow);
                    overflow: hidden;
                    transition: background-color 0.3s ease;
                }

                .settings-section {
                    padding: 1.5rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .settings-section:last-child {
                    border-bottom: none;
                }

                .settings-section h3 {
                    margin-top: 0;
                    margin-bottom: 1rem;
                    color: var(--text-color);
                }

                .add-target-form {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr auto;
                    gap: 1rem;
                    align-items: flex-end;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                }

                .form-group label {
                    margin-bottom: 0.5rem;
                    font-weight: 500;
                    color: var(--text-color);
                }

                .targets-table {
                    border: 1px solid var(--border-color);
                    border-radius: 4px;
                    overflow: hidden;
                }

                .table-header {
                    display: grid;
                    grid-template-columns: 1fr 2fr 1fr 80px 100px 180px;
                    background-color: var(--bg-tertiary);
                    font-weight: 600;
                    border-bottom: 1px solid var(--border-color);
                    color: var(--text-color);
                }

                .table-row {
                    display: grid;
                    grid-template-columns: 1fr 2fr 1fr 80px 100px 180px;
                    border-bottom: 1px solid var(--border-color);
                    align-items: center;
                    color: var(--text-color);
                }

                .actions-cell {
                    display: flex;
                    gap: 0.5rem;
                    align-items: center;
                }

                .table-row:last-child {
                    border-bottom: none;
                }

                .table-cell {
                    padding: 1rem;
                }

                @media (max-width: 768px) {
                    .add-target-form {
                        grid-template-columns: 1fr;
                    }

                    .table-header,
                    .table-row {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
        </>
    );
}
