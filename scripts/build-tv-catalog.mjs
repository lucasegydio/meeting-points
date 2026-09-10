import {readFile,writeFile} from 'node:fs/promises';
const primary=JSON.parse(await readFile('scripts/research/tv-primary.json','utf8'));
const editorial=JSON.parse(await readFile('scripts/tv-editorial.json','utf8'));
const shows=editorial.map((s,i)=>({...s,...Object.fromEntries(['video','length','poster','posterWidth','posterHeight','chapters','published','channel'].map(k=>[k,primary[i][k]])),checked:'2026-09-09'}));
await writeFile('dist/tv-data.js','// Generated from documented sources; edit scripts/tv-editorial.json.\nexport const shows='+JSON.stringify(shows,null,2)+';\n');
console.log('Built '+shows.length+' documented TV programs.');
