import type{ContributionDay}from"@/server/cards/contributions/contributions.types";
export interface StreakResult{currentStreak:number;currentStreakStart:string|null;currentStreakEnd:string|null;longestStreak:number;longestStreakStart:string|null;longestStreakEnd:string|null;activeDays:number;totalContributions:number}
export interface StreakCardData extends StreakResult{username:string;year:number}
export interface StreakOptions{username:string;theme:string;width:number;year:number;hideBorder:boolean;showRing:boolean;locale:string}
export type StreakDay=ContributionDay;
