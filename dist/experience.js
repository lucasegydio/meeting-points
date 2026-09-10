export const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fold=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export const keyword=(value,kind='all')=>`<a class="keyword" data-keyword="${safe(value)}" data-kind="${safe(kind)}" href="#busca?${new URLSearchParams({q:String(value),tipo:kind})}">${safe(value)}</a>`;
export function matchesKeyword(a,q,kind='all'){
 const credits=[...(a.credits||[]),...(a.tracks||[]).flatMap(t=>[...(t.credits||[]),...(t.contributors||[])])];
 const people=[a.artist,...credits.map(c=>c.name)];
 const values=kind==='person'?people:kind==='genre'?[a.genre]:kind==='year'?[String(a.release||'').slice(0,4)]:[a.title,...(a.aliases||[]),...people,a.genre,String(a.release||'').slice(0,4),a.listened,...(a.tracks||[]).map(t=>t.name)];
 return values.some(v=>fold(v).includes(fold(q)));
}
export function savedOrder(ids){try{const stored=JSON.parse(localStorage.getItem('meeting.points.stack')||'[]');return [...new Set([...stored.filter(id=>ids.includes(id)),...ids])];}catch{return [...ids];}}
export function saveOrder(ids){try{localStorage.setItem('meeting.points.stack',JSON.stringify(ids));return true;}catch{return false;}}
export const moodSets=[
 {id:'calma',label:'Desacelerar',note:'Textura, espaço e respiro.',symbol:'◌',albums:['burial-untrue','tennyson-plx','sam-gellaitry-anywhere'],images:['assets/mood-layers.jpg','assets/mood-texture.jfif','assets/mood-vinyl.jfif']},
 {id:'curiosidade',label:'Explorar',note:'Desvios e novas combinações.',symbol:'✳',albums:['cyst-00','dorian-electra','danny-doss-crystallise'],images:['assets/mood-vinyl.jfif','assets/mood-layers.jpg','assets/mood-texture.jfif']},
 {id:'energia',label:'Ganhar energia',note:'Cor, ritmo e movimento.',symbol:'↗',albums:['frost-children-tweaker','deekapz-remixes','nate-sib-reborn'],images:['assets/mood-texture.jfif','assets/mood-vinyl.jfif','assets/mood-layers.jpg']}
];
export const moodCards=()=>`<div class="mood-choices">${moodSets.map(m=>`<a class="mood-choice mood-${m.id}" href="#moods/${m.id}"><span aria-hidden="true">${m.symbol}</span><small>Hoje eu quero</small><strong>${m.label}</strong></a>`).join('')}</div>`;
export function moodPage(albums,id){
 if(!id)try{id=localStorage.getItem('meeting.points.mood');}catch{}
 const m=moodSets.find(m=>m.id===id)||moodSets[0],picks=m.albums.map(id=>albums.find(a=>a.id===id)).filter(Boolean);
 return `<section class="page-heading"><span class="eyebrow">UNIVERSO VISUAL</span><h1>Qual é o seu mood?</h1></section>${moodCards()}<section class="mood-room mood-${m.id}"><div class="section-head"><div><h2>${m.label}</h2><p>${m.note}</p></div><button class="text-link" data-immersive>Modo imersivo</button></div><div class="mood-collage">${m.images.map((src,i)=>`<figure class="mood-fragment fragment-${i}"><img src="${src}" alt="Referência visual ${i+1} para ${m.label.toLowerCase()}" loading="lazy"></figure>`).join('')}${picks.map((a,i)=>`<a class="mood-record record-${i}" href="#album/${a.id}"><img src="${a.cover}" alt="${safe(a.title)} — ${safe(a.artist)}" loading="lazy"></a>`).join('')}</div><div class="mood-listen"><h3>Para acompanhar</h3>${picks.map(a=>`<div><a href="#album/${a.id}"><strong>${safe(a.title)}</strong><span>${safe(a.artist)}</span></a><a class="text-link" href="${safe(a.url)}" target="_blank" rel="noopener noreferrer">Ouvir ↗</a></div>`).join('')}</div><button class="immersive-close solid" data-immersive>Sair do modo imersivo</button></section>`;
}
let dispose=()=>{};
export function bindExperience(root){
 dispose();document.body.classList.remove('mood-immersive');const controller=new AbortController(),options={signal:controller.signal};
 const exit=()=>{document.body.classList.remove('mood-immersive');root.querySelector('[data-immersive]')?.focus();};
 root.querySelectorAll('[data-immersive]').forEach(b=>b.addEventListener('click',()=>{document.body.classList.toggle('mood-immersive');root.querySelector(document.body.classList.contains('mood-immersive')?'.immersive-close':'[data-immersive]')?.focus();},options));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('mood-immersive'))exit();},options);

 const mood=root.querySelector('.mood-room');if(mood)try{localStorage.setItem('meeting.points.mood',moodSets.find(m=>mood.classList.contains('mood-'+m.id)).id);}catch{}
 dispose=()=>controller.abort();
}
export function bindAmbient(){
 const reduce=matchMedia('(prefers-reduced-motion: reduce)'),el=document.createElement('div');el.className='ambient-wash';el.setAttribute('aria-hidden','true');document.body.prepend(el);let frame=0;
 const update=()=>{frame=0;const p=reduce.matches?0:Math.min(1,scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight));el.style.transform=`translate3d(${p*6-3}%,${p*12-6}%,0)`;el.style.opacity=String(.36+p*.22);};
 addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});addEventListener('resize',update);reduce.addEventListener('change',update);update();
}
