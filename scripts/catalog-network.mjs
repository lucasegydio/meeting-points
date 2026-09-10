import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
let last=0;
export async function api(url){
 await mkdir('.catalog-cache',{recursive:true});const file='.catalog-cache/'+createHash('sha256').update(url).digest('hex')+'.json';
 try{const c=JSON.parse(await readFile(file,'utf8'));if(Date.now()-c.time<7*86400000)return c.data;}catch{}
 if(url.includes('musicbrainz.org')){await new Promise(r=>setTimeout(r,Math.max(0,1100-Date.now()+last)));last=Date.now();}
 let response;for(let i=0;i<3;i++){response=await fetch(url,{signal:AbortSignal.timeout(20000),headers:{'User-Agent':'meeting.points/1.0 (personal music catalogue)','Accept':'application/json'}});if(![429,502,503,504].includes(response.status)||i===2)break;await new Promise(r=>setTimeout(r,2000*(i+1)));}
 if(response.status===404)return null;if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();if(data.error)throw Error(data.error.message||'API error');await writeFile(file,JSON.stringify({time:Date.now(),data}));return data;
}
export const norm=s=>String(s).normalize('NFKD').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');
