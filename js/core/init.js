/* ================= INIT ================= */
function applyStaticTranslations(){
  const map={'i18n-login-label':'login','i18n-settings-label':'settings','i18n-shorts-label':'shorts'};
  Object.keys(map).forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent=t(map[id]); });
  document.documentElement.lang=CURRENT_LANG;
}
async function init(){
  CURRENT_LANG = (STATE.language && SUPPORTED_LANGS.includes(STATE.language)) ? STATE.language : detectLang();
  if(!STATE.language){
    STATE.language=CURRENT_LANG;
    if(CURRENT_LANG==='fr' && STATE.region==='US') STATE.region='FR';
    saveState();
  }
  applyStaticTranslations();
  injectManifest();
  registerServiceWorker();
  document.getElementById('scroll-top-btn').addEventListener('click', ()=>{ window.scrollTo({top:0,behavior:'smooth'}); try{ document.body.scrollTo({top:0,behavior:'smooth'}); }catch(e){} });
  window.addEventListener('hashchange', router);
  window.addEventListener('hashchange',()=>{ setTimeout(()=>{ if(!document.getElementById('home-hero')) heroTeardown(); },400); });
  window.addEventListener('scroll', onScrollThrottled, {passive:true});
  document.addEventListener('scroll', onScrollThrottled, {passive:true, capture:true}); // le body est le conteneur qui defile
  if(true){ try{ await Promise.all([ensureGenres('movie'),ensureGenres('tv')]); }catch(e){} }
  await router();
}
document.addEventListener('DOMContentLoaded', init);
