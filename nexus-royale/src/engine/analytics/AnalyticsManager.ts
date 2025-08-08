export interface AnalyticsEvent {
  type: string;
  data: any;
  timestamp: number;
  sessionId: string;
  playerId?: string;
}

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  networkLatency: number;
  renderCalls: number;
  triangles: number;
}

export interface GameplayMetrics {
  sessionDuration: number;
  actionsPerMinute: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  weaponsUsed: string[];
  mapPosition: any;
}

export interface UserMetrics {
  playerId: string;
  skillRating: number;
  totalPlayTime: number;
  sessionsCount: number;
  averageSessionLength: number;
  retentionDay1: boolean;
  retentionDay7: boolean;
  retentionDay30: boolean;
}

/**
 * Comprehensive analytics and telemetry system
 */
export class AnalyticsManager {
  private events: AnalyticsEvent[] = [];
  private sessionId: string;
  private playerId: string | null = null;
  private sessionStartTime: number;
  private performanceMetrics: PerformanceMetrics;
  private gameplayMetrics: GameplayMetrics;
  private userMetrics: UserMetrics | null = null;
  
  private batchSize: number = 50;
  private flushInterval: number = 30000; // 30 seconds
  private lastFlush: number = 0;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.performanceMetrics = this.createEmptyPerformanceMetrics();
    this.gameplayMetrics = this.createEmptyGameplayMetrics();
    this.startPeriodicFlush();
  }

  /**
   * Track performance metrics
   */
  trackPerformance(metrics: Partial<PerformanceMetrics>): void {
    this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
    this.trackEvent('performance_update', this.performanceMetrics);
  }

  /**
   * Track gameplay event
   */
  trackGameplayEvent(type: string, data: any): void {
    this.trackEvent(`gameplay_${type}`, data);
    
    // Update gameplay metrics
    switch (type) {
      case 'kill':
        this.gameplayMetrics.kills++;
        break;
      case 'death':
        this.gameplayMetrics.deaths++;
        break;
      case 'damage_dealt':
        this.gameplayMetrics.damageDealt += data.amount || 0;
        break;
      case 'damage_taken':
        this.gameplayMetrics.damageTaken += data.amount || 0;
        break;
      case 'weapon_used':
        if (data.weaponId && !this.gameplayMetrics.weaponsUsed.includes(data.weaponId)) {
          this.gameplayMetrics.weaponsUsed.push(data.weaponId);
        }
        break;
      case 'position_update':
        this.gameplayMetrics.mapPosition = data.position;
        break;
    }
  }

  /**
   * Track user action
   */
  trackUserAction(action: string, data: any = {}): void {
    this.trackEvent('user_action', { action, ...data });
  }

  /**
   * Track error
   */
  trackError(error: Error, context: any = {}): void {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context
    });
  }

  /**
   * Track session start
   */
  trackSessionStart(): void {
    this.trackEvent('session_start', {
      sessionId: this.sessionId,
      timestamp: this.sessionStartTime
    });
  }

  /**
   * Track session end
   */
  trackSessionEnd(): void {
    const sessionDuration = Date.now() - this.sessionStartTime;
    this.gameplayMetrics.sessionDuration = sessionDuration;
    
    this.trackEvent('session_end', {
      sessionId: this.sessionId,
      duration: sessionDuration,
      finalMetrics: this.gameplayMetrics
    });
    
    this.flushEvents();
  }

  /**
   * Set player ID for user tracking
   */
  setPlayerId(playerId: string): void {
    this.playerId = playerId;
    this.userMetrics = this.createUserMetrics(playerId);
    this.trackEvent('player_identified', { playerId });
  }

  /**
   * Update user metrics
   */
  updateUserMetrics(updates: Partial<UserMetrics>): void {
    if (this.userMetrics) {
      this.userMetrics = { ...this.userMetrics, ...updates };
      this.trackEvent('user_metrics_update', this.userMetrics);
    }
  }

  /**
   * Track custom event
   */
  trackEvent(type: string, data: any): void {
    const event: AnalyticsEvent = {
      type,
      data,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      playerId: this.playerId || undefined
    };

    this.events.push(event);

    // Flush if batch size reached
    if (this.events.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  /**
   * Flush events to server
   */
  private flushEvents(): void {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    // Send to analytics server
    this.sendToServer(eventsToSend);
  }

  /**
   * Send events to analytics server
   */
  private async sendToServer(events: AnalyticsEvent[]): Promise<void> {
    try {
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          events,
          sessionId: this.sessionId,
          playerId: this.playerId,
          timestamp: Date.now()
        })
      });

      if (!response.ok) {
        console.warn('Failed to send analytics:', response.status);
      }
    } catch (error) {
      console.error('Analytics send error:', error);
    }
  }

  /**
   * Start periodic flush
   */
  private startPeriodicFlush(): void {
    setInterval(() => {
      const now = Date.now();
      if (now - this.lastFlush >= this.flushInterval) {
        this.flushEvents();
        this.lastFlush = now;
      }
    }, 10000); // Check every 10 seconds
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create empty performance metrics
   */
  private createEmptyPerformanceMetrics(): PerformanceMetrics {
    return {
      fps: 0,
      frameTime: 0,
      memoryUsage: 0,
      networkLatency: 0,
      renderCalls: 0,
      triangles: 0
    };
  }

  /**
   * Create empty gameplay metrics
   */
  private createEmptyGameplayMetrics(): GameplayMetrics {
    return {
      sessionDuration: 0,
      actionsPerMinute: 0,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      damageTaken: 0,
      weaponsUsed: [],
      mapPosition: null
    };
  }

  /**
   * Create user metrics
   */
  private createUserMetrics(playerId: string): UserMetrics {
    return {
      playerId,
      skillRating: 1000,
      totalPlayTime: 0,
      sessionsCount: 1,
      averageSessionLength: 0,
      retentionDay1: false,
      retentionDay7: false,
      retentionDay30: false
    };
  }

  /**
   * Get analytics statistics
   */
  getStats(): any {
    return {
      sessionId: this.sessionId,
      playerId: this.playerId,
      eventsCount: this.events.length,
      sessionDuration: Date.now() - this.sessionStartTime,
      performance: this.performanceMetrics,
      gameplay: this.gameplayMetrics,
      user: this.userMetrics
    };
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Get player ID
   */
  getPlayerId(): string | null {
    return this.playerId;
  }
}