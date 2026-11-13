/* ================= PWA ================= */
function buildManifest(){
  return {
    name:"Bubux — Movie & TV Discovery", short_name:"Bubux",
    description:"Discover movies & shows, track what to watch, find where to stream.",
    start_url:".", scope:".", display:"standalone", orientation:"portrait",
    background_color:"#050506", theme_color:"#0a0a0e",
    icons:[
      {src:ICON_192, sizes:"192x192", type:"image/png", purpose:"any"},
      {src:ICON_192, sizes:"192x192", type:"image/png", purpose:"maskable"},
      {src:ICON_512, sizes:"512x512", type:"image/png", purpose:"any"},
      {src:ICON_512, sizes:"512x512", type:"image/png", purpose:"maskable"}
    ]
  };
}
function injectManifest(){
  try{
    const json=JSON.stringify(buildManifest());
    const b64=btoa(unescape(encodeURIComponent(json)));
    if(location.protocol!=='http:' && location.protocol!=='https:') document.getElementById('manifest-link').setAttribute('href','data:application/json;base64,'+b64);
    document.getElementById('favicon-link').setAttribute('href', ICON_192);
    document.getElementById('touch-icon-link').setAttribute('href', ICON_192);
  }catch(e){ console.error(e); }
}
const SW_SOURCE=`
const CACHE_NAME='luma-shell-v1';
self.addEventListener('install', e=>{ self.skipWaiting(); });
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', e=>{
  if(e.request.method!=='GET') return;
  const url=e.request.url;
  const isTMDB = url.indexOf('api.themoviedb.org')>-1 || url.indexOf('image.tmdb.org')>-1;
  e.respondWith(
    caches.open(CACHE_NAME).then(async cache=>{
      if(isTMDB){
        try{ const res=await fetch(e.request); cache.put(e.request, res.clone()); return res; }
        catch(err){ const cached=await cache.match(e.request); if(cached) return cached; throw err; }
      }
      const cached=await cache.match(e.request);
      if(cached) return cached;
      try{ const res=await fetch(e.request); cache.put(e.request, res.clone()); return res; }
      catch(err){ throw err; }
    })
  );
});
`;
function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  try{
    if(location.protocol!=='http:' && location.protocol!=='https:') return;
    navigator.serviceWorker.register('sw.js', {scope:'./'}).catch(()=>{});
  }catch(e){}
}
let deferredInstallPrompt=null;
const INSTALL_SNOOZE_KEY='bubux_install_snooze';
function isStandalone(){ return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone===true; }
function showInstallFloat(){
  try{
    if(!deferredInstallPrompt || isStandalone() || document.getElementById('install-float')) return;
    const until=parseInt(safeStorageGet(INSTALL_SNOOZE_KEY)||'0',10);
    if(until && Date.now()<until) return;
    const fr=(CURRENT_LANG==='fr');
    const el=document.createElement('div'); el.id='install-float';
    el.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(94px + var(--safe-b));z-index:55;width:min(92vw,460px);';
    el.innerHTML='<div class="install-banner" style="margin:0;background:var(--bg-elevated-2);box-shadow:var(--shadow-pop)">'
      +'<img src="icon-192.png" alt="" style="width:40px;height:40px;flex:none" onerror="this.style.display=\'none\'">'
      +'<div class="txt"><strong>'+t('installLuma')+'</strong><span>'+t('installDesc')+'</span></div>'
      +'<button class="btn-primary" style="flex:none;padding:10px 16px" data-action="install-pwa">'+t('install')+'</button>'
      +'<button data-action="dismiss-install-float" aria-label="'+(fr?'Plus tard':'Later')+'" style="flex:none;padding:6px"><svg viewBox="0 0 24 24" style="width:16px;height:16px"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>';
    document.body.appendChild(el);
  }catch(e){}
}
function hideInstallFloat(snoozeDays){
  const el=document.getElementById('install-float'); if(el) el.remove();
  if(snoozeDays) safeStorageSet(INSTALL_SNOOZE_KEY, String(Date.now()+snoozeDays*86400000));
}
window.addEventListener('beforeinstallprompt', e=>{ e.preventDefault(); deferredInstallPrompt=e; maybeShowInstallBanner(); setTimeout(showInstallFloat,2500); });
window.addEventListener('appinstalled', ()=>{ deferredInstallPrompt=null; hideInstallFloat(); showToast(t('lumaInstalled')); });
async function triggerInstall(){
  if(!deferredInstallPrompt){ showToast(t('noInstallPrompt')); return; }
  hideInstallFloat();
  deferredInstallPrompt.prompt();
  const choice=await deferredInstallPrompt.userChoice;
  deferredInstallPrompt=null;
  showToast(choice.outcome==='accepted' ? t('installing') : t('installDismissed'));
}

