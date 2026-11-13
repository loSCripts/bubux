function titleAlreadyWatched(mt,id){
  return !!((STATE.watched||{})[mt+'_'+id]) || (STATE.continueWatching||[]).some(c=>String(c.id)===String(id)&&c.media_type===mt);
}
function openVideasyPlayer(mediaType,tmdbId,title,season,episode){
  // Pas de pub si : film deja regarde, ou serie hors cycle (une pub tous les AD_EVERY_N_EPISODES episodes).
  // Reglages et fonctionnement de la pub : js/ads/ad-config.js et js/ads/ad-gate.js
  if(!adNeededForOpen(mediaType,tmdbId,season,episode)){ videasyReallyOpen(mediaType,tmdbId,title,season,episode); return; }
  adGateShow({mediaType:mediaType,onPass:function(){
    closeModal();
    videasyReallyOpen(mediaType,tmdbId,title,season,episode);
  }});
}

/* Écran de pub fictive (placeholder) affiché avant le lancement réel du lecteur.
   Plus tard : une vraie publicité sera intégrée ici avant l'appel à videasyReallyOpen. */
function videasyShowAdThenPlay(mediaType,tmdbId,title,season,episode){
  openModal(`
    <div style="text-align:center;padding:10px 0">
      <div style="font-size:2.2rem;line-height:1;margin-bottom:14px">📺</div>
      <h3 style="margin-bottom:10px">Publicité</h3>
      <p class="sub" style="margin-bottom:18px;line-height:1.5">Ceci est un emplacement publicitaire fictif. Une vraie publicité sera diffusée ici prochainement.</p>
      <button class="btn-play" style="width:100%;justify-content:center" id="videasy-ad-continue">Continuer vers le film</button>
    </div>
  `);
  document.getElementById('videasy-ad-continue').addEventListener('click', function(){
    closeModal();
    videasyReallyOpen(mediaType,tmdbId,title,season,episode);
  });
}


async function videasyReallyOpen(mediaType,tmdbId,title,season,episode){
  const modal=document.getElementById('videasy-modal');
  const iframe=document.getElementById('videasy-iframe');
  const modalTitle=document.getElementById('videasy-title');
  const unavailableEl=document.getElementById('videasy-unavailable');

  const s=mediaType==='tv'?(season||1):null;
  const e=mediaType==='tv'?(episode||1):null;
  if(mediaType==='tv') adCommitEpisode(tmdbId,s,e);   // compte cet episode pour la pub tous les N episodes
  videasyAltPlayer=false;
  videasySandboxEnabled=(safeStorageGet('videasySandbox')!=='0');
  const url=videasyBuildUrl(mediaType,tmdbId,s,e);
  if(!url){ showToast('Type de média non supporté'); return; }

  STATE.watched=STATE.watched||{}; STATE.watched[mediaType+'_'+tmdbId]=1; saveState();
  videasyCurrentMediaType=mediaType;
  videasyCurrentUrl=url;
  videasyCurrentTmdbId=tmdbId;
  videasyCurrentTitle=title||'';
  videasyCurrentSeason=s;
  videasyCurrentEpisode=e;
  videasyCurrentImage=videasyCurrentImage||'';
  unavailableEl.style.display='none';
  iframe.style.display='block';
  videasyApplySandboxAttribute(iframe);
  iframe.src=url;
  modalTitle.textContent=mediaType==='tv'&&s&&e ? `${title||'Lecture en cours'} · S${s} E${e}` : (title||'Lecture en cours');
  modal.style.display='flex';
  document.body.style.overflow='hidden';
  videasyUpdateLangButton();
  videasyUpdateSandboxButton(); videasyUpdateSourceButton(); videasyUpdateSubsButton();
  { const tip=document.getElementById('videasy-tip'); if(tip){ tip.classList.remove('hide'); clearTimeout(window.__videasyTipT); window.__videasyTipT=setTimeout(()=>tip.classList.add('hide'),9000); tip.onclick=()=>tip.classList.add('hide'); } }

  const epToggle=document.getElementById('videasy-episodes-toggle');
  const nextBar=document.getElementById('videasy-next-episode-bar');
  document.getElementById('videasy-episodes-panel').classList.remove('open');
  if(mediaType==='tv'){
    epToggle.style.display='';
    document.getElementById('videasy-episodes-toggle-label').textContent=`S${s} E${e}`;
    videasyLoadEpisodesPanel(tmdbId,s,e);
  }else{
    epToggle.style.display='none';
    nextBar.classList.remove('show');
  }
  videasyScheduleNextEpisodeSuggestion();
  videasyOpenToken=Date.now(); videasyLastCur=0; videasyRealMsgAt=0;
  { const rsec=videasyResumeSeconds(mediaType,tmdbId,s,e); if(rsec>0) videasyForceSeek(rsec,videasyOpenToken); }

  // Enregistre tout de suite la progression réelle (saison/épisode en cours),
  // pour permettre une vraie reprise "au bon endroit" depuis l'accueil.
  logRealProgress();

  // Rattache le bouton/geste retour du téléphone à la fermeture du lecteur,
  // au lieu de laisser le navigateur quitter toute l'app.
  history.pushState({videasyPlayer:true}, '', location.href);
}
window.addEventListener('popstate', function(){
  if(videasyIsOpen()) closeVideasyPlayer(true);
});

function videasyShowUnavailable(){
  const iframe=document.getElementById('videasy-iframe');
  const unavailableEl=document.getElementById('videasy-unavailable');
  iframe.style.display='none';
  iframe.src='';
  unavailableEl.style.display='flex';
}
document.getElementById('videasy-unavailable-close').addEventListener('click', ()=>closeVideasyPlayer());

async function closeVideasyPlayer(fromPopstate){
  const modal=document.getElementById('videasy-modal');
  const iframe=document.getElementById('videasy-iframe');
  modal.style.display='none';
  iframe.src='';
  document.body.style.overflow='';
  if(videasyNextEpisodeTimer){ clearTimeout(videasyNextEpisodeTimer); videasyNextEpisodeTimer=null; }
  document.getElementById('videasy-next-episode-bar').classList.remove('show');
  if(parseHash()[0]==='home') renderContinueWatching();
  if(!fromPopstate){
    // On consomme l'entrée d'historique ajoutée à l'ouverture, pour que le
    // bouton retour du téléphone ne laisse pas une entrée fantôme derrière.
    history.back();
  }
}
document.getElementById('close-videasy').addEventListener('click', ()=>closeVideasyPlayer());
document.getElementById('videasy-subs-toggle').addEventListener('click', function(e){ e.stopPropagation(); videasyToggleSubs(); });
document.getElementById('videasy-sandbox-toggle').addEventListener('click', function(e){ e.stopPropagation(); videasyToggleSandbox(); });
document.getElementById('videasy-source-toggle').addEventListener('click', function(e){ e.stopPropagation(); videasyToggleSource(); });

