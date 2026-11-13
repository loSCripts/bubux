/* ================= DETAIL ================= */
function providerHomeUrl(name){
  const n=name.toLowerCase();
  if(n.includes('netflix')) return 'https://www.netflix.com/';
  if(n.includes('hulu')) return 'https://www.hulu.com/';
  if(n.includes('disney')) return 'https://www.disneyplus.com/';
  if(n.includes('prime')) return 'https://www.primevideo.com/';
  if(n.includes('max')) return 'https://www.max.com/';
  if(n.includes('apple')) return 'https://tv.apple.com/';
  return 'https://www.justwatch.com/';
}
function detailEpisodesSectionHtml(tvId,data,defaultSeason){
  const seasons=data.seasons.filter(s=>s.season_number>0);
  if(!seasons.length) return '';
  const sel=seasons.some(s=>s.season_number===defaultSeason)?defaultSeason:seasons[0].season_number;
  return `<div class="detail-section" id="detail-episodes-section" data-tv-id="${tvId}" data-title="${escapeHtml(data.name||'')}" data-image="${escapeHtml(data.backdrop_path||data.poster_path||'')}">
    <div class="section-head" style="margin-bottom:8px">
      <h3 style="margin:0">Épisodes</h3>
      <select class="videasy-season-select" id="detail-season-select">
        ${seasons.map(s=>`<option value="${s.season_number}" ${s.season_number===sel?'selected':''}>${escapeHtml(s.name||('Saison '+s.season_number))}</option>`).join('')}
      </select>
    </div>
    <div id="detail-episodes-list"><p style="color:var(--text-3);font-size:.85rem">Chargement…</p></div>
  </div>`;
}
async function loadDetailEpisodesList(tvId,seasonNumber){
  const list=document.getElementById('detail-episodes-list');
  if(!list) return;
  list.innerHTML=`<p style="color:var(--text-3);font-size:.85rem">Chargement…</p>`;
  try{
    const data=await tmdb(`/tv/${tvId}/season/${seasonNumber}`);
    const episodes=data.episodes||[];
    const section=document.getElementById('detail-episodes-section');
    const title=section ? section.dataset.title : '';
    const image=section ? section.dataset.image : '';
    list.innerHTML=episodes.map(ep=>{
      const thumb=ep.still_path?`${IMG_BASE}/w300${ep.still_path}`:'';
      return `<div class="videasy-episode-row" style="cursor:pointer" data-action="watch" data-type="tv" data-id="${tvId}" data-title="${escapeHtml(title)}" data-image="${escapeHtml(image)}" data-season="${seasonNumber}" data-episode="${ep.episode_number}">
        <div class="ep-thumb" style="${thumb?`background-image:url(${thumb});background-size:cover;background-position:center`:''};background-color:var(--bg-elevated)"></div>
        <div><div class="ep-num" style="color:var(--text-3)">Épisode ${ep.episode_number}</div><div class="ep-title" style="color:var(--text-1)">${escapeHtml(ep.name||'')}</div></div>
      </div>`;
    }).join('') || `<p style="color:var(--text-3);font-size:.85rem">Aucun épisode trouvé.</p>`;
  }catch(e){
    list.innerHTML=`<p style="color:var(--text-3);font-size:.85rem">Impossible de charger les épisodes.</p>`;
  }
}
async function renderDetail(root,mediaType,id){
  root.innerHTML=`<div class="page">
      <button class="back-btn" data-action="go-back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
      <div class="top-logo" style="left:64px">B</div>
      <section class="hero" id="detail-hero" style="min-height:64vh">
        <div class="hero-bg-wrap" id="hero-bg-wrap"><div class="hero-bg skel" id="detail-hero-bg"></div></div>
        <div class="hero-scrim"></div>
        <div class="hero-content" id="detail-hero-content"></div>
      </section>
      <div id="detail-extra"></div>
    </div>`;
  const data=await tmdb(`/${mediaType}/${id}`,{append_to_response:'videos,images,credits,recommendations,watch/providers'});
  const year=(data.release_date||data.first_air_date||'').slice(0,4);
  const runtime = mediaType==='movie' ? (data.runtime?`${Math.floor(data.runtime/60)}h ${data.runtime%60}m`:null)
                                       : (data.number_of_seasons?`${data.number_of_seasons} season${data.number_of_seasons>1?'s':''}`:null);
  const genreName=data.genres && data.genres[0] ? data.genres[0].name : null;
  const bgEl=document.getElementById('detail-hero-bg');
  if(bgEl){ bgEl.style.backgroundImage = data.backdrop_path?`url(${IMG_BASE}/${BACKDROP_SIZE}${data.backdrop_path})`:''; bgEl.classList.remove('skel'); }
  const logos=(data.images && data.images.logos) || [];
  const logo=logos.find(l=>l.iso_639_1==='en') || logos[0];
  const contentEl=document.getElementById('detail-hero-content');
  const savedProgress=STATE.continueWatching.find(c=>String(c.id)===String(id) && c.media_type===mediaType);
  const resumeSeason=savedProgress && savedProgress.season ? savedProgress.season : 1;
  const resumeEpisode=savedProgress && savedProgress.episode ? savedProgress.episode : 1;
  const playLabel = mediaType==='tv' && savedProgress ? `${t('play')} · S${resumeSeason} E${resumeEpisode}` : t('play');
  const posterImg=data.backdrop_path||data.poster_path||'';
  contentEl.innerHTML=`
    ${logo?`<img class="hero-logo-img" src="${IMG_BASE}/${LOGO_SIZE}${logo.file_path}" alt="${escapeHtml(data.title||data.name)}">`:`<div class="hero-title-fallback">${escapeHtml(data.title||data.name||'')}</div>`}
    <div class="hero-meta">
      <span>${iconSpan(STAR_PATH).replace('<svg ','<svg class="star-ic" ')}${data.vote_average?data.vote_average.toFixed(1):'–'}/10</span>
      <span><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>${year||'–'}</span>
      ${genreName?`<span>${iconSpan(iconForGenre(genreName))}${escapeHtml(genreName)}</span>`:''}
      ${runtime?`<span>${runtime}</span>`:''}
    </div>
    <p class="hero-desc" style="-webkit-line-clamp:4">${escapeHtml(data.overview||t('noDescription'))}</p>
    <div class="hero-actions">
      <button class="btn-play" data-action="watch" data-type="${mediaType}" data-id="${id}" data-title="${escapeHtml(data.title||data.name||'')}" data-image="${escapeHtml(posterImg)}" ${mediaType==='tv'?`data-season="${resumeSeason}" data-episode="${resumeEpisode}"`:''}><svg viewBox="0 0 24 24"><path d="M7 4l13 8-13 8Z"/></svg> ${playLabel}</button>
      <button class="btn-trailer" data-action="play-trailer" data-type="${mediaType}" data-id="${id}"><svg viewBox="0 0 24 24"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg> ${t('trailer')||'Bande-annonce'}</button>
      <div class="btn-segment"><button data-action="add-to-list" data-type="${mediaType}" data-id="${id}" aria-label="${t('addToList')}"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button></div>
    </div>`;
  let extraHtml='';
  if(mediaType==='tv' && data.seasons && data.seasons.length){
    extraHtml+=detailEpisodesSectionHtml(id,data,resumeSeason);
  }
  const providersRegion=(data['watch/providers'] && data['watch/providers'].results) ? data['watch/providers'].results[STATE.region] : null;
  const provs=[].concat((providersRegion&&providersRegion.flatrate)||[],(providersRegion&&providersRegion.free)||[]).filter((v,i,a)=>a.findIndex(x=>x.provider_id===v.provider_id)===i);
  if(provs.length){
    extraHtml+=`<div class="detail-section"><h3>${t('availableOn')}</h3><div class="provider-badges">
      ${provs.map(p=>`<a class="provider-badge" href="${providerHomeUrl(p.provider_name)}" target="_blank" rel="noopener"><img src="${IMG_BASE}/${PROVIDER_LOGO_SIZE}${p.logo_path}" alt=""><span>${escapeHtml(p.provider_name)}</span></a>`).join('')}
    </div><p class="credits-text">${t('justwatchCredit')}</p></div>`;
  }
  const cast=(data.credits && data.credits.cast)||[];
  if(cast.length){
    extraHtml+=`<div class="detail-section"><h3>${t('cast')}</h3><div class="cast-row">
      ${cast.slice(0,12).map(c=>`<div class="cast-item"><img class="avatar" src="${c.profile_path?IMG_BASE+'/w185'+c.profile_path:''}" alt=""><div class="name">${escapeHtml(c.name)}</div></div>`).join('')}
    </div></div>`;
  }
  const recs=(data.recommendations && data.recommendations.results)||[];
  if(recs.length){
    extraHtml+=`<div class="section"><div class="section-head"><h2>${t('youMightLike')}</h2></div><div class="row-scroll" id="detail-recs-row">${recs.map(posterCardHtml).join('')}</div></div>`;
  }
  document.getElementById('detail-extra').innerHTML=extraHtml;
  { const rr=document.getElementById('detail-recs-row');
    if(rr){ const seen=new Set(recs.map(r=>(r.media_type||mediaType)+r.id)); let pg=1,tot=(data.recommendations&&data.recommendations.total_pages)||1,ld=false;
      const more=async()=>{ if(ld||!rr.isConnected) return; if(pg>=tot){ pg=0; seen.clear(); } ld=true;
        try{ const d=await tmdb(`/${mediaType}/${id}/recommendations`,{page:pg+1}); pg=d.page; tot=d.total_pages;
          rr.insertAdjacentHTML('beforeend',(d.results||[]).filter(r=>{const k=(r.media_type||mediaType)+r.id; if(seen.has(k)) return false; seen.add(k); return true;}).map(posterCardHtml).join('')); }catch(e){}
        ld=false; };
      rr.addEventListener('scroll',()=>{ if(rr.scrollWidth-(rr.scrollLeft+rr.clientWidth)<900) more(); },{passive:true}); } }
  if(mediaType==='tv' && data.seasons && data.seasons.length){
    const seasonSelect=document.getElementById('detail-season-select');
    if(seasonSelect){
      loadDetailEpisodesList(id,Number(seasonSelect.value));
      seasonSelect.addEventListener('change', function(){ loadDetailEpisodesList(id,Number(this.value)); });
    }
  }
}

/* ================= CONTINUE WATCHING / TRAILER =================
   La progression réelle (saison/épisode réellement regardés) est gérée par
   logRealProgress(), appelée depuis videasyReallyOpen / videasySwitchEpisode. */
function removeContinueWatching(mediaType,id){
  STATE.continueWatching=STATE.continueWatching.filter(c=>!(String(c.id)===String(id) && c.media_type===mediaType));
  saveState(); renderContinueWatching();
}
async function playTrailer(mediaType,id){
  showToast(t('loadingTrailer'));
  try{
    let data=await tmdb(`/${mediaType}/${id}/videos`);
    let vids=data.results||[];
    let trailer=vids.find(v=>v.site==='YouTube'&&v.type==='Trailer');
    if(!trailer && LANG_TO_TMDB[CURRENT_LANG]!=='en-US'){
      data=await tmdb(`/${mediaType}/${id}/videos`,{language:'en-US'});
      vids=data.results||[];
      trailer=vids.find(v=>v.site==='YouTube'&&v.type==='Trailer');
    }
    if(!trailer) trailer=vids.find(v=>v.site==='YouTube');
    if(!trailer){ showToast(t('noTrailer')); return; }
    const details=await tmdb(`/${mediaType}/${id}`);
    openModal(`<h3 style="margin-bottom:14px">${escapeHtml(details.title||details.name)}</h3>
      <div style="position:relative;width:100%;aspect-ratio:16/9;border-radius:14px;overflow:hidden;background:#000">
        <iframe style="width:100%;height:100%;border:0" src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&playsinline=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>
      </div>`);
  }catch(e){ handleApiError(e); }
}

