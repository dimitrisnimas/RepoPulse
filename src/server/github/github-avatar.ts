import { env } from "@/config/env";
const MAX_AVATAR_BYTES=300_000;
const allowedHosts=(hostname:string)=>hostname==="avatars.githubusercontent.com"||hostname.endsWith(".githubusercontent.com");
export async function embedGitHubAvatar(value:string):Promise<string|null>{
  let url:URL;try{url=new URL(value)}catch{return null}if(url.protocol!=="https:"||!allowedHosts(url.hostname))return null;
  try{const response=await fetch(url,{headers:{Accept:"image/avif,image/webp,image/png,image/jpeg","User-Agent":`RepoPulse/${env.APP_VERSION}`},cache:"force-cache",signal:AbortSignal.timeout(Math.min(4000,env.REPOPULSE_GITHUB_TIMEOUT_MS))});if(!response.ok)return null;if(response.redirected){const finalUrl=new URL(response.url);if(finalUrl.protocol!=="https:"||!allowedHosts(finalUrl.hostname))return null}const type=response.headers.get("content-type")?.split(";",1)[0]?.toLowerCase();if(!type||!["image/png","image/jpeg","image/webp"].includes(type))return null;const declared=Number(response.headers.get("content-length")??0);if(declared>MAX_AVATAR_BYTES)return null;const bytes=await response.arrayBuffer();if(!bytes.byteLength||bytes.byteLength>MAX_AVATAR_BYTES)return null;return`data:${type};base64,${Buffer.from(bytes).toString("base64")}`}catch{return null}
}
