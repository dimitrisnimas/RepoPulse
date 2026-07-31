import type{ContributionsCardData}from"@/server/cards/contributions/contributions.types";import{calculateStreaks}from"./streak-calculator";import type{StreakCardData}from"./streak.types";
export function mapStreakData(data:ContributionsCardData,today?:Date):StreakCardData{return{username:data.username,year:data.year,...calculateStreaks(data.weeks.flatMap((week)=>week.days),today)};}
