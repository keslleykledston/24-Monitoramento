import Settings from '../components/Settings';

export default function SettingsPage() {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <h2>Settings</h2>
        <p className="subtitle">Manage targets, probes, and locations</p>
      </div>
      <Settings />
    </div>
  );
}
