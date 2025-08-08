export interface WebSocketStats {
  latency: number;
  packetLoss: number;
  bandwidth: number;
  connected: boolean;
}

export interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: number;
}

/**
 * WebSocket connection for server communication
 */
export class WebSocketConnection {
  private url: string;
  private playerId: string;
  private roomId: string;
  private socket: WebSocket | null = null;
  
  // Event handlers
  onConnect: (() => void) | null = null;
  onDisconnect: (() => void) | null = null;
  onMessage: ((message: any) => void) | null = null;
  onError: ((error: Event) => void) | null = null;

  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;
  private lastPingTime: number = 0;
  private lastPongTime: number = 0;
  private pingInterval: number = 30000; // 30 seconds

  constructor(url: string, playerId: string, roomId: string) {
    this.url = url;
    this.playerId = playerId;
    this.roomId = roomId;
  }

  /**
   * Connect to WebSocket server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = new WebSocket(this.url);

        this.socket.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Send join room message
          this.send({
            type: 'join_room',
            data: {
              playerId: this.playerId,
              roomId: this.roomId
            }
          });

          this.onConnect?.();
          resolve();
        };

        this.socket.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.onDisconnect?.();
          
          // Attempt to reconnect
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect().catch(console.error);
            }, this.reconnectDelay * this.reconnectAttempts);
          }
        };

        this.socket.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.onError?.(error);
          reject(error);
        };

        this.socket.onmessage = (event) => {
          this.handleMessage(event.data);
        };

      } catch (error) {
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Send message to server
   */
  send(message: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, cannot send message');
      return;
    }

    const packet: WebSocketMessage = {
      type: message.type,
      data: message.data,
      timestamp: Date.now()
    };

    this.socket.send(JSON.stringify(packet));
  }

  /**
   * Send ping to measure latency
   */
  sendPing(): void {
    this.send({
      type: 'ping',
      data: { timestamp: Date.now() }
    });
  }

  /**
   * Handle incoming message
   */
  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);
      
      // Handle ping/pong for latency measurement
      if (message.type === 'ping') {
        this.send({
          type: 'pong',
          data: { timestamp: message.data.timestamp }
        });
        return;
      }

      if (message.type === 'pong') {
        this.lastPongTime = Date.now();
        return;
      }

      // Forward message to handler
      this.onMessage?.(message);
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Update WebSocket connection
   */
  update(deltaTime: number): void {
    const currentTime = Date.now();

    // Send periodic pings
    if (currentTime - this.lastPingTime >= this.pingInterval) {
      this.sendPing();
      this.lastPingTime = currentTime;
    }
  }

  /**
   * Get WebSocket statistics
   */
  getStats(): WebSocketStats {
    const latency = this.lastPongTime > 0 ? this.lastPongTime - this.lastPingTime : 0;
    
    return {
      latency,
      packetLoss: 0, // WebSocket doesn't provide packet loss info
      bandwidth: 0,  // WebSocket doesn't provide bandwidth info
      connected: this.socket?.readyState === WebSocket.OPEN
    };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getConnectionState(): string {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'closed';
      default:
        return 'unknown';
    }
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnect');
      this.socket = null;
    }
  }

  /**
   * Set reconnect settings
   */
  setReconnectSettings(maxAttempts: number, delay: number): void {
    this.maxReconnectAttempts = maxAttempts;
    this.reconnectDelay = delay;
  }

  /**
   * Set ping interval
   */
  setPingInterval(interval: number): void {
    this.pingInterval = interval;
  }
}