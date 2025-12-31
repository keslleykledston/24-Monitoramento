import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { MonitoringProvider } from './contexts/MonitoringContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import Incidents from './pages/Incidents';
import LatencyMonitor from './pages/LatencyMonitor';
import History from './pages/History';
import './styles/global.css';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const username = localStorage.getItem('username');
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  return (
    <>
      <div className="header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Multi-Location Monitoring</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <span>Welcome, {username}</span>
            <button
              onClick={toggleTheme}
              className="button button-small"
              style={{ fontSize: 12 }}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <button onClick={handleLogout} className="button button-small" style={{ fontSize: 12 }}>
              Logout
            </button>
          </div>
        </div>
        <nav className="nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/latency">Latency Monitor</Link>
          <Link to="/history">History</Link>
          <Link to="/incidents">Incidents</Link>
          <Link to="/settings">Settings</Link>
        </nav>
      </div>
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <MonitoringProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/incidents"
              element={
                <PrivateRoute>
                  <Layout>
                    <Incidents />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/latency"
              element={
                <PrivateRoute>
                  <Layout>
                    <LatencyMonitor />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route
              path="/history"
              element={
                <PrivateRoute>
                  <Layout>
                    <History />
                  </Layout>
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/settings" element={<PrivateRoute><Layout><SettingsPage /></Layout></PrivateRoute>} />
          </Routes>
        </MonitoringProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
