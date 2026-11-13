/* ================= ONBOARDING / API KEY ================= */
function showApiKeyOnboarding(){
  openModal(`
    <div class="onboarding-icon"><svg viewBox="0 0 24 24"><path d="M12 15v-3m0-4h.01M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z"/></svg></div>
    <h3>${t('connectKey')}</h3>
    <p class="sub">${t('connectKeyDesc')}</p>
    <div class="modal-field">
      <label>${t('apiKeyLabel')}</label>
      <input id="api-key-input" type="text" placeholder="${t('pasteKeyHere')}" autocomplete="off" autocapitalize="off" spellcheck="false">
      <p class="field-hint">${t('apiKeyHint')}</p>
    </div>
    <div class="modal-actions"><button class="btn-primary" data-action="save-api-key" style="flex:1">${t('continueBtn')}</button></div>
  `);
  setTimeout(()=>document.getElementById('api-key-input')?.focus(),80);
}
async function saveApiKeyFromModal(){
  const val=document.getElementById('api-key-input')?.value.trim();
  if(!val){ showToast(t('pasteKeyFirst')); return; }
  const btn=document.querySelector('[data-action="save-api-key"]');
  if(btn) btn.textContent=t('checking');
  const prevAuth=STATE.auth;
  STATE.auth={key:val};
  try{
    await tmdb('/authentication');
    STATE.seenOnboarding=true; saveState(); closeModal(); showToast(t('connectedTMDB'));
    await Promise.all([ensureGenres('movie'),ensureGenres('tv')]);
    router();
  }catch(e){
    STATE.auth=prevAuth;
    if(btn) btn.textContent=t('continueBtn');
    showToast(e && e.code===401 ? t('keyRejected') : t('couldNotReach'));
  }
}
function maskKey(k){ return k.length>8 ? k.slice(0,4)+'••••'+k.slice(-4) : '••••••'; }
function clearApiKey(){ STATE.auth=null; saveState(); closeModal(); showToast(t('keyRemoved')); goHashOrRefresh('#/home'); }

