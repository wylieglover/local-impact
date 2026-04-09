/**
 * XP required to reach a given level from level 1.
 * Curve: xpRequired(level) = floor(100 * level^1.5)
 *
 * Level 1  → 100 XP
 * Level 2  → 283 XP
 * Level 5  → 1118 XP
 * Level 10 → 3162 XP
 * Level 20 → 8944 XP
 */
export const XP_REWARDS = {
  REPORT_WITHOUT_PHOTO: 20,
  REPORT_WITH_PHOTO: 35,
  ISSUE_RESOLVED: 75,
} as const

export function xpRequiredForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5))
}

export function xpForCurrentLevel(experience: number, level: number): number {
  // XP earned within the current level (resets each level)
  const previousLevelXp = level > 1 ? xpRequiredForLevel(level - 1) : 0
  return experience - previousLevelXp
}

export function xpRemainingForNextLevel(experience: number, level: number): number {
  const currentLevelXp = xpForCurrentLevel(experience, level)
  const neededForThisLevel = xpRequiredForLevel(level) - (level > 1 ? xpRequiredForLevel(level - 1) : 0)
  return neededForThisLevel - currentLevelXp
}

export function progressToNextLevel(experience: number, level: number): number {
  // Returns 0–1 representing how far through the current level the user is
  const previousLevelXp = level > 1 ? xpRequiredForLevel(level - 1) : 0
  const nextLevelXp = xpRequiredForLevel(level)
  const span = nextLevelXp - previousLevelXp
  const progress = experience - previousLevelXp
  return Math.min(progress / span, 1)
}