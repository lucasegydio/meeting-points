import {readFile,writeFile,stat} from 'node:fs/promises';
const file='dist/audio/hopecore-review.mp3';if((await stat(file)).size<10000)throw Error('Audio incomplete');
const catalog=JSON.parse(await readFile('dist/catalog.json','utf8'));
catalog.find(a=>a.id==='anatole-muster-hopecore').audioReview={src:'audio/hopecore-review.mp3',synthetic:true,voice:'pt-BR-AntonioNeural',adapted:true,transcript:await readFile('dist/audio/hopecore-narration.txt','utf8')};
await writeFile('dist/catalog.json',JSON.stringify(catalog,null,2)+'\n');console.log('Narration linked, original review unchanged.');
