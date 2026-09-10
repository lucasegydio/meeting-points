import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {artistPhotos as existing} from '../dist/artist-photos.js';
const require=createRequire(import.meta.url),sharp=require(require.resolve('sharp',{paths:['C:/Users/Lucas/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules']}));
const manifest=JSON.parse(await readFile('../.motion-analysis/artist-research-round2/manifest.json','utf8'));
const photos=[...existing],profiles=[];await mkdir('dist/assets/artists',{recursive:true});
for(const p of manifest.profiles){
 const {photo,additionalPhotos,...profile}=p;profiles.push(profile);
 if(photos.some(x=>x.artist===p.artist))continue;
 const input=await readFile(photo.localPath),m=await sharp(input).metadata();
 const id=p.artist.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
 const base='assets/artists/'+id,original=base+'-original.'+(m.format==='png'?'png':'jpg');await writeFile('dist/'+original,input);
 const variants=[];for(const width of [...new Set([480,960,Math.min(m.width,1600)].filter(w=>w<=m.width))]){const src=base+'-'+width+'.webp';await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:93}).toFile('dist/'+src);variants.push({src,width});}
 const caption=p.artist==='Danny L Harle e Doss'?'Danny L Harle · retrato de divulgação da XL Recordings':p.artist==='slayr'?'slayr · campanha Ascending do SoundCloud':p.artist==='Burial'?'Burial · autorretrato público de 2014':p.artist==='Charli xcx'?'Charli xcx · Tramlines, 2012':p.artist==='Cyst, Iglooghost e daisy*'?'Cyst · imagem de divulgação do duo':p.artist+' · fotografia de divulgação';
 photos.push({id,artist:p.artist,caption,source:photo.source,credit:(photo.credit||'Divulgação · fotógrafo não identificado')+(photo.license?' · versão redimensionada':''),license:photo.license,rights:photo.rights,notes:photo.notes||null,original,src:variants.at(-1).src,variants,width:m.width,height:m.height});
 console.log(p.artist,m.width+'×'+m.height);
}
await writeFile('dist/artist-directory.js','// Public sourced facts; null means not verified. Do not invent birthdays.\nexport const artistDirectory='+JSON.stringify(profiles,null,2)+';\n');
await writeFile('dist/artist-photos.js','// Photo originals, responsive derivatives, credit and source.\nexport const artistPhotos='+JSON.stringify(photos,null,2)+';\n');
console.log('Profiles:',profiles.length,'Photo records:',photos.length);
