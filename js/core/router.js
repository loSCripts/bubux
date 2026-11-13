/* ================= ROUTER ================= */
function parseHash(){
  const h=location.hash.replace(/^#\/?/,'');
  const parts=h.split('/').filter(Boolean);
  return parts.length?parts:['home'];
}
function updateNavActive(parts){
  const top=parts[0];
  document.querySelectorAll('.nav-btn[data-href]').forEach(btn=>{
    const route=(btn.dataset.href||'').replace(/^#\/?/,'').split('/')[0];
    btn.classList.toggle('active', route===top);
  });
}
function updateAuroraVisibility(route){ document.getElementById('aurora-bg').classList.toggle('active', AURORA_ROUTES.includes(route)); }
function updateNavVisibility(route){
  document.getElementById('bottom-nav').classList.toggle('nav-hidden', route==='shorts');
  document.getElementById('scroll-top-btn').classList.toggle('hidden', route==='shorts');
}

async function router(){
  const parts=parseHash();
  const root=document.getElementById('view-root');
  window.__infiniteScrollHandler=null;
  updateNavActive(parts);
  updateAuroraVisibility(parts[0]);
  updateNavVisibility(parts[0]);
  if(parts[0]!=='shorts' && shortsObserver){ shortsObserver.disconnect(); shortsObserver=null; }
  if(parts[0]!=='home' && typeof heroKill==='function') heroKill();
  window.scrollTo({top:0}); document.body.scrollTop=0;
  try{
    if(parts[0]==='home') await renderHome(root);
    else if(parts[0]==='movies') await renderCatalog(root,'movie');
    else if(parts[0]==='tv') await renderCatalog(root,'tv');
    else if(parts[0]==='search') await renderSearch(root);
    else if(parts[0]==='lists' && parts[1]) await renderListDetail(root,parts[1]);
    else if(parts[0]==='lists') await renderLists(root);
    else if(parts[0]==='title' && parts[1] && parts[2]) await renderDetail(root,parts[1],parts[2]);
    else if(parts[0]==='shorts') await renderShorts(root);
    else await renderHome(root);
  }catch(e){ handleViewError(e,root); }
}
function handleViewError(e,root){
  if(e && e.message==='NO_KEY'){ showApiKeyOnboarding(); return; }
  console.error(e);
  root.innerHTML=`<div class="page" style="padding:90px 24px;text-align:center;color:var(--text-2)"><p>${t('somethingWrongPage')}</p></div>`;
  showToast(t('unexpectedError'));
}
function goBack(){ if(history.length>1) history.back(); else location.hash='#/home'; }

