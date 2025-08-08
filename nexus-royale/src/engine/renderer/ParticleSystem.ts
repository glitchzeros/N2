import * as THREE from 'three';
import { Vector3 } from '@/engine/core/math/Vector3';
import { Scene } from './Scene';

export interface Particle {
  position: Vector3;
  velocity: Vector3;
  color: THREE.Color;
  size: number;
  life: number;
  maxLife: number;
  mesh: THREE.Mesh;
}

/**
 * Particle system for visual effects
 */
export class ParticleSystem {
  private scene: Scene;
  private particles: Particle[] = [];
  private particlePool: Particle[] = [];
  private maxParticles: number = 1000;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Update particle system
   */
  update(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i];
      
      // Update particle
      particle.life -= deltaTime;
      particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
      particle.velocity.y -= 9.81 * deltaTime; // Gravity
      
      // Update mesh
      particle.mesh.position.copy(particle.position);
      
      // Update size and opacity
      const lifeRatio = particle.life / particle.maxLife;
      particle.mesh.scale.setScalar(particle.size * (1 + (1 - lifeRatio)));
      
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      if (material) {
        material.opacity = lifeRatio;
      }
      
      // Remove dead particles
      if (particle.life <= 0) {
        this.removeParticle(i);
      }
    }
  }

  /**
   * Create explosion effect
   */
  createExplosion(position: Vector3, radius: number, intensity: number = 1): void {
    const particleCount = Math.floor(50 * intensity);
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.createParticle();
      if (!particle) continue;
      
      // Random position within radius
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      particle.position.copy(position);
      particle.position.x += Math.cos(angle) * distance;
      particle.position.z += Math.sin(angle) * distance;
      
      // Random velocity outward
      const velocity = new Vector3(
        Math.cos(angle) * (10 + Math.random() * 20),
        Math.random() * 30,
        Math.sin(angle) * (10 + Math.random() * 20)
      );
      particle.velocity.copy(velocity);
      
      // Random color (fire/explosion)
      const colors = [0xff4400, 0xff6600, 0xff8800, 0xffff00];
      particle.color.setHex(colors[Math.floor(Math.random() * colors.length)]);
      
      // Random size and life
      particle.size = 0.5 + Math.random() * 1.5;
      particle.life = 1 + Math.random() * 2;
      particle.maxLife = particle.life;
      
      // Update mesh
      particle.mesh.position.copy(particle.position);
      particle.mesh.scale.setScalar(particle.size);
      
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      if (material) {
        material.color = particle.color;
        material.opacity = 1;
      }
      
      this.particles.push(particle);
      this.scene.add(particle.mesh);
    }
  }

  /**
   * Create muzzle flash effect
   */
  createMuzzleFlash(position: Vector3, direction: Vector3): void {
    const particleCount = 10;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.createParticle();
      if (!particle) continue;
      
      // Position at muzzle
      particle.position.copy(position);
      particle.position.add(direction.clone().multiplyScalar(1.5));
      
      // Velocity in direction with spread
      const spread = 0.3;
      const velocity = direction.clone().add(new Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
      )).normalize().multiplyScalar(20 + Math.random() * 30);
      particle.velocity.copy(velocity);
      
      // Bright yellow/orange color
      particle.color.setHex(0xffff00);
      
      // Small size, short life
      particle.size = 0.2 + Math.random() * 0.3;
      particle.life = 0.1 + Math.random() * 0.2;
      particle.maxLife = particle.life;
      
      // Update mesh
      particle.mesh.position.copy(particle.position);
      particle.mesh.scale.setScalar(particle.size);
      
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      if (material) {
        material.color = particle.color;
        material.opacity = 1;
      }
      
      this.particles.push(particle);
      this.scene.add(particle.mesh);
    }
  }

  /**
   * Create impact effect
   */
  createImpact(position: Vector3, normal: Vector3, material: string = 'default'): void {
    const particleCount = 15;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.createParticle();
      if (!particle) continue;
      
      // Position at impact point
      particle.position.copy(position);
      
      // Velocity along normal with spread
      const spread = 0.5;
      const velocity = normal.clone().add(new Vector3(
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread,
        (Math.random() - 0.5) * spread
      )).normalize().multiplyScalar(5 + Math.random() * 15);
      particle.velocity.copy(velocity);
      
      // Color based on material
      let color: number;
      switch (material) {
        case 'metal':
          color = 0x888888;
          break;
        case 'wood':
          color = 0x8B4513;
          break;
        case 'stone':
          color = 0x696969;
          break;
        default:
          color = 0x666666;
      }
      particle.color.setHex(color);
      
      // Small size, medium life
      particle.size = 0.1 + Math.random() * 0.2;
      particle.life = 0.5 + Math.random() * 1;
      particle.maxLife = particle.life;
      
      // Update mesh
      particle.mesh.position.copy(particle.position);
      particle.mesh.scale.setScalar(particle.size);
      
      const material = particle.mesh.material as THREE.MeshBasicMaterial;
      if (material) {
        material.color = particle.color;
        material.opacity = 1;
      }
      
      this.particles.push(particle);
      this.scene.add(particle.mesh);
    }
  }

  /**
   * Create particle from pool
   */
  private createParticle(): Particle | null {
    if (this.particles.length >= this.maxParticles) {
      return null;
    }
    
    let particle: Particle;
    
    if (this.particlePool.length > 0) {
      particle = this.particlePool.pop()!;
    } else {
      // Create new particle
      const geometry = new THREE.SphereGeometry(1, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1
      });
      const mesh = new THREE.Mesh(geometry, material);
      
      particle = {
        position: new Vector3(),
        velocity: new Vector3(),
        color: new THREE.Color(),
        size: 1,
        life: 1,
        maxLife: 1,
        mesh
      };
    }
    
    return particle;
  }

  /**
   * Remove particle
   */
  private removeParticle(index: number): void {
    const particle = this.particles[index];
    
    this.scene.remove(particle.mesh);
    this.particles.splice(index, 1);
    this.particlePool.push(particle);
  }

  /**
   * Get particle statistics
   */
  getStats(): any {
    return {
      activeParticles: this.particles.length,
      poolSize: this.particlePool.length,
      maxParticles: this.maxParticles
    };
  }

  /**
   * Dispose of particle system
   */
  dispose(): void {
    // Remove all particles
    for (const particle of this.particles) {
      this.scene.remove(particle.mesh);
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    }
    
    // Dispose pool
    for (const particle of this.particlePool) {
      particle.mesh.geometry.dispose();
      (particle.mesh.material as THREE.Material).dispose();
    }
    
    this.particles.length = 0;
    this.particlePool.length = 0;
  }
}