/* ================= LECTEUR VIDEASY (Streaming, mode cinéma) ================= */
let videasyCurrentMediaType=null;
let videasyCurrentUrl=null;
let videasyCurrentTmdbId=null;
let videasyCurrentTitle='';
let videasyCurrentImage='';
let videasyCurrentSeason=null;
let videasyCurrentEpisode=null;
let videasySeasonsCache=null; // {seasons:[{season_number,episode_count,name}], episodesBySeason:{n:[...]}}
let videasyNextEpisodeTimer=null;
let videasySandboxEnabled=(safeStorageGet('videasySandbox')!=='0'); // activé par défaut pour protéger des pubs, désactivable par l'utilisateur
function videasyDetectDefaultLang(){
  // Détecte la langue du navigateur/appareil de l'utilisateur, plutôt que de
  // forcer le français pour tout le monde. Langues confirmées par la doc
  // moviez.ac (codes ISO 639-1) : en, es, hi, fr. Repli sur 'fr' si aucune
  // des langues du navigateur ne correspond.
  const supported=['fr','en','es','hi'];
  const langs=(navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language||''];
  for(const l of langs){
    const code=(l||'').toLowerCase().slice(0,2);
    if(supported.includes(code)) return code;
  }
  return 'fr';
}
let videasyAudioLang=(localStorage.getItem('videasyAudioLang')||videasyDetectDefaultLang()); // code ISO 639-1 ('fr','en','es','hi'), détecté automatiquement puis mémorisé
const VIDEASY_SANDBOX_VALUE='allow-scripts allow-same-origin allow-forms allow-presentation allow-orientation-lock allow-storage-access-by-user-activation';

function videasyApplySandboxAttribute(iframe){
  if(videasySandboxEnabled) iframe.setAttribute('sandbox', VIDEASY_SANDBOX_VALUE);
  else iframe.removeAttribute('sandbox');
}

function videasyResumeSeconds(mt,id,season,episode){
  const it=(STATE.continueWatching||[]).find(c=>String(c.id)===String(id)&&c.media_type===mt);
  if(!it || !(it.seconds>15)) return 0;
  if(it.pct && it.pct>=95) return 0;   // quasi fini : on repart du debut
  if(mt==='tv' && (Number(it.season||1)!==Number(season||1) || Number(it.episode||1)!==Number(episode||1))) return 0;
  return Math.max(0,Math.floor(it.seconds-3));
}
function fmtClock(sec){ sec=Math.floor(sec); const h=Math.floor(sec/3600), m=Math.floor(sec%3600/60), r=sec%60; return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(r).padStart(2,'0'); }
/* Lecteur 1 (Moviez) = defaut a chaque ouverture. Lecteur 2 = uniquement si l'utilisateur appuie sur le bouton. */
let videasySubs=(safeStorageGet('videasySubs')==='1');
function videasyUpdateSubsButton(){
  const b=document.getElementById('videasy-subs-toggle'); if(!b) return;
  b.classList.toggle('videasy-subs-on', videasySubs);
  b.title=videasySubs?'Sous-titres français activés (appuie pour désactiver)':'Sous-titres français désactivés (appuie pour activer)';
}
function videasyToggleSubs(){
  videasySubs=!videasySubs;
  safeStorageSet('videasySubs',videasySubs?'1':'0');
  videasyUpdateSubsButton();
  showToast(videasySubs?'Sous-titres français activés (VO sous-titrée)':'Sous-titres désactivés');
  if(videasyCurrentTmdbId && videasyIsOpen()){
    const iframe=document.getElementById('videasy-iframe');
    videasyCurrentUrl=videasyBuildUrl(videasyCurrentMediaType,videasyCurrentTmdbId,videasyCurrentSeason,videasyCurrentEpisode);
    iframe.src='';
    setTimeout(()=>{ iframe.src=videasyCurrentUrl; },30);
  }
}
let videasyAltPlayer=false;
function videasyUpdateSourceButton(){
  const b=document.getElementById('videasy-source-toggle'); if(!b) return;
  b.classList.toggle('videasy-alt-on', videasyAltPlayer);
  b.title='Changer de lecteur ('+(videasyAltPlayer?'Lecteur 2':'Lecteur 1')+' actif)';
}
function videasyToggleSource(){
  videasyAltPlayer=!videasyAltPlayer;
  // Lecteur 2 : protection desactivee automatiquement (sans toucher au reglage memorise). Lecteur 1 : reglage memorise.
  videasySandboxEnabled=videasyAltPlayer?false:(safeStorageGet('videasySandbox')!=='0');
  videasyApplySandboxAttribute(document.getElementById('videasy-iframe'));
  videasyUpdateSandboxButton();
  videasyUpdateSourceButton();
  showToast(videasyAltPlayer?'Lecteur 2 : protection désactivée':'Lecteur 1');
  if(videasyCurrentTmdbId && videasyIsOpen()){
    const iframe=document.getElementById('videasy-iframe');
    videasyCurrentUrl=videasyBuildUrl(videasyCurrentMediaType,videasyCurrentTmdbId,videasyCurrentSeason,videasyCurrentEpisode);
    iframe.src='';
    setTimeout(()=>{ iframe.src=videasyCurrentUrl; },30);
  }
}
function videasyBuildUrl(mediaType,tmdbId,season,episode){
  if(videasyAltPlayer){
    const flxLang=(!videasySubs&&videasyAudioLang==='fr')?'vf':'vo';
    const base=`https://fluxora.sbs/embed/zenix?tmdb=${tmdbId}&type=${mediaType}&lang=${flxLang}&embed_mobile=1&pk=6O5dLJWmhoxPjmKdXWAtNlBRjxtv1O`;
    const rsec=videasyResumeSeconds(mediaType,tmdbId,season,episode);
    const rs=rsec>0?`&progress=${rsec}&t=${rsec}&start=${rsec}&startAt=${rsec}`:'';
    if(mediaType==='movie') return base+rs;
    if(mediaType==='tv') return `${base}&season=${season||1}&episode=${episode||1}${rs}`;
    return null;
  }
  // Lecteur 1 : Moviez (api.moviez.ac)
  // Film : /<tmdb>   Serie : /serie/<tmdb>/<saison>/<episode>   Options : ?autoplay=1  ?lang=vo
  let url;
  if(mediaType==='movie') url=`https://api.moviez.ac/${tmdbId}`;
  else if(mediaType==='tv') url=`https://api.moviez.ac/serie/${tmdbId}/${season||1}/${episode||1}`;
  else return null;
  const q=['autoplay=1'];
  if(videasySubs) q.push('lang=vostfr');                    // VO sous-titrée en français
  else if(videasyAudioLang!=='fr') q.push('lang=vo');
  const sec=videasyResumeSeconds(mediaType,tmdbId,season,episode);
  if(sec>0) q.push('t='+sec,'start='+sec,'progress='+sec);
  return url+'?'+q.join('&');
}

