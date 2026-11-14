/* ================= IMPORT DU RAPPORT DE L'ANCIENNE VERSION (offre temporaire) =================
   Bannière sur l'accueil + entrée dans les réglages, jusqu'au 28 novembre 2026 inclus.
   Pour arrêter l'offre plus tôt ou plus tard, change IMPORT_OFFER_END.
   Le rapport est le JSON copié par le bouton « Copier le rapport » de l'ancienne version
   (format "bubux-rapport", voir le prompt fourni avec cette version). */
const IMPORT_OFFER_END=new Date('2026-11-29T00:00:00');
const IMPORT_K_DONE='bubux_import_done';
const IMPORT_K_NO='bubux_import_no';
const IMPORT_K_PROGRESS='bubux_imported_progress';   // minutes de l'ancienne version, pour le message « Tu étais à… »
const IMPORT_K_TOAST='bubux_import_toast';

function importOfferActive(){ return new Date()<IMPORT_OFFER_END; }
function importBannerWanted(){
  return importOfferActive() && safeStorageGet(IMPORT_K_DONE)!=='1' && safeStorageGet(IMPORT_K_NO)!=='1';
}

/* --- Bannière sur l'accueil --- */
function maybeShowImportBanner(){
  const slot=document.getElementById('import-banner-slot'); if(!slot) return;
  if(!importBannerWanted()){ slot.innerHTML=''; return; }
  slot.innerHTML=`<div class="install-banner" id="import-banner">
    <svg viewBox="0 0 24 24" style="flex:none"><path d="M12 16V4m0 0-4 4m4-4 4 4"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
    <div class="txt"><strong>${TL("Tu viens de l'ancienne version ?","Coming from the old version?")}</strong><span>${TL("Colle ton rapport pour retrouver ton historique, tes minutes et tes goûts.","Paste your report to get your history, timestamps and tastes back.")}</span></div>
    <button class="btn-primary" style="flex:none;padding:10px 16px" data-import="open">${TL("Importer","Import")}</button>
    <button class="btn-ghost" style="flex:none;padding:6px 10px" data-import="no" aria-label="${TL("Non merci","No thanks")}">✕</button>
  </div>`;
}

/* --- Fenêtre de collage --- */
function openImportModal(){
  openModal(`<h3>${TL("Importer ton rapport","Import your report")}</h3>
    <p class="sub">${TL("Sur l'ancienne version, appuie sur « Copier le rapport », puis colle-le ici.","On the old version, tap \"Copier le rapport\", then paste it here.")}</p>
    <button class="btn-secondary" style="width:100%;margin-bottom:12px" data-import="paste">${TL("Coller depuis le presse-papiers","Paste from clipboard")}</button>
    <div class="modal-field"><textarea id="import-text" rows="6" spellcheck="false" autocapitalize="off" autocomplete="off" placeholder="${TL("Ou colle le rapport ici","Or paste the report here")}"></textarea></div>
    <p class="sub" id="import-msg" style="min-height:1.2em;margin-bottom:14px"></p>
    <div class="modal-actions"><button class="btn-secondary" data-action="close-modal">${TL("Fermer","Close")}</button><button class="btn-primary" data-import="run">${TL("Importer","Import")}</button></div>`);
}
function importSetMsg(txt,isError){
  const m=document.getElementById('import-msg'); if(!m) return;
  m.textContent=txt; m.style.color=isError?'var(--danger,#ef4444)':'';
}
async function importPasteFromClipboard(){
  const ta=document.getElementById('import-text'); if(!ta) return;
  try{
    const txt=await navigator.clipboard.readText();
    if(!txt || !txt.trim()) throw new Error('vide');
    ta.value=txt;
    importSetMsg(TL("Rapport collé. Appuie sur Importer.","Report pasted. Tap Import."));
  }catch(e){
    // Plan B : le collage automatique est refusé, on laisse l'utilisateur coller à la main dans le champ
    importSetMsg(TL("Le collage automatique est bloqué : appuie longuement dans le champ, puis choisis Coller.","Automatic paste is blocked: long-press in the field, then choose Paste."),true);
    ta.focus();
  }
}

/* --- Lecture du texte collé (tolère du texte autour du JSON) --- */
function importParse(txt){
  const s=String(txt||'').trim();
  if(!s) throw new Error('vide');
  try{ return JSON.parse(s); }catch(e){}
  const a=s.indexOf('{'), b=s.lastIndexOf('}');
  if(a>=0 && b>a) return JSON.parse(s.slice(a,b+1));
  throw new Error('json');
}
function importLooksValid(d){
  return !!(d && typeof d==='object' && !Array.isArray(d) && (d.format==='bubux-rapport' || d.reprises || d.vus || d.brut || d.listes || d.gouts));
}
/* Minutes d'un élément « reprise » : champ seconds, sinon déduit du texte (1:12:05 ou 12:30) */
function importSecondsOf(it){
  if(it && typeof it.seconds==='number' && it.seconds>0) return Math.floor(it.seconds);
  const m=String((it&&it.progressLabel)||'').match(/(\d+):(\d{2})(?::(\d{2}))?/);
  if(!m) return 0;
  return m[3]!==undefined ? (+m[1])*3600+(+m[2])*60+(+m[3]) : (+m[1])*60+(+m[2]);
}

/* --- Restauration (fusion avec ce qui existe déjà, la clé API n'est jamais importée) --- */
function importApply(d){
  const raw=(d.brut && d.brut.luma_state && typeof d.brut.luma_state==='object') ? d.brut.luma_state : {};
  const other=(d.brut && d.brut.autres_cles && typeof d.brut.autres_cles==='object') ? d.brut.autres_cles : {};
  // Plan B : si une partie structurée manque, on la prend dans la copie brute
  const pick=(k,rk)=>{ const v=d[k]; return (v!==undefined && v!==null) ? v : raw[rk||k]; };
  const stats={vus:0,reprises:0,listes:0,gouts:false};
  STATE.watched=STATE.watched||{};

  // 1. Titres vus
  let vus=pick('vus','watched');
  if(Array.isArray(vus)){ const o={}; vus.forEach(k=>{ o[k]=1; }); vus=o; }
  if(vus && typeof vus==='object'){
    Object.keys(vus).forEach(k=>{ if(!STATE.watched[k]){ STATE.watched[k]=1; stats.vus++; } });
  }

  // 2. Reprises (minutes) : on garde la plus avancée quand le titre existe déjà
  const rep=pick('reprises','continueWatching');
  const progress={};
  if(Array.isArray(rep)){
    const keyOf=it=>it.media_type+'_'+it.id;
    const map=new Map((STATE.continueWatching||[]).map(it=>[keyOf(it),it]));
    rep.forEach(it=>{
      if(!it || it.id==null || (it.media_type!=='movie' && it.media_type!=='tv')) return;
      const item=Object.assign({},it,{id:Number(it.id)});
      const sec=importSecondsOf(item);
      if(sec>0) item.seconds=sec;
      const k=keyOf(item), ex=map.get(k);
      if(!ex || sec>(ex.seconds||0)){ map.set(k,item); stats.reprises++; }
      if(sec>15) progress[k]={seconds:sec,season:item.season||null,episode:item.episode||null,title:item.title||''};
      if(!STATE.watched[k]){ STATE.watched[k]=1; stats.vus++; }
    });
    STATE.continueWatching=Array.from(map.values()).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,10);
  }
  // Minutes de l'ancienne version, gardées pour le message « Tu étais à… » au lancement de la lecture
  let prev={}; try{ prev=JSON.parse(safeStorageGet(IMPORT_K_PROGRESS)||'{}')||{}; }catch(e){}
  safeStorageSet(IMPORT_K_PROGRESS,JSON.stringify(Object.assign(prev,progress)));

  // 3. Listes (fusion par identifiant, puis par nom)
  const listes=pick('listes','lists');
  if(Array.isArray(listes)){
    STATE.lists=STATE.lists||[];
    const itemKey=it=>String(it.id)+':'+it.media_type;
    listes.forEach(l=>{
      if(!l || typeof l!=='object' || !Array.isArray(l.items)) return;
      let ex=STATE.lists.find(x=>x.id===l.id) || STATE.lists.find(x=>String(x.name||'').toLowerCase()===String(l.name||'').toLowerCase());
      if(ex){
        const seen=new Set((ex.items||[]).map(itemKey));
        ex.items=ex.items||[];
        l.items.forEach(it=>{ if(it && it.id!=null && !seen.has(itemKey(it))){ ex.items.push(it); seen.add(itemKey(it)); } });
      }else{
        STATE.lists.push(Object.assign({},l,{id:l.id||('list_'+Date.now()+Math.floor(Math.random()*1000))}));
      }
      stats.listes++;
    });
  }

  // 4. Goûts (le questionnaire ne sera plus reposé)
  const gouts=pick('gouts','tastes');
  if(gouts && typeof gouts==='object'){ STATE.tastes=gouts; STATE.tastesAsked=true; stats.gouts=true; }
  else if(pick('goutsDemandes','tastesAsked')) STATE.tastesAsked=true;

  // 5. Profil, région, langue, plateforme, onboarding
  const p=pick('profil','profile');
  if(p && typeof p==='object' && p.name && !STATE.profile) STATE.profile={name:String(p.name).slice(0,24),color:p.color||'#7c5cff'};
  const rg=pick('region'); if(typeof rg==='string' && /^[A-Za-z]{2}$/.test(rg)) STATE.region=rg.toUpperCase();
  const lg=pick('language'); if(typeof lg==='string' && typeof SUPPORTED_LANGS!=='undefined' && SUPPORTED_LANGS.includes(lg)) STATE.language=lg;
  const pv=pick('plateforme','selectedProvider'); if(pv!==undefined && pv!==null) STATE.selectedProvider=pv;
  if(pick('onboardingVu','seenOnboarding')) STATE.seenOnboarding=true;

  // 6. Réglages du lecteur
  const rgl=(d.reglages && typeof d.reglages==='object') ? d.reglages : other;
  ['videasySubs','videasySandbox'].forEach(k=>{ const v=rgl[k]; if(v==='0' || v==='1') safeStorageSet(k,v); });
  if(['fr','en','es','hi'].includes(rgl.videasyAudioLang)) safeStorageSet('videasyAudioLang',rgl.videasyAudioLang);

  saveState();   // la clé API (auth) n'est jamais lue dans le rapport, celle de cet appareil reste intacte
  return stats;
}
function importSummary(s){
  const bits=[];
  bits.push(TL(s.vus+" titre(s) vu(s)",s.vus+" watched title(s)"));
  bits.push(TL(s.reprises+" reprise(s)",s.reprises+" resume point(s)"));
  if(s.listes) bits.push(TL(s.listes+" liste(s)",s.listes+" list(s)"));
  if(s.gouts) bits.push(TL("tes goûts","your tastes"));
  return TL("Importé : ","Imported: ")+bits.join(', ');
}
function importCanReload(){
  try{ localStorage.setItem('__t','1'); localStorage.removeItem('__t'); return true; }catch(e){ return false; }
}
function importRunFromModal(){
  const ta=document.getElementById('import-text');
  let data;
  try{ data=importParse(ta?ta.value:''); }
  catch(e){ importSetMsg(TL("Je ne reconnais pas ce texte. Vérifie que tu as copié tout le rapport.","I don't recognise this text. Check that you copied the whole report."),true); return; }
  if(!importLooksValid(data)){ importSetMsg(TL("Ce texte n'est pas un rapport Bubux.","This text is not a Bubux report."),true); return; }
  let stats;
  try{ stats=importApply(data); }
  catch(e){ importSetMsg(TL("Erreur pendant l'import : ","Error during import: ")+(e&&e.message||e),true); return; }
  safeStorageSet(IMPORT_K_DONE,'1');
  const msg=importSummary(stats);
  importSetMsg(msg);
  if(importCanReload()){
    safeStorageSet(IMPORT_K_TOAST,JSON.stringify(stats));
    setTimeout(()=>{ try{ location.reload(); }catch(e){} },900);
  }else{
    // Plan B : stockage indisponible, on rafraîchit simplement l'affichage
    setTimeout(()=>{ closeModal(); showToast(msg); try{ goHashOrRefresh('#/home'); }catch(e){} },900);
  }
}

/* --- Plan B de la reprise : message « Tu étais à X min » au lancement de la lecture --- */
function videasyShowImportedNote(mediaType,id,season,episode){
  try{
    const map=JSON.parse(safeStorageGet(IMPORT_K_PROGRESS)||'{}')||{};
    const e=map[mediaType+'_'+id];
    if(!e || !(e.seconds>15)) return;
    if(mediaType==='tv' && (Number(e.season||1)!==Number(season||1) || Number(e.episode||1)!==Number(episode||1))) return;
    const it=(STATE.continueWatching||[]).find(c=>String(c.id)===String(id) && c.media_type===mediaType);
    if(it && (it.seconds||0)>e.seconds+20) return;   // déjà plus loin que sur l'ancienne version
    const clock=fmtClock(e.seconds);
    const ep=(mediaType==='tv') ? ' (S'+(e.season||1)+' E'+(e.episode||1)+')' : '';
    const msg=TL("Sur l'ancienne version, tu étais à "+clock+ep+". Si la lecture ne reprend pas toute seule, avance jusqu'à ce moment.",
                 "On the old version you were at "+clock+ep+". If playback does not resume by itself, skip to that point.");
    const note=document.getElementById('videasy-resume-note');
    if(!note){ showToast(msg); return; }
    note.textContent=msg;
    note.classList.remove('hide');
    clearTimeout(window.__videasyNoteT);
    window.__videasyNoteT=setTimeout(()=>note.classList.add('hide'),10000);
    note.onclick=()=>note.classList.add('hide');
  }catch(err){}
}

/* --- Clics (boutons data-import) et message affiché après le rechargement --- */
document.addEventListener('click',function(e){
  const b=e.target.closest && e.target.closest('[data-import]'); if(!b) return;
  const a=b.dataset.import;
  if(a==='open') openImportModal();
  else if(a==='no'){ safeStorageSet(IMPORT_K_NO,'1'); maybeShowImportBanner(); }
  else if(a==='paste') importPasteFromClipboard();
  else if(a==='run') importRunFromModal();
});
(function(){
  try{
    const m=localStorage.getItem(IMPORT_K_TOAST);
    if(m){ localStorage.removeItem(IMPORT_K_TOAST); setTimeout(()=>{ try{ showToast(importSummary(JSON.parse(m))); }catch(e){} },1200); }
  }catch(e){}
})();
