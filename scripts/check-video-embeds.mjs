// Read-only diagnostics; no media is downloaded and no restrictions are bypassed.
for(const video of ['ET-hf8B-tI4','OC5mO8I_Cd4','THjekE5p2aw','QmR4zLcORNc']){
 const response=await fetch('https://www.youtube.com/embed/'+video,{headers:{Referer:'http://127.0.0.1:4173/'},signal:AbortSignal.timeout(20000)});
 const html=await response.text();const match=html.match(/(?:var ytInitialPlayerResponse\s*=\s*|"PLAYER_RESPONSE":\s*)(\{.*?\});/);
 let state;if(match)try{state=JSON.parse(match[1]).playabilityStatus;}catch{}
 console.log(JSON.stringify({video,status:response.status,playerState:state?.status,reason:state?.reason,playableInEmbed:state?.playableInEmbed,hasPlayer:html.includes('yt-player'),diagnosticOnly:true}));
}
