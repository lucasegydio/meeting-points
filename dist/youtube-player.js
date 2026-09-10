// Official IFrame API. Never proxy media or bypass the uploader's restrictions.
let apiPromise;
export function loadYouTube(){
 if(window.YT?.Player)return Promise.resolve(window.YT);
 if(apiPromise)return apiPromise;
 apiPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.referrerPolicy='strict-origin-when-cross-origin';
  const previous=window.onYouTubeIframeAPIReady;
  let finished=false;
  const fail=()=>{if(finished)return;finished=true;clearTimeout(timer);script.remove();apiPromise=null;reject(Error('YouTube não carregou nesta conexão.'));};
  const timer=setTimeout(fail,15000);
  window.onYouTubeIframeAPIReady=()=>{if(finished)return;finished=true;clearTimeout(timer);try{previous?.();}catch{}resolve(window.YT);};
  script.onerror=fail;document.head.append(script);
 });
 return apiPromise;
}
export const watchURL=(video,seconds=0)=>`https://www.youtube.com/watch?v=${encodeURIComponent(video)}&t=${Math.max(0,Math.floor(seconds))}s`;
export function createYouTubePlayer({container,video,title,status,onTime=()=>{},onStart=()=>{}}){
 let player,frame,ready=false,disposed=false,pending=0,clock,timeout,attempt=0,loading=false,failed=false;
 const message=(text,code)=>{if(disposed)return;status.textContent=text;status.dataset.error=code?String(code):'';};
 const failure=code=>{failed=true;clearTimeout(timeout);const messages={100:'Este vídeo não está disponível no YouTube.',101:'O responsável pelo vídeo não permite reprodução incorporada.',150:'O responsável pelo vídeo não permite reprodução incorporada.',153:'O YouTube não reconheceu a identificação desta prévia.',5:'O YouTube não conseguiu reproduzir o vídeo neste navegador.'};message((messages[code]||'Não foi possível reproduzir aqui.')+' Use “Assistir no YouTube” para abrir no trecho selecionado.',code);};
 const play=async(seconds=0)=>{
  pending=Math.max(0,Math.floor(seconds));onTime(pending);
  if(ready&&!failed){player.seekTo(pending,true);player.playVideo();return;}
  if(loading)return;
  loading=true;failed=false;const generation=++attempt;
  player?.destroy();player=null;ready=false;clearInterval(clock);clearTimeout(timeout);
  frame=document.createElement('iframe');frame.id='meeting-tv-player';frame.title=title;frame.width='1280';frame.height='720';
  frame.allow='autoplay; encrypted-media; fullscreen; picture-in-picture';frame.allowFullscreen=true;
  frame.referrerPolicy='strict-origin-when-cross-origin';
  const vars=new URLSearchParams({enablejsapi:'1',origin:location.origin,widget_referrer:location.href.split('#')[0],playsinline:'1',autoplay:'1',start:String(pending),rel:'0'});
  frame.src='https://www.youtube-nocookie.com/embed/'+encodeURIComponent(video)+'?'+vars;
  container.replaceChildren(frame);message('Conectando ao YouTube…');
  timeout=setTimeout(()=>{if(!ready){loading=false;failed=true;message('O player não respondeu. Você pode tentar novamente ou assistir no YouTube, mantendo o trecho escolhido.');}},18000);
  try{
   const YT=await loadYouTube();if(disposed||generation!==attempt)return;
   player=new YT.Player(frame,{events:{
    onReady:e=>{if(disposed||generation!==attempt)return;ready=true;loading=false;clearTimeout(timeout);message('');e.target.seekTo(pending,true);e.target.playVideo();
     clock=setInterval(()=>{if(!disposed&&ready&&!failed){const time=player.getCurrentTime?.();if(Number.isFinite(time))onTime(time);}},1000);
    },
    onStateChange:e=>{if(disposed||generation!==attempt)return;if(e.data===1){onStart();message('');failed=false;}},
    onAutoplayBlocked:()=>message('Toque no botão de play do YouTube para começar.'),
    onError:e=>{if(generation!==attempt)return;loading=false;failure(e.data);}
   }});
  }catch{if(disposed)return;loading=false;message('O controle do player não carregou. Use o player acima ou abra o trecho no YouTube.');}
 };
 return {play,get unavailable(){return failed;},destroy(){disposed=true;attempt++;clearInterval(clock);clearTimeout(timeout);player?.destroy();frame?.remove();}};
}
