import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(require.resolve('sharp',{paths:[process.cwd(),process.env.FREQUENCIA_NODE_MODULES||'C:/Users/Lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const catalog=JSON.parse(await readFile('dist/catalog.json','utf8'));
const overrides=JSON.parse(await readFile('scripts/catalog-overrides.json','utf8'));
const only=process.argv.find(x=>x.startsWith('--only='))?.slice(7);
const cache='.catalog-cache';await mkdir(cache,{recursive:true});await mkdir('dist/assets/hq',{recursive:true});
const norm=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'').replace(/(ep|single)$/,'');
const artistOf=a=>a.artist.split(/,| e | & /)[0];
function matches(a,title,artist){const n=norm(a.title),t=norm(title);return (n===t||(a.title.includes('…')&&t.startsWith(norm(a.title.split('…')[0]))))&&norm(artist).includes(norm(artistOf(a)));}
let lastMB=0;
const report=[];
async function json(url){
 const key=createHash('sha256').update(url).digest('hex');
 try{const cached=JSON.parse(await readFile(`${cache}/${key}.json`,'utf8'));if(Date.now()-cached.time<7*86400000)return cached.data;}catch{}
 if(url.includes('musicbrainz.org')){await new Promise(r=>setTimeout(r,Math.max(0,1200-(Date.now()-lastMB))));lastMB=Date.now();}
 let r;for(let attempt=0;attempt<3;attempt++){r=await fetch(url,{headers:{'User-Agent':'Frequencia/0.4 (https://frequencia-lucas-music.gravity3-0284.chatgpt.site)','Accept':'application/json'},signal:AbortSignal.timeout(18000)});if(![429,502,503,504].includes(r.status)||attempt===2)break;await new Promise(resolve=>setTimeout(resolve,Math.min(6000,Math.max(1500,Number(r.headers.get('retry-after')||0)*1000,1500*(attempt+1)))));if(url.includes('musicbrainz.org'))lastMB=Date.now();}
 if(r.status===404)return null;if(!r.ok)throw Error(`HTTP ${r.status}`);const data=await r.json();if(data.error)throw Error(data.error.message||'Provider error');
 await writeFile(`${cache}/${key}.json`,JSON.stringify({time:Date.now(),data}));return data;
}
async function apple(a){
 let data;if(a.url.includes('music.apple.com')){const id=new URL(a.url).pathname.split('/').filter(Boolean).at(-1);data=(await json(`https://itunes.apple.com/lookup?id=${id}&entity=song`))?.results;}
 else{for(const country of ['US','BR','GB']){const results=await json('https://itunes.apple.com/search?'+new URLSearchParams({term:artistOf(a)+' '+a.title.split('(')[0],entity:'album',country,limit:'30'}));const match=results?.results?.find(x=>matches(a,x.collectionName,x.artistName));if(match){data=(await json(`https://itunes.apple.com/lookup?id=${match.collectionId}&entity=song&country=${country}`))?.results;break;}}}
 const x=data?.find(x=>x.wrapperType==='collection');if(!x||!matches(a,x.collectionName,x.artistName))return null;
 return {name:'Apple / iTunes',title:x.collectionName,artist:x.artistName,date:x.releaseDate,url:x.collectionViewUrl,genre:x.primaryGenreName,images:[x.artworkUrl100.replace(/100x100bb/,'3000x3000bb')],tracks:data.filter(t=>t.wrapperType==='track').map(t=>({name:t.trackName,number:t.trackNumber,duration:t.trackTimeMillis,url:t.trackViewUrl}))};
}
async function deezer(a){
 const pinned=overrides[a.id]?.deezerId;const results=pinned?null:await json('https://api.deezer.com/search/album?'+new URLSearchParams({q:artistOf(a)+' '+a.title.split('(')[0],limit:'25'}));const hit=pinned?{id:pinned}:results?.data?.find(x=>matches(a,x.title,x.artist?.name));if(!hit)return null;
 const x=await json(`https://api.deezer.com/album/${hit.id}`);return {name:'Deezer',title:x.title,artist:x.artist.name,date:x.release_date,url:x.link,label:x.label,genre:x.genres?.data?.[0]?.name,images:[x.cover_xl],tracks:x.tracks?.data?.map((t,i)=>({name:t.title,number:i+1,duration:t.duration*1000,url:t.link}))||[]};
}
async function musicbrainz(a){
 const title=a.title.split('…')[0].replace(/["()]/g,' ').trim();const search=await json('https://musicbrainz.org/ws/2/release/?'+new URLSearchParams({query:`release:"${title}" AND artist:"${artistOf(a)}"`,fmt:'json',limit:'10'}));
 const hit=search?.releases?.find(x=>matches(a,x.title,(x['artist-credit']||[]).map(x=>x.name||x.artist?.name||'').join(' ')));if(!hit)return null;
 const x=await json(`https://musicbrainz.org/ws/2/release/${hit.id}?inc=recordings+labels+artist-credits+genres&fmt=json`);
 let artwork;try{artwork=await json(`https://coverartarchive.org/release/${hit.id}/`);}catch{}
 const image=artwork?.images?.find(x=>x.front&&x.approved);
 return {name:'MusicBrainz',title:x.title,artist:(x['artist-credit']||[]).map(x=>x.name||x.artist?.name||'').join(' '),date:x.date,url:`https://musicbrainz.org/release/${x.id}`,label:x['label-info']?.[0]?.label?.name,genre:x.genres?.[0]?.name,images:image?[image.image.replace('http:','https:')]:[],imageSource:'Cover Art Archive',tracks:(x.media||[]).flatMap(m=>(m.tracks||[]).map(t=>({name:t.title,number:t.position,duration:t.length||0,url:`https://musicbrainz.org/recording/${t.recording.id}`})))};
}
for(const a of catalog){
 if(only&&!only.split(',').includes(a.id))continue;
 if(overrides[a.id]){a.title=overrides[a.id].title||a.title;a.aliases=overrides[a.id].aliases||[];}
 const providers=await Promise.allSettled([apple(a),deezer(a),musicbrainz(a)]);
 const found=providers.filter(x=>x.status==='fulfilled'&&x.value).map(x=>x.value);
 const errors=providers.map((x,i)=>x.status==='rejected'?`${['Apple','Deezer','MusicBrainz'][i]}: ${x.reason.message}`:null).filter(Boolean);
 let best={buffer:await readFile('dist/'+(a.coverOriginal||a.cover)),source:a.coverSource||a.source,url:a.coverSourceUrl||null};best.meta=await sharp(best.buffer).metadata();
 for(const source of found){for(const url of source.images.filter(Boolean)){try{const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)continue;if(Number(r.headers.get('content-length'))>30e6)continue;const buffer=Buffer.from(await r.arrayBuffer());if(buffer.length>30e6)continue;const meta=await sharp(buffer,{limitInputPixels:50e6}).metadata();if(Math.min(meta.width,meta.height)>Math.min(best.meta.width,best.meta.height))best={buffer,meta,source:source.imageSource||source.name,url};}catch(e){errors.push('Capa: '+e.message);}}}
 const base=`assets/hq/${a.id}`;const ext=best.meta.format==='png'?'png':best.meta.format==='webp'?'webp':'jpg';await writeFile(`dist/${base}-original.${ext}`,best.buffer);
 a.coverOriginal=`${base}-original.${ext}`;a.coverSource=best.source;a.coverSourceUrl=best.url;a.coverWidth=best.meta.width;a.coverHeight=best.meta.height;
 a.coverVariants=[];
 for(const width of [...new Set([Math.min(480,best.meta.width),Math.min(960,best.meta.width),Math.min(1800,best.meta.width)])]){const p=`${base}-${width}.webp`;await sharp(best.buffer).rotate().resize({width,withoutEnlargement:true}).webp({quality:94,effort:5}).toFile('dist/'+p);a.coverVariants.push({src:p,width});}
 a.cover=a.coverVariants.at(-1).src;
 const primary=found.find(x=>x.name==='Apple / iTunes')||found[0];
 if(primary){a.title=primary.title;a.release=primary.date||a.release;a.releaseVerified=!!primary.date;a.source=primary.name;if(primary.name!=='MusicBrainz'){a.url=primary.url;a.listenLabel=primary.name==='Deezer'?'Ouvir no Deezer':'Ouvir no Apple Music';}if(!a.tracks.length&&primary.tracks.length)a.tracks=primary.tracks;a.label=found.find(x=>x.label)?.label||null;}
 a.sources=[...(a.sources||[]).filter(s=>!found.some(x=>x.name===s.name)),...found.map(x=>({name:x.name,url:x.url}))];a.metadataCheckedAt=new Date().toISOString();
 a.catalogDescription=primary?`${a.type} de ${primary.artist}, lançado em ${primary.date?.slice(0,4)||'data não informada'}.${a.tracks.length?' '+a.tracks.length+' faixas.':''}${a.label?' Selo: '+a.label+'.':''}`:a.catalogDescription||null;
 const swatch=await sharp(best.buffer).resize(1,1).removeAlpha().raw().toBuffer();a.color='#'+[...swatch].slice(0,3).map(x=>x.toString(16).padStart(2,'0')).join('');
 report.push({id:a.id,title:a.title,dimensions:[a.coverWidth,a.coverHeight],coverSource:a.coverSource,providers:a.sources.map(x=>x.name),errors});
 console.log(`${a.title}: ${a.coverWidth}×${a.coverHeight} / ${a.coverSource} / ${a.sources.map(x=>x.name).join(', ')||'sem correspondência'}`);
}
await writeFile('dist/catalog.json.tmp',JSON.stringify(catalog,null,2));await rename('dist/catalog.json.tmp','dist/catalog.json');let audit=[];try{audit=JSON.parse(await readFile('scripts/catalog-audit.json','utf8'));}catch{}await writeFile('scripts/catalog-audit.json',JSON.stringify([...audit.filter(x=>!report.some(r=>r.id===x.id)),...report],null,2));
