import {readFile,writeFile,rename} from 'node:fs/promises';
import {api,norm} from './catalog-network.mjs';
const catalogue=JSON.parse(await readFile('dist/catalog.json','utf8')),audit=[];
const roleNames={producer:'Produção','co-producer':'Coprodução','executive producer':'Produção executiva',mix:'Mixagem',mixing:'Mixagem',mastering:'Masterização',engineer:'Engenharia de áudio',programming:'Programação',remixer:'Remix',composer:'Composição',writer:'Composição',lyricist:'Letra'};
const merge=(existing=[],next=[])=>[...existing,...next].filter((c,i,a)=>a.findIndex(x=>x.name===c.name&&x.role===c.role)===i);
function credits(relations=[],source){return relations.filter(r=>r.artist&&roleNames[r.type]).map(r=>({name:r.artist.name,artistId:r.artist.id,role:roleNames[r.type],source}));}
for(const a of catalogue){
 const report={id:a.id,tracks:a.tracks.length,bpm:0,production:0,errors:[]};
 const dz=a.sources?.find(x=>x.name==='Deezer');
 if(dz)try{
  const album=await api('https://api.deezer.com/album/'+new URL(dz.url).pathname.split('/').at(-1));
  if(norm(album.title)!==norm(a.title)||!norm(a.artist).includes(norm(album.artist.name)))throw Error('Album identity mismatch');
  let index=0;const worker=async()=>{while(index<a.tracks.length){const t=a.tracks[index++],hit=album.tracks.data.find(x=>norm(x.title)===norm(t.name)||norm(x.title_short)===norm(t.name));if(!hit)continue;try{
   const x=await api('https://api.deezer.com/track/'+hit.id);if(x.album?.id!==album.id||norm(x.title)!==norm(hit.title))continue;
   t.isrc=x.isrc||t.isrc;
   if(Number.isFinite(x.bpm)&&x.bpm>0&&x.bpm<400){t.bpm=x.bpm;t.bpmSource={name:'Deezer',url:x.link};}
   const mapped=(x.contributors||[]).filter(c=>roleNames[c.role?.toLowerCase()]).map(c=>({name:c.name,role:roleNames[c.role.toLowerCase()],source:{name:'Deezer',url:x.link}}));t.credits=merge(t.credits,mapped);
   t.contributors=(x.contributors||[]).map(c=>({name:c.name,role:c.role,url:c.link}));
  }catch(e){report.errors.push(t.name+': '+e.message);}}};await Promise.all([worker(),worker(),worker()]);
 }catch(e){report.errors.push('Deezer: '+e.message);}
 const mb=a.sources?.find(x=>x.name==='MusicBrainz');
 if(mb)try{
  const release=await api(mb.url.replace('https://musicbrainz.org/release/','https://musicbrainz.org/ws/2/release/')+'?inc=recordings+artist-rels+recording-level-rels+work-rels+labels+artist-credits&fmt=json');
  if(norm(release.title)!==norm(a.title))throw Error('Release identity mismatch');
  a.credits=merge(a.credits,credits(release.relations,mb));
  const tracks=(release.media||[]).flatMap(m=>m.tracks||[]);
  for(const t of a.tracks){const hit=tracks.find(x=>norm(x.title)===norm(t.name)||norm(x.recording?.title)===norm(t.name));if(!hit)continue;t.recordingId=hit.recording?.id;const src={name:'MusicBrainz',url:'https://musicbrainz.org/recording/'+t.recordingId};t.credits=merge(t.credits,credits(hit.recording?.relations,src));}
 }catch(e){report.errors.push('MusicBrainz: '+e.message);}
 report.bpm=a.tracks.filter(t=>t.bpm>0).length;report.production=a.tracks.filter(t=>t.credits?.some(c=>/produção|produç|Produção|Coprodução/.test(c.role))).length;
 a.technicalMetadataCheckedAt=new Date().toISOString();audit.push(report);console.log(a.title+': BPM '+report.bpm+'/'+report.tracks+', produção '+report.production+'/'+report.tracks+(report.errors.length?' ('+report.errors.length+' pendências)':''));
}
await writeFile('dist/catalog.json.tmp',JSON.stringify(catalogue,null,2)+'\n');await rename('dist/catalog.json.tmp','dist/catalog.json');await writeFile('scripts/track-details-audit.json',JSON.stringify(audit,null,2)+'\n');
