// Legacy importer retained for history. Use import-selection.mjs for the active collection.
import { mkdir, writeFile } from 'node:fs/promises';
const queries = ['The Marias Submarine','Magdalena Bay Imaginal Disk','Charli xcx how im feeling now','Billie Eilish HIT ME HARD AND SOFT','Clairo Charm','Radiohead In Rainbows'];
await mkdir('dist/assets',{recursive:true});
const albums=[];
for(const [i,q] of queries.entries()){
 const result=await fetch('https://itunes.apple.com/search?'+new URLSearchParams({term:q,entity:'album',limit:'5'})).then(r=>r.json());
 const a=result.results[0]; if(!a)throw Error('Album not found: '+q);
 const lookup=await fetch(`https://itunes.apple.com/lookup?id=${a.collectionId}&entity=song`).then(r=>r.json());
 const cover=a.artworkUrl100.replace('100x100bb','600x600bb');
 const img=await fetch(cover); if(!img.ok)throw Error('Cover failed');
 await writeFile(`dist/assets/album-${i}.jpg`,new Uint8Array(await img.arrayBuffer()));
 albums.push({id:String(a.collectionId),title:a.collectionName,artist:a.artistName,cover:`assets/album-${i}.jpg`,url:a.collectionViewUrl,release:a.releaseDate,genre:a.primaryGenreName,tracks:lookup.results.filter(t=>t.wrapperType==='track').map(t=>({name:t.trackName,number:t.trackNumber,duration:t.trackTimeMillis,url:t.trackViewUrl})),score:[9.2,9.6,8.8,9.0,8.5,9.8][i],listened:i<4?2026:2025,color:['#789fab','#b3c5ce','#99bd48','#588392','#bf9977','#b97849'][i]});
 console.log(a.artistName+' — '+a.collectionName);
}
await writeFile('dist/catalog.json',JSON.stringify(albums,null,2));
