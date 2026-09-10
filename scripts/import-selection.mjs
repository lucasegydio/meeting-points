import {readFile,writeFile,mkdir} from 'node:fs/promises';
const items=JSON.parse(await readFile('scripts/selection.json','utf8'));
const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'').replace(/(ep|single)$/,'');
await mkdir('dist/assets/selection',{recursive:true});
const output=[];
for(const [i,item] of items.entries()){
 const a={...item,cover:`assets/selection/${item.id}.jpg`,release:'2026',listened:2026,color:'#db9466',tracks:[],source:'Referência enviada',genreSource:'Classificação editorial provisória',url:'https://open.spotify.com/search/'+encodeURIComponent(item.artist+' '+item.title),listenLabel:'Buscar no Spotify'};
 delete a.image;delete a.box;
 try{
  const r=await fetch('https://itunes.apple.com/search?'+new URLSearchParams({term:item.artist+' '+item.title.replace(/\(.*/,''),entity:'album',limit:'20'}),{signal:AbortSignal.timeout(12000)}).then(r=>r.json());
  const match=r.results?.find(x=>norm(x.collectionName)===norm(item.title)&&norm(x.artistName).includes(norm(item.artist.split(' e ')[0].split(',')[0])));
  if(match){const lookup=await fetch(`https://itunes.apple.com/lookup?id=${match.collectionId}&entity=song`,{signal:AbortSignal.timeout(12000)}).then(r=>r.json());const cover=await fetch(match.artworkUrl100.replace('100x100bb','600x600bb'));if(cover.ok)await writeFile('dist/'+a.cover,new Uint8Array(await cover.arrayBuffer()));a.release=match.releaseDate;a.url=match.collectionViewUrl;a.listenLabel='Ouvir no Apple Music';a.source='Apple / iTunes';a.catalogGenre=match.primaryGenreName;a.tracks=lookup.results.filter(t=>t.wrapperType==='track').map(t=>({name:t.trackName,number:t.trackNumber,duration:t.trackTimeMillis,url:t.trackViewUrl}));}
 }catch(e){console.log('Fallback:',item.id);}
 output.push(a);console.log(item.title+': '+a.source);
}
await writeFile('dist/catalog.json',JSON.stringify(output,null,2));
