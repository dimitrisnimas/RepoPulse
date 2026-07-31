import type { GitHubContributionsResponse } from "@/server/github/github.types";
import type { ContributionsCardData } from "./contributions.types";
const levels={NONE:0,FIRST_QUARTILE:1,SECOND_QUARTILE:2,THIRD_QUARTILE:3,FOURTH_QUARTILE:4} as const;
export function mapContributionsData(user:NonNullable<GitHubContributionsResponse["user"]>,year:number):ContributionsCardData{
 const weeks=user.contributionsCollection.contributionCalendar.weeks.map((week)=>({days:week.contributionDays.map((day)=>({date:day.date,count:day.contributionCount,level:levels[day.contributionLevel],weekday:day.weekday}))}));
 const days=weeks.flatMap((week)=>week.days);
 return{username:user.login,year,totalContributions:user.contributionsCollection.contributionCalendar.totalContributions,from:days[0]?.date??`${year}-01-01`,to:days.at(-1)?.date??`${year}-12-31`,weeks};
}
export function monthPositions(data:ContributionsCardData):Array<{label:string;week:number}>{
 const seen=new Set<number>();const formatter=new Intl.DateTimeFormat("en",{month:"short",timeZone:"UTC"});const result:Array<{label:string;week:number}>=[];
 data.weeks.forEach((week,index)=>{const first=week.days.find((day)=>new Date(`${day.date}T00:00:00Z`).getUTCDate()<=7);if(!first)return;const month=new Date(`${first.date}T00:00:00Z`).getUTCMonth();if(!seen.has(month)){seen.add(month);result.push({label:formatter.format(new Date(`${first.date}T00:00:00Z`)),week:index});}});
 return result;
}
