import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require(require.resolve('sharp',{paths:['C:/Users/Lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const candidates=[
 {id:'anatole-accordion',artist:'Anatole Muster',path:'../.motion-analysis/artist-research/anatole-1.jpg',source:'https://anatolemuster.com/',caption:'Anatole Muster com acordeom',credit:'Acervo do artista · fotógrafo não identificado',rights:'Sem licença aberta identificada; conferir autorização antes de publicação pública.'},
 {id:'anatole-standing',artist:'Anatole Muster',path:'../.motion-analysis/artist-research/anatole-alt.png',source:'https://anatolemuster.com/',caption:'Anatole Muster · retrato com acordeom',credit:'Acervo do artista · fotógrafo não identificado',rights:'Sem licença aberta identificada; conferir autorização antes de publicação pública.'},
 {id:'gaspard-auge',artist:'Gaspard Augé',url:'https://upload.wikimedia.org/wikipedia/commons/2/26/Justice_-_2601634722_%28cropped%29.jpg',source:'https://commons.wikimedia.org/wiki/File:Justice_-_2601634722_%28cropped%29.jpg',caption:'Gaspard Augé · recorte de uma fotografia de Justice',credit:'Gerard Romans Camps · CC BY 2.0 · recorte da fonte',license:'https://creativecommons.org/licenses/by/2.0/',rights:'CC BY 2.0; arquivo convertido para WebP e redimensionado sem novo recorte.'},
 {id:'nate-sib',artist:'Nate Sib',path:'../.motion-analysis/artist-research/nate.png',source:'https://www.republicrecords.com/pages/artists',caption:'Nate Sib · retrato de divulgação',credit:'Republic Records · fotógrafo não identificado',rights:'Sem licença aberta identificada; conferir autorização antes de publicação pública.'},
 {id:'dorian-electra',artist:'Dorian Electra',url:'https://upload.wikimedia.org/wikipedia/commons/1/16/DorianElectra_ReithHumphreys2.jpg',source:'https://commons.wikimedia.org/wiki/File:DorianElectra_ReithHumphreys2.jpg',caption:'Dorian Electra em apresentação em Vancouver',credit:'ReithHumphreys · CC BY-SA 4.0 · redimensionada',license:'https://creativecommons.org/licenses/by-sa/4.0/',rights:'CC BY-SA 4.0; derivados WebP oferecidos sob a mesma licença, sem recorte no arquivo.'}
];
await mkdir('dist/assets/artists',{recursive:true});const photos=[];
for(const c of candidates){
 try{
  let buffer;if(c.path)buffer=await readFile(c.path);else{const r=await fetch(c.url,{headers:{'User-Agent':'meeting.points private preview / image attribution research'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);buffer=Buffer.from(await r.arrayBuffer());}
  const m=await sharp(buffer).metadata(),base='assets/artists/'+c.id,original=base+'-original.'+(m.format==='png'?'png':'jpg');await writeFile('dist/'+original,buffer);
  const variants=[];for(const width of [...new Set([480,960,Math.min(m.width,1600)].filter(w=>w<=m.width))]){const src=base+'-'+width+'.webp';await sharp(buffer).resize({width,withoutEnlargement:true}).webp({quality:94}).toFile('dist/'+src);variants.push({width,src});}
  const {path,url,...meta}=c;photos.push({...meta,original,src:variants.at(-1).src,variants,width:m.width,height:m.height});console.log(c.artist,m.width+'×'+m.height);
 }catch(e){console.warn(c.artist+': '+e.message);}
}
if(!photos.some(p=>p.artist==='Gaspard Augé'))throw Error('Required contextual portrait unavailable');
await writeFile('dist/artist-photos.js','// Verified photo sources, attribution and reuse information.\nexport const artistPhotos='+JSON.stringify(photos,null,2)+';\n');
