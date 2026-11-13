/* ================= GLOBAL CLICK DELEGATION ================= */
function handleGlobalClick(e){
  const popover=document.getElementById('settings-popover');
  const gearBtn=document.getElementById('settings-nav-btn');
  if(!popover.classList.contains('hidden') && !popover.contains(e.target) && e.target!==gearBtn && !gearBtn.contains(e.target)){ closeSettingsPopover(); }
  const pd=document.getElementById('provider-dropdown-list');
  if(pd && !pd.classList.contains('hidden') && !pd.contains(e.target) && !e.target.closest('#provider-row-title')){ pd.classList.add('hidden'); }
  if(e.target.classList.contains('modal-backdrop')){ closeModal(); return; }
  if(lpFired){ lpFired=false; return; }

  const el=e.target.closest('[data-action]');
  if(!el) return;
  const action=el.dataset.action, d=el.dataset;
  switch(action){
    case 'navigate': heroKill(); location.hash=d.href; break;
    case 'go-back': goBack(); break;
    case 'play-trailer': heroKill(); playTrailer(d.type,d.id); break;
    case 'edit-tastes': openTasteQuiz(); break;
    case 'close-modal-x': closeModal(); break;
    case 'taste-save': tasteSave(); break;
    case 'taste-genre': { const id=Number(d.v); if(tasteDraft){ if(tasteDraft.genres.has(id)) tasteDraft.genres.delete(id); else tasteDraft.genres.add(id); el.classList.toggle('on'); } break; }
    case 'taste-type': case 'taste-era': { if(tasteDraft){ if(action==='taste-type') tasteDraft.type=d.v; else tasteDraft.era=d.v; el.parentElement.querySelectorAll('.taste-chip').forEach(b=>b.classList.toggle('on',b===el)); } break; }
    case 'watch':
      heroKill();
      videasyCurrentImage=d.image||'';
      openVideasyPlayer(d.type,d.id,d.title,d.season?Number(d.season):null,d.episode?Number(d.episode):null);
      break;
    case 'videasy-pick-episode': videasySwitchEpisode(Number(d.season),Number(d.episode)); break;
    case 'toggle-short-mute': toggleShortsMute(el); break;
    case 'add-to-list': openAddToListModal(d.type,d.id); break;
    case 'toggle-list-item': toggleListItem(d.list,d.type,d.id); break;
    case 'new-list': openNewListModal(); break;
    case 'new-list-inline': openNewListInline(d.type,d.id); break;
    case 'confirm-new-list': confirmNewList(); break;
    case 'confirm-new-list-inline': confirmNewListInline(d.type,d.id); break;
    case 'delete-list': confirmDeleteList(d.id); break;
    case 'confirm-delete-list': doDeleteList(d.id); break;
    case 'toggle-cw-edit':
      document.getElementById('cw-row')?.classList.toggle('editing');
      document.querySelectorAll('#cw-row .card-remove').forEach(b=>b.classList.toggle('hidden'));
      break;
    case 'remove-cw': removeContinueWatching(d.type,d.id); break;
    case 'change-recs-ref': openChangeRecsRef(); break;
    case 'set-recs-ref': recsRefOverride={id:d.id,type:d.type,title:d.title}; closeModal(); renderBecauseYouWatched(); break;
    case 'toggle-provider-dropdown': pd?.classList.toggle('hidden'); break;
    case 'select-provider': selectProvider(d.id); break;
    case 'open-filter': openFilterSheet(d.filter); break;
    case 'apply-filter': applyFilterValue(d.kind,d.value,d.label); break;
    case 'surprise-me': surpriseMe(d.media); break;
    case 'toggle-settings-popover': toggleSettingsPopover(); break;
    case 'open-login': closeSettingsPopover(); openLoginModal(); break;
    case 'open-login-key': closeModal(); showApiKeyOnboarding(); break;
    case 'open-settings': closeSettingsPopover(); openSettingsPanel(); break;
    case 'open-shorts': closeSettingsPopover(); location.hash='#/shorts'; break;
    case 'close-modal': closeModal(); break;
    case 'save-api-key': saveApiKeyFromModal(); break;
    case 'clear-api-key': clearApiKey(); break;
    case 'save-profile': saveProfileFromModal(); break;
    case 'pick-color': pickColor(d.color); break;
    case 'install-pwa': triggerInstall(); break;
    case 'dismiss-install-float': hideInstallFloat(3); break;
    case 'open-ad-link': openExternalTab(AD_LINK); break;
    case 'dismiss-install-banner': STATE._installDismissed=true; maybeShowInstallBanner(); break;
    case 'reset-app-data': confirmResetData(); break;
    case 'confirm-reset-data': doResetData(); break;
    case 'open-api-key-help': window.open('https://www.themoviedb.org/settings/api','_blank'); break;
  }
}
document.addEventListener('click', handleGlobalClick);

