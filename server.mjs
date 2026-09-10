import http from 'node:http';
import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
const base=path.dirname(fileURLToPath(import.meta.url)),root=path.join(base,'dist');
const dataDir=process.env.FREQUENCIA_DATA_DIR||path.join(base,'.data');
await mkdir(dataDir,{recursive:true});
const db=new DatabaseSync(path.join(dataDir,'comments.sqlite'));
db.exec(`PRAGMA journal_mode=WAL;
CREATE TABLE IF NOT EXISTS comments(id TEXT PRIMARY KEY,album TEXT NOT NULL,nick TEXT NOT NULL CHECK(length(nick) BETWEEN 1 AND 32),body TEXT NOT NULL CHECK(length(body) BETWEEN 1 AND 2000),score INTEGER NOT NULL CHECK(typeof(score)='integer' AND score BETWEEN 0 AND 10),created TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS idx_comments_album_created ON comments(album,created);
PRAGMA optimize;`);
const baseCatalog=JSON.parse(await readFile(path.join(root,'catalog.json'),'utf8'));
const publishedFile=path.join(dataDir,'published-reviews.json');
const readPublished=async()=>{try{return JSON.parse(await readFile(publishedFile,'utf8'))}catch{return []}};
const albumIds=new Set([...baseCatalog,...await readPublished()].map(a=>a.id));
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.jpg':'image/jpeg','.jfif':'image/jpeg','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg','.m4a':'audio/mp4','.ogg':'audio/ogg','.wav':'audio/wav','.txt':'text/plain; charset=utf-8'};
const port=Number(process.env.PORT||4173);
const host=process.env.PORT?'0.0.0.0':'127.0.0.1';
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
const fail=(status,message)=>Object.assign(new Error(message),{status});
const slug=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,70);
const shortSentence=s=>{const clean=String(s||'').replace(/\s+/g,' ').trim(),sentence=clean.match(/^.*?[.!?](?:\s|$)/)?.[0]||clean;if(sentence.length<=170)return sentence;return sentence.slice(0,167).replace(/\s+\S*$/,'')+'…'};
const externalJson=async url=>{const r=await fetch(url,{signal:AbortSignal.timeout(16000),headers:{'User-Agent':'meeting.points/1.0 (personal music catalogue)'}});if(!r.ok)throw Error('Fonte externa indisponível');return r.json()};
async function releaseMetadata(title,artist){
 const term=`${artist} ${title}`,appleSearch=await externalJson('https://itunes.apple.com/search?'+new URLSearchParams({term,entity:'album',limit:'12'})).catch(()=>({results:[]}));
 const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const apple=appleSearch.results?.find(x=>norm(x.collectionName)===norm(title)&&norm(x.artistName).includes(norm(artist)))||appleSearch.results?.[0];
 let appleTracks=[];if(apple?.collectionId)appleTracks=(await externalJson(`https://itunes.apple.com/lookup?id=${apple.collectionId}&entity=song`).catch(()=>({results:[]}))).results?.filter(x=>x.wrapperType==='track')||[];
 const dzSearch=await externalJson('https://api.deezer.com/search/album?'+new URLSearchParams({q:term,limit:'12'})).catch(()=>({data:[]})),dzHit=dzSearch.data?.find(x=>norm(x.title)===norm(title)&&norm(x.artist?.name).includes(norm(artist)))||dzSearch.data?.[0];
 const dz=dzHit?.id?await externalJson(`https://api.deezer.com/album/${dzHit.id}`).catch(()=>null):null;
 const appleList=appleTracks.map(x=>({number:x.trackNumber,name:x.trackName,duration:x.trackTimeMillis,url:x.trackViewUrl,credits:[]}));
 const deezerList=await Promise.all((dz?.tracks?.data||[]).map(async(x,i)=>{const detail=await externalJson(`https://api.deezer.com/track/${x.id}`).catch(()=>x);return {number:i+1,name:x.title,duration:x.duration*1000,url:x.link,bpm:Number(detail.bpm)||0,bpmSource:Number(detail.bpm)>0?{name:'Deezer',url:x.link}:null,credits:(detail.contributors||[]).map(c=>({name:c.name,role:c.role||'Participação',source:{name:'Deezer',url:x.link}}))}}));
 const tracks=deezerList.length>appleList.length?deezerList:appleList.map((x,i)=>({...x,bpm:deezerList[i]?.bpm||0,bpmSource:deezerList[i]?.bpmSource||null,credits:deezerList[i]?.credits||[]}));
 const wiki=await externalJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artist.replace(/ /g,'_'))}`).catch(()=>null),artistUrl=dz?.artist?.link||apple?.artistViewUrl||wiki?.content_urls?.desktop?.page;
 return {release:apple?.releaseDate||dz?.release_date,genre:apple?.primaryGenreName||dz?.genres?.data?.[0]?.name,type:(apple?.collectionType||'Album')==='Album'?'Álbum':'EP',label:apple?.copyright||dz?.label||'',cover:(apple?.artworkUrl100?.replace('100x100bb','3000x3000bb'))||dz?.cover_xl,coverSource:apple?'Apple / iTunes':'Deezer',url:apple?.collectionViewUrl||dz?.link||'#',listenLabel:apple?'Ouvir no Apple Music':'Ouvir no Deezer',tracks,sources:[...(apple?[{name:'Apple / iTunes',url:apple.collectionViewUrl}]:[]),...(dz?[{name:'Deezer',url:dz.link}]:[])],artistProfile:{name:artist,role:`Artista · ${apple?.primaryGenreName||dz?.genres?.data?.[0]?.name||'música'}`,bio:wiki?.extract||`${artist} é o artista principal de ${title}.`,facts:[['Lançamento no arquivo',title],['Selo',apple?.copyright||dz?.label||null]],source:{label:wiki?'Wikipedia · perfil do artista':'Perfil oficial do artista',url:artistUrl||'#'}},artistPhoto:dz?.artist?.picture_xl?{artist,src:dz.artist.picture_xl,original:dz.artist.picture_xl,width:1000,height:1000,caption:`${artist} · foto de perfil`,credit:'Deezer',source:dz.artist.link}:null};
}
const page=(album,offset=0)=>({comments:db.prepare('SELECT id,nick,body,score,created FROM comments WHERE album=? ORDER BY created DESC,id DESC LIMIT 50 OFFSET ?').all(album,offset),total:db.prepare('SELECT count(*) AS n FROM comments WHERE album=?').get(album).n});
export const server=http.createServer(async(req,res)=>{
try{
 const allowedHosts=[`127.0.0.1:${port}`,`localhost:${port}`];
 if(process.env.PORT&&req.headers.host)allowedHosts.push(req.headers.host);
 if(!allowedHosts.includes(req.headers.host))throw fail(403,'Endereço não permitido.');
 const url=new URL(req.url,`http://${req.headers.host}`);
 if(url.pathname==='/api/admin/reviews'&&req.method==='DELETE'){
  const id=url.searchParams.get('id'),published=await readPublished(),next=published.filter(x=>x.id!==id);if(next.length===published.length)throw fail(404,'Review não encontrada.');await writeFile(publishedFile,JSON.stringify(next,null,2));return json(res,200,{ok:true});
 }
 if(url.pathname==='/api/admin/reviews'&&req.method==='POST'){
  if(req.headers.origin!==url.origin)throw fail(403,'Publique pela central administrativa.');
  let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>100000)throw fail(413,'Review muito longa.');chunks.push(chunk)}
  let d;try{d=JSON.parse(Buffer.concat(chunks).toString())}catch{throw fail(400,'Dados inválidos.')}
  const title=String(d.title||'').trim(),artist=String(d.artist||'').trim(),year=String(d.year||new Date().getFullYear()).replace(/\D/g,'').slice(0,4),slug=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  if(!title||!artist||year.length!==4||!String(d.review||'').trim()||!String(d.body||'').trim()||!Number.isInteger(Number(d.score)))throw fail(400,'Preencha álbum, artista, nota e os textos da review.');
  const metadata=await releaseMetadata(title,artist),id=`${slug(artist)}-${slug(title)}`,release=metadata.release||`${year}-01-01T00:00:00Z`,score=Math.max(0,Math.min(10,Math.round(Number(d.score)||0))),placement=score>=9&&['frequency','radar'].includes(d.placement)?d.placement:'none',record={id,title,artist,release,releaseVerified:Boolean(metadata.release),type:metadata.type||'Álbum',genre:metadata.genre||'Curadoria',score,placement,shortReview:shortSentence(d.review),review:[String(d.review||'Nova escuta'),...String(d.body||'').split(/\n\s*\n/).filter(Boolean)],cover:metadata.cover||baseCatalog[0].cover,coverOriginal:metadata.cover||baseCatalog[0].coverOriginal||baseCatalog[0].cover,coverVariants:[],coverWidth:3000,coverHeight:3000,color:'#283cff',tracks:metadata.tracks||[],credits:[],sources:metadata.sources||[],source:metadata.coverSource||'Cadastro manual',coverSource:metadata.coverSource||'Cadastro manual',label:metadata.label||'',url:metadata.url||'#',listenLabel:metadata.listenLabel||'Dados em edição',catalogDescription:`${metadata.type||'Álbum'} de ${artist}, lançado em ${new Date(release).getUTCFullYear()}. ${metadata.tracks?.length?`${metadata.tracks.length} faixas.`:''}`,artistProfile:metadata.artistProfile,artistPhoto:metadata.artistPhoto};
  record.review=[record.shortReview,String(d.review),...String(d.body||'').split(/\n\s*\n/).filter(Boolean)];const published=await readPublished(),index=published.findIndex(x=>x.id===id);if(placement==='frequency')published.forEach(x=>{if(x.placement==='frequency')x.placement='none'});if(index>=0)published[index]=record;else published.unshift(record);await writeFile(publishedFile,JSON.stringify(published,null,2));albumIds.add(id);return json(res,201,{ok:true,id});
 }
 if(url.pathname==='/api/comments'){
  const album=url.searchParams.get('album');if(!albumIds.has(album))throw fail(404,'Álbum não encontrado.');
  if(req.method==='GET'){const offset=Number(url.searchParams.get('offset')||0);if(!Number.isSafeInteger(offset)||offset<0)throw fail(400,'Página inválida.');return json(res,200,page(album,offset));}
  if(req.method!=='POST')throw fail(405,'Método não permitido.');
  if(req.headers.origin!==url.origin)throw fail(403,'Envie o comentário pela página do álbum.');
  if(!req.headers['content-type']?.startsWith('application/json'))throw fail(415,'Formato inválido.');
  if(Number(req.headers['content-length'])>16000)throw fail(413,'Comentário muito longo.');
  let chunks=[],size=0;for await(const chunk of req){size+=chunk.length;if(size>16000)throw fail(413,'Comentário muito longo.');chunks.push(chunk);}
  let input;try{input=JSON.parse(Buffer.concat(chunks).toString());}catch{throw fail(400,'Dados inválidos.');}
  const nick=typeof input?.nick==='string'?input.nick.trim():'',body=typeof input?.body==='string'?input.body.trim():'';
  if(!nick||nick.length>32||!body||body.length>2000||!Number.isInteger(input.score)||input.score<0||input.score>10||!/^\w[\w-]{15,79}$/.test(input.id||''))throw fail(400,'Preencha o nick, o comentário e uma nota inteira de 0 a 10.');
  const existing=db.prepare('SELECT * FROM comments WHERE id=?').get(input.id);
  if(existing){if(existing.album!==album||existing.nick!==nick||existing.body!==body||existing.score!==input.score)throw fail(409,'Comentário já enviado com outros dados.');return json(res,200,page(album));}
  db.prepare('INSERT INTO comments(id,album,nick,body,score,created) VALUES(?,?,?,?,?,?)').run(input.id,album,nick,body,input.score,new Date().toISOString());return json(res,201,page(album));
 }
 if(url.pathname.startsWith('/api/'))throw fail(404,'Serviço não encontrado.');
 if(url.pathname==='/catalog.json'){const published=await readPublished(),rank=x=>x.placement==='frequency'?0:x.placement==='radar'?1:2;published.sort((a,b)=>rank(a)-rank(b));return json(res,200,[...published,...baseCatalog]);}
 if(!['GET','HEAD'].includes(req.method))throw fail(405,'Método não permitido.');
 const candidate=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(candidate!==root&&!candidate.startsWith(root+path.sep))throw fail(403,'Não permitido.');
 const file=await realpath(candidate===root?path.join(root,'index.html'):candidate);if(!file.startsWith(root+path.sep))throw fail(403,'Não permitido.');
 const body=await readFile(file),headers={'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Accept-Ranges':'bytes'};
 if(req.headers.range&&req.method==='GET'){
  const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if(!range||(!range[1]&&!range[2])){res.writeHead(416,{...headers,'Content-Range':`bytes */${body.length}`});return res.end();}
  const start=range[1]?Number(range[1]):Math.max(0,body.length-Number(range[2]));
  const end=range[1]&&range[2]?Math.min(body.length-1,Number(range[2])):body.length-1;
  if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start<0||start>=body.length||end<start){res.writeHead(416,{...headers,'Content-Range':`bytes */${body.length}`});return res.end();}
  res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${body.length}`,'Content-Length':end-start+1});return res.end(body.subarray(start,end+1));
 }
 res.writeHead(200,{...headers,'Content-Length':body.length});res.end(req.method==='HEAD'?undefined:body);
}catch(e){json(res,e.status||(e.code==='ENOENT'?404:500),{error:e.status?e.message:e.code==='ENOENT'?'Não encontrado.':'Não foi possível salvar ou carregar. Tente novamente.'});}
});
server.listen(port,host,()=>console.log(`Local: http://${host}:${port}`));
