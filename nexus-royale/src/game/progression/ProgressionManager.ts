export interface ProgressionData {
  playerId: string;
  level: number;
  experience: number;
  experienceToNext: number;
  totalPlayTime: number;
  matchesPlayed: number;
  matchesWon: number;
  kills: number;
  deaths: number;
  damageDealt: number;
  damageTaken: number;
  weaponsUsed: string[];
  achievements: Achievement[];
  unlocks: Unlock[];
  skillRating: number;
  rank: string;
  season: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress: number;
  maxProgress: number;
  category: 'combat' | 'survival' | 'exploration' | 'social' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface Unlock {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'weapon_skin' | 'character_skin' | 'emote' | 'banner' | 'title';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlocked: boolean;
  unlockedAt?: number;
  unlockMethod: 'level' | 'achievement' | 'challenge' | 'purchase';
  unlockRequirement: any;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: 'daily' | 'weekly' | 'seasonal';
  progress: number;
  maxProgress: number;
  completed: boolean;
  completedAt?: number;
  reward: {
    type: 'experience' | 'unlock' | 'currency';
    amount: number;
    itemId?: string;
  };
  expiresAt: number;
}

/**
 * Complete progression and unlocks system
 */
export class ProgressionManager {
  private progression: ProgressionData;
  private challenges: Challenge[] = [];
  private achievements: Map<string, Achievement> = new Map();
  private unlocks: Map<string, Unlock> = new Map();
  
  private onLevelUp: ((newLevel: number) => void) | null = null;
  private onAchievementUnlocked: ((achievement: Achievement) => void) | null = null;
  private onUnlockUnlocked: ((unlock: Unlock) => void) | null = null;
  private onChallengeCompleted: ((challenge: Challenge) => void) | null = null;

  constructor(playerId: string) {
    this.progression = this.createInitialProgression(playerId);
    this.initializeAchievements();
    this.initializeUnlocks();
    this.generateChallenges();
    this.loadProgression();
  }

  /**
   * Create initial progression data
   */
  private createInitialProgression(playerId: string): ProgressionData {
    return {
      playerId,
      level: 1,
      experience: 0,
      experienceToNext: 100,
      totalPlayTime: 0,
      matchesPlayed: 0,
      matchesWon: 0,
      kills: 0,
      deaths: 0,
      damageDealt: 0,
      damageTaken: 0,
      weaponsUsed: [],
      achievements: [],
      unlocks: [],
      skillRating: 1000,
      rank: 'Bronze',
      season: 1
    };
  }

  /**
   * Initialize achievements
   */
  private initializeAchievements(): void {
    const achievementList: Achievement[] = [
      {
        id: 'first_blood',
        name: 'First Blood',
        description: 'Get your first kill',
        icon: '🔴',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        category: 'combat',
        rarity: 'common'
      },
      {
        id: 'survivor',
        name: 'Survivor',
        description: 'Win your first match',
        icon: '🏆',
        unlocked: false,
        progress: 0,
        maxProgress: 1,
        category: 'survival',
        rarity: 'rare'
      },
      {
        id: 'sharpshooter',
        name: 'Sharpshooter',
        description: 'Get 10 kills in a single match',
        icon: '🎯',
        unlocked: false,
        progress: 0,
        maxProgress: 10,
        category: 'combat',
        rarity: 'epic'
      },
      {
        id: 'veteran',
        name: 'Veteran',
        description: 'Play 100 matches',
        icon: '⚔️',
        unlocked: false,
        progress: 0,
        maxProgress: 100,
        category: 'survival',
        rarity: 'rare'
      },
      {
        id: 'weapon_master',
        name: 'Weapon Master',
        description: 'Use all weapon types',
        icon: '🔫',
        unlocked: false,
        progress: 0,
        maxProgress: 5,
        category: 'combat',
        rarity: 'epic'
      },
      {
        id: 'legend',
        name: 'Legend',
        description: 'Reach level 50',
        icon: '👑',
        unlocked: false,
        progress: 0,
        maxProgress: 50,
        category: 'special',
        rarity: 'legendary'
      }
    ];

    for (const achievement of achievementList) {
      this.achievements.set(achievement.id, achievement);
    }
  }

  /**
   * Initialize unlocks
   */
  private initializeUnlocks(): void {
    const unlockList: Unlock[] = [
      {
        id: 'golden_rifle',
        name: 'Golden Rifle',
        description: 'A golden assault rifle skin',
        icon: '🔫',
        type: 'weapon_skin',
        rarity: 'rare',
        unlocked: false,
        unlockMethod: 'level',
        unlockRequirement: { level: 10 }
      },
      {
        id: 'veteran_title',
        name: 'Veteran',
        description: 'Prove your experience',
        icon: '⚔️',
        type: 'title',
        rarity: 'rare',
        unlocked: false,
        unlockMethod: 'achievement',
        unlockRequirement: { achievement: 'veteran' }
      },
      {
        id: 'victory_dance',
        name: 'Victory Dance',
        description: 'Celebrate your wins',
        icon: '💃',
        type: 'emote',
        rarity: 'common',
        unlocked: false,
        unlockMethod: 'achievement',
        unlockRequirement: { achievement: 'survivor' }
      },
      {
        id: 'legend_banner',
        name: 'Legend Banner',
        description: 'Banner for the elite',
        icon: '🏆',
        type: 'banner',
        rarity: 'legendary',
        unlocked: false,
        unlockMethod: 'achievement',
        unlockRequirement: { achievement: 'legend' }
      }
    ];

    for (const unlock of unlockList) {
      this.unlocks.set(unlock.id, unlock);
    }
  }

  /**
   * Generate challenges
   */
  private generateChallenges(): void {
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const weekMs = 7 * dayMs;

    this.challenges = [
      {
        id: 'daily_kills',
        name: 'Daily Kills',
        description: 'Get 5 kills today',
        type: 'daily',
        progress: 0,
        maxProgress: 5,
        completed: false,
        reward: { type: 'experience', amount: 100 },
        expiresAt: now + dayMs
      },
      {
        id: 'weekly_wins',
        name: 'Weekly Wins',
        description: 'Win 3 matches this week',
        type: 'weekly',
        progress: 0,
        maxProgress: 3,
        completed: false,
        reward: { type: 'experience', amount: 500 },
        expiresAt: now + weekMs
      },
      {
        id: 'seasonal_damage',
        name: 'Seasonal Damage',
        description: 'Deal 10,000 damage this season',
        type: 'seasonal',
        progress: 0,
        maxProgress: 10000,
        completed: false,
        reward: { type: 'unlock', amount: 1, itemId: 'seasonal_skin' },
        expiresAt: now + (30 * dayMs)
      }
    ];
  }

  /**
   * Load progression from localStorage
   */
  private loadProgression(): void {
    try {
      const saved = localStorage.getItem(`nexus-royale-progression-${this.progression.playerId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.progression = { ...this.progression, ...parsed };
        
        // Restore achievements and unlocks
        if (parsed.achievements) {
          this.progression.achievements = parsed.achievements;
        }
        if (parsed.unlocks) {
          this.progression.unlocks = parsed.unlocks;
        }
      }
    } catch (error) {
      console.warn('Failed to load progression:', error);
    }
  }

  /**
   * Save progression to localStorage
   */
  private saveProgression(): void {
    try {
      localStorage.setItem(
        `nexus-royale-progression-${this.progression.playerId}`,
        JSON.stringify(this.progression)
      );
    } catch (error) {
      console.warn('Failed to save progression:', error);
    }
  }

  /**
   * Add experience
   */
  addExperience(amount: number): void {
    this.progression.experience += amount;
    
    // Check for level up
    while (this.progression.experience >= this.progression.experienceToNext) {
      this.levelUp();
    }
    
    this.saveProgression();
  }

  /**
   * Level up
   */
  private levelUp(): void {
    this.progression.level++;
    this.progression.experience -= this.progression.experienceToNext;
    this.progression.experienceToNext = this.calculateExperienceToNext();
    
    // Check for level-based unlocks
    this.checkLevelUnlocks();
    
    if (this.onLevelUp) {
      this.onLevelUp(this.progression.level);
    }
  }

  /**
   * Calculate experience needed for next level
   */
  private calculateExperienceToNext(): number {
    return Math.floor(100 * Math.pow(1.2, this.progression.level - 1));
  }

  /**
   * Check level-based unlocks
   */
  private checkLevelUnlocks(): void {
    for (const [id, unlock] of this.unlocks) {
      if (!unlock.unlocked && 
          unlock.unlockMethod === 'level' && 
          unlock.unlockRequirement.level <= this.progression.level) {
        this.unlockItem(unlock);
      }
    }
  }

  /**
   * Record match result
   */
  recordMatchResult(won: boolean, kills: number, deaths: number, damageDealt: number, damageTaken: number): void {
    this.progression.matchesPlayed++;
    if (won) this.progression.matchesWon++;
    this.progression.kills += kills;
    this.progression.deaths += deaths;
    this.progression.damageDealt += damageDealt;
    this.progression.damageTaken += damageTaken;
    
    // Add experience based on performance
    let experience = 50; // Base experience
    if (won) experience += 100;
    experience += kills * 25;
    experience += Math.floor(damageDealt / 100);
    
    this.addExperience(experience);
    
    // Update challenges
    this.updateChallenges('match_result', { won, kills, deaths, damageDealt, damageTaken });
    
    // Update achievements
    this.updateAchievements();
    
    this.saveProgression();
  }

  /**
   * Record weapon usage
   */
  recordWeaponUsage(weaponId: string): void {
    if (!this.progression.weaponsUsed.includes(weaponId)) {
      this.progression.weaponsUsed.push(weaponId);
    }
    
    this.updateAchievements();
    this.saveProgression();
  }

  /**
   * Update challenges
   */
  private updateChallenges(type: string, data: any): void {
    for (const challenge of this.challenges) {
      if (challenge.completed) continue;
      
      switch (challenge.id) {
        case 'daily_kills':
          if (type === 'match_result' && data.kills > 0) {
            challenge.progress += data.kills;
          }
          break;
        case 'weekly_wins':
          if (type === 'match_result' && data.won) {
            challenge.progress++;
          }
          break;
        case 'seasonal_damage':
          if (type === 'match_result') {
            challenge.progress += data.damageDealt;
          }
          break;
      }
      
      // Check if challenge is completed
      if (challenge.progress >= challenge.maxProgress && !challenge.completed) {
        this.completeChallenge(challenge);
      }
    }
  }

  /**
   * Complete challenge
   */
  private completeChallenge(challenge: Challenge): void {
    challenge.completed = true;
    challenge.completedAt = Date.now();
    
    // Give reward
    if (challenge.reward.type === 'experience') {
      this.addExperience(challenge.reward.amount);
    } else if (challenge.reward.type === 'unlock' && challenge.reward.itemId) {
      const unlock = this.unlocks.get(challenge.reward.itemId);
      if (unlock) {
        this.unlockItem(unlock);
      }
    }
    
    if (this.onChallengeCompleted) {
      this.onChallengeCompleted(challenge);
    }
  }

  /**
   * Update achievements
   */
  private updateAchievements(): void {
    for (const [id, achievement] of this.achievements) {
      if (achievement.unlocked) continue;
      
      switch (achievement.id) {
        case 'first_blood':
          achievement.progress = Math.min(this.progression.kills, 1);
          break;
        case 'survivor':
          achievement.progress = Math.min(this.progression.matchesWon, 1);
          break;
        case 'sharpshooter':
          // This would need to track kills per match
          break;
        case 'veteran':
          achievement.progress = Math.min(this.progression.matchesPlayed, 100);
          break;
        case 'weapon_master':
          achievement.progress = Math.min(this.progression.weaponsUsed.length, 5);
          break;
        case 'legend':
          achievement.progress = Math.min(this.progression.level, 50);
          break;
      }
      
      // Check if achievement is unlocked
      if (achievement.progress >= achievement.maxProgress && !achievement.unlocked) {
        this.unlockAchievement(achievement);
      }
    }
  }

  /**
   * Unlock achievement
   */
  private unlockAchievement(achievement: Achievement): void {
    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();
    this.progression.achievements.push(achievement);
    
    // Check for achievement-based unlocks
    for (const [id, unlock] of this.unlocks) {
      if (!unlock.unlocked && 
          unlock.unlockMethod === 'achievement' && 
          unlock.unlockRequirement.achievement === achievement.id) {
        this.unlockItem(unlock);
      }
    }
    
    if (this.onAchievementUnlocked) {
      this.onAchievementUnlocked(achievement);
    }
  }

  /**
   * Unlock item
   */
  private unlockItem(unlock: Unlock): void {
    unlock.unlocked = true;
    unlock.unlockedAt = Date.now();
    this.progression.unlocks.push(unlock);
    
    if (this.onUnlockUnlocked) {
      this.onUnlockUnlocked(unlock);
    }
  }

  /**
   * Update skill rating
   */
  updateSkillRating(newRating: number): void {
    this.progression.skillRating = newRating;
    this.progression.rank = this.calculateRank(newRating);
    this.saveProgression();
  }

  /**
   * Calculate rank based on skill rating
   */
  private calculateRank(skillRating: number): string {
    if (skillRating >= 2000) return 'Diamond';
    if (skillRating >= 1500) return 'Platinum';
    if (skillRating >= 1200) return 'Gold';
    if (skillRating >= 1000) return 'Silver';
    return 'Bronze';
  }

  /**
   * Get progression data
   */
  getProgression(): ProgressionData {
    return { ...this.progression };
  }

  /**
   * Get challenges
   */
  getChallenges(): Challenge[] {
    return [...this.challenges];
  }

  /**
   * Get achievements
   */
  getAchievements(): Achievement[] {
    return Array.from(this.achievements.values());
  }

  /**
   * Get unlocks
   */
  getUnlocks(): Unlock[] {
    return Array.from(this.unlocks.values());
  }

  /**
   * Set callbacks
   */
  onLevelUpCallback(callback: (newLevel: number) => void): void {
    this.onLevelUp = callback;
  }

  onAchievementUnlockedCallback(callback: (achievement: Achievement) => void): void {
    this.onAchievementUnlocked = callback;
  }

  onUnlockUnlockedCallback(callback: (unlock: Unlock) => void): void {
    this.onUnlockUnlocked = callback;
  }

  onChallengeCompletedCallback(callback: (challenge: Challenge) => void): void {
    this.onChallengeCompleted = callback;
  }

  /**
   * Get progression statistics
   */
  getStats(): any {
    return {
      level: this.progression.level,
      experience: this.progression.experience,
      experienceToNext: this.progression.experienceToNext,
      matchesPlayed: this.progression.matchesPlayed,
      winRate: this.progression.matchesPlayed > 0 ? 
        (this.progression.matchesWon / this.progression.matchesPlayed * 100).toFixed(1) + '%' : '0%',
      kdr: this.progression.deaths > 0 ? 
        (this.progression.kills / this.progression.deaths).toFixed(2) : this.progression.kills.toString(),
      skillRating: this.progression.skillRating,
      rank: this.progression.rank,
      achievementsUnlocked: this.progression.achievements.length,
      totalAchievements: this.achievements.size,
      unlocksUnlocked: this.progression.unlocks.length,
      totalUnlocks: this.unlocks.size,
      activeChallenges: this.challenges.filter(c => !c.completed).length
    };
  }
}