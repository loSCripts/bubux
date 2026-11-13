/* Lecteur YouTube du hero : sans controles, non interactif, 5 s par film */
const HERO_SLIDE_MS=5000, HERO_START=6;
let heroYT={apiBad:0,killed:false,killedAt:0,player:null,ready:false,unlocked:false,paused:false,offscreen:false,apiPromise:null,slideTimer:null,failTimer:null,io:null};
function loadYTApi(){
  if(window.YT && window.YT.Player) return Promise.resolve();
  if(heroYT.apiPromise) return heroYT.apiPromise;
  heroYT.apiPromise=new Promise((res,rej)=>{
    const prev=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{ if(prev) try{prev();}catch(e){} res(); };
    const to=setTimeout(()=>{ heroYT.apiPromise=null; rej(new Error('yt timeout')); },7000);
    const ok=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{ clearTimeout(to); ok&&ok(); };
    const sc=document.createElement('script'); sc.src='https://www.youtube.com/iframe_api';
    sc.onerror=()=>{ clearTimeout(to); heroYT.apiPromise=null; rej(new Error('yt blocked')); };
    document.head.appendChild(sc);
  });
  return heroYT.apiPromise;
}
function heroFitVideo(){
  const hero=document.getElementById('home-hero'), box=document.getElementById('hero-video');
  if(!hero||!box) return;
  const el=box.firstElementChild; if(!el) return;
  const W=hero.clientWidth, H=hero.clientHeight;
  const w=Math.max(W,H*16/9), h=w*9/16;
  el.style.width=w+'px'; el.style.height=h+'px';
}
function heroActive(){ return !heroYT.killed && !heroYT.paused && !heroYT.offscreen && !document.hidden && !!document.getElementById('home-hero'); }
function heroClearTimers(){ clearTimeout(heroYT.slideTimer); clearTimeout(heroYT.failTimer); clearTimeout(heroState.imgTimer); }
function heroDestroyPlayer(){
  heroClearTimers();
  const pl=heroYT.player;
  try{ if(pl){ pl.mute&&pl.mute(); pl.stopVideo&&pl.stopVideo(); } }catch(e){}
  try{ if(pl && pl.destroy) pl.destroy(); }catch(e){}
  document.querySelectorAll('iframe#hero-yt').forEach(f=>{ try{ f.src='about:blank'; }catch(e){} f.remove(); });
  heroYT.player=null; heroYT.ready=false;
  const vb=document.getElementById('hero-video'); if(vb) vb.classList.remove('on');
}
function heroKill(){ heroYT.killed=true; heroYT.killedAt=Date.now(); heroTeardown(); }
function heroStopPlayback(){ heroClearTimers(); try{ heroYT.player&&heroYT.player.pauseVideo&&heroYT.player.pauseVideo(); }catch(e){} }
function heroPause(){ heroYT.paused=true; heroStopPlayback(); }
function heroResume(){ heroYT.paused=false; heroYT.killed=false; if(document.getElementById('home-hero')) renderHeroSlide(); }
function heroArmImg(token){
  if(heroState.items.length<2) return;
  clearTimeout(heroState.imgTimer);
  heroState.imgTimer=setTimeout(()=>{ if(token===heroState.token && heroActive()) heroNextSlide(); },HERO_SLIDE_MS);
}
function heroArmFail(token){
  clearTimeout(heroYT.failTimer);
  heroYT.failTimer=setTimeout(()=>{ if(token===heroState.token && heroActive()) heroNextSlide(); },9000);
}
function heroKick(){
  if(!heroActive()) return;
  const item=heroState.items[heroState.index]; if(!item) return;
  const token=heroState.token;
  if(item._ytKey && heroYT.player && heroYT.ready){
    try{ heroYT.player.mute(); heroYT.player.playVideo(); }catch(e){}
    heroArmFail(token);
  } else if(!item._ytKey){ heroArmImg(token); }
}
function heroNextSlide(){
  if(!document.getElementById('home-hero')){ heroTeardown(); return; }
  heroState.index=(heroState.index+1)%heroState.items.length;
  renderHeroSlide();
}
function heroTeardown(){ heroDestroyPlayer(); try{ if(heroYT.io) heroYT.io.disconnect(); }catch(e){} heroYT.io=null; }
async function heroPlayTrailer(item,token){
  const box=document.getElementById('hero-video');
  if(!box||!item._ytKey||heroYT.killed) return;
  if(Date.now()-heroYT.apiBad<60000){ heroArmImg(token); return; }   // secours : images seules
  try{ await loadYTApi(); }catch(e){ heroYT.apiBad=Date.now(); console.warn('Bubux hero: YouTube indisponible, mode images',e&&e.message); heroArmImg(token); return; }
  if(token!==heroState.token || heroYT.killed || !document.getElementById('hero-video')) return;
  if(heroYT.player && heroYT.ready){
    try{
      if(heroActive()) heroYT.player.loadVideoById({videoId:item._ytKey,startSeconds:HERO_START});
      else heroYT.player.cueVideoById({videoId:item._ytKey,startSeconds:HERO_START});
    }catch(e){}
    if(heroActive()) heroArmFail(token);
    return;
  }
  if(heroYT.player) return;  // creation en cours : onReady chargera le film courant
  const q=new URLSearchParams({enablejsapi:1,autoplay:1,mute:1,controls:0,disablekb:1,fs:0,modestbranding:1,rel:0,iv_load_policy:3,playsinline:1,cc_load_policy:0,start:HERO_START});
  if(/^https?:$/.test(location.protocol)) q.set('origin',location.origin);
  const fr=document.createElement('iframe');
  fr.id='hero-yt'; fr.src='https://www.youtube.com/embed/'+item._ytKey+'?'+q.toString();
  fr.allow='autoplay; encrypted-media; picture-in-picture'; fr.setAttribute('referrerpolicy','strict-origin-when-cross-origin'); fr.setAttribute('frameborder','0');
  box.innerHTML=''; box.appendChild(fr);
  heroYT.player=new YT.Player(fr,{
    events:{
      onReady:(e)=>{
        if(heroYT.killed||!document.getElementById('home-hero')){ heroDestroyPlayer(); return; }
        heroYT.ready=true; heroFitVideo();
        const f=box.querySelector('iframe'); if(f){ f.setAttribute('tabindex','-1'); f.setAttribute('aria-hidden','true'); }
        const cur=heroState.items[heroState.index];
        try{
          e.target.mute();
          if(cur&&cur._ytKey){
            if(heroActive()){ e.target.loadVideoById({videoId:cur._ytKey,startSeconds:HERO_START}); heroArmFail(heroState.token); }
            else e.target.cueVideoById({videoId:cur._ytKey,startSeconds:HERO_START});
          }
        }catch(_){}
      },
      onStateChange:(e)=>{
        const vb=document.getElementById('hero-video');
        if(e.data===1){
          try{ e.target.mute(); }catch(_){}
          if(!heroActive()){ try{ e.target.pauseVideo(); }catch(_){} return; }
          if(vb) vb.classList.add('on');
          clearTimeout(heroYT.failTimer); clearTimeout(heroYT.slideTimer);
          heroYT.slideTimer=setTimeout(()=>{ if(heroActive()) heroNextSlide(); },HERO_SLIDE_MS);
        } else if(e.data===2){
          clearTimeout(heroYT.slideTimer);
          if(heroActive()){ try{ e.target.playVideo(); }catch(_){} }   // pause interdite
        } else if(e.data===0){
          if(heroActive()) heroNextSlide();
        }
      },
      onError:(e)=>{ console.warn('Bubux hero YouTube error',e&&e.data); if(heroActive()) heroNextSlide(); }
    }
  });
  heroFitVideo();
}
// Premier doigt pose sur l'ecran = autorisation navigateur : on passe la video avec le son
(function(){
  function unlock(ev){
    heroYT.unlocked=true;
    if(ev && ev.target && ev.target.closest && ev.target.closest('[data-action="navigate"],[data-action="watch"],[data-action="play-trailer"],[data-longpress],.card')) return;
    if(heroYT.player && heroYT.ready && heroActive()){
      try{
        const cur=heroState.items[heroState.index];
        const st=heroYT.player.getPlayerState?heroYT.player.getPlayerState():-1;
        if(st!==1 && cur && cur._ytKey) heroYT.player.loadVideoById({videoId:cur._ytKey,startSeconds:HERO_START});
        else heroYT.player.playVideo();
        heroYT.player.mute();
      }catch(e){}
    }
  }
  window.addEventListener('pointerdown',unlock,{passive:true,capture:true});
  window.addEventListener('touchstart',unlock,{passive:true,capture:true});
  window.addEventListener('mousedown',unlock,{passive:true,capture:true});
  window.addEventListener('keydown',unlock,{passive:true,capture:true});
  window.addEventListener('resize',heroFitVideo);
  setInterval(()=>{
    const hero=document.getElementById('home-hero');
    const vm=document.getElementById('videasy-modal');
    const videoOpen=!!vm && getComputedStyle(vm).display!=='none';
    const mr=document.getElementById('modal-root');
    const modalOpen=!!mr && mr.children.length>0;
    const bad=!hero||videoOpen||modalOpen;
    if(bad){
      if(!heroYT.killed && (heroYT.player||document.querySelector('iframe#hero-yt'))) heroKill();
      else if(document.querySelector('iframe#hero-yt') && (!hero||!hero.contains(document.querySelector('iframe#hero-yt')))) heroDestroyPlayer();
    } else if(heroYT.killed && hero && Date.now()-heroYT.killedAt>1500){ heroResume(); }
  },400);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden) heroStopPlayback(); else heroKick(); });
})();

