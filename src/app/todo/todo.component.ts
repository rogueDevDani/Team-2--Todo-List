import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

type Priority = 'low'|'medium'|'high';
type Task = {
  id: number;
  name: string;
  priority: Priority;
  dueDate?: string;
  completed: boolean;
  editing?: boolean; // Used to show/hide edit fields
};

type Reward = {
  id: number;
  name: string;
  milestone: number; // Cumulative tasks completed across all time
  unlocked: boolean;
  description: string;
  effect: string;
};

// ** USER-DEFINED OPPONENT LIST **
const OPPONENTS = [
  'Mizuki', 'Kabuto', 'Zabuza', 'Neji', 'Gaara', 
  'Kakuzu', 'Pain', 'Obito', 'Madara', 'Kaguya' 
];

// Define the default rewards array structure
const DEFAULT_REWARDS: Reward[] = [
    { id: 1, name: 'Enhanced Kunai', milestone: 10, unlocked: false, 
      description: 'Naruto throws better kunai.',
      effect: 'Permanently increases Low Priority task damage by 2 HP (New Low: 22).' },
    { id: 2, name: 'Shadow Clone Training', milestone: 25, unlocked: false, 
      description: 'Efficient learning by using clones.',
      effect: 'Unlocks Shadow Clone Reward: Every 5-Task streak now grants a bonus 10 XP on the next task.' },
    { id: 3, name: 'Chakra Control Mastery', milestone: 50, unlocked: false, 
      description: 'Better chakra flow reduces wasted energy.',
      effect: 'Permanently reduces player loss on unchecked tasks from 3% to 1%.' },
    { id: 4, name: 'Nine-Tails Chakra Buff', milestone: 75, unlocked: false, 
      description: 'Gain a temporary chakra boost from Kurama.',
      effect: 'Unlocks Nine-Tails Reward: Every 5-Task streak now grants 1-Mission Immunity.' },
    { id: 5, name: 'Rasengan Optimization', milestone: 100, unlocked: false, 
      description: 'A more focused Rasengan.',
      effect: 'Permanently increases Medium Priority task damage by 5 HP (New Med: 45).' },
    { id: 6, name: 'Sage Mode Skin/Buff', milestone: 150, unlocked: false, 
      description: 'Naruto unlocks the power of the Sages! (Cosmetic + Buff)',
      effect: 'Permanently increases High Priority task damage by 10 HP (New High: 70).' },
    { id: 7, name: 'Hokage Foresight', milestone: 200, unlocked: false, 
      description: 'The foresight of a Kage protects you from minor lapses.',
      effect: 'Permanently reduces enemy damage on overdue tasks from 5% to 4%.' },
    { id: 8, name: 'Wind Release Mastery', milestone: 300, unlocked: false, 
      description: 'Wind chakra enhances speed and focus.',
      effect: 'All task damage is permanently increased by an additional 2 HP.' },
    { id: 9, name: 'Jinchuriki Healing', milestone: 400, unlocked: false, 
      description: 'Kurama’s natural healing rate.',
      effect: 'Player is healed 5% progress upon defeating an opponent (Base win heal is now 15%).' },
    { id: 10, name: 'Six Paths Power', milestone: 500, unlocked: false, 
      description: 'A legendary level of power.',
      effect: 'Permanently reduces enemy damage on overdue tasks to 2%.' }
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent implements OnInit {
  // form
  newTask = '';
  newDueDate = '';
  priority: Priority = 'low';

  // tasks
  tasks: Task[] = [];

  showRewardsOverlay = false;

  get completedTasksCount(): number {
    return this.tasks.filter(t => t.completed).length;
  }
  
  // ** TUG-OF-WAR LOGIC **
  levelIndex = 0; 
  playerProgressPercentage = 50; 
  
  // ** GAME CONSTANTS **
  damageValues = { low: 20, medium: 40, high: 60 };
  hpToProgressRatio = 2;
  opponentDamageLoss = 5;
  
  uncheckLoss = 3;
  winHealGain = 10;

  // xp/level-ish display
  xp = 0;
  level = 1;

  // Streak Reward Logic
  currentStreak = 0;
  totalCompletedMissions = 0; // Cumulative count
  isImmune = false;
  
  rewards: Reward[] = DEFAULT_REWARDS;

  // Reminder logic remains the same
  reminderTimerFirstMs = 60 * 1000; 
  reminderIntervalMs = 1.5 * 60 * 60 * 1000; 
  
  reminderMessages = [
    '💧 Hydration Mission: Please drink your water!',
    '🍜 Fuel Check: Please eat your food or have a snack.',
    '🚶 Movement Scroll: Time to go for a quick walk or stand up.',
    '🧘 Stretch Jutsu: Do a quick stretch break—30 seconds!',
    '👀 Focus Technique: Close your eyes and rest them for 20 seconds.',
    '🧠 Chakra Regeneration: Take a 5-minute mental break.'
  ];

  // animation state
  showAttack = false;
  attackGifUrl = ''; 
  attackText = '';
  
  popupText = '';

  constructor(){}

  ngOnInit(){
    this.load();
    this.applyPermanentEffects(); // Apply effects on load
    this.updateDerived();
    
    // schedule reminders
    setTimeout(()=> this.randomReminder(), this.reminderTimerFirstMs);
    setInterval(()=> this.randomReminder(), this.reminderIntervalMs);

    // Check for overdue tasks hourly
    setInterval(() => this.checkOverdueTasks(), 60 * 60 * 1000); 
  }

  triggerPopup(text: string, duration = 3000): void {
    this.popupText = text;
    setTimeout(() => {
      this.popupText = '';
    }, duration);
  }

  randomReminder(): void {
    const randomIndex = Math.floor(Math.random() * this.reminderMessages.length);
    this.triggerPopup(this.reminderMessages[randomIndex]);
  }

  toggleRewardsOverlay(): void {
    this.showRewardsOverlay = !this.showRewardsOverlay;
  }

  // Helper to re-calculate damage and passive effects based on unlocked rewards
  applyPermanentEffects(): void {
    let lowDmg = 20; let mediumDmg = 40; let highDmg = 60;
    let overdueDmg = 5;
    let uncheckLoss = 3;
    let winHeal = 10;

    // Apply all unlocked permanent rewards
    this.rewards.forEach(r => {
        if (r.unlocked) {
            switch (r.id) {
                case 1: lowDmg += 2; break; // Enhanced Kunai
                case 3: uncheckLoss = 1; break; // Chakra Control Mastery
                case 5: mediumDmg += 5; break; // Rasengan Optimization
                case 6: highDmg += 10; break; // Sage Mode
                case 7: overdueDmg = Math.min(overdueDmg, 4); break; // Hokage Foresight
                case 8: lowDmg += 2; mediumDmg += 2; highDmg += 2; break; // Wind Release Mastery
                case 9: winHeal = 15; break; // Jinchuriki Healing
                case 10: overdueDmg = Math.min(overdueDmg, 2); break; // Six Paths Power
            }
        }
    });

    // Apply calculated values
    this.damageValues = { low: lowDmg, medium: mediumDmg, high: highDmg };
    this.opponentDamageLoss = overdueDmg;
    this.uncheckLoss = uncheckLoss;
    this.winHealGain = winHeal;
  }

  checkForRewards(): void {
    this.rewards.forEach(r => {
      if (!r.unlocked && this.totalCompletedMissions >= r.milestone) {
        r.unlocked = true;
        this.triggerPopup(`🌟 REWARD UNLOCKED: ${r.name}! ${r.effect}`);
        this.applyPermanentEffects();
      }
    });
  }

  // ----- tasks -----
  addTask(){
    if (!this.newTask.trim()) return;
    const t:Task = {
      id: Date.now(),
      name: this.newTask.trim(),
      priority: this.priority,
      dueDate: this.newDueDate || undefined,
      completed: false
    };
    this.tasks.unshift(t);
    this.newTask=''; this.newDueDate=''; this.priority='low';
    this.save(); this.updateDerived();
  }

  editTask(t:Task){
    // FIX: Toggling the flag is correct. HTML must reveal the edit fields.
    t.editing = !t.editing;
    this.save(); // Save after toggling, useful for persistence
  }

  // FIX: This function now also untoggles the editing flag explicitly
  saveEdit(t:Task){ 
    t.editing=false; 
    // Ensure data binding has updated the object before saving
    this.save(); 
    this.updateDerived(); 
  }
  
  // FIX: Cancel Edit function added for completeness
  cancelEdit(t:Task) {
    t.editing = false;
    this.save();
  }

  removeTask(id:number){
    this.tasks = this.tasks.filter(x => x.id !== id);
    this.save(); this.updateDerived();
  }

  toggleComplete(t:Task){
    setTimeout(() => {
      if (t.completed) {
        // TASK COMPLETED: Player gains progress
        const damageHP = this.damageForPriority(t.priority);
        const progressGain = damageHP / this.hpToProgressRatio;
        this.attackOpponent(progressGain);
        this.gainXP(Math.round(progressGain));
        this.totalCompletedMissions++; // Increment total cumulative count
        this.updateCurrentStreak(true);
        this.checkForRewards();
      } else {
        // TASK UNCHECKED: Player loses progress (Uses dynamic uncheckLoss)
        this.playerProgressPercentage = Math.max(0, this.playerProgressPercentage - this.uncheckLoss); 
        this.triggerPopup(`📉 Unchecked task! You lost ${this.uncheckLoss}% control.`);
        this.updateCurrentStreak(false);
      }
      this.save(); 
      this.updateDerived();
    }, 0);
  }

  updateCurrentStreak(isCompleted: boolean): void {
    const chakraBuff = this.rewards.find(r => r.id === 4 && r.unlocked);
    const shadowClone = this.rewards.find(r => r.id === 2 && r.unlocked);

    if (isCompleted) {
      this.currentStreak++;
      if (this.currentStreak % 5 === 0) {
        if (shadowClone) {
          this.gainXP(10);
          this.triggerPopup(`✨ Shadow Clone Bonus: Naruto gained 10 bonus XP!`);
        }
        if (chakraBuff) {
          this.isImmune = true;
          this.triggerPopup(`✨ Chakra Surge: Naruto gained 1-Mission Immunity!`);
        }
      }
    } else {
      this.currentStreak = 0;
      this.isImmune = false;
    }
  }

  checkOverdueTasks(){
    const today = new Date().toISOString().split('T')[0];
    let tasksOverdue = 0;
    
    this.tasks.forEach(t => {
      if (!t.completed && t.dueDate && t.dueDate < today && !t.editing) {
        tasksOverdue++; 
      }
    });

    if (tasksOverdue > 0) {
      if (this.isImmune) {
        this.isImmune = false; 
        this.triggerPopup(`🛡️ Immunity Shield blocked ${tasksOverdue} overdue mission attack!`);
      } else {
        const progressLoss = tasksOverdue * this.opponentDamageLoss;
        this.playerProgressPercentage = Math.max(0, this.playerProgressPercentage - progressLoss);
        this.triggerPopup(`💥 You missed ${tasksOverdue} mission(s)! ${this.currentOpponentName} gained ${progressLoss}% control!`);
        this.checkOpponentDefeated(); 
      }
      this.currentStreak = 0;
      this.save();
    }
  }

  damageForPriority(p:Priority){
    if (p==='low') return this.damageValues.low; 
    if (p==='medium') return this.damageValues.medium; 
    return this.damageValues.high; 
  }
  // END TUG-OF-WAR LOGIC

  resetLevel(){
    this.playerProgressPercentage = 50;
    this.currentStreak = 0;
    this.isImmune = false;
    this.triggerPopup(`🔄 Battle with ${this.currentOpponentName} reset to 50/50.`);
    this.save();
    this.updateDerived();
  }

  // FIX: Reset totalCompletedMissions and Rewards on New Game
  startNewGame(){
    this.levelIndex = 0;
    this.playerProgressPercentage = 50;
    this.tasks = []; 
    this.currentStreak = 0;
    this.totalCompletedMissions = 0; // IMPORTANT: Reset cumulative count
    this.isImmune = false;
    this.rewards = DEFAULT_REWARDS.map(r => ({ ...r, unlocked: false })); // Reset rewards state
    this.applyPermanentEffects(); // Re-apply base effects
    
    this.triggerPopup(`⚔️ New Game started! Facing ${this.currentOpponentName}.`);
    this.save();
    this.updateDerived();
  }

  // ----- fight logic (rest remains the same) -----
  attackOpponent(progressGain:number){
    this.attackGifUrl = 'https://media.giphy.com/media/3o6ZtpxSZbQRRnwCKQ/giphy.gif'; 
    this.attackText = `Naruto used Rasengan! Gained ${progressGain.toFixed(0)}% control!`;
    this.showAttack = true;

    setTimeout(() => {
      this.playerProgressPercentage = Math.min(100, this.playerProgressPercentage + progressGain);
      this.showAttack = false;
      this.checkOpponentDefeated();
      this.save();
    }, 650); 
  }

  getWinProgressReset(): number {
    return 50 + this.winHealGain; 
  }

  checkOpponentDefeated(){
    if (this.playerProgressPercentage >= 100) {
      this.triggerPopup(`🎉 You defeated ${OPPONENTS[this.levelIndex]}!`);
      this.levelIndex++;
      this.currentStreak = 0;
      this.isImmune = false;
      if (this.levelIndex >= OPPONENTS.length) {
        this.triggerPopup('🏆 You defeated all opponents! Great job! Play again?');
        this.levelIndex = OPPONENTS.length - 1;
      }
      this.playerProgressPercentage = this.getWinProgressReset(); 
      this.save();

    } else if (this.playerProgressPercentage <= 0) {
      this.triggerPopup(`💀 ${OPPONENTS[this.levelIndex]} defeated you! Resetting battle...`);
      this.playerProgressPercentage = 50;
      this.currentStreak = 0;
      this.isImmune = false;
      this.save();
    }
  }

  get currentOpponentName(): string {
    if (this.levelIndex < 0 || this.levelIndex >= OPPONENTS.length) {
      return '—';
    }
    return OPPONENTS[this.levelIndex];
  }

  // ----- XP/level -----
  gainXP(amount:number){
    this.xp += amount;
    while (this.xp >= 100) {
      this.xp -= 100;
      this.level++;
      this.triggerPopup(`⚡ Level up! Now level ${this.level}`);
    }
  }

  // ----- storage -----
  updateDerived(){
    this.playerProgressPercentage = Math.min(100, Math.max(0, this.playerProgressPercentage));
    this.checkOpponentDefeated();
  }

  save(){
    const obj = {
      tasks:this.tasks,
      levelIndex:this.levelIndex,
      playerProgressPercentage:this.playerProgressPercentage, 
      xp:this.xp,
      level:this.level,
      currentStreak: this.currentStreak, 
      totalCompletedMissions: this.totalCompletedMissions,
      isImmune: this.isImmune,
      rewards: this.rewards 
    };
    localStorage.setItem('naruto_todo_v2', JSON.stringify(obj));
  }

  load(){
    const raw = localStorage.getItem('naruto_todo_v2');
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      this.tasks = parsed.tasks || [];
      this.levelIndex = parsed.levelIndex ?? 0;
      this.playerProgressPercentage = parsed.playerProgressPercentage ?? 50; 
      this.xp = parsed.xp ?? 0;
      this.level = parsed.level ?? 1;
      this.currentStreak = parsed.currentStreak ?? 0; 
      this.totalCompletedMissions = parsed.totalCompletedMissions ?? 0;
      this.isImmune = parsed.isImmune ?? false;
      
      // Load rewards, ensuring we use default structure but keep the unlocked status
      if (parsed.rewards) {
        this.rewards = DEFAULT_REWARDS.map(defaultReward => {
          const loaded = parsed.rewards.find((r: Reward) => r.id === defaultReward.id);
          // FIX: Use the loaded unlocked status, but fallback to false if reward isn't found
          return loaded ? { ...defaultReward, unlocked: loaded.unlocked ?? false } : defaultReward;
        });
      } else {
        this.rewards = DEFAULT_REWARDS;
      }
      
    } catch (e) {
      console.warn('load error', e);
      // Fallback to default state on load error
      this.tasks = [];
      this.levelIndex = 0;
      this.playerProgressPercentage = 50;
      this.xp = 0;
      this.level = 1;
      this.totalCompletedMissions = 0;
      this.rewards = DEFAULT_REWARDS;
    }
  }
  //to switch the images on left when villian switches
get currentOpponentImage(): string {
  const opponentName = this.currentOpponentName.toLowerCase();
  return `/${opponentName}_sprite.png`;
}
}
