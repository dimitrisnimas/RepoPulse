export interface ContributionDay { date: string; count: number; level: 0|1|2|3|4; weekday: number }
export interface ContributionsCardData { username: string; year: number; totalContributions: number; from: string; to: string; weeks: Array<{ days: ContributionDay[] }> }
export interface ContributionsOptions { username:string;theme:string;width:number;year:number;showTotal:boolean;showLegend:boolean;showWeekdays:boolean;hideBorder:boolean;locale:string }
