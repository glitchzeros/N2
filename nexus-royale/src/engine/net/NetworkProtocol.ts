import { Vector3 } from '@/engine/core/math/Vector3';

export interface NetworkPacket {
  type: string;
  data: any;
  timestamp: number;
  sequence: number;
}

export interface GameStatePacket {
  players: Map<string, any>;
  projectiles: any[];
  gameTime: number;
  gameState: string;
}

export interface PlayerInputPacket {
  playerId: string;
  movement: Vector3;
  look: Vector3;
  buttons: any;
  timestamp: number;
}

export interface PlayerPositionPacket {
  playerId: string;
  position: Vector3;
  rotation: any;
  velocity: Vector3;
  timestamp: number;
}

export interface WeaponFirePacket {
  playerId: string;
  weaponId: string;
  position: Vector3;
  direction: Vector3;
  timestamp: number;
}

/**
 * Network protocol for efficient data serialization
 */
export class NetworkProtocol {
  private sequenceCounter: number = 0;

  /**
   * Encode game state packet
   */
  encodeGameState(gameState: any): NetworkPacket {
    const packet: NetworkPacket = {
      type: 'game_state',
      data: {
        players: this.serializePlayers(gameState.players),
        projectiles: gameState.projectiles || [],
        gameTime: gameState.gameTime || 0,
        gameState: gameState.gameState || 'playing'
      },
      timestamp: Date.now(),
      sequence: this.getNextSequence()
    };

    return packet;
  }

  /**
   * Encode player input packet
   */
  encodePlayerInput(input: any): NetworkPacket {
    const packet: NetworkPacket = {
      type: 'player_input',
      data: {
        playerId: input.playerId,
        movement: this.serializeVector3(input.movement),
        look: this.serializeVector3(input.look),
        buttons: input.buttons || {},
        timestamp: input.timestamp || Date.now()
      },
      timestamp: Date.now(),
      sequence: this.getNextSequence()
    };

    return packet;
  }

  /**
   * Encode player position packet
   */
  encodePlayerPosition(position: Vector3, rotation: any): NetworkPacket {
    const packet: NetworkPacket = {
      type: 'player_position',
      data: {
        playerId: 'local', // Will be set by network manager
        position: this.serializeVector3(position),
        rotation: this.serializeRotation(rotation),
        velocity: this.serializeVector3(new Vector3()), // Will be set by network manager
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      sequence: this.getNextSequence()
    };

    return packet;
  }

  /**
   * Encode weapon fire packet
   */
  encodeWeaponFire(weaponId: string, position: Vector3, direction: Vector3): NetworkPacket {
    const packet: NetworkPacket = {
      type: 'weapon_fire',
      data: {
        playerId: 'local', // Will be set by network manager
        weaponId,
        position: this.serializeVector3(position),
        direction: this.serializeVector3(direction),
        timestamp: Date.now()
      },
      timestamp: Date.now(),
      sequence: this.getNextSequence()
    };

    return packet;
  }

  /**
   * Decode network packet
   */
  decode(data: string | ArrayBuffer): any {
    if (typeof data === 'string') {
      return JSON.parse(data);
    } else {
      // Binary decoding (for future optimization)
      return this.decodeBinary(data);
    }
  }

  /**
   * Serialize players map
   */
  private serializePlayers(players: Map<string, any>): any[] {
    const serialized: any[] = [];
    
    for (const [playerId, player] of players) {
      serialized.push({
        id: playerId,
        position: this.serializeVector3(player.position),
        rotation: this.serializeRotation(player.rotation),
        health: player.health || 100,
        shield: player.shield || 0,
        alive: player.alive !== false
      });
    }

    return serialized;
  }

  /**
   * Serialize Vector3
   */
  private serializeVector3(vector: Vector3): any {
    return {
      x: Math.round(vector.x * 100) / 100, // Round to 2 decimal places
      y: Math.round(vector.y * 100) / 100,
      z: Math.round(vector.z * 100) / 100
    };
  }

  /**
   * Serialize rotation (quaternion or euler)
   */
  private serializeRotation(rotation: any): any {
    if (rotation && typeof rotation === 'object') {
      if (rotation.x !== undefined && rotation.y !== undefined && 
          rotation.z !== undefined && rotation.w !== undefined) {
        // Quaternion
        return {
          x: Math.round(rotation.x * 1000) / 1000,
          y: Math.round(rotation.y * 1000) / 1000,
          z: Math.round(rotation.z * 1000) / 1000,
          w: Math.round(rotation.w * 1000) / 1000
        };
      } else if (rotation.x !== undefined && rotation.y !== undefined && 
                 rotation.z !== undefined) {
        // Euler angles
        return {
          x: Math.round(rotation.x * 100) / 100,
          y: Math.round(rotation.y * 100) / 100,
          z: Math.round(rotation.z * 100) / 100
        };
      }
    }
    
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  /**
   * Deserialize Vector3
   */
  deserializeVector3(data: any): Vector3 {
    return new Vector3(data.x || 0, data.y || 0, data.z || 0);
  }

  /**
   * Deserialize rotation
   */
  deserializeRotation(data: any): any {
    if (data.w !== undefined) {
      // Quaternion
      return {
        x: data.x || 0,
        y: data.y || 0,
        z: data.z || 0,
        w: data.w || 1
      };
    } else {
      // Euler angles
      return {
        x: data.x || 0,
        y: data.y || 0,
        z: data.z || 0
      };
    }
  }

  /**
   * Get next sequence number
   */
  private getNextSequence(): number {
    return ++this.sequenceCounter;
  }

  /**
   * Binary decoding (placeholder for future optimization)
   */
  private decodeBinary(data: ArrayBuffer): any {
    // This would use a more efficient binary protocol
    // For now, we'll stick with JSON for simplicity
    const decoder = new TextDecoder();
    const json = decoder.decode(data);
    return JSON.parse(json);
  }

  /**
   * Binary encoding (placeholder for future optimization)
   */
  encodeBinary(packet: NetworkPacket): ArrayBuffer {
    // This would use a more efficient binary protocol
    // For now, we'll stick with JSON for simplicity
    const json = JSON.stringify(packet);
    const encoder = new TextEncoder();
    return encoder.encode(json).buffer;
  }

  /**
   * Compress packet data
   */
  compress(packet: NetworkPacket): NetworkPacket {
    // Simple compression by removing unnecessary precision
    if (packet.data.position) {
      packet.data.position = this.serializeVector3(packet.data.position);
    }
    
    if (packet.data.rotation) {
      packet.data.rotation = this.serializeRotation(packet.data.rotation);
    }

    return packet;
  }

  /**
   * Decompress packet data
   */
  decompress(packet: NetworkPacket): NetworkPacket {
    // Decompression would restore precision if needed
    return packet;
  }

  /**
   * Validate packet integrity
   */
  validate(packet: NetworkPacket): boolean {
    if (!packet.type || !packet.data || !packet.timestamp) {
      return false;
    }

    // Check for reasonable timestamp (within 5 seconds of now)
    const now = Date.now();
    if (Math.abs(now - packet.timestamp) > 5000) {
      return false;
    }

    return true;
  }

  /**
   * Get packet size estimate
   */
  getPacketSize(packet: NetworkPacket): number {
    return JSON.stringify(packet).length;
  }

  /**
   * Reset sequence counter
   */
  resetSequence(): void {
    this.sequenceCounter = 0;
  }
}