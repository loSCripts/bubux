/* ================= SHORTS ================= */
let shortsObserver=null;
let shortsMuted=true;
let shortsVideoCache={};
function muteIconSvg(muted){
  return muted
    ? '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 5V4L8 9Z"/><path d="M16 9l5 6M21 9l-5 6"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 5V4L8 9Z"/><path d="M16.2 8.8a5 5 0 0 1 0 6.4"/><path d="M19 6.2a8.5 8.5 0 0 1 0 11.6"/></svg>';
}
async function renderShorts(root){
  root.innerHTML=`<div class="page shorts-page">
      <button class="back-btn shorts-back-btn" data-action="go-back" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
      <div class="shorts-wrap" id="shorts-wrap"></div>
    </div>`;
  const wrap=document.getElementById('shorts-wrap');
  wrap.innerHTML=Array.from({length:5}).map(()=>'<div class="short-item"><div class="skel" style="position:absolute;inset:0"></div></div>').join('');
  try{
    const data=await TMDBApi.trending('all','week');
    const items=(data.results||[]).filter(it=>it.backdrop_path && (it.media_type==='movie'||it.media_type==='tv')).slice(0,10);
    wrap.innerHTML=items.map(it=>{
      const mt=it.media_type;
      return `<div class="short-item" data-type="${mt}" data-id="${it.id}" data-active="0">
        <div class="short-bg" style="background-image:url(${IMG_BASE}/${BACKDROP_SIZE}${it.backdrop_path})"></div>
        <div class="short-scrim"></div>
        <div class="short-video-slot"></div>
        <button class="short-mute-btn" data-action="toggle-short-mute" aria-label="Mute">${muteIconSvg(shortsMuted)}</button>
        <div class="short-content"><h3>${escapeHtml(it.title||it.name)}</h3>
          <div class="hero-meta"><span>${iconSpan(STAR_PATH).replace('<svg ','<svg class="star-ic" ')}${it.vote_average?it.vote_average.toFixed(1):'–'}/10</span></div>
        </div></div>`;
    }).join('') || `<div class="short-item"><div class="short-content"><h3>${t('noTrendingShorts')}</h3></div></div>`;
    setupShortsObserver();
  }catch(e){ handleApiError(e); }
}
function setupShortsObserver(){
  const wrap=document.getElementById('shorts-wrap');
  if(!wrap) return;
  if(shortsObserver) shortsObserver.disconnect();
  shortsObserver=new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting && entry.intersectionRatio>=0.6) activateShort(entry.target);
      else deactivateShort(entry.target);
    });
  }, {root:wrap, threshold:[0,0.6,1]});
  wrap.querySelectorAll('.short-item[data-type]').forEach(item=>shortsObserver.observe(item));
}
async function activateShort(item){
  if(item.dataset.active==='1') return;
  item.dataset.active='1';
  const slot=item.querySelector('.short-video-slot');
  const type=item.dataset.type, id=item.dataset.id;
  const cacheKey=type+'-'+id;
  let key=shortsVideoCache[cacheKey];
  if(key===undefined){
    try{
      const langParam=LANG_TO_TMDB[CURRENT_LANG]||'en-US';
      let data=await tmdb(`/${type}/${id}/videos`,{language:langParam});
      let vids=data.results||[];
      let trailer=vids.find(v=>v.site==='YouTube'&&v.type==='Trailer');
      if(!trailer && langParam!=='en-US'){
        data=await tmdb(`/${type}/${id}/videos`,{language:'en-US'});
        vids=data.results||[];
        trailer=vids.find(v=>v.site==='YouTube'&&v.type==='Trailer')||vids.find(v=>v.site==='YouTube');
      }
      key=trailer?trailer.key:null;
    }catch(e){ key=null; }
    shortsVideoCache[cacheKey]=key;
  }
  if(item.dataset.active!=='1' || !slot) return;
  if(key){
    const m=shortsMuted?1:0;
    slot.innerHTML=`<iframe src="https://www.youtube.com/embed/${key}?autoplay=1&mute=${m}&playsinline=1&controls=0&loop=1&playlist=${key}&modestbranding=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  }
}
function deactivateShort(item){
  item.dataset.active='0';
  const slot=item.querySelector('.short-video-slot');
  if(slot) slot.innerHTML='';
}
function toggleShortsMute(btnEl){
  shortsMuted=!shortsMuted;
  document.querySelectorAll('.short-mute-btn').forEach(b=>b.innerHTML=muteIconSvg(shortsMuted));
  const activeItem=document.querySelector('.short-item[data-active="1"]');
  if(activeItem){ activeItem.dataset.active='0'; activateShort(activeItem); }
}


