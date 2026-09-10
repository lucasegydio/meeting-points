let cleanup=()=>{};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function bindReview(root){
 cleanup();const abort=new AbortController(),options={signal:abort.signal};
 let modal,returnFocus,previousOverflow,turnAnimation,turnToken=0;
 const close=()=>{if(modal?.open)modal.close();};
 cleanup=()=>{turnToken++;turnAnimation?.cancel();close();if(previousOverflow!==undefined)document.body.style.overflow=previousOverflow;abort.abort();modal?.remove();};
 const art=root.querySelector('.artwork-deck');
 if(art){
  let sides=[{src:art.dataset.front,label:'Capa'},...(art.dataset.back?[{src:art.dataset.back,label:'Contracapa'}]:[])],current=0;
  modal=document.createElement('dialog');modal.className='art-lightbox';modal.setAttribute('aria-label','Arte do álbum');
  modal.innerHTML='<button class="art-close" aria-label="Fechar imagem" autofocus>×</button><figure><img alt=""><figcaption></figcaption></figure><div class="art-switch"></div><p class="art-error" role="status"></p>';
  document.body.append(modal);
  const display=()=>{const side=sides[current];modal.querySelector('img').src=side.src;modal.querySelector('img').alt=side.label+' de '+art.dataset.title;modal.querySelector('figcaption').textContent=side.label+' · '+art.dataset.title;modal.querySelector('.art-error').textContent='';modal.querySelector('.art-switch').innerHTML=sides.length>1?sides.map((s,i)=>`<button data-side="${i}" aria-pressed="${i===current}">${s.label}</button>`).join(''):'';};
  const open=index=>{if(art.classList.contains('is-flipping'))return;returnFocus=document.activeElement;current=index;display();previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';modal.showModal();};
  art.querySelector('.artwork-front').addEventListener('click',()=>open(0),options);
  art.querySelector('.artwork-back-open')?.addEventListener('click',()=>open(1),options);
  const back=art.querySelector('.artwork-back');let suppressArtClick=false;
  if(back){
   const card=document.createElement('button');card.type='button';card.className='artwork-back-card';card.setAttribute('aria-label','Ampliar contracapa de '+art.dataset.title);back.before(card);card.append(back);card.addEventListener('click',()=>{if(!suppressArtClick)open(1);suppressArtClick=false;},options);
   art.dataset.activeSide='0';const controls=document.createElement('div');controls.className='artwork-side-switch';controls.setAttribute('role','group');controls.setAttribute('aria-label','Folhear capa e contracapa');controls.innerHTML='<button type="button" data-deck-side="0" aria-pressed="true">Capa</button><button type="button" data-deck-side="1" aria-pressed="false">Contracapa</button>';art.querySelector('.artwork-stage').after(controls);
   let desired=0,busy=false;
   const flip=async index=>{
    desired=index;if(busy||String(index)===art.dataset.activeSide)return;
    const outgoing=art.dataset.activeSide==='1'?card:art.querySelector('.artwork-front'),stage=art.querySelector('.artwork-stage');
    const apply=()=>{art.dataset.activeSide=String(index);controls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.deckSide)===index)));};
    if(matchMedia('(prefers-reduced-motion: reduce)').matches||!outgoing.animate){apply();return;}
    busy=true;const token=++turnToken;art.classList.add('is-flipping');stage.setAttribute('aria-busy','true');
    const away='translate(58%, -8%) rotate(12deg) scale(.95)';
    try{
     outgoing.style.zIndex='4';
     turnAnimation=outgoing.animate([{transform:getComputedStyle(outgoing).transform},{transform:away}],{duration:220,easing:'cubic-bezier(.4,0,.6,1)',fill:'forwards'});
     await turnAnimation.finished;if(token!==turnToken)return;
     apply();outgoing.style.zIndex='1';
     const returning=outgoing.animate([{transform:away},{transform:'translate(4%, -3%) rotate(4deg) scale(.97)'}],{duration:340,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});
     turnAnimation.cancel();turnAnimation=returning;await returning.finished;
    }catch{/* Navigation and a changed motion preference can cancel safely. */}
    finally{if(token===turnToken){turnAnimation?.cancel();outgoing.style.removeProperty('z-index');art.classList.remove('is-flipping');stage.removeAttribute('aria-busy');busy=false;if(desired!==Number(art.dataset.activeSide))flip(desired);}}
   };
   controls.addEventListener('click',e=>{const b=e.target.closest('[data-deck-side]');if(b)flip(Number(b.dataset.deckSide));},options);
   let drag=null;const stage=art.querySelector('.artwork-stage');
   stage.querySelectorAll('img').forEach(img=>img.draggable=false);
   const finishDrag=(cancel=false)=>{
    if(!drag)return;const state=drag;drag=null;
    if(state.node.hasPointerCapture?.(state.pointerId))state.node.releasePointerCapture(state.pointerId);
    stage.classList.remove('is-art-dragging');state.node.classList.remove('is-dragging');
    if(state.moved){suppressArtClick=true;if(!cancel&&Math.abs(state.dx)>45){const side=state.node===card?1:0;const target=side===Number(art.dataset.activeSide)?1-side:side;desired=target;art.dataset.activeSide=String(target);controls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.deckSide)===target)));}}
    state.node.style.removeProperty('transform');state.node.style.removeProperty('z-index');
   };
   stage.addEventListener('pointerdown',e=>{if(e.button!==0||busy)return;const node=e.target.closest('button');if(!node||!stage.contains(node))return;suppressArtClick=false;drag={node,pointerId:e.pointerId,x:e.clientX,y:e.clientY,dx:0,moved:false};},options);
   stage.addEventListener('pointermove',e=>{if(!drag||drag.pointerId!==e.pointerId)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(!drag.moved&&Math.abs(dx)<9)return;if(!drag.moved&&e.pointerType==='touch'&&Math.abs(dy)>Math.abs(dx)*1.2){finishDrag(true);return;}if(!drag.moved){drag.moved=true;drag.node.setPointerCapture(e.pointerId);stage.classList.add('is-art-dragging');drag.node.classList.add('is-dragging');}e.preventDefault();drag.dx=dx;drag.node.style.zIndex='5';drag.node.style.transform='translate('+dx+'px,'+dy*.5+'px) rotate('+Math.max(-15,Math.min(15,dx/18))+'deg)';},options);
   stage.addEventListener('pointerup',()=>finishDrag(),options);stage.addEventListener('pointercancel',()=>finishDrag(true),options);stage.addEventListener('lostpointercapture',()=>finishDrag(true),options);
   window.addEventListener('pointerup',()=>finishDrag(),options);window.addEventListener('blur',()=>finishDrag(true),options);
   document.addEventListener('keydown',e=>{if(e.key==='Escape'&&drag){e.preventDefault();finishDrag(true);}},options);
   stage.addEventListener('click',e=>{if(suppressArtClick){e.preventDefault();e.stopImmediatePropagation();suppressArtClick=false;}},{...options,capture:true});
   back.addEventListener('error',()=>{art.classList.remove('has-back');art.dataset.activeSide='0';card.remove();controls.remove();art.querySelector('.artwork-back-open')?.remove();sides=sides.slice(0,1);},options);
  }
  modal.addEventListener('close',()=>{document.body.style.overflow=previousOverflow||'';if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});},options);
  modal.addEventListener('click',e=>{if(e.target.closest('.art-close'))close();const b=e.target.closest('[data-side]');if(b){current=Number(b.dataset.side);display();}if(e.target===modal){const r=modal.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}},options);
  modal.addEventListener('keydown',e=>{if(sides.length>1&&['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();current=1-current;display();}},options);
  modal.querySelector('img').addEventListener('error',()=>{modal.querySelector('.art-error').textContent='Não foi possível carregar a imagem.';},options);
 }
 const section=root.querySelector('.comments-section');if(!section)return;
 const form=section.querySelector('form'),status=section.querySelector('.comment-status'),list=section.querySelector('.comment-list'),more=section.querySelector('.comments-more');
 const endpoint='/api/comments?album='+encodeURIComponent(section.dataset.album);
 let entries=[],total=0,pending=null;
 const render=()=>{list.innerHTML=entries.length?entries.map(c=>`<article class="comment"><header><strong>${escape(c.nick)}</strong><span class="comment-score" aria-label="Nota ${c.score} de 10">${c.score}<small>/10</small></span></header><p>${escape(c.body)}</p><time datetime="${escape(c.created)}">${new Date(c.created).toLocaleDateString('pt-BR')}</time></article>`).join(''):'<p class="comments-empty">Ainda não há comentários. Conte o que achou do disco.</p>';more.hidden=entries.length>=total;more.textContent='Ver mais comentários';};
 const request=async(url,init={})=>{const r=await fetch(url,{...init,signal:abort.signal});let data;try{data=await r.json();}catch{throw Error('Comentários indisponíveis. Tente novamente mais tarde.');}if(!r.ok)throw Error(data.error||'Não foi possível carregar os comentários.');return data;};
 const load=async()=>{more.disabled=true;try{const data=await request(endpoint+'&offset='+entries.length);entries.push(...data.comments);total=data.total;render();status.textContent='';}catch(e){if(e.name!=='AbortError'){status.textContent=e.message;more.hidden=false;more.textContent='Tentar novamente';}}finally{more.disabled=false;}};
 more.addEventListener('click',load,options);
 form.addEventListener('submit',async e=>{e.preventDefault();if(!form.reportValidity())return;const values=new FormData(form),payload={nick:values.get('nick').trim(),body:values.get('body').trim(),score:Number(values.get('score'))};if(!payload.nick||!payload.body){status.textContent='Preencha seu nick e comentário.';return;}const signature=JSON.stringify(payload);if(pending?.signature!==signature)pending={signature,id:crypto.randomUUID()};const submit=form.querySelector('[type=submit]');submit.disabled=true;status.textContent='Enviando…';try{const data=await request(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,id:pending.id})});entries=data.comments;total=data.total;render();form.querySelector('textarea').value='';pending=null;status.textContent='Comentário publicado.';}catch(e){if(e.name!=='AbortError')status.textContent=e.message;}finally{submit.disabled=false;}},options);
 load();
}
