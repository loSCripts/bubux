function videasyUpdateSandboxButton(){
  const btn=document.getElementById('videasy-sandbox-toggle'); if(!btn) return;
  btn.classList.toggle('videasy-sandbox-on', videasySandboxEnabled);
  btn.title=videasySandboxEnabled?"Sandbox activée : les pages externes sont bloquées (appuie pour désactiver)":"Sandbox désactivée (appuie pour activer)";
}
function videasyToggleSandbox(){
  videasySandboxEnabled=!videasySandboxEnabled;
  safeStorageSet('videasySandbox', videasySandboxEnabled?'1':'0');
  const iframe=document.getElementById('videasy-iframe');
  videasyApplySandboxAttribute(iframe);
  videasyUpdateSandboxButton();
  showToast(videasySandboxEnabled ? 'Sandbox activée : pages externes bloquées' : 'Sandbox désactivée');
  // Le changement de l'attribut sandbox ne prend effet qu'au prochain
  // chargement : on force un rechargement de l'iframe sur le même contenu.
  if(videasyCurrentUrl && videasyIsOpen()){
    iframe.src='';
    setTimeout(()=>{ iframe.src=videasyCurrentUrl; }, 30);
  }
}

const VIDEASY_LANGS={
  fr:{flag:'🇫🇷', label:'Français'},
  en:{flag:'🇬🇧', label:'English'},
  es:{flag:'🇪🇸', label:'Español'},
  hi:{flag:'🇮🇳', label:'हिन्दी'},
};

function videasyUpdateLangButton(){
  const btn=document.getElementById('videasy-audio-lang-toggle');
  if(!btn) return;
  const info=VIDEASY_LANGS[videasyAudioLang]||VIDEASY_LANGS.fr;
  btn.textContent = info.flag;
  btn.title = 'Changer la langue (audio et sous-titres)';
}

function videasySetAudioLang(code){
  if(!VIDEASY_LANGS[code] || code===videasyAudioLang){ videasyCloseLangMenu(); return; }
  videasyAudioLang=code;
  localStorage.setItem('videasyAudioLang', videasyAudioLang);
  videasyUpdateLangButton();
  videasyCloseLangMenu();
  showToast('Langue : '+VIDEASY_LANGS[code].label);

  if(videasyCurrentTmdbId && videasyIsOpen()){
    const iframe=document.getElementById('videasy-iframe');
    const url=videasyBuildUrl(videasyCurrentMediaType,videasyCurrentTmdbId,videasyCurrentSeason,videasyCurrentEpisode);
    videasyCurrentUrl=url;
    iframe.src='';
    setTimeout(()=>{ iframe.src=videasyCurrentUrl; }, 30);
  }
}

function videasyCloseLangMenu(){
  const menu=document.getElementById('videasy-lang-menu');
  if(menu) menu.remove();
}

function videasyToggleLangMenu(){
  const existing=document.getElementById('videasy-lang-menu');
  if(existing){ existing.remove(); return; }
  const btn=document.getElementById('videasy-audio-lang-toggle');
  if(!btn) return;
  const menu=document.createElement('div');
  menu.id='videasy-lang-menu';
  menu.style.cssText='position:absolute;top:100%;right:0;margin-top:6px;background:var(--bg-elevated,#1c1c1e);border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.45);overflow:hidden;z-index:50;min-width:150px';
  menu.innerHTML=Object.keys(VIDEASY_LANGS).map(code=>{
    const info=VIDEASY_LANGS[code];
    const active=code===videasyAudioLang;
    return `<button data-lang-code="${code}" style="display:flex;align-items:center;gap:8px;width:100%;padding:10px 14px;background:${active?'rgba(255,255,255,.08)':'transparent'};border:none;color:var(--text-1,#fff);font-size:.85rem;text-align:left;cursor:pointer">${info.flag} ${info.label}${active?' ✓':''}</button>`;
  }).join('');
  menu.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>videasySetAudioLang(b.dataset.langCode));
  });
  btn.parentElement.style.position='relative';
  btn.parentElement.appendChild(menu);
  setTimeout(()=>{
    document.addEventListener('click', function onDocClick(e){
      if(!menu.contains(e.target) && e.target!==btn){ menu.remove(); document.removeEventListener('click', onDocClick); }
    });
  },0);
}
document.getElementById('videasy-audio-lang-toggle').addEventListener('click', function(e){ e.stopPropagation(); videasyToggleLangMenu(); });
videasyUpdateLangButton();

