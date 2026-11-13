/* --- Réception des messages du lecteur (best-effort, affine juste le %) --- */
let videasyRealMsgAt=0, videasySavedAt=0, videasyLastCur=0, videasyOpenToken=0;
function videasyForceSeek(sec,token){
  const msgs=[{type:'seek',time:sec},{event:'seek',time:sec},{command:'seek',time:sec,currentTime:sec},{action:'seek',time:sec},
    {type:'chrome:command',command:'seek',args:[sec]},{type:'chrome:command',command:'currentTime',args:[sec]},
    {method:'setCurrentTime',value:sec},{event:'command',func:'seekTo',args:[sec,true]},{type:'SEEK',data:{time:sec}},{type:'player:seek',time:sec}];
  [4000,9000,15000].forEach(d=>setTimeout(()=>{
    if(token!==videasyOpenToken||!videasyIsOpen()) return;
    if(Date.now()-videasyRealMsgAt<8000 && videasyLastCur>=sec-30) return;   // deja au bon endroit
    const w=document.getElementById('videasy-iframe').contentWindow; if(!w) return;
    msgs.forEach(m=>{ try{ w.postMessage(m,'*'); w.postMessage(JSON.stringify(m),'*'); }catch(e){} });
  },d));
}
function extractPlayerTime(d){
  let cur=null,dur=null,pct=null;
  (function walk(o,depth){
    if(!o||typeof o!=='object'||depth>4) return;
    for(const k in o){
      const v=o[k], kk=k.toLowerCase();
      if(typeof v==='number'&&isFinite(v)){
        if(cur===null && ['currenttime','current_time','time','timestamp','position','watched','seconds','playedseconds'].includes(kk) && v>=0 && v<100000) cur=v;
        else if(dur===null && ['duration','totalduration','total','runtime'].includes(kk) && v>0 && v<100000) dur=v;
        else if(pct===null && kk==='progress' && v>=0 && v<=100) pct=v;
      } else if(v&&typeof v==='object') walk(v,depth+1);
    }
  })(d,0);
  return {cur,dur,pct};
}
function videasySaveSeconds(cur,dur,pct){
  const it=(STATE.continueWatching||[]).find(c=>String(c.id)===String(videasyCurrentTmdbId)&&c.media_type===videasyCurrentMediaType);
  if(!it) return;
  it.seconds=Math.floor(cur);
  if(dur&&dur>0) it.pct=Math.min(100,cur/dur*100); else if(pct!=null) it.pct=pct;
  const c=fmtClock(it.seconds);
  it.progressLabel=it.media_type==='tv'?`S${it.season||1} E${it.episode||1} · ${c}`:`Reprendre à ${c}`;
  saveState();
}
window.addEventListener('message', function(event){
  if(!videasyIsOpen()) return;
  if(/youtube\.com|youtube-nocookie\.com/.test(event.origin)) return;
  try{
    const data=typeof event.data==='string'?JSON.parse(event.data):event.data;
    if(!data||typeof data!=='object') return;
    const r=extractPlayerTime(data);
    if(r.cur!==null && r.cur>0){
      videasyRealMsgAt=Date.now(); videasyLastCur=r.cur;
      if(Date.now()-videasySavedAt>4000){ videasySavedAt=Date.now(); videasySaveSeconds(r.cur,r.dur,r.pct); }
    }
  }catch(e){ /* message non JSON : on ignore */ }
});
// Repli si le lecteur n'envoie aucune position : estimation par le temps passe dans le lecteur
setInterval(function(){
  if(!videasyIsOpen()||document.hidden) return;
  if(Date.now()-videasyRealMsgAt<20000) return;
  const it=(STATE.continueWatching||[]).find(c=>String(c.id)===String(videasyCurrentTmdbId)&&c.media_type===videasyCurrentMediaType);
  if(!it) return;
  videasySaveSeconds((it.seconds||0)+5,null,null);
},5000);

let videasyLastKnownProgressPct=null;

/* Enregistre la progression réelle (saison/épisode réellement choisis par
   l'utilisateur, pas de valeur aléatoire ni inventée) dans "Reprendre la lecture". */
function logRealProgress(){
  if(!videasyCurrentTmdbId || !videasyCurrentMediaType) return;
  if(!STATE.continueWatching) STATE.continueWatching=[];

  const mediaType=videasyCurrentMediaType;
  const id=videasyCurrentTmdbId;
  const existingIndex=STATE.continueWatching.findIndex(
    item=>String(item.id)===String(id) && item.media_type===mediaType
  );

  let progressLabel;
  if(mediaType==='tv'){
    progressLabel=`S${videasyCurrentSeason||1} E${videasyCurrentEpisode||1} en cours`;
  }else{
    progressLabel='Reprendre la lecture';
  }

  const newItem={
    id:Number(id), media_type:mediaType,
    title:videasyCurrentTitle||'Titre inconnu', image:videasyCurrentImage||'',
    progressLabel, updatedAt:Date.now(),
    season:videasyCurrentSeason, episode:videasyCurrentEpisode
  };
  { const prev=existingIndex>-1?STATE.continueWatching[existingIndex]:null;
    const same=prev && (mediaType==='movie' || (Number(prev.season||1)===Number(videasyCurrentSeason||1) && Number(prev.episode||1)===Number(videasyCurrentEpisode||1)));
    newItem.seconds=same?(prev.seconds||0):0; newItem.pct=same?(prev.pct||0):0;
    if(newItem.seconds>15){ const c=fmtClock(newItem.seconds); newItem.progressLabel=mediaType==='tv'?`S${videasyCurrentSeason||1} E${videasyCurrentEpisode||1} · ${c}`:`Reprendre à ${c}`; } }

  const finish=(item)=>{
    if(existingIndex>-1) STATE.continueWatching.splice(existingIndex,1);
    STATE.continueWatching.unshift(item);
    if(STATE.continueWatching.length>10) STATE.continueWatching=STATE.continueWatching.slice(0,10);
    saveState();
    if(parseHash()[0]==='home') renderContinueWatching();
  };

  if(!newItem.title || newItem.title==='Titre inconnu' || !newItem.image){
    fetchVideasyTitleDetails(mediaType,id).then(details=>{
      newItem.title=details.title;
      newItem.image=details.poster_path;
      videasyCurrentTitle=details.title;
      videasyCurrentImage=details.poster_path;
      finish(newItem);
    });
  }else{
    finish(newItem);
  }
}
async function fetchVideasyTitleDetails(mediaType,id){
  try{
    const res=await tmdb(`/${mediaType}/${id}`);
    return{ title:res.title||res.name||'Titre inconnu', poster_path:res.backdrop_path||res.poster_path||'' };
  }catch(e){
    return{ title:'Titre inconnu', poster_path:'' };
  }
}

