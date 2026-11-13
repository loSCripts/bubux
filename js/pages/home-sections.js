function mountHero(items){
  heroState.items=items; heroState.index=0;
  const hero=document.getElementById('home-hero');
  if(!hero) return;
  if(!items.length){ hero.innerHTML=`<div class="hero-content"><p style="color:var(--text-2)">No trending titles right now.</p></div>`; return; }
  hero.innerHTML=`
    <div class="hero-bg-wrap" id="hero-bg-wrap"><div class="hero-bg" id="hero-bg-img"></div></div>
    <div class="hero-video" id="hero-video"></div>
    <div class="hero-scrim"></div>
    <div class="hero-dots" id="hero-dots"></div>
    <div class="hero-content" id="hero-content"></div>`;
  heroTeardown();
  heroYT.killed=false; heroYT.paused=false;
  heroYT.offscreen=false;
  if('IntersectionObserver' in window){
    heroYT.io=new IntersectionObserver(es=>{
      const off=es[es.length-1].intersectionRatio<0.25;
      if(off===heroYT.offscreen) return;
      heroYT.offscreen=off;
      if(off) heroStopPlayback(); else heroKick();
    },{threshold:[0,0.25,0.5]});
    heroYT.io.observe(hero);
  }
  renderHeroSlide();
}
async function renderHeroSlide(){
  const item=heroState.items[heroState.index];
  if(!item) return;
  heroState.token=(heroState.token||0)+1; const myToken=heroState.token;
  heroClearTimers();
  const vbox=document.getElementById('hero-video'); if(vbox) vbox.classList.remove('on');
  if(item._ytKey){ heroArmFail(myToken); heroPlayTrailer(item,myToken); }
  else{ try{ heroYT.player&&heroYT.player.pauseVideo&&heroYT.player.pauseVideo(); }catch(e){} heroArmImg(myToken); }
  const mediaType=item.media_type||'movie';
  const bg=document.getElementById('hero-bg-img');
  if(bg) bg.style.backgroundImage=`url(${IMG_BASE}/${BACKDROP_SIZE}${item.backdrop_path})`;
  const dotsEl=document.getElementById('hero-dots');
  if(dotsEl) dotsEl.innerHTML=heroState.items.map((_,i)=>`<span class="${i===heroState.index?'active':''}"></span>`).join('');
  const content=document.getElementById('hero-content');
  if(!content) return;
  const year=(item.release_date||item.first_air_date||'').slice(0,4);
  const genreName=genreNameFor(mediaType, item.genre_ids && item.genre_ids[0]);
  content.innerHTML=`
    <div class="hero-title-fallback" id="hero-title-slot">${escapeHtml(item.title||item.name||'')}</div>
    <div class="hero-meta">
      <span>${iconSpan(STAR_PATH).replace('<svg ','<svg class="star-ic" ')}${item.vote_average?item.vote_average.toFixed(1):'–'}/10</span>
      <span><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>${year||'–'}</span>
      ${genreName?`<span>${iconSpan(iconForGenre(genreName))}${escapeHtml(genreName)}</span>`:''}
    </div>
    <p class="hero-desc">${escapeHtml(item.overview||'')}</p>
    <div class="hero-actions">
      <button class="btn-play" data-action="watch" data-type="${mediaType}" data-id="${item.id}" data-title="${escapeHtml(item.title||item.name||'')}"><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8Z"/></svg> ${t('play')}</button>
      <button class="btn-trailer" data-action="play-trailer" data-type="${mediaType}" data-id="${item.id}"><svg viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> ${t('trailer')||'Bande-annonce'}</button>
      <div class="btn-segment">
        <button data-action="add-to-list" data-type="${mediaType}" data-id="${item.id}" aria-label="${t('addToList')}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
        <div class="seg-divider"></div>
        <button data-action="navigate" data-href="#/title/${mediaType}/${item.id}" aria-label="Info"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M12 11v5.5M12 8v.01"/></svg></button>
      </div>
    </div>`;
  const cacheKey=mediaType+'-'+item.id;
  if(heroState.logoCache[cacheKey]===undefined){
    try{
      const imgs=await tmdb(`/${mediaType}/${item.id}/images`,{include_image_language:'en,null'});
      const logo=(imgs.logos||[]).find(l=>l.iso_639_1==='en') || (imgs.logos||[])[0] || null;
      heroState.logoCache[cacheKey]=logo?`${IMG_BASE}/${LOGO_SIZE}${logo.file_path}`:null;
    }catch(e){ heroState.logoCache[cacheKey]=null; }
  }
  if(heroState.items[heroState.index]===item){
    const slot=document.getElementById('hero-title-slot');
    if(slot && heroState.logoCache[cacheKey]){
      slot.outerHTML=`<img class="hero-logo-img" id="hero-title-slot" src="${heroState.logoCache[cacheKey]}" alt="${escapeHtml(item.title||item.name||'')}">`;
    }
  }
}

function maybeShowInstallBanner(){
  const slot=document.getElementById('install-banner-slot');
  if(!slot) return;
  if(!deferredInstallPrompt || STATE._installDismissed){ slot.innerHTML=''; return; }
  slot.innerHTML=`<div class="install-banner">
    <svg viewBox="0 0 24 24" style="flex:none"><path d="M12 3v13m0 0 4-4m-4 4-4-4"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
    <div class="txt"><strong>${t('installLuma')}</strong><span>${t('installDesc')}</span></div>
    <button class="btn-primary" style="flex:none;padding:10px 16px" data-action="install-pwa">${t('install')}</button>
    <button data-action="dismiss-install-banner" aria-label="Dismiss" style="flex:none;padding:6px"><svg viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
  </div>`;
}

function renderContinueWatching(){
  const el=document.getElementById('continue-watching-section');
  if(!el) return;
  if(!STATE.continueWatching.length){ el.innerHTML=''; return; }
  el.innerHTML=`<div class="section"><div class="section-head"><h2>${t('continueWatching')}</h2>
      <button class="edit-pencil" data-action="toggle-cw-edit" aria-label="Edit"><svg viewBox="0 0 24 24"><path d="M4 20l1-4L16 5l3 3L8 19l-4 1Z"/></svg></button>
    </div><div class="row-scroll" id="cw-row">${STATE.continueWatching.slice(0,10).map(cwCardHtml).join('')}</div></div>`;
}

async function renderBecauseYouWatched(){
  const el=document.getElementById('because-you-watched-section');
  if(!el) return;
  // On n'affiche cette section que si l'utilisateur a réellement regardé quelque chose.
  // Avant, une référence factice ("Avatar") s'affichait par défaut : on ne veut plus
  // jamais prétendre que l'utilisateur a regardé un titre qu'il n'a pas vu.
  const ref=recsRefOverride || STATE.continueWatching[0] || null;
  if(!ref){ el.innerHTML=''; return; }
  el.innerHTML=`<div class="section"><div class="section-head">
      <h2 class="with-dropdown" data-action="change-recs-ref"><span>${t('becauseYouWatched')} <u>${escapeHtml(ref.title)}</u></span>
      <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></h2>
    </div><div class="row-scroll" id="recs-row">${skeletonRow(4)}</div></div>`;
  try{
    infiniteRow(document.getElementById('recs-row'),pg=>tmdb(`/${ref.type||ref.media_type}/${ref.id}/recommendations`,{page:pg}));
  }catch(e){ const r=document.getElementById('recs-row'); if(r) r.innerHTML=emptyRowMsg(); }
}
function openChangeRecsRef(){
  if(!STATE.continueWatching.length){ showToast(t('watchFirst')); return; }
  openModal(`<h3>${t('becauseYouWatched')}…</h3><div class="modal-field" style="max-height:50vh;overflow-y:auto">
    ${STATE.continueWatching.map(it=>`<button class="list-picker-item" style="width:100%;text-align:left" data-action="set-recs-ref" data-type="${it.media_type}" data-id="${it.id}" data-title="${escapeHtml(it.title)}">${escapeHtml(it.title)}</button>`).join('')}
  </div>`);
}

async function renderProviderRow(mediaType){
  const el=document.getElementById('provider-row-section');
  if(!el) return;
  el.innerHTML=`<div class="section" style="position:relative">
      <div class="section-head"><h2 class="with-dropdown" id="provider-row-title" data-action="toggle-provider-dropdown">
        <span>${t('moviesOn')} <u id="provider-row-name">…</u></span><svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></h2></div>
      <div class="provider-dropdown hidden" id="provider-dropdown-list"></div>
      <div class="row-scroll" id="provider-row-items">${skeletonRow(4)}</div>
    </div>`;
  try{
    const data=await TMDBApi.providersList(mediaType, STATE.region);
    const results=(data.results||[]).slice();
    const preferred=['Netflix','Hulu','Disney Plus','Amazon Prime Video','Max','Apple TV'];
    const known=[]; const rest=[];
    results.forEach(r=>{ const idx=preferred.findIndex(p=>r.provider_name.toLowerCase().includes(p.toLowerCase())); if(idx>-1) known[idx]=r; else rest.push(r); });
    rest.sort((a,b)=>(a.display_priority||99)-(b.display_priority||99));
    providerRowState.list=known.filter(Boolean).concat(rest).slice(0,10);
    providerRowState.mediaType=mediaType;
    providerRowState.selected=providerRowState.list[0]||null;
    renderProviderDropdownList();
    if(providerRowState.selected) await loadProviderRowItems();
    else { const r=document.getElementById('provider-row-items'); if(r) r.innerHTML=emptyRowMsg(t('noProvidersRegion')); }
  }catch(e){ const r=document.getElementById('provider-row-items'); if(r) r.innerHTML=emptyRowMsg(); }
}
function renderProviderDropdownList(){
  const wrap=document.getElementById('provider-dropdown-list');
  if(!wrap) return;
  wrap.innerHTML=providerRowState.list.map(p=>`
    <button class="provider-item ${providerRowState.selected && providerRowState.selected.provider_id===p.provider_id?'selected':''}" data-action="select-provider" data-id="${p.provider_id}">
      <img src="${p.logo_path?IMG_BASE+'/'+PROVIDER_LOGO_SIZE+p.logo_path:''}" alt="">
      <span>${escapeHtml(p.provider_name)}</span></button>`).join('');
  const nameEl=document.getElementById('provider-row-name');
  if(nameEl) nameEl.textContent=(providerRowState.selected && providerRowState.selected.provider_name)||'Netflix';
}
async function loadProviderRowItems(){
  const rowEl=document.getElementById('provider-row-items');
  if(!rowEl) return;
  rowEl.innerHTML=skeletonRow(4);
  try{
    const pid=providerRowState.selected.provider_id, mt=providerRowState.mediaType;
    infiniteRow(rowEl,pg=>TMDBApi.discover(mt,{with_watch_providers:pid, watch_region:STATE.region, sort_by:'popularity.desc', page:pg}));
  }catch(e){ rowEl.innerHTML=emptyRowMsg(); }
}
function selectProvider(id){
  const p=providerRowState.list.find(x=>String(x.provider_id)===String(id));
  if(!p) return;
  providerRowState.selected=p;
  renderProviderDropdownList();
  const dd=document.getElementById('provider-dropdown-list'); if(dd) dd.classList.add('hidden');
  loadProviderRowItems();
  // Applique aussi ce provider comme filtre global du catalogue (Films/TV)
  STATE.selectedProvider={id:p.provider_id, name:p.provider_name};
  saveState();
}

async function renderTrendingRow(mediaType,label,container,targetRoute){
  if(!container) return;
  const rowId=`row-${targetRoute}-${mediaType}`;
  container.innerHTML=`<div class="section"><div class="section-head"><h2>${label}</h2>
      <button class="view-all" data-action="navigate" data-href="#/${targetRoute}">${t('viewAll')}<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button></div>
    <div class="row-scroll" id="${rowId}">${skeletonRow(4)}</div></div>`;
  try{
    const el=document.getElementById(rowId);
    if(el) infiniteRow(el,pg=>TMDBApi.trending(mediaType,'day',pg));
  }catch(e){ const el=document.getElementById(rowId); if(el) el.innerHTML=emptyRowMsg(); }
}

