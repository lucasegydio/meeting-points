let cleanup=()=>{};
export function bindRail(root){
 cleanup();const rail=root.querySelector('.album-rail');const controls=root.querySelector('.rail-controls');if(!rail||!controls){cleanup=()=>{};return;}
 let viewport=rail.parentElement;if(!viewport.classList.contains('rail-viewport')){viewport=document.createElement('div');viewport.className='rail-viewport';rail.before(viewport);viewport.append(rail);viewport.insertAdjacentHTML('beforeend','<button class="rail-overlay rail-overlay-prev" aria-label="Discos anteriores">←</button><button class="rail-overlay rail-overlay-next" aria-label="Próximos discos">→</button>');}
 const overlayPrev=viewport.querySelector('.rail-overlay-prev'),overlayNext=viewport.querySelector('.rail-overlay-next');
 const lifecycle=new AbortController(),options={signal:lifecycle.signal};
 const prev=controls.querySelector('[data-rail-prev]'),next=controls.querySelector('[data-rail-next]'),slider=controls.querySelector('.rail-slider'),position=controls.querySelector('.rail-position');
 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const max=()=>Math.max(0,rail.scrollWidth-rail.clientWidth);
 let dragging=false,frame=0;
 function update(){const limit=max(),x=rail.scrollLeft;prev.disabled=x<2;next.disabled=x>=limit-2;overlayPrev.disabled=prev.disabled;overlayNext.disabled=next.disabled;slider.disabled=limit<2;slider.value=limit?String(x/limit*100):'0';const cards=[...rail.querySelectorAll('.album-card')];if(!cards.length){position.textContent='Sem resultados';return;}const left=rail.getBoundingClientRect().left,right=left+rail.clientWidth;const visible=cards.map((c,i)=>({i,r:c.getBoundingClientRect()})).filter(c=>c.r.right>left+15&&c.r.left<right-15);position.textContent=visible.length?`${String(visible[0].i+1).padStart(2,'0')}–${String(visible.at(-1).i+1).padStart(2,'0')} / ${cards.length}`:`${cards.length} discos`;}
 function move(delta){rail.scrollBy({left:delta,behavior:reduced()?'instant':'smooth'});}
 prev.addEventListener('click',()=>move(-rail.clientWidth*.85),options);next.addEventListener('click',()=>move(rail.clientWidth*.85),options);
 overlayPrev.addEventListener('click',()=>move(-rail.clientWidth*.85),options);overlayNext.addEventListener('click',()=>move(rail.clientWidth*.85),options);
 slider.addEventListener('input',()=>{rail.scrollLeft=Number(slider.value)/100*max();},options);
 rail.addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);},options);
 rail.addEventListener('keydown',e=>{if(e.target!==rail)return;if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();if(e.key==='Home'||e.key==='End')rail.scrollTo({left:e.key==='Home'?0:max(),behavior:reduced()?'instant':'smooth'});else move((e.key==='ArrowLeft'?-1:1)*320);}},options);
 // Touch and trackpad use native scrolling. Mouse dragging is optional, without trapping vertical wheel gestures.
 let origin=null;
 rail.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button!==0)return;origin={x:e.clientX,left:rail.scrollLeft};dragging=false;},options);
 window.addEventListener('pointermove',e=>{if(!origin)return;const dx=e.clientX-origin.x;if(Math.abs(dx)>6){dragging=true;rail.classList.add('is-dragging');rail.scrollLeft=origin.left-dx;}},options);
 window.addEventListener('pointerup',()=>{origin=null;rail.classList.remove('is-dragging');},options);
 rail.addEventListener('click',e=>{if(dragging){e.preventDefault();dragging=false;}},{...options,capture:true});
 rail.addEventListener('dragstart',e=>e.preventDefault(),options);
 const resize=new ResizeObserver(update);resize.observe(rail);update();cleanup=()=>{lifecycle.abort();resize.disconnect();cancelAnimationFrame(frame);};
}
