/* --- Panneau Épisodes (façon Netflix) --- */
async function videasyLoadEpisodesPanel(tmdbId,currentSeason,currentEpisode){
  const panel=document.getElementById('videasy-episodes-panel');
  const seasonSelect=document.getElementById('videasy-season-select');
  const list=document.getElementById('videasy-episodes-list');
  list.innerHTML=`<p style="color:rgba(255,255,255,.5);padding:16px 4px;font-size:.85rem">Chargement…</p>`;
  try{
    if(!videasySeasonsCache || videasySeasonsCache.tmdbId!==tmdbId){
      const show=await tmdb(`/tv/${tmdbId}`);
      const seasons=(show.seasons||[]).filter(s=>s.season_number>0);
      videasySeasonsCache={tmdbId, seasons, episodesBySeason:{}};
    }
    seasonSelect.innerHTML=videasySeasonsCache.seasons.map(s=>
      `<option value="${s.season_number}" ${s.season_number===currentSeason?'selected':''}>${escapeHtml(s.name||('Saison '+s.season_number))}</option>`
    ).join('');
    await videasyRenderEpisodesForSeason(tmdbId,currentSeason,currentEpisode);
  }catch(e){
    list.innerHTML=`<p style="color:rgba(255,255,255,.5);padding:16px 4px;font-size:.85rem">Impossible de charger les épisodes.</p>`;
  }
}
async function videasyRenderEpisodesForSeason(tmdbId,seasonNumber,highlightEpisode){
  const list=document.getElementById('videasy-episodes-list');
  list.innerHTML=`<p style="color:rgba(255,255,255,.5);padding:16px 4px;font-size:.85rem">Chargement…</p>`;
  try{
    let episodes=videasySeasonsCache.episodesBySeason[seasonNumber];
    if(!episodes){
      const data=await tmdb(`/tv/${tmdbId}/season/${seasonNumber}`);
      episodes=data.episodes||[];
      videasySeasonsCache.episodesBySeason[seasonNumber]=episodes;
    }
    list.innerHTML=episodes.map(ep=>{
      const isCurrent=seasonNumber===videasyCurrentSeason && ep.episode_number===highlightEpisode;
      const thumb=ep.still_path?`background-image:url(${IMG_BASE}/w300${ep.still_path})`:'';
      return `<div class="videasy-episode-row ${isCurrent?'current':''}" data-action="videasy-pick-episode" data-season="${seasonNumber}" data-episode="${ep.episode_number}">
        <div class="ep-thumb" style="${thumb}"></div>
        <div><div class="ep-num">Épisode ${ep.episode_number}</div><div class="ep-title">${escapeHtml(ep.name||'')}</div></div>
      </div>`;
    }).join('') || `<p style="color:rgba(255,255,255,.5);padding:16px 4px;font-size:.85rem">Aucun épisode trouvé.</p>`;
  }catch(e){
    list.innerHTML=`<p style="color:rgba(255,255,255,.5);padding:16px 4px;font-size:.85rem">Impossible de charger les épisodes.</p>`;
  }
}
document.getElementById('videasy-season-select').addEventListener('change', function(){
  const seasonNumber=Number(this.value);
  videasyRenderEpisodesForSeason(videasyCurrentTmdbId,seasonNumber,videasyCurrentEpisode);
});
document.getElementById('videasy-episodes-toggle').addEventListener('click', function(){
  document.getElementById('videasy-episodes-panel').classList.toggle('open');
});

/* Change d'épisode depuis le panneau (clic sur un épisode) : ne touche pas au
   reste du lecteur, recharge juste l'iframe sur le nouvel épisode. */
function videasySwitchEpisode(seasonNumber,episodeNumber){
  // Une pub tous les AD_EVERY_N_EPISODES episodes (js/ads/ad-gate.js) : on change d'episode une fois la pub validee
  if(adNeededForEpisode(videasyCurrentTmdbId,seasonNumber,episodeNumber)){
    adGateShow({mediaType:'tv',onPass:function(){ videasyDoSwitchEpisode(seasonNumber,episodeNumber); }});
    return;
  }
  videasyDoSwitchEpisode(seasonNumber,episodeNumber);
}
function videasyDoSwitchEpisode(seasonNumber,episodeNumber){
  adCommitEpisode(videasyCurrentTmdbId,seasonNumber,episodeNumber);
  videasyCurrentSeason=seasonNumber;
  videasyCurrentEpisode=episodeNumber;
  const url=videasyBuildUrl('tv',videasyCurrentTmdbId,seasonNumber,episodeNumber);
  videasyCurrentUrl=url;
  const iframe=document.getElementById('videasy-iframe');
  iframe.src=url;
  document.getElementById('videasy-title').textContent=`${videasyCurrentTitle||'Lecture en cours'} · S${seasonNumber} E${episodeNumber}`;
  document.getElementById('videasy-episodes-toggle-label').textContent=`S${seasonNumber} E${episodeNumber}`;
  document.getElementById('videasy-episodes-panel').classList.remove('open');
  document.getElementById('videasy-next-episode-bar').classList.remove('show');
  videasyRenderEpisodesForSeason(videasyCurrentTmdbId,seasonNumber,episodeNumber);
  logRealProgress();
  videasyScheduleNextEpisodeSuggestion();
}

/* Bouton "Épisode suivant" flottant, séparé du lecteur. On propose le
   passage à l'épisode suivant après quelques minutes de lecture, sans
   dépendre d'un signal fiable venant de l'iframe tierce. */
function videasyScheduleNextEpisodeSuggestion(){
  if(videasyNextEpisodeTimer) clearTimeout(videasyNextEpisodeTimer);
  const bar=document.getElementById('videasy-next-episode-bar');
  bar.classList.remove('show');
  if(videasyCurrentMediaType!=='tv') return;
  videasyNextEpisodeTimer=setTimeout(()=>{
    if(videasyIsOpen() && videasyCurrentMediaType==='tv') bar.classList.add('show');
  }, 15*60*1000); // proposé après 15 min, ajustable
}
document.getElementById('videasy-next-episode-bar').addEventListener('click', function(){
  videasyGoToNextEpisode();
});
function videasyGoToNextEpisode(){
  if(!videasySeasonsCache || videasyCurrentMediaType!=='tv') return;
  const episodes=videasySeasonsCache.episodesBySeason[videasyCurrentSeason]||[];
  const hasNextInSeason=episodes.some(ep=>ep.episode_number===videasyCurrentEpisode+1);
  if(hasNextInSeason){
    videasySwitchEpisode(videasyCurrentSeason,videasyCurrentEpisode+1);
  }else{
    const nextSeason=videasySeasonsCache.seasons.find(s=>s.season_number===videasyCurrentSeason+1);
    if(nextSeason) videasySwitchEpisode(nextSeason.season_number,1);
    else showToast('Dernier épisode disponible 🎉');
  }
}

