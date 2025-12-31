/**
 * Core types for the monitoring application
 */

export interface Target {
  id: number;
  name: string;
  url: string;
  ip_address?: string | null;
  type: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Threshold and detection settings
  latency_threshold?: number; // High latency threshold in ms (default: 30% above average)
  timeout_threshold?: number; // Timeout threshold in ms (default: 1000ms)
  packet_loss_threshold?: number; // Packet loss percentage for down detection (default: 2 packets)
  oscillation_percentage?: number; // Percentage above average for oscillation detection (default: 30%)
}

export interface Location {
  id: number;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Probe {
  id: number;
  name: string;
  location_id: number;
  location?: Location;
  ip_address: string;
  status: 'online' | 'offline' | 'unknown';
  last_seen: string;
  created_at: string;
  updated_at: string;
}

export interface ProbeResult {
  id: number;
  target_id: number;
  probe_id: number;
  up: boolean;
  rtt_ms: number | null;
  status_code?: number;
  error_message?: string;
  timestamp: string;
  created_at: string;
}

export interface Incident {
  id: number;
  target_id: number;
  probe_id: number;
  status: 'open' | 'acknowledged' | 'resolved';
  severity: 'critical' | 'high' | 'medium' | 'low';
  error_message: string;
  first_occurrence: string;
  last_occurrence: string;
  acked_by?: string;
  acked_at?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * WebSocket message types for real-time updates
 */
export interface WSMessage {
  type: 'probe_result' | 'incident' | 'heartbeat';
  target_id: number;
  probe_id: number;
  up: boolean;
  rtt_ms: number | null;
  timestamp: string;
  error_message?: string;
  status_code?: number;
}

export interface WSAcknowledge {
  type: 'ping' | 'pong' | 'subscribe' | 'unsubscribe';
  timestamp: string;
}

/**
 * API Response types
 */
export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface APIError {
  detail: string | { [key: string]: string[] };
}
