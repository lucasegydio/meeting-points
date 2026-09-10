let dispose=()=>{};
export function bindCardTilt(root){
 dispose();const reduce=matchMedia('(prefers-reduced-motion: reduce)'),events=new AbortController(),options={signal:events.signal};const resets=[];
 root.querySelectorAll('.stack-cover,.artwork-front,.artwork-back-card,.editorial-image,.mood-listen-card>a:first-child,.mood-record').forEach(card=>{
  let x=0,y=0,tx=0,ty=0,vx=0,vy=0,frame=0,last=0;
  const tick=time=>{const dt=Math.min(2,(time-(last||time-16.67))/16.67);last=time;vx=(vx+(tx-x)*.12*dt)*Math.pow(.72,dt);vy=(vy+(ty-y)*.12*dt)*Math.pow(.72,dt);x+=vx*dt;y+=vy*dt;card.style.setProperty('--tilt-x',x+'deg');card.style.setProperty('--tilt-y',y+'deg');card.style.setProperty('--shadow-x',(-y*.8)+'px');if(Math.abs(tx-x)+Math.abs(ty-y)+Math.abs(vx)+Math.abs(vy)>.02)frame=requestAnimationFrame(tick);else{frame=0;last=0;}};
  const target=(a,b)=>{tx=a;ty=b;if(!frame)frame=requestAnimationFrame(tick);};
  const reset=()=>{cancelAnimationFrame(frame);frame=last=x=y=tx=ty=vx=vy=0;card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg');};resets.push(reset);
  card.addEventListener('pointermove',e=>{if(reduce.matches||card.classList.contains('is-dragging')||(card.classList.contains('stack-cover')&&!card.classList.contains('is-selected')))return;const r=card.getBoundingClientRect(),clamp=n=>Math.max(-1,Math.min(1,n));target(-clamp((e.clientY-r.top)/r.height*2-1)*12,clamp((e.clientX-r.left)/r.width*2-1)*12);},options);
  card.addEventListener('pointerleave',()=>target(0,0),options);card.addEventListener('pointerup',e=>{if(e.pointerType==='touch')target(0,0);},options);card.addEventListener('pointercancel',reset,options);
 });
 reduce.addEventListener('change',()=>{if(reduce.matches)resets.forEach(fn=>fn());},options);
 dispose=()=>{events.abort();resets.forEach(fn=>fn());};
}
