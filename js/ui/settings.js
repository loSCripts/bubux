/* ================= SETTINGS POPOVER + LOGIN + SETTINGS PANEL ================= */
function toggleSettingsPopover(){
  const popover=document.getElementById('settings-popover');
  popover.classList.contains('hidden') ? openSettingsPopover() : closeSettingsPopover();
}
function openSettingsPopover(){ document.getElementById('settings-popover').classList.remove('hidden'); document.getElementById('settings-nav-btn').classList.add('active'); }
function closeSettingsPopover(){ document.getElementById('settings-popover').classList.add('hidden'); document.getElementById('settings-nav-btn').classList.remove('active'); }

function openLoginModal(){
  const p=STATE.profile;
  if(!STATE._tempColor) STATE._tempColor=(p && p.color) || PROFILE_COLORS[0];
  openModal(`
    <div class="onboarding-icon"><svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"/><path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg></div>
    <h3>${t('localProfile')}</h3>
    <p class="sub">${t('localProfileDesc')}</p>
    <div class="modal-field"><label>${t('displayName')}</label><input id="profile-name-input" type="text" maxlength="24" placeholder="${t('yourName')}" value="${p?escapeHtml(p.name):''}"></div>
    <div class="modal-field"><label>${t('color')}</label><div class="color-swatches">
      ${PROFILE_COLORS.map(c=>`<button class="color-swatch ${STATE._tempColor===c?'selected':''}" style="background:${c}" data-action="pick-color" data-color="${c}"></button>`).join('')}
    </div></div>
    <div class="modal-actions"><button class="btn-secondary" data-action="close-modal">${t('cancel')}</button><button class="btn-primary" data-action="save-profile">${t('save')}</button></div>`);
}
function pickColor(c){ STATE._tempColor=c; document.querySelectorAll('.color-swatch').forEach(s=>s.classList.toggle('selected', s.dataset.color===c)); }
function saveProfileFromModal(){
  const name=document.getElementById('profile-name-input')?.value.trim();
  if(!name){ showToast(t('enterNameFirst')); return; }
  STATE.profile={name, color:STATE._tempColor||PROFILE_COLORS[0]};
  delete STATE._tempColor;
  saveState(); closeModal(); showToast(t('profileSaved'));
}
function openSettingsPanel(){
  const masked=(STATE.auth && STATE.auth.key)?maskKey(STATE.auth.key):t('notSet');
  const LANG_NAMES={en:'English',fr:'Français'};
  openModal(`<h3>${t('settings')}</h3>
    <div class="modal-field"><label>${t('language')}</label>
      <select id="language-select">${SUPPORTED_LANGS.map(l=>`<option value="${l}" ${CURRENT_LANG===l?'selected':''}>${LANG_NAMES[l]||l}</option>`).join('')}</select>
    </div>
    <div class="modal-field"><label>${t('regionLabel')}</label>
      <select id="region-select">${['US','FR','GB','CA','DE','ES','IT'].map(r=>`<option value="${r}" ${STATE.region===r?'selected':''}>${r}</option>`).join('')}</select>
    </div>
    <div class="install-banner"><svg viewBox="0 0 24 24" style="flex:none"><path d="M12 3v13m0 0 4-4m-4 4-4-4"/><path d="M4 17v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
      <div class="txt"><strong>${t('installLuma')}</strong><span>${t('installDesc')}</span></div>
      <button class="btn-primary" style="flex:none;padding:10px 16px" data-action="install-pwa">${t('install')}</button></div>
    <button class="btn-ghost" data-action="reset-app-data" style="width:100%;text-align:center;color:var(--danger)">${t('resetData')}</button>
    <p class="credits-text">${t('tmdbCredit')}<br>${t('justwatchCredit')}</p>`);
  document.getElementById('region-select').addEventListener('change', e=>setRegion(e.target.value));
  document.getElementById('language-select').addEventListener('change', e=>setLanguage(e.target.value));
}
function setRegion(v){ STATE.region=v; saveState(); showToast(t('regionSet',v)); }
function setLanguage(v){
  if(!SUPPORTED_LANGS.includes(v)) return;
  CURRENT_LANG=v; STATE.language=v; saveState();
  CACHE.genresMovie=null; CACHE.genresTV=null;
  heroState.logoCache={}; shortsVideoCache={};
  applyStaticTranslations();
  closeModal();
  router();
}
function confirmResetData(){
  openModal(`<h3>${t('resetConfirmTitle')}</h3><p class="sub">${t('resetConfirmDesc')}</p>
    <div class="modal-actions"><button class="btn-secondary" data-action="close-modal">${t('cancel')}</button><button class="btn-primary" style="background:var(--danger)" data-action="confirm-reset-data">${t('reset')}</button></div>`);
}
function doResetData(){ STATE=defaultState(); CURRENT_LANG=detectLang(); saveState(); closeModal(); showToast(t('dataReset')); goHashOrRefresh('#/home'); }

