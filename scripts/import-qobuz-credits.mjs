import {readFile,writeFile} from 'node:fs/promises';
import {norm} from './catalog-network.mjs';
const sources={
 'dorian-electra':'https://www.qobuz.com/au-en/album/dorian-electra-dorian-electra/poalljwzpjitg',
 'sam-gellaitry-anywhere':'https://www.qobuz.com/us-en/album/anywhere-here-is-perfect-sam-gellaitry/q2vjpuzbvf4xp',
 'frost-children-tweaker':'https://www.qobuz.com/ie-en/album/tweaker-poem-frost-children/qvc2oqv4fbhld',
 'cyst-00':'https://www.qobuz.com/ie-en/album/cyst-iglooghost-daisy/o8hbodxdb89nh',
 'nate-sib-reborn':'https://www.qobuz.com/us-en/album/reborn-nate-sib/s4c8a3wrkdcu7',
 'zeds-dead-return':'https://www.qobuz.com/us-en/album/return-to-the-return-of-the-spectrum-of-intergalactic-happiness-zeds-dead/e3b33cjd22b0d',
 'tiffany-day-halo':'https://www.qobuz.com/us-en/album/halo-tiffany-day/nzhhk1gzqhflt',
 'rico-nasty-rx':'https://www.qobuz.com/fr-fr/album/rx-rico-nasty/gtks2yjweix31',
 'danny-doss-crystallise':'https://www.qobuz.com/ie-en/album/crystallise-divergence-danny-l-harle-doss/pv9shmkfrgyby'
};
const roles={Producer:'Produção',CoProducer:'Coprodução',ExecutiveProducer:'Produção executiva',Composer:'Composição',ComposerLyricist:'Composição e letra',Lyricist:'Letra',Writer:'Composição',MixingEngineer:'Mixagem',Mixer:'Mixagem',Masterer:'Masterização',MasteringEngineer:'Masterização','Recorded by':'Gravação',RecordingEngineer:'Gravação',Remixer:'Remix',Programmer:'Programação',Programming:'Programação'};
const decode=s=>s.replace(/&#(\d+);/g,(_,v)=>String.fromCodePoint(+v)).replace(/&quot;/g,'"').replace(/&apos;|&#039;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ');
const plain=s=>decode(s.replace(/<[^>]*>/g,'')).replace(/\s+/g,' ').trim();
const catalogue=JSON.parse(await readFile('dist/catalog.json','utf8'));
const audit=[];
for(const [id,url] of Object.entries(sources)){
 const a=catalogue.find(x=>x.id===id);if(!a)continue;
 try{
  const response=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!response.ok)throw Error('HTTP '+response.status);
  const html=await response.text();let matched=0,added=0;
  for(const chunk of html.split('data-track-v2="').slice(1)){
   const info=chunk.match(/<p\s+class="track__info"[^>]*>([\s\S]*?)<\/p>/);
   const title=chunk.match(/class="track__items"\s+title="([^"]+)"/);
   const meta=chunk.match(/^([^"]+)"/);
   if(!info||!title||!meta)continue;
   const identity=JSON.parse(decode(meta[1]));
   if(!norm(a.artist).includes(norm(identity.item_brand)))continue;
   const titleKey=s=>norm(s.replace(/\s*[-–]?\s*EP$/i,'').replace(/\s*\(DELUXE\)$/i,''));
   if(titleKey(a.title)!==titleKey(identity.item_category)&&a.id!=='cyst-00')continue;
   const trackKey=s=>norm(s.replace(/\s*\(feat\.[^)]*\)/i,''));
   const t=a.tracks.find(t=>trackKey(t.name)===trackKey(decode(title[1])));if(!t)continue;
   matched++;t.credits??=[];
   for(const person of plain(info[1]).split(' - ')){
    const [name,...parts]=person.split(',').map(s=>s.trim());
    for(const role of parts.filter(x=>roles[x])){
     if(t.credits.some(c=>norm(c.name)===norm(name)&&c.role===roles[role]))continue;
     t.credits.push({name,role:roles[role],source:{name:'Qobuz',url}});added++;
    }
   }
  }
  audit.push({id,matched,added,url});console.log(id+': '+matched+' faixas, '+added+' créditos adicionados');
 }catch(e){audit.push({id,error:e.message,url});console.log(id+': '+e.message);}
}
const overrides=JSON.parse(await readFile('scripts/verified-credit-overrides.json','utf8'));
for(const a of catalogue){
 if(a.coverSourceUrl?.includes('mzstatic.com'))a.coverSource='Apple / iTunes';
 const extra=overrides[a.id];if(!extra)continue;
 for(const t of a.tracks){
  const credits=[...(extra.tracks?.[t.name]||[]),...(extra.remixersByTrackNumber?.[t.number]||[]).map(name=>({name,role:'Remix'}))];
  for(const c of credits){t.credits??=[];if(!t.credits.some(x=>norm(x.name)===norm(c.name)&&x.role===c.role))t.credits.push({...c,source:extra.source});}
 }
}
await writeFile('dist/catalog.json',JSON.stringify(catalogue,null,2)+'\n');
await writeFile('scripts/qobuz-credits-audit.json',JSON.stringify(audit,null,2)+'\n');
