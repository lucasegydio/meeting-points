let dispose=()=>{};
export function bindStackInteraction(root,onReorder=()=>true){
 dispose();const gallery=root.querySelector('.stack-gallery');if(!gallery)return;
 const events=new AbortController(),options={signal:events.signal},scene=gallery.querySelector('.stack-scene'),caption=gallery.querySelector('.stack-caption');
 let cards=[...scene.querySelectorAll('.stack-cover')],selected=0,drag=null,suppress=false,lastPointer=null;
 const status=document.createElement('p');status.className='sr-only';status.setAttribute('aria-live','polite');scene.append(status);
 function select(index,focus=false){
  selected=(index+cards.length)%cards.length;
  cards.forEach((c,i)=>{c.classList.toggle('is-selected',i===selected);c.setAttribute('aria-pressed',String(i===selected));c.style.setProperty('--layer',String((i-selected+cards.length)%cards.length));c.style.setProperty('--layer-step','20px');});
  const c=cards[selected];caption.querySelector('strong').textContent=c.dataset.title;caption.querySelector('.stack-artist').textContent=c.dataset.artist;caption.querySelector('.stack-genre').textContent=c.dataset.genre;caption.querySelector('.stack-rating').textContent=c.dataset.score;caption.querySelector('a').href=c.dataset.href;gallery.querySelector('.stack-position').textContent=String(selected+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');if(focus)c.focus({preventScroll:true});
 }
 function reorder(card,index){const from=cards.indexOf(card);cards.splice(from,1);cards.splice(index,0,card);cards.forEach(c=>scene.insertBefore(c,status));select(0);const saved=onReorder(cards.map(c=>c.dataset.id));status.textContent=card.dataset.title+' na posição '+(index+1)+'.'+(saved===false?' Não foi possível salvar a preferência neste navegador.':'');}
 function finish(cancel=false){if(!drag)return;const state=drag;drag=null;if(state.card.hasPointerCapture?.(state.pointerId))state.card.releasePointerCapture(state.pointerId);state.card.classList.remove('is-dragging');state.card.style.removeProperty('--drag-x');state.card.style.removeProperty('--drag-y');gallery.classList.remove('is-reordering');if(state.moved){suppress=true;if(!cancel)reorder(state.card,state.to);else {select(selected);status.textContent='Reordenação cancelada.';}}}
 cards.forEach(card=>{
  card.addEventListener('pointerenter',e=>{if(drag||e.pointerType==='touch'||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;if(lastPointer&&Math.hypot(e.clientX-lastPointer.x,e.clientY-lastPointer.y)<4)return;lastPointer={x:e.clientX,y:e.clientY};select(cards.indexOf(card));},options);
  card.addEventListener('focus',()=>{if(!drag)select(cards.indexOf(card));},options);
  card.addEventListener('pointerdown',e=>{if(e.button!==0)return;suppress=false;select(cards.indexOf(card));drag={card,x:e.clientX,y:e.clientY,pointerId:e.pointerId,moved:false,to:cards.indexOf(card)};},options);
  card.addEventListener('pointermove',e=>{if(!drag||drag.card!==card||drag.pointerId!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)<9&&!drag.moved)return;if(!drag.moved){drag.moved=true;card.setPointerCapture(e.pointerId);gallery.classList.add('is-reordering');card.classList.add('is-dragging');}e.preventDefault();card.style.setProperty('--drag-x',dx+'px');card.style.setProperty('--drag-y',dy+'px');const r=scene.getBoundingClientRect();drag.to=Math.max(0,Math.min(cards.length-1,Math.abs(dy)>Math.abs(dx)?cards.indexOf(card)+Math.round(dy/45):Math.floor((e.clientX-r.left)/Math.max(1,r.width)*cards.length)));const preview=cards.filter(c=>c!==card);preview.splice(drag.to,0,card);preview.forEach((c,i)=>{if(c!==card){c.classList.remove('is-selected');c.style.setProperty('--layer',String(i));}});lastPointer={x:e.clientX,y:e.clientY};},options);
  card.addEventListener('pointerup',()=>finish(),options);card.addEventListener('pointercancel',()=>finish(true),options);card.addEventListener('lostpointercapture',()=>finish(true),options);
  card.addEventListener('click',e=>{if(suppress){e.preventDefault();suppress=false;return;}location.hash=card.dataset.href;},options);
  card.addEventListener('keydown',e=>{if(e.key==='Escape'){finish(true);return;}if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(e.key))return;e.preventDefault();const start=e.altKey?cards.indexOf(card):selected;const next=e.key==='Home'?0:e.key==='End'?cards.length-1:(start+(['ArrowLeft','ArrowUp'].includes(e.key)?-1:1)+cards.length)%cards.length;if(e.altKey){reorder(card,next);select(next,true);}else select(next,true);},options);
 });
 // Release outside a card must never leave the stack in a grabbed state.
 window.addEventListener('pointerup',()=>finish(),options);window.addEventListener('blur',()=>finish(true),options);
 gallery.querySelector('[data-stack-prev]').addEventListener('click',()=>select(selected-1),options);gallery.querySelector('[data-stack-next]').addEventListener('click',()=>select(selected+1),options);
 select(0);dispose=()=>{finish(true);events.abort();};
}
