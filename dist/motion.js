const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const fine=window.matchMedia('(hover: hover) and (pointer: fine)');
let observer,clearStack=()=>{};
export function animatePage(root){
 observer?.disconnect();
 if(reduced.matches)return;
 const candidates=root.querySelectorAll('.intro,.hero,.section-head,.bottom-grid>div,.page-heading,.detail-top,.detail-copy,.track-section,.mood-board figure');
 observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;entry.target.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'translateY(0)'}],{duration:650,easing:'cubic-bezier(.2,.7,.2,1)',fill:'none'});observer.unobserve(entry.target);}},{threshold:.08});
 candidates.forEach(el=>observer.observe(el));
}
export function animateGrid(root){
 if(reduced.matches)return;
 root.querySelectorAll('.album-card').forEach((card,i)=>card.animate([{opacity:0,transform:'translateY(18px) scale(.975)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:420,delay:i*45,easing:'cubic-bezier(.2,.75,.25,1)',fill:'backwards'}));
}
export function bindDepth(root){
 if(!fine.matches||reduced.matches)return;
 root.querySelectorAll('.hero-art,.cover-wrap').forEach(el=>{
 let frame=0;
 el.addEventListener('pointermove',e=>{if(reduced.matches)return;cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{const r=el.getBoundingClientRect();el.style.setProperty('--pointer-x',String((e.clientX-r.left)/r.width-.5));el.style.setProperty('--pointer-y',String((e.clientY-r.top)/r.height-.5));});});
 el.addEventListener('pointerleave',()=>{cancelAnimationFrame(frame);el.style.setProperty('--pointer-x','0');el.style.setProperty('--pointer-y','0');});
 });
}
export function bindStack(root){
 clearStack();clearStack=()=>{};
 const gallery=root.querySelector('.stack-gallery');if(!gallery)return;
 const cards=[...gallery.querySelectorAll('.stack-cover')];
 const caption=gallery.querySelector('.stack-caption');
 const indexLabel=gallery.querySelector('.stack-position');
 let selected=Math.max(0,cards.findIndex(c=>c.getAttribute('aria-pressed')==='true'));
 let frame=0,previousTime=0,x=0,y=0,vx=0,vy=0,tx=0,ty=0,tilted=null;
 function tick(time){
  const dt=Math.min(2,(time-(previousTime||time-16.67))/16.67);previousTime=time;
  vx=(vx+(tx-x)*.12*dt)*Math.pow(.72,dt);vy=(vy+(ty-y)*.12*dt)*Math.pow(.72,dt);x+=vx*dt;y+=vy*dt;
  tilted?.style.setProperty('--tilt-x',x+'deg');tilted?.style.setProperty('--tilt-y',y+'deg');
  if(Math.abs(tx-x)+Math.abs(ty-y)+Math.abs(vx)+Math.abs(vy)>.02)frame=requestAnimationFrame(tick);else{frame=0;previousTime=0;}
 }
 function tilt(card,nextX,nextY){
  if(reduced.matches)return;if(tilted!==card){if(tilted){tilted.style.setProperty('--tilt-x','0deg');tilted.style.setProperty('--tilt-y','0deg');}tilted=card;x=y=vx=vy=0;}
  tx=nextX;ty=nextY;if(!frame)frame=requestAnimationFrame(tick);
 }
 clearStack=()=>{cancelAnimationFrame(frame);cards.forEach(c=>{c.style.setProperty('--tilt-x','0deg');c.style.setProperty('--tilt-y','0deg');});};
 function select(index,focus=false){
 selected=(index+cards.length)%cards.length;
 cards.forEach((c,i)=>{c.classList.toggle('is-selected',i===selected);c.setAttribute('aria-pressed',String(i===selected));c.style.setProperty('--layer',String((i-selected+cards.length)%cards.length));c.style.setProperty('--layer-step',`${Math.min(20,100/Math.max(1,cards.length-1))}px`);});
 const card=cards[selected];
 caption.querySelector('strong').textContent=card.dataset.title;
 caption.querySelector('.stack-artist').textContent=card.dataset.artist;
 const genre=caption.querySelector('.stack-genre');if(genre)genre.textContent=card.dataset.genre;
 caption.querySelector('.stack-rating').textContent=card.dataset.score+' / 10';
 caption.querySelector('a').href=card.dataset.href;
 indexLabel.textContent=String(selected+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
 if(focus)card.focus({preventScroll:true});
 }
 let lastPointer=null,suppressClick=false;
 cards.forEach((card,i)=>{
 card.addEventListener('pointerenter',e=>{if(!fine.matches)return;if(lastPointer&&Math.hypot(e.clientX-lastPointer.x,e.clientY-lastPointer.y)<4)return;lastPointer={x:e.clientX,y:e.clientY};select(i);});
 card.addEventListener('focus',()=>select(i));
 card.addEventListener('pointermove',e=>{if(i!==selected||(!fine.matches&&e.pointerType!=='touch'))return;const r=card.getBoundingClientRect();const px=Math.max(-1,Math.min(1,(e.clientX-r.left)/r.width*2-1)),py=Math.max(-1,Math.min(1,(e.clientY-r.top)/r.height*2-1));tilt(card,-py*12,px*12);});
 card.addEventListener('pointerleave',()=>{if(tilted===card)tilt(card,0,0);});
 card.addEventListener('click',()=>{if(!suppressClick){select(i);window.location.hash=card.dataset.href;}suppressClick=false;});
 card.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?cards.length-1:selected+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1);select(next,true);});
 });
 gallery.querySelector('[data-stack-prev]').addEventListener('click',()=>select(selected-1));
 gallery.querySelector('[data-stack-next]').addEventListener('click',()=>select(selected+1));
 // Horizontal swipes only: vertical touch movement remains native page scrolling.
 let origin=null;
 const scene=gallery.querySelector('.stack-scene');
 scene.addEventListener('pointerdown',e=>{suppressClick=false;if(e.pointerType==='touch')origin={x:e.clientX,y:e.clientY};});
 scene.addEventListener('pointerup',e=>{if(!origin)return;const dx=e.clientX-origin.x,dy=e.clientY-origin.y;origin=null;suppressClick=Math.hypot(dx,dy)>10;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.5)select(selected+(dx<0?1:-1));if(tilted)tilt(tilted,0,0);});
 scene.addEventListener('pointercancel',()=>{origin=null;});
 select(selected);
}
reduced.addEventListener('change',()=>{if(reduced.matches){clearStack();observer?.disconnect();document.getAnimations().forEach(a=>a.cancel());document.querySelectorAll('[style*="--pointer-"]').forEach(el=>{el.style.removeProperty('--pointer-x');el.style.removeProperty('--pointer-y');});}});
