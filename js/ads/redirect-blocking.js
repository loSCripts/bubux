/* ================= BLOCAGE DES REDIRECTIONS PUBLICITAIRES =================
   Le lecteur Videasy (iframe tierce, non-sandboxée pour qu'il fonctionne) peut
   contenir des scripts publicitaires qui tentent de rediriger l'utilisateur en
   dehors de Bubux. On bloque uniquement les tentatives de redirection vers un
   AUTRE site que le nôtre : jamais la navigation interne à Bubux (changement
   de hash, rechargement, etc.), qui doit continuer à fonctionner normalement. */
function videasyIsOpen(){
  const modal=document.getElementById('videasy-modal');
  return !!(modal && modal.style.display==='flex');
}
function isSameOriginUrl(url){
  try{
    const resolved=new URL(url, location.href);
    return resolved.origin===location.origin;
  }catch(e){
    // Une URL relative ou un simple hash (#/home) est toujours interne.
    return true;
  }
}

// AD_LINK (lien de la pub) est dans js/ads/ad-config.js
function openExternalTab(url){
  if(!url) return;
  const desktop=window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  if(!desktop){ window.open(url,'_blank','noopener'); return; }
  const a=document.createElement('a'); a.href=url; a.target='_blank'; a.rel='noopener'; a.style.display='none';
  document.body.appendChild(a);
  const isMac=/Mac|iPhone|iPad/.test(navigator.platform||'');
  a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window,ctrlKey:!isMac,metaKey:isMac}));
  setTimeout(function(){ a.remove(); },0);
}
// 0) Ordinateur uniquement (souris) : les liens externes de Bubux (plateformes
// "Disponible sur") s'ouvrent dans l'onglet voisin, sans basculer dessus.
// Sur telephone/tablette (ecran tactile) rien ne change.
document.addEventListener('click', function(e){
  if(!e.isTrusted || e.defaultPrevented) return;
  if(e.button!==0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  if(!window.matchMedia || !window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
  const link=e.target.closest && e.target.closest('a.provider-badge[target="_blank"]');
  if(!link) return;
  e.preventDefault();
  const a=document.createElement('a');
  a.href=link.href; a.target='_blank'; a.rel='noopener'; a.style.display='none';
  document.body.appendChild(a);
  const isMac=/Mac|iPhone|iPad/.test(navigator.platform||'');
  a.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window,ctrlKey:!isMac,metaKey:isMac}));
  setTimeout(function(){ a.remove(); },0);
}, true);

// 1) Bloque toute ouverture de nouvel onglet/fenêtre vers un site externe
// (la méthode la plus utilisée par les régies pub pour rediriger).
(function blockWindowOpen(){
  const nativeOpen=window.open;
  window.open=function(url){
    if(adBypass) return nativeOpen.apply(window, arguments);   // ouverture de la pub validee par ad-gate.js
    if(videasyIsOpen() && url && !isSameOriginUrl(url)) return null;
    return nativeOpen.apply(window, arguments);
  };
})();

// 2) Bloque les clics sur des liens menant vers un domaine externe
// injectés dynamiquement dans la page, sans toucher aux liens internes.
document.addEventListener('click', function(e){
  if(!videasyIsOpen()) return;
  const link=e.target.closest && e.target.closest('a[href]');
  if(!link) return;
  const href=link.getAttribute('href')||'';
  if(href.startsWith('#')) return; // navigation interne Bubux, toujours autorisée
  if(link.getAttribute('data-ad')) return; // lien de secours de la pub (ad-gate.js)
  if(!isSameOriginUrl(href)){
    e.preventDefault();
    e.stopPropagation();
  }
}, true);

// 3) Empêche une redirection de toute la page vers un domaine externe
// (location.href/assign/replace), en laissant passer toute navigation interne.
(function blockTopNavigation(){
  const nativeAssign=window.location.assign.bind(window.location);
  const nativeReplace=window.location.replace.bind(window.location);
  try{
    window.location.assign=function(url){
      if(videasyIsOpen() && !isSameOriginUrl(url)) return;
      return nativeAssign(url);
    };
    window.location.replace=function(url){
      if(videasyIsOpen() && !isSameOriginUrl(url)) return;
      return nativeReplace(url);
    };
  }catch(e){ /* certains navigateurs interdisent de réécrire location, on ignore */ }
})();

// 4) Filet de sécurité : une simple assignation `location.href = "..."` ne peut
// pas toujours être interceptée directement, donc on bloque le déchargement de
// la page au dernier moment si le lecteur est ouvert (l'utilisateur doit fermer
// le lecteur ou confirmer explicitement pour quitter Bubux).
window.addEventListener('beforeunload', function(e){
  if(videasyIsOpen()){
    e.preventDefault();
    e.returnValue='';
  }
});

