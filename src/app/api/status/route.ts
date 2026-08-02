import{NextResponse}from"next/server";import{env}from"@/config/env";
export function GET(){return NextResponse.json({service:"RepoPulse",status:"operational",cards:["overview","languages","contributions","streak","repository","profile","pinned","private-activity"],version:env.APP_VERSION,timestamp:new Date().toISOString()},{headers:{"Cache-Control":"public, max-age=60, s-maxage=300"}})}
