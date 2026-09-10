import {api} from './catalog-network.mjs';
for(const id of ['e08c3db9-fc33-4d4e-b8b7-818d34228bef','6d3e269c-a5b3-4fed-89dd-a862a5200bb6','715d4a00-2ad5-4882-b1be-24853344315e']){
 try{const art=await api('https://coverartarchive.org/release/'+id+'/');console.log(JSON.stringify({id,images:art?.images?.map(i=>({front:i.front,back:i.back,approved:i.approved,image:i.image}))}));}catch(e){console.log(id,e.message);}
}
const x=await api('https://musicbrainz.org/ws/2/release/e08c3db9-fc33-4d4e-b8b7-818d34228bef?inc=recordings+artist-rels+recording-level-rels+work-rels+labels+artist-credits&fmt=json');console.log(JSON.stringify({date:x.date,label:x['label-info'],relations:x.relations,track:x.media?.[0]?.tracks?.[1]}));
const d=await api('https://api.deezer.com/track/4121697531');console.log(JSON.stringify({deezer:d}));
