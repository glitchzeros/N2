import { WebSocketServer, WebSocket } from 'ws';
import { NetworkProtocol } from '@/engine/net/NetworkProtocol';
import { Vector3 } from '@/engine/core/math/Vector3';

export interface GameRoom {
  id: string;
  players: Map<string, PlayerSession>;
  gameState: string;
  maxPlayers: number;
  createdAt: number;
  lastUpdate: number;
}

export interface PlayerSession {
  id: string;
  ws: WebSocket;
  roomId: string;
  playerData: any;
  lastPing: number;
  connected: boolean;
}

export interface MatchmakingQueue {
  playerId: string;
  skillRating: number;
  preferences: any;
  timestamp: number;
}

/**
 * Complete game server for matchmaking and multiplayer
 */
export class GameServer {
  private wss: WebSocketServer;
  private rooms: Map<string, GameRoom> = new Map();
  private players: Map<string, PlayerSession> = new Map();
  private matchmakingQueue: MatchmakingQueue[] = [];
  private protocol: NetworkProtocol;
  
  private tickRate: number = 60;
  private tickInterval: number = 1000 / this.tickRate;
  private lastTick: number = 0;

  constructor(port: number = 8080) {
    this.wss = new WebSocketServer({ port });
    this.protocol = new NetworkProtocol();
    this.setupWebSocketServer();
    this.startGameLoop();
  }

  /**
   * Setup WebSocket server
   */
  private setupWebSocketServer(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected');
      
      ws.on('message', (data: Buffer) => {
        this.handleMessage(ws, data);
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.handleDisconnect(ws);
      });
    });

    console.log(`Game server started on port ${this.wss.options.port}`);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(ws: WebSocket, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'join_room':
          this.handleJoinRoom(ws, message.data);
          break;
        case 'leave_room':
          this.handleLeaveRoom(ws, message.data);
          break;
        case 'game_state':
          this.handleGameState(ws, message.data);
          break;
        case 'player_input':
          this.handlePlayerInput(ws, message.data);
          break;
        case 'weapon_fire':
          this.handleWeaponFire(ws, message.data);
          break;
        case 'ping':
          this.handlePing(ws, message.data);
          break;
        case 'matchmaking_request':
          this.handleMatchmakingRequest(ws, message.data);
          break;
        default:
          console.warn('Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to handle message:', error);
    }
  }

  /**
   * Handle join room request
   */
  private handleJoinRoom(ws: WebSocket, data: any): void {
    const { playerId, roomId } = data;
    
    // Create room if it doesn't exist
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, {
        id: roomId,
        players: new Map(),
        gameState: 'waiting',
        maxPlayers: 100,
        createdAt: Date.now(),
        lastUpdate: Date.now()
      });
    }

    const room = this.rooms.get(roomId)!;
    
    // Check if room is full
    if (room.players.size >= room.maxPlayers) {
      ws.send(JSON.stringify({
        type: 'error',
        data: { message: 'Room is full' }
      }));
      return;
    }

    // Create player session
    const playerSession: PlayerSession = {
      id: playerId,
      ws,
      roomId,
      playerData: { position: new Vector3(), health: 100, alive: true },
      lastPing: Date.now(),
      connected: true
    };

    // Add player to room
    room.players.set(playerId, playerSession);
    this.players.set(playerId, playerSession);

    // Notify other players
    this.broadcastToRoom(roomId, {
      type: 'player_joined',
      data: { playerId, playerData: playerSession.playerData }
    }, playerId);

    // Send room state to new player
    ws.send(JSON.stringify({
      type: 'room_state',
      data: {
        roomId,
        players: Array.from(room.players.entries()).map(([id, session]) => ({
          id,
          playerData: session.playerData
        })),
        gameState: room.gameState
      }
    }));

    console.log(`Player ${playerId} joined room ${roomId}`);
  }

  /**
   * Handle leave room request
   */
  private handleLeaveRoom(ws: WebSocket, data: any): void {
    const { playerId } = data;
    const player = this.players.get(playerId);
    
    if (player) {
      const room = this.rooms.get(player.roomId);
      if (room) {
        room.players.delete(playerId);
        
        // Notify other players
        this.broadcastToRoom(player.roomId, {
          type: 'player_left',
          data: { playerId }
        });

        // Remove empty rooms
        if (room.players.size === 0) {
          this.rooms.delete(player.roomId);
        }
      }
      
      this.players.delete(playerId);
      console.log(`Player ${playerId} left room`);
    }
  }

  /**
   * Handle game state update
   */
  private handleGameState(ws: WebSocket, data: any): void {
    const { playerId, gameState } = data;
    const player = this.players.get(playerId);
    
    if (player) {
      const room = this.rooms.get(player.roomId);
      if (room) {
        // Update room game state
        room.gameState = gameState;
        room.lastUpdate = Date.now();
        
        // Broadcast to other players in room
        this.broadcastToRoom(player.roomId, {
          type: 'game_state',
          data: { playerId, gameState }
        }, playerId);
      }
    }
  }

  /**
   * Handle player input
   */
  private handlePlayerInput(ws: WebSocket, data: any): void {
    const { playerId, input } = data;
    const player = this.players.get(playerId);
    
    if (player) {
      // Broadcast input to other players in room
      this.broadcastToRoom(player.roomId, {
        type: 'player_input',
        data: { playerId, input }
      }, playerId);
    }
  }

  /**
   * Handle weapon fire
   */
  private handleWeaponFire(ws: WebSocket, data: any): void {
    const { playerId, weaponId, position, direction } = data;
    const player = this.players.get(playerId);
    
    if (player) {
      // Broadcast weapon fire to other players in room
      this.broadcastToRoom(player.roomId, {
        type: 'weapon_fire',
        data: { playerId, weaponId, position, direction }
      }, playerId);
    }
  }

  /**
   * Handle ping
   */
  private handlePing(ws: WebSocket, data: any): void {
    const { playerId, timestamp } = data;
    const player = this.players.get(playerId);
    
    if (player) {
      player.lastPing = Date.now();
      
      // Send pong response
      ws.send(JSON.stringify({
        type: 'pong',
        data: { timestamp }
      }));
    }
  }

  /**
   * Handle matchmaking request
   */
  private handleMatchmakingRequest(ws: WebSocket, data: any): void {
    const { playerId, skillRating, preferences } = data;
    
    // Add to matchmaking queue
    this.matchmakingQueue.push({
      playerId,
      skillRating: skillRating || 1000,
      preferences: preferences || {},
      timestamp: Date.now()
    });

    // Try to find a match
    this.processMatchmaking();
  }

  /**
   * Process matchmaking queue
   */
  private processMatchmaking(): void {
    if (this.matchmakingQueue.length < 2) return;

    // Sort by skill rating
    this.matchmakingQueue.sort((a, b) => Math.abs(a.skillRating - b.skillRating));

    // Find players with similar skill ratings
    for (let i = 0; i < this.matchmakingQueue.length - 1; i++) {
      const player1 = this.matchmakingQueue[i];
      const player2 = this.matchmakingQueue[i + 1];
      
      const skillDiff = Math.abs(player1.skillRating - player2.skillRating);
      const timeDiff = Date.now() - Math.min(player1.timestamp, player2.timestamp);
      
      // Match if skill difference is small or waiting time is long
      if (skillDiff < 200 || timeDiff > 30000) {
        this.createMatch(player1, player2);
        
        // Remove matched players from queue
        this.matchmakingQueue.splice(i, 2);
        break;
      }
    }
  }

  /**
   * Create a match for two players
   */
  private createMatch(player1: MatchmakingQueue, player2: MatchmakingQueue): void {
    const roomId = `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create new room
    const room: GameRoom = {
      id: roomId,
      players: new Map(),
      gameState: 'starting',
      maxPlayers: 100,
      createdAt: Date.now(),
      lastUpdate: Date.now()
    };

    this.rooms.set(roomId, room);

    // Notify players about match
    const player1Session = this.players.get(player1.playerId);
    const player2Session = this.players.get(player2.playerId);

    if (player1Session) {
      player1Session.ws.send(JSON.stringify({
        type: 'match_found',
        data: { roomId, opponent: player2.playerId }
      }));
    }

    if (player2Session) {
      player2Session.ws.send(JSON.stringify({
        type: 'match_found',
        data: { roomId, opponent: player1.playerId }
      }));
    }

    console.log(`Match created: ${player1.playerId} vs ${player2.playerId} in room ${roomId}`);
  }

  /**
   * Broadcast message to all players in a room
   */
  private broadcastToRoom(roomId: string, message: any, excludePlayerId?: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const [playerId, session] of room.players) {
      if (playerId !== excludePlayerId && session.connected) {
        session.ws.send(JSON.stringify(message));
      }
    }
  }

  /**
   * Handle player disconnect
   */
  private handleDisconnect(ws: WebSocket): void {
    // Find player by WebSocket
    for (const [playerId, player] of this.players) {
      if (player.ws === ws) {
        this.handleLeaveRoom(ws, { playerId });
        break;
      }
    }
  }

  /**
   * Start game loop
   */
  private startGameLoop(): void {
    setInterval(() => {
      this.update();
    }, this.tickInterval);
  }

  /**
   * Update game server
   */
  private update(): void {
    const currentTime = Date.now();
    
    // Update rooms
    for (const [roomId, room] of this.rooms) {
      // Check for inactive players
      for (const [playerId, player] of room.players) {
        if (currentTime - player.lastPing > 10000) { // 10 second timeout
          player.connected = false;
          this.handleLeaveRoom(player.ws, { playerId });
        }
      }

      // Update room state
      room.lastUpdate = currentTime;
    }

    // Clean up old matchmaking entries
    this.matchmakingQueue = this.matchmakingQueue.filter(
      entry => currentTime - entry.timestamp < 60000 // 1 minute timeout
    );

    this.lastTick = currentTime;
  }

  /**
   * Get server statistics
   */
  getStats(): any {
    return {
      rooms: this.rooms.size,
      players: this.players.size,
      matchmakingQueue: this.matchmakingQueue.length,
      uptime: Date.now() - this.lastTick,
      tickRate: this.tickRate
    };
  }

  /**
   * Shutdown server
   */
  shutdown(): void {
    this.wss.close();
    console.log('Game server shutdown');
  }
}