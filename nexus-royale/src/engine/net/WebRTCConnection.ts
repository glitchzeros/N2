import { Vector3 } from '@/engine/core/math/Vector3';

export interface WebRTCStats {
  latency: number;
  packetLoss: number;
  bandwidth: number;
  peers: number;
}

export interface PeerConnection {
  id: string;
  connection: RTCPeerConnection;
  dataChannel: RTCDataChannel | null;
  lastPing: number;
  lastPong: number;
  latency: number;
}

/**
 * WebRTC peer-to-peer connection manager
 */
export class WebRTCConnection {
  private playerId: string;
  private iceServers: RTCIceServer[];
  private peers: Map<string, PeerConnection> = new Map();
  private dataChannels: Map<string, RTCDataChannel> = new Map();
  
  // Event handlers
  onDataChannel: ((channel: RTCDataChannel) => void) | null = null;
  onPeerConnected: ((peerId: string) => void) | null = null;
  onPeerDisconnected: ((peerId: string) => void) | null = null;
  onMessage: ((peerId: string, data: any) => void) | null = null;

  private pingInterval: number = 1000; // 1 second
  private lastPingTime: number = 0;

  constructor(playerId: string, iceServers: RTCIceServer[] = []) {
    this.playerId = playerId;
    this.iceServers = iceServers;
  }

  /**
   * Create peer connection
   */
  async createPeerConnection(peerId: string): Promise<RTCPeerConnection> {
    const connection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10
    });

    // Create data channel
    const dataChannel = connection.createDataChannel('game', {
      ordered: false,
      maxRetransmits: 1
    });

    this.setupDataChannel(dataChannel, peerId);

    // Handle ICE candidates
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ICE candidate to peer via signaling server
        this.onMessage?.(peerId, {
          type: 'ice_candidate',
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'connected') {
        console.log(`WebRTC connected to peer: ${peerId}`);
        this.onPeerConnected?.(peerId);
      } else if (connection.connectionState === 'disconnected' || 
                 connection.connectionState === 'failed') {
        console.log(`WebRTC disconnected from peer: ${peerId}`);
        this.removePeer(peerId);
        this.onPeerDisconnected?.(peerId);
      }
    };

    // Store peer connection
    this.peers.set(peerId, {
      id: peerId,
      connection,
      dataChannel,
      lastPing: 0,
      lastPong: 0,
      latency: 0
    });

    return connection;
  }

  /**
   * Handle incoming peer connection
   */
  async handleIncomingPeer(peerId: string): Promise<RTCPeerConnection> {
    const connection = new RTCPeerConnection({
      iceServers: this.iceServers,
      iceCandidatePoolSize: 10
    });

    // Handle incoming data channel
    connection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      this.setupDataChannel(dataChannel, peerId);
    };

    // Handle ICE candidates
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onMessage?.(peerId, {
          type: 'ice_candidate',
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    connection.onconnectionstatechange = () => {
      if (connection.connectionState === 'connected') {
        console.log(`WebRTC connected to peer: ${peerId}`);
        this.onPeerConnected?.(peerId);
      } else if (connection.connectionState === 'disconnected' || 
                 connection.connectionState === 'failed') {
        console.log(`WebRTC disconnected from peer: ${peerId}`);
        this.removePeer(peerId);
        this.onPeerDisconnected?.(peerId);
      }
    };

    // Store peer connection
    this.peers.set(peerId, {
      id: peerId,
      connection,
      dataChannel: null,
      lastPing: 0,
      lastPong: 0,
      latency: 0
    });

    return connection;
  }

  /**
   * Setup data channel
   */
  private setupDataChannel(dataChannel: RTCDataChannel, peerId: string): void {
    dataChannel.onopen = () => {
      console.log(`Data channel opened with peer: ${peerId}`);
      this.dataChannels.set(peerId, dataChannel);
      
      // Update peer connection
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.dataChannel = dataChannel;
      }
    };

    dataChannel.onclose = () => {
      console.log(`Data channel closed with peer: ${peerId}`);
      this.dataChannels.delete(peerId);
      
      // Update peer connection
      const peer = this.peers.get(peerId);
      if (peer) {
        peer.dataChannel = null;
      }
    };

    dataChannel.onmessage = (event) => {
      this.handleDataChannelMessage(peerId, event.data);
    };

    dataChannel.onerror = (error) => {
      console.error(`Data channel error with peer ${peerId}:`, error);
    };
  }

  /**
   * Handle data channel message
   */
  private handleDataChannelMessage(peerId: string, data: any): void {
    try {
      // Handle ping/pong for latency measurement
      if (data.type === 'ping') {
        this.sendToPeer(peerId, { type: 'pong', timestamp: data.timestamp });
        return;
      }

      if (data.type === 'pong') {
        const peer = this.peers.get(peerId);
        if (peer) {
          peer.lastPong = Date.now();
          peer.latency = peer.lastPong - data.timestamp;
        }
        return;
      }

      // Forward message to handler
      this.onMessage?.(peerId, data);
    } catch (error) {
      console.error('Failed to handle data channel message:', error);
    }
  }

  /**
   * Handle WebRTC offer
   */
  async handleOffer(offer: RTCSessionDescriptionInit, peerId: string): Promise<RTCSessionDescriptionInit> {
    let peer = this.peers.get(peerId);
    
    if (!peer) {
      const connection = await this.handleIncomingPeer(peerId);
      peer = this.peers.get(peerId)!;
    }

    await peer.connection.setRemoteDescription(offer);
    const answer = await peer.connection.createAnswer();
    await peer.connection.setLocalDescription(answer);

    return answer;
  }

  /**
   * Handle WebRTC answer
   */
  async handleAnswer(answer: RTCSessionDescriptionInit, peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    await peer.connection.setRemoteDescription(answer);
  }

  /**
   * Handle ICE candidate
   */
  async handleICECandidate(candidate: RTCIceCandidateInit, peerId: string): Promise<void> {
    const peer = this.peers.get(peerId);
    if (!peer) {
      throw new Error(`Peer not found: ${peerId}`);
    }

    await peer.connection.addIceCandidate(candidate);
  }

  /**
   * Send data to specific peer
   */
  sendToPeer(peerId: string, data: any): void {
    const dataChannel = this.dataChannels.get(peerId);
    if (dataChannel && dataChannel.readyState === 'open') {
      dataChannel.send(JSON.stringify(data));
    }
  }

  /**
   * Broadcast data to all peers
   */
  broadcast(data: any): void {
    for (const [peerId, dataChannel] of this.dataChannels) {
      if (dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify(data));
      }
    }
  }

  /**
   * Send ping to measure latency
   */
  sendPing(peerId: string): void {
    this.sendToPeer(peerId, {
      type: 'ping',
      timestamp: Date.now()
    });
  }

  /**
   * Update WebRTC connection
   */
  update(deltaTime: number): void {
    const currentTime = Date.now();

    // Send periodic pings
    if (currentTime - this.lastPingTime >= this.pingInterval) {
      for (const peerId of this.peers.keys()) {
        this.sendPing(peerId);
      }
      this.lastPingTime = currentTime;
    }

    // Clean up disconnected peers
    for (const [peerId, peer] of this.peers) {
      if (peer.connection.connectionState === 'failed' || 
          peer.connection.connectionState === 'closed') {
        this.removePeer(peerId);
        this.onPeerDisconnected?.(peerId);
      }
    }
  }

  /**
   * Remove peer connection
   */
  private removePeer(peerId: string): void {
    const peer = this.peers.get(peerId);
    if (peer) {
      if (peer.dataChannel) {
        peer.dataChannel.close();
      }
      peer.connection.close();
    }

    this.peers.delete(peerId);
    this.dataChannels.delete(peerId);
  }

  /**
   * Get WebRTC statistics
   */
  getStats(): WebRTCStats {
    let totalLatency = 0;
    let totalPacketLoss = 0;
    let totalBandwidth = 0;
    let peerCount = 0;

    for (const peer of this.peers.values()) {
      if (peer.connection.connectionState === 'connected') {
        totalLatency += peer.latency;
        peerCount++;
      }
    }

    const avgLatency = peerCount > 0 ? totalLatency / peerCount : 0;

    return {
      latency: avgLatency,
      packetLoss: totalPacketLoss,
      bandwidth: totalBandwidth,
      peers: peerCount
    };
  }

  /**
   * Get peer connections
   */
  getPeers(): Map<string, PeerConnection> {
    return new Map(this.peers);
  }

  /**
   * Check if connected to peer
   */
  isConnectedToPeer(peerId: string): boolean {
    const peer = this.peers.get(peerId);
    return peer?.connection.connectionState === 'connected';
  }

  /**
   * Get peer latency
   */
  getPeerLatency(peerId: string): number {
    const peer = this.peers.get(peerId);
    return peer?.latency || 0;
  }

  /**
   * Disconnect from all peers
   */
  disconnect(): void {
    for (const [peerId, peer] of this.peers) {
      if (peer.dataChannel) {
        peer.dataChannel.close();
      }
      peer.connection.close();
    }

    this.peers.clear();
    this.dataChannels.clear();
  }
}