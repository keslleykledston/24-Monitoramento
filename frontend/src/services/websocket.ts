import type { WSMessage } from '../types';

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 3000;
  private messageHandlers: Set<(message: WSMessage) => void> = new Set();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = import.meta.env.VITE_WS_URL;

    if (wsUrl) {
      try {
        const parsedUrl = new URL(wsUrl);
        if (!parsedUrl.pathname || parsedUrl.pathname === '/') {
          parsedUrl.pathname = '/ws/live';
        }
        this.url = parsedUrl.toString();
      } catch {
        this.url = wsUrl;
      }
    } else {
      const host = import.meta.env.VITE_API_URL || `http://localhost:8000`;
      const baseUrl = host.replace(/^https?:\/\//, '');
      this.url = `${protocol}//${baseUrl}/ws/live`;
    }
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[WebSocket] Connecting to: ${this.url}`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.setupHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WSMessage = JSON.parse(event.data);
            this.notifyHandlers(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.clearHeartbeat();
          this.attemptReconnect();
        };
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.clearHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to WebSocket messages
   */
  public subscribe(handler: (message: WSMessage) => void): () => void {
    this.messageHandlers.add(handler);

    // Return unsubscribe function
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  /**
   * Send message to WebSocket server
   */
  public send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(data));
      } catch (error) {
        console.error('Failed to send WebSocket message:', error);
      }
    }
  }

  /**
   * Get connection status
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Setup heartbeat to keep connection alive
   */
  private setupHeartbeat(): void {
    this.clearHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping', timestamp: new Date().toISOString() });
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  /**
   * Clear heartbeat interval
   */
  private clearHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

      setTimeout(() => {
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error);
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Notify all subscribers of a new message
   */
  private notifyHandlers(message: WSMessage): void {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
