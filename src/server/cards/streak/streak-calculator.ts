import type{StreakDay,StreakResult}from"./streak.types";
const dayMs=86_400_000;
function timestamp(date:string){return Date.parse(`${date}T00:00:00Z`);}
function iso(time:number){return new Date(time).toISOString().slice(0,10);}
export function calculateStreaks(source:StreakDay[],today=new Date()):StreakResult{
 const unique=new Map(source.map((day)=>[day.date,day]));const days=[...unique.values()].sort((a,b)=>a.date.localeCompare(b.date));let longest=0,longestStart:null|string=null,longestEnd:null|string=null,run=0,runStart:null|string=null,previous:number|null=null,total=0,active=0;
 for(const day of days){total+=day.count;const time=timestamp(day.date);if(day.count>0){active++;if(previous!==null&&time-previous===dayMs&&run>0)run++;else{run=1;runStart=day.date;}if(run>longest){longest=run;longestStart=runStart;longestEnd=day.date;}previous=time;}else{run=0;runStart=null;previous=time;}}
 const todayTime=Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate());const todayKey=iso(todayTime),yesterdayKey=iso(todayTime-dayMs);const end=unique.get(todayKey)?.count?todayKey:unique.get(yesterdayKey)?.count?yesterdayKey:null;let current=0,currentStart:null|string=null;
 if(end){let cursor=timestamp(end);while((unique.get(iso(cursor))?.count??0)>0){current++;currentStart=iso(cursor);cursor-=dayMs;}}
 return{currentStreak:current,currentStreakStart:currentStart,currentStreakEnd:end,longestStreak:longest,longestStreakStart:longestStart,longestStreakEnd:longestEnd,activeDays:active,totalContributions:total};
}
