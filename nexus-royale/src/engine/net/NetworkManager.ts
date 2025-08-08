import { WebRTCConnection } from './WebRTCConnection';
import { WebSocketConnection } from './WebSocketConnection';
import { NetworkProtocol } from './NetworkProtocol';
import { NetworkState } from './NetworkState';
import { Vector3 } from '@/engine/core/math/Vector3';

export interface NetworkConfig {
  serverUrl: string;
  roomId: string;
  playerId: string;
  maxPlayers: number;
  tickRate: number;
  maxLatency: number;
  enableWebRTC: boolean;
  enableWebSocket: boolean;
  iceServers: RTCIceServer[];
}

export interface NetworkStats {
  latency: number;
  packetLoss: number;
  bandwidth: number;
  connections: number;
  state: string;
}

/**
 * Main network manager for multiplayer
 */
export class NetworkManager {
  private config: NetworkConfig;
  private state: NetworkState;
  private protocol: NetworkProtocol;
  private webrtcConnection: WebRTCConnection | null = null;
  private websocketConnection: WebSocketConnection | null = null;
  
  private isConnected: boolean = false;
  private isHost: boolean = false;
  private players: Map<string, any> = new Map();
  private lastUpdateTime: number = 0;
  private updateInterval: number = 0;

  constructor(config: Partial<NetworkConfig> = {}) {
    this.config = {
      serverUrl: 'wss://nexus-royale-server.com',
      roomId: 'default',
      playerId: this.generatePlayerId(),
      maxPlayers: 100,
      tickRate: 60,
      maxLatency: 200,
      enableWebRTC: true,
      enableWebSocket: true,
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      ...config
    };

    this.state = new NetworkState();
    this.protocol = new NetworkProtocol();
    this.updateInterval = 1000 / this.config.tickRate;
  }

  /**
   * Initialize network connections
   */
  async initialize(): Promise<void> {
    try {
      // Initialize WebSocket connection for signaling
      if (this.config.enableWebSocket) {
        this.websocketConnection = new WebSocketConnection(
          this.config.serverUrl,
          this.config.playerId,
          this.config.roomId
        );

        this.websocketConnection.onMessage = (message) => {
          this.handleWebSocketMessage(message);
        };

        this.websocketConnection.onConnect = () => {
          console.log('WebSocket connected');
          this.isConnected = true;
        };

        this.websocketConnection.onDisconnect = () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
        };

        await this.websocketConnection.connect();
      }

      // Initialize WebRTC connection for peer-to-peer
      if (this.config.enableWebRTC) {
        this.webrtcConnection = new WebRTCConnection(
          this.config.playerId,
          this.config.iceServers
        );

        this.webrtcConnection.onDataChannel = (channel) => {
          this.handleDataChannel(channel);
        };

        this.webrtcConnection.onPeerConnected = (peerId) => {
          console.log(`Peer connected: ${peerId}`);
          this.players.set(peerId, { connected: true, lastUpdate: Date.now() });
        };

        this.webrtcConnection.onPeerDisconnected = (peerId) => {
          console.log(`Peer disconnected: ${peerId}`);
          this.players.delete(peerId);
        };
      }

      console.log('Network manager initialized');
    } catch (error) {
      console.error('Failed to initialize network manager:', error);
      throw error;
    }
  }

  /**
   * Update network manager
   */
  update(deltaTime: number): void {
    const currentTime = Date.now();

    // Send periodic updates
    if (currentTime - this.lastUpdateTime >= this.updateInterval) {
      this.sendGameState();
      this.lastUpdateTime = currentTime;
    }

    // Update connections
    if (this.webrtcConnection) {
      this.webrtcConnection.update(deltaTime);
    }

    if (this.websocketConnection) {
      this.websocketConnection.update(deltaTime);
    }

    // Update network state
    this.state.update(deltaTime);
  }

  /**
   * Send game state to all peers
   */
  sendGameState(): void {
    if (!this.isConnected) return;

    const gameState = this.state.getCurrentState();
    const packet = this.protocol.encodeGameState(gameState);

    // Send via WebRTC to peers
    if (this.webrtcConnection) {
      this.webrtcConnection.broadcast(packet);
    }

    // Send via WebSocket to server
    if (this.websocketConnection) {
      this.websocketConnection.send(packet);
    }
  }

  /**
   * Send player input
   */
  sendPlayerInput(input: any): void {
    if (!this.isConnected) return;

    const packet = this.protocol.encodePlayerInput(input);
    
    if (this.webrtcConnection) {
      this.webrtcConnection.broadcast(packet);
    }

    if (this.websocketConnection) {
      this.websocketConnection.send(packet);
    }
  }

  /**
   * Send player position
   */
  sendPlayerPosition(position: Vector3, rotation: any): void {
    if (!this.isConnected) return;

    const packet = this.protocol.encodePlayerPosition(position, rotation);
    
    if (this.webrtcConnection) {
      this.webrtcConnection.broadcast(packet);
    }

    if (this.websocketConnection) {
      this.websocketConnection.send(packet);
    }
  }

  /**
   * Send weapon fire
   */
  sendWeaponFire(weaponId: string, position: Vector3, direction: Vector3): void {
    if (!this.isConnected) return;

    const packet = this.protocol.encodeWeaponFire(weaponId, position, direction);
    
    if (this.webrtcConnection) {
      this.webrtcConnection.broadcast(packet);
    }

    if (this.websocketConnection) {
      this.websocketConnection.send(packet);
    }
  }

  /**
   * Handle WebSocket messages
   */
  private handleWebSocketMessage(message: any): void {
    try {
      const packet = this.protocol.decode(message);
      
      switch (packet.type) {
        case 'game_state':
          this.handleGameState(packet.data);
          break;
        case 'player_joined':
          this.handlePlayerJoined(packet.data);
          break;
        case 'player_left':
          this.handlePlayerLeft(packet.data);
          break;
        case 'webrtc_offer':
          this.handleWebRTCOffer(packet.data);
          break;
        case 'webrtc_answer':
          this.handleWebRTCAnswer(packet.data);
          break;
        case 'ice_candidate':
          this.handleICECandidate(packet.data);
          break;
        default:
          console.warn('Unknown packet type:', packet.type);
      }
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error);
    }
  }

  /**
   * Handle data channel messages
   */
  private handleDataChannel(channel: RTCDataChannel): void {
    channel.onmessage = (event) => {
      try {
        const packet = this.protocol.decode(event.data);
        this.handlePacket(packet);
      } catch (error) {
        console.error('Failed to handle data channel message:', error);
      }
    };
  }

  /**
   * Handle incoming packets
   */
  private handlePacket(packet: any): void {
    switch (packet.type) {
      case 'game_state':
        this.handleGameState(packet.data);
        break;
      case 'player_input':
        this.handlePlayerInput(packet.data);
        break;
      case 'player_position':
        this.handlePlayerPosition(packet.data);
        break;
      case 'weapon_fire':
        this.handleWeaponFire(packet.data);
        break;
      default:
        console.warn('Unknown packet type:', packet.type);
    }
  }

  /**
   * Handle game state update
   */
  private handleGameState(data: any): void {
    this.state.updateFromNetwork(data);
  }

  /**
   * Handle player input
   */
  private handlePlayerInput(data: any): void {
    // Update remote player input
    this.state.updatePlayerInput(data.playerId, data.input);
  }

  /**
   * Handle player position
   */
  private handlePlayerPosition(data: any): void {
    // Update remote player position
    this.state.updatePlayerPosition(data.playerId, data.position, data.rotation);
  }

  /**
   * Handle weapon fire
   */
  private handleWeaponFire(data: any): void {
    // Handle remote weapon fire
    this.state.addWeaponFire(data.playerId, data.weaponId, data.position, data.direction);
  }

  /**
   * Handle player joined
   */
  private handlePlayerJoined(data: any): void {
    console.log(`Player joined: ${data.playerId}`);
    this.players.set(data.playerId, { connected: true, lastUpdate: Date.now() });
  }

  /**
   * Handle player left
   */
  private handlePlayerLeft(data: any): void {
    console.log(`Player left: ${data.playerId}`);
    this.players.delete(data.playerId);
  }

  /**
   * Handle WebRTC offer
   */
  private async handleWebRTCOffer(data: any): Promise<void> {
    if (!this.webrtcConnection) return;

    try {
      const answer = await this.webrtcConnection.handleOffer(data.offer, data.playerId);
      
      if (this.websocketConnection) {
        this.websocketConnection.send({
          type: 'webrtc_answer',
          data: { answer, playerId: data.playerId }
        });
      }
    } catch (error) {
      console.error('Failed to handle WebRTC offer:', error);
    }
  }

  /**
   * Handle WebRTC answer
   */
  private async handleWebRTCAnswer(data: any): Promise<void> {
    if (!this.webrtcConnection) return;

    try {
      await this.webrtcConnection.handleAnswer(data.answer, data.playerId);
    } catch (error) {
      console.error('Failed to handle WebRTC answer:', error);
    }
  }

  /**
   * Handle ICE candidate
   */
  private async handleICECandidate(data: any): Promise<void> {
    if (!this.webrtcConnection) return;

    try {
      await this.webrtcConnection.handleICECandidate(data.candidate, data.playerId);
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error);
    }
  }

  /**
   * Generate unique player ID
   */
  private generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get network statistics
   */
  getStats(): NetworkStats {
    const webrtcStats = this.webrtcConnection?.getStats() || { latency: 0, packetLoss: 0, bandwidth: 0 };
    const websocketStats = this.websocketConnection?.getStats() || { latency: 0, packetLoss: 0, bandwidth: 0 };

    return {
      latency: Math.max(webrtcStats.latency, websocketStats.latency),
      packetLoss: (webrtcStats.packetLoss + websocketStats.packetLoss) / 2,
      bandwidth: webrtcStats.bandwidth + websocketStats.bandwidth,
      connections: this.players.size,
      state: this.isConnected ? 'connected' : 'disconnected'
    };
  }

  /**
   * Get connected players
   */
  getPlayers(): Map<string, any> {
    return new Map(this.players);
  }

  /**
   * Check if connected
   */
  isNetworkConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Check if host
   */
  isNetworkHost(): boolean {
    return this.isHost;
  }

  /**
   * Get network state
   */
  getNetworkState(): NetworkState {
    return this.state;
  }

  /**
   * Disconnect from network
   */
  disconnect(): void {
    if (this.webrtcConnection) {
      this.webrtcConnection.disconnect();
    }

    if (this.websocketConnection) {
      this.websocketConnection.disconnect();
    }

    this.isConnected = false;
    this.players.clear();
  }

  /**
   * Dispose of network resources
   */
  dispose(): void {
    this.disconnect();
  }
}