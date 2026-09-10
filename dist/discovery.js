import {safe,fold,keyword,matchesKeyword} from './experience.js';
import {artistProfiles as contextProfiles} from './artist-data.js';
import {artistDirectory} from './artist-directory.js';
const artistProfiles=[...artistDirectory.map(p=>({...p,aliases:[...(p.aliases||[]),p.artist]})),...contextProfiles.filter(p=>!artistDirectory.some(d=>d.name===p.name))];
import {artistPhotos} from './artist-photos.js';
import {shows} from './tv-data.js';
const profileFor=name=>artistProfiles.find(p=>[p.name,...(p.aliases||[])].some(n=>fold(n)===fold(name)));
const photosFor=name=>artistPhotos.filter(p=>fold(p.artist)===fold(name));
const photoCredit=p=>`<a href="${safe(p.source)}" target="_blank" rel="noopener noreferrer">${safe(p.credit)} ↗</a>${p.license?` · <a href="${safe(p.license)}" target="_blank" rel="noopener noreferrer">Licença ↗</a>`:''}`;
export function artistSidebar(a,albums){
 const profile=profileFor(a.artist)||a.artistProfile,photos=[...photosFor(a.artist),...(a.artistPhoto?[a.artistPhoto]:[])],others=albums.filter(b=>b.id!==a.id&&matchesKeyword(b,a.artist,'person')).slice(0,3);
 const birthday=profile?.birthDate?new Date(profile.birthDate+'T12:00:00Z').toLocaleDateString('pt-BR',{timeZone:'UTC'}):null;
 const facts=(profile?.artist?[[profile.group?'Integrantes':'Nome civil',profile.group?(profile.members||[]).map(m=>m.realName&&m.realName!==m.name?m.name+' · '+m.realName:m.name).join(' / '):profile.realName],['Nascimento',profile.group?null:birthday],['Selo deste lançamento',a.label],['Gravadora · elenco atual',profile.currentLabel?.name],['Gênero',a.genre]]:profile?.facts||[['No arquivo',a.title],['Gênero',a.genre]]).filter(([,value])=>value&&!/não (confirmado|informado|documentado)/i.test(value));
 return `<aside class="artist-folio"><header><span class="eyebrow">POR TRÁS DO DISCO</span><h2>${keyword(a.artist,'person')}</h2>${profile?`<p class="artist-role">${safe(profile.role)}</p>`:''}</header>${photos.length?`<div class="artist-photo-strip">${photos.map((p,i)=>`<figure><button style="--photo-aspect:${p.width}/${p.height}" data-image-src="${safe(p.original||p.src)}" data-image-caption="${safe(p.caption||p.artist)}" aria-label="Ampliar ${safe(p.caption||a.artist)}"><img src="${safe(p.src)}" ${p.variants?.length?`srcset="${p.variants.map(v=>safe(v.src)+' '+v.width+'w').join(', ')}" sizes="(max-width: 600px) 85vw, 420px"`:''} alt="${safe(p.caption||a.artist)}" width="${p.width}" height="${p.height}" loading="lazy"></button><figcaption>${photoCredit(p)}</figcaption></figure>`).join('')}</div>`:''}${profile?`<p class="artist-bio">${safe(profile.bio)}</p>`:''}<dl class="artist-facts">${facts.map(([k,v])=>`<div><dt>${safe(k)}</dt><dd>${safe(v)}</dd></div>`).join('')}</dl>${profile?.curiosity?`<details class="artist-curiosity"><summary>Uma coisa a mais</summary><p>${safe(profile.curiosity)}</p>${profile.extraSource?`<a class="small" href="${safe(profile.extraSource.url)}" target="_blank" rel="noopener noreferrer">${safe(profile.extraSource.label)} ↗</a>`:''}</details>`:''}${profile?.factsSources?.length?`<details class="artist-fact-sources"><summary>Fontes da ficha</summary>${profile.factsSources.map(f=>`<a href="${safe(f.url)}" target="_blank" rel="noopener noreferrer">${safe(f.label)} ↗</a>`).join('')}${profile.currentLabel?.source?`<a href="${safe(profile.currentLabel.source.url)}" target="_blank" rel="noopener noreferrer">Elenco da gravadora ↗</a>`:''}</details>`:''}${profile?`<a class="artist-source" href="${safe(profile.source.url)}" target="_blank" rel="noopener noreferrer">${safe(profile.source.label)} ↗</a>`:''}${others.length?`<div class="artist-related"><span class="eyebrow">TAMBÉM NO ARQUIVO</span>${others.map(b=>`<a href="#album/${b.id}"><img src="${safe(b.cover)}" width="48" height="48" alt="" loading="lazy"><span>${safe(b.title)}</span></a>`).join('')}</div>`:''}</aside>`;
}
export function buildEntities(albums){
 const entities=new Map();const add=(name,role,source)=>{if(!name||name.length<3||entities.has(fold(name)))return;entities.set(fold(name),{name,role,bio:role?`No arquivo como ${role.toLowerCase()}.`:'Explore as participações no arquivo.',source});};
 for(const a of albums){add(a.artist,'Artista',a.sources?.[0]);for(const c of [...(a.credits||[]),...(a.tracks||[]).flatMap(t=>[...(t.credits||[]),...(t.contributors||[])])])add(c.name,c.role,c.source);}
 for(const s of shows){add(s.artist,'Artista',s.sources[0]);for(const [role,names]of s.credits){if(/Não |Bercy|Descrição|Canal|Créditos/.test(names)||/Proveniência|Registro sonoro|Repertório/.test(role))continue;for(const n of names.split(/ · | e | \/ /))add(n.trim(),role,s.sources[0]);}}
 for(const p of artistProfiles){entities.set(fold(p.name),p);for(const alias of p.aliases||[])entities.set(fold(alias),p);}
 return entities;
}
let cleanup=()=>{};
export function bindDiscovery(root,albums){
 cleanup();const controller=new AbortController(),opt={signal:controller.signal},entities=buildEntities(albums);let card,anchor,showTimer,hideTimer,photoModal,returnFocus;
 const linkText=(value,kind)=>{const a=document.createElement('a');a.className='keyword';a.href='#busca?'+new URLSearchParams({q:value,tipo:kind});a.dataset.keyword=value;a.dataset.kind=kind;a.textContent=value;return a;};
 // Walk text nodes only: never rewrite markup or nest anchors. Original words stay intact.
 const escapeRE=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const spellings=[...new Set([...artistProfiles.flatMap(p=>[p.name,...(p.aliases||[])]),...entities.values()].flatMap(p=>typeof p==='string'?[p]:[p.name]))].sort((a,b)=>b.length-a.length);
 const expression=new RegExp('(?<![\\p{L}\\p{N}])('+spellings.map(escapeRE).join('|')+'|(?:19|20)\\d{2})(?![\\p{L}\\p{N}])','giu');
 const containers=root.querySelectorAll('.tv-dossier p,.tv-credits dd,.tv-intro>p,.artist-bio,.artist-facts dd,.artist-curiosity p,.detail-copy>p');
 for(const container of containers){const nodes=[];const walk=n=>{for(const child of n.childNodes){if(child.nodeType===3)nodes.push(child);else if(child.nodeType===1&&!child.matches('a,button,script,style'))walk(child);}};walk(container);for(const node of nodes){const text=node.textContent;expression.lastIndex=0;const matches=[...text.matchAll(expression)];if(!matches.length)continue;const fragment=document.createDocumentFragment();let cursor=0;for(const m of matches){fragment.append(document.createTextNode(text.slice(cursor,m.index)));fragment.append(linkText(m[0],/^\d{4}$/.test(m[0])?'year':'person'));cursor=m.index+m[0].length;}fragment.append(document.createTextNode(text.slice(cursor)));node.replaceWith(fragment);}}
 const hide=()=>{clearTimeout(showTimer);clearTimeout(hideTimer);if(anchor){anchor.removeAttribute('aria-describedby');anchor.removeAttribute('aria-expanded');}card?.remove();card=null;anchor=null;};
 const scheduleHide=()=>{clearTimeout(hideTimer);hideTimer=setTimeout(hide,180);};
 const show=a=>{
  hide();const params=new URLSearchParams((a.getAttribute('href')||'').split('?')[1]||''),value=a.dataset.keyword||params.get('q'),person=entities.get(fold(value));if(!person)return;
  anchor=a;card=document.createElement('aside');card.id='music-context-card';card.className='context-card';card.setAttribute('role','dialog');card.setAttribute('aria-label',person.name);a.setAttribute('aria-describedby',card.id);a.setAttribute('aria-expanded','true');
  const photo=photosFor(person.name)[0],related=albums.filter(x=>matchesKeyword(x,person.name,'person')).length;
  card.innerHTML=`<button class="context-close" aria-label="Fechar contexto">×</button>${photo?`<img src="${safe(photo.src)}" alt="${safe(person.name)}" width="88" height="88">`:''}<span class="eyebrow">${safe(person.role||'NO ARQUIVO')}</span><h3>${safe(person.name)}</h3><p>${safe(person.bio)}</p>${photo?`<small class="context-photo-credit">${photoCredit(photo)}</small>`:''}<a class="context-explore" href="#busca?${new URLSearchParams({q:person.name,tipo:'person'})}">Explorar no arquivo ↗</a>${person.source?.url?`<a class="context-source" href="${safe(person.source.url)}" target="_blank" rel="noopener noreferrer">Fonte ↗</a>`:''}`;
  document.body.append(card);const r=a.getBoundingClientRect(),c=card.getBoundingClientRect(),vw=window.innerWidth,vh=window.innerHeight;
  card.style.left=Math.max(12,Math.min(vw-c.width-12,r.left))+'px';card.style.top=Math.max(12,Math.min(vh-c.height-12,r.bottom+10))+'px';
  card.addEventListener('pointerenter',()=>clearTimeout(hideTimer),opt);card.addEventListener('pointerleave',scheduleHide,opt);card.addEventListener('focusin',()=>clearTimeout(hideTimer),opt);card.addEventListener('focusout',e=>{if(!card?.contains(e.relatedTarget)&&e.relatedTarget!==anchor)scheduleHide();},opt);card.querySelector('button').onclick=()=>{const previous=anchor;hide();previous?.focus({preventScroll:true});clearTimeout(showTimer);};
 };
 root.querySelectorAll('a.keyword').forEach(a=>{
  const value=a.dataset.keyword||new URLSearchParams((a.getAttribute('href')||'').split('?')[1]||'').get('q');if(!entities.has(fold(value)))return;a.classList.add('has-context');a.setAttribute('aria-haspopup','dialog');
  a.addEventListener('pointerenter',e=>{if(e.pointerType==='touch')return;clearTimeout(hideTimer);clearTimeout(showTimer);showTimer=setTimeout(()=>show(a),300);},opt);
  a.addEventListener('pointerleave',scheduleHide,opt);a.addEventListener('focus',()=>{showTimer=setTimeout(()=>show(a),300);},opt);a.addEventListener('blur',e=>{if(!card?.contains(e.relatedTarget))scheduleHide();},opt);
  a.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();show(a);card?.querySelector('.context-explore')?.focus();}},opt);
  a.addEventListener('click',e=>{if(matchMedia('(hover: none)').matches&&anchor!==a&&!e.ctrlKey&&!e.metaKey){e.preventDefault();show(a);}},opt);
 });
 const openPhoto=b=>{
  returnFocus=b;photoModal??=document.createElement('dialog');photoModal.className='photo-lightbox';photoModal.innerHTML=`<button class="photo-close" aria-label="Fechar imagem" autofocus>×</button><figure><img src="${safe(b.dataset.imageSrc)}" alt="${safe(b.dataset.imageCaption||'Referência visual')}"><figcaption>${safe(b.dataset.imageCaption||'')}</figcaption></figure>`;document.body.append(photoModal);photoModal.showModal();photoModal.querySelector('button').onclick=()=>photoModal.close();
  photoModal.addEventListener('click',e=>{if(e.target===photoModal)photoModal.close();},{once:false,signal:controller.signal});photoModal.addEventListener('close',()=>returnFocus?.isConnected&&returnFocus.focus({preventScroll:true}),{once:true});
 };
 root.querySelectorAll('[data-image-src]').forEach(b=>b.addEventListener('click',()=>openPhoto(b),opt));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&card){e.preventDefault();hide();}},opt);
 document.addEventListener('pointerdown',e=>{if(card&&!card.contains(e.target)&&!anchor?.contains(e.target))hide();},opt);
 window.addEventListener('scroll',hide,{...opt,passive:true});window.addEventListener('resize',hide,opt);
 cleanup=()=>{hide();photoModal?.close();photoModal?.remove();controller.abort();};
}
