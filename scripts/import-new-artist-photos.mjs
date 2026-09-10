import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require(require.resolve('sharp',{paths:['C:/Users/Lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const artists=[['krewella','https://image-cdn-ak.spotifycdn.com/image/ab6761610000e5eb07f54b59b3c41e965e4ae046'],['skrillex','https://image-cdn-ak.spotifycdn.com/image/ab6761610000e5eb09a2575e4cfa8af8bce207d1']];
await mkdir('dist/assets/artists',{recursive:true});for(const [id,url] of artists){const r=await fetch(url);if(!r.ok)throw Error(id+' '+r.status);const b=Buffer.from(await r.arrayBuffer()),m=await sharp(b).metadata();await writeFile('dist/assets/artists/'+id+'-original.jpg',b);for(const width of [480,640])await sharp(b).resize(width,width,{fit:'inside',withoutEnlargement:true}).webp({quality:90}).toFile('dist/assets/artists/'+id+'-'+Math.min(width,m.width)+'.webp');console.log(id,m.width,m.height);}
