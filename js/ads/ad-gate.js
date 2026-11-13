/* ================= PORTE PUBLICITAIRE =================
   Avant de lancer un film (premiere fois) ou un episode (tous les N episodes d'une serie),
   on affiche un message, on ouvre la pub AU PREMIER PLAN et on valide seulement quand
   l'utilisateur est reste au moins AD_MIN_STAY_MS sur l'onglet de la pub puis revient ici.
   Reglages : ad-config.js. Appele depuis player-open.js et player-episodes.js. */

let adBypass=false;   // vrai uniquement pendant l'ouverture de la pub (redirect-blocking.js le lit)
let adGate=null;      // porte en cours : {el,onPass,armed,leftAt,helpTimer}
const adNow=()=>performance.now();

/* --- Quand faut-il une pub ? --- */
function adTvInfo(tmdbId){
  const rec=(STATE.adTv||{})[tmdbId];
  if(rec) return rec;
  // Serie deja commencee avant cette regle : pas de pub tout de suite, la suivante viendra dans N episodes
  return {n:titleAlreadyWatched('tv',tmdbId)?1:0, last:''};
}
function adEpisodeKey(season,episode){ return 'S'+season+'E'+episode; }
function adNeededForEpisode(tmdbId,season,episode){
  const rec=adTvInfo(tmdbId);
  if(rec.last===adEpisodeKey(season,episode)) return false;   // reprise du meme episode : pas de pub
  return rec.n%AD_EVERY_N_EPISODES===0;
}
function adCommitEpisode(tmdbId,season,episode){
  const rec=Object.assign({},adTvInfo(tmdbId));
  const key=adEpisodeKey(season,episode);
  if(rec.last===key) return;
  rec.n=(rec.n||0)+1; rec.last=key;
  STATE.adTv=STATE.adTv||{}; STATE.adTv[tmdbId]=rec; saveState();
}
function adNeededForOpen(mediaType,tmdbId,season,episode){
  if(mediaType==='tv') return adNeededForEpisode(tmdbId,season||1,episode||1);
  return !titleAlreadyWatched(mediaType,tmdbId);   // film : premiere fois seulement
}

/* --- Ouverture de la pub (a appeler directement depuis un clic) --- */
function adOpenTab(){
  let w=null;
  adBypass=true;
  try{
    w=window.open('about:blank','_blank');   // onglet au premier plan
    if(w){
      try{ w.opener=null; }catch(e){}
      try{ w.location.href=AD_LINK; }catch(e){ try{ w.close(); }catch(_){} w=null; }
    }
  }catch(e){ w=null; }
  adBypass=false;
  return !!w;
}

/* --- Fenetre d'avertissement --- */
function adSeconds(ms){ return (ms/1000).toFixed(1).replace('.',','); }
function adGateShow(opts){
  adGateClose();
  const secs=Math.round(AD_MIN_STAY_MS/1000);
  const isEpisode=!!(opts&&opts.mediaType==='tv');
  const intro=isEpisode
    ? `Pour continuer à vous offrir ce contenu gratuitement, une publicité vous est demandée tous les ${AD_EVERY_N_EPISODES} épisodes.`
    : 'Pour continuer à vous offrir ce contenu gratuitement, veuillez regarder une seule publicité avant de commencer votre film ou série.';
  const el=document.createElement('div');
  el.id='ad-gate'; el.className='ad-gate';
  el.innerHTML=`
    <div class="ad-card">
      <div class="ad-emoji">❤️</div>
      <h3>Merci de soutenir Bubux</h3>
      <p class="ad-text">${intro}</p>
      <div class="ad-rule">⏱️ Important : restez au moins <b>${secs} secondes</b> sur l'onglet de la publicité, puis revenez ici. La lecture ne se débloque qu'après ces ${secs} secondes.</div>
      <p class="ad-small">Nous ne sommes pas responsables des publicités affichées par le lecteur : elles proviennent de nos fournisseurs de streaming, indépendants de Bubux.</p>
      <p class="ad-small">⚠️ Certains films et séries indiqués comme doublés en français ne le sont pas toujours réellement selon la source : ceci ne dépend pas de Bubux.</p>
      <details class="ad-details">
        <summary>Clause de non-responsabilité (source du lecteur)</summary>
        <p>Bubux n'héberge, ne stocke ni ne distribue aucun contenu protégé par le droit d'auteur. Le lecteur intégré est fourni par Moviez, un service d'indexation qui agrège des liens vers du contenu accessible publiquement sur des sites web tiers, à l'instar d'un moteur de recherche. Ni Bubux ni Moviez ne contrôlent ni n'approuvent le contenu accessible via ces liens. La responsabilité du contenu incombe entièrement aux fournisseurs tiers respectifs. Pour toute question relative au droit d'auteur, veuillez consulter la politique DMCA de Moviez.</p>
      </details>
      <div class="ad-status" id="ad-gate-status"></div>
      <div class="ad-help" id="ad-gate-help" style="display:none">
        La publicité ne s'affiche pas ? <a id="ad-gate-link" data-ad="1" href="${AD_LINK}" target="_blank" rel="noopener">Ouvrez-la ici</a>.<br>
        Elle s'est peut-être ouverte dans l'onglet voisin : ouvrez-le, restez ${secs} secondes dessus, puis revenez sur Bubux.
      </div>
      <button class="btn-play ad-go" id="ad-gate-go">▶ Voir la publicité</button>
      <button class="ad-cancel" id="ad-gate-cancel">Annuler</button>
    </div>`;
  document.body.appendChild(el);
  adGate={el,onPass:opts&&opts.onPass,armed:false,leftAt:0,helpTimer:null};
  document.getElementById('ad-gate-go').addEventListener('click',adGateStart);
  document.getElementById('ad-gate-cancel').addEventListener('click',()=>adGateClose());
}
function adGateClose(){
  if(!adGate) return;
  clearTimeout(adGate.helpTimer);
  try{ adGate.el.remove(); }catch(e){}
  adGate=null;
}
function adGateSetStatus(html,kind){
  const s=document.getElementById('ad-gate-status'); if(!s) return;
  s.className='ad-status'+(kind?' '+kind:''); s.innerHTML=html;
}
function adGateShowHelp(){
  const h=document.getElementById('ad-gate-help'); if(h) h.style.display='block';
}

/* Clic sur "Voir la publicite" : on ouvre l'onglet tout de suite (dans le clic) */
function adGateStart(){
  const g=adGate; if(!g) return;
  const secs=Math.round(AD_MIN_STAY_MS/1000);
  g.armed=true; g.leftAt=0;
  const opened=adOpenTab();
  const go=document.getElementById('ad-gate-go'); if(go) go.style.display='none';
  const help=document.getElementById('ad-gate-help'); if(help) help.style.display='none';
  adGateSetStatus(`Publicité ouverte. Restez ${secs} secondes sur son onglet, puis revenez sur Bubux.`,'wait');
  clearTimeout(g.helpTimer);
  if(opened){
    // Si l'ecran n'a pas bascule au bout de 2,5 s, on affiche le plan B (lien manuel + onglet voisin)
    g.helpTimer=setTimeout(()=>{ if(adGate===g && g.armed && !g.leftAt) adGateShowHelp(); },2500);
  }else{
    adGateShowHelp();
  }
}

/* --- Mesure du temps passe sur l'onglet de la pub --- */
function adLeave(){ if(adGate && adGate.armed && !adGate.leftAt) adGate.leftAt=adNow(); }
function adBack(){
  const g=adGate; if(!g || !g.armed || !g.leftAt) return;
  const away=adNow()-g.leftAt; g.leftAt=0;
  if(away>=AD_MIN_STAY_MS) adGatePass(); else adGateTooShort(away);
}
document.addEventListener('visibilitychange',()=>{ if(document.hidden) adLeave(); else adBack(); });
window.addEventListener('blur',adLeave);
window.addEventListener('focus',adBack);
window.addEventListener('popstate',()=>adGateClose());
window.addEventListener('hashchange',()=>adGateClose());

function adGatePass(){
  const g=adGate; if(!g) return;
  const cb=g.onPass;
  adGateClose();
  try{ if(cb) cb(); }catch(e){ console.error(e); }
}
function adGateTooShort(away){
  const secs=Math.round(AD_MIN_STAY_MS/1000);
  adGateSetStatus(`Vous êtes revenu après ${adSeconds(away)} s. Il faut rester au moins ${secs} secondes sur la publicité pour valider.`,'warn');
  const go=document.getElementById('ad-gate-go');
  if(go){ go.style.display=''; go.textContent='↻ Réessayer'; }
  const help=document.getElementById('ad-gate-help'); if(help) help.style.display='none';
  if(adGate){ adGate.armed=false; clearTimeout(adGate.helpTimer); }
}
