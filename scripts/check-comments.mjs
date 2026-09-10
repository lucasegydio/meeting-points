import {spawn} from 'node:child_process';
import {mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {once} from 'node:events';
import assert from 'node:assert/strict';
const data=await mkdtemp(path.join(tmpdir(),'frequencia-comments-'));
const origin='http://127.0.0.1:4174',endpoint=origin+'/api/comments?album=cyst-00';
let child;
async function start(){child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'4174',FREQUENCIA_DATA_DIR:data},windowsHide:true,stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{child.stdout.on('data',d=>{if(String(d).includes('Local:'))resolve();});child.on('error',reject);child.once('exit',code=>reject(Error('Server exited '+code)));});}
async function stop(){const done=once(child,'exit');child.kill();await done;}
const post=(payload,customOrigin=origin)=>fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json',Origin:customOrigin},body:JSON.stringify(payload)});
try{
 await start();assert.equal((await fetch(origin)).status,200);
 const payload={id:crypto.randomUUID(),nick:'teste <script>',body:'Persistência com acentos e <b>texto</b>',score:0};
 assert.equal((await post(payload)).status,201);assert.equal((await post(payload)).status,200);
 assert.equal((await post({...payload,id:crypto.randomUUID(),score:9.2})).status,400);
 assert.equal((await post({...payload,id:crypto.randomUUID(),score:11})).status,400);
 assert.equal((await post({...payload,id:crypto.randomUUID(),nick:' '})).status,400);
 assert.equal((await post({...payload,id:crypto.randomUUID()},'https://example.com')).status,403);
 assert.equal((await post({...payload,id:crypto.randomUUID(),score:10})).status,201);
 assert.equal((await (await fetch(origin+'/api/comments?album=dorian-electra')).json()).total,0);
 await stop();await start();const saved=await(await fetch(endpoint)).json();assert.equal(saved.total,2);assert.equal(saved.comments[0].body,payload.body);assert.ok(saved.comments.every(x=>Number.isInteger(x.score)));
 assert.equal((await fetch(origin+'/api/comments?album=unknown')).status,404);
 assert.equal((await fetch(origin+'/.data/comments.sqlite')).status,404);
 console.log('Comments passed: persistent after restart; 0/10 accepted; decimals rejected; album isolation, origin validation, idempotency and private database verified.');
}finally{if(child?.exitCode===null)await stop();}
