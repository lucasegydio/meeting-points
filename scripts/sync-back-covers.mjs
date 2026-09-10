import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require(require.resolve('sharp',{paths:[process.cwd(),process.env.FREQUENCIA_NODE_MODULES||'C:/Users/Lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const albums=JSON.parse(await readFile('dist/catalog.json','utf8'));await mkdir('dist/assets/backs',{recursive:true});
const report=[];
for(const a of albums){
 const release=a.sources?.find(s=>s.name==='MusicBrainz')?.url;
 if(!release){report.push({id:a.id,status:'no-verified-release'});continue;}
 const url=release.replace('musicbrainz.org','coverartarchive.org')+'/';
 try{
  let data;try{const cached=JSON.parse(await readFile('.catalog-cache/'+createHash('sha256').update(url).digest('hex')+'.json','utf8'));if(Date.now()-cached.time<7*86400000)data=cached.data;}catch{}
  if(!data){const r=await fetch(url,{signal:AbortSignal.timeout(18000),headers:{'User-Agent':'Frequencia/0.7 (personal music archive)'}});if(r.status===404){report.push({id:a.id,status:'no-artwork'});continue;}if(!r.ok)throw Error('HTTP '+r.status);data=await r.json();}
  const back=data.images?.find(i=>i.back&&i.approved);if(!back){report.push({id:a.id,status:'no-back-cover'});continue;}
  const r=await fetch(back.image.replace('http:','https:'),{signal:AbortSignal.timeout(25000)});if(!r.ok)throw Error('Image HTTP '+r.status);if(Number(r.headers.get('content-length'))>30e6)throw Error('Image too large');const bytes=Buffer.from(await r.arrayBuffer());if(bytes.length>30e6)throw Error('Image too large');
  const image=sharp(bytes,{limitInputPixels:50e6}),meta=await image.metadata();
  const ext=['png','webp'].includes(meta.format)?meta.format:'jpg',base='assets/backs/'+a.id;
  await writeFile('dist/'+base+'-original.'+ext,bytes);await image.rotate().resize({width:1200,height:1200,fit:'inside',withoutEnlargement:true}).webp({quality:94}).toFile('dist/'+base+'.webp');
  a.backCover=base+'.webp';a.backCoverOriginal=base+'-original.'+ext;a.backCoverSource={name:'Cover Art Archive',url:back.image.replace('http:','https:'),release};
  report.push({id:a.id,status:'found',width:meta.width,height:meta.height,path:a.backCover});
 }catch(e){report.push({id:a.id,status:'unavailable',error:e.message});}
}
await writeFile('dist/catalog.json.tmp',JSON.stringify(albums,null,2)+'\n');await rename('dist/catalog.json.tmp','dist/catalog.json');
await writeFile('scripts/back-covers-audit.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
