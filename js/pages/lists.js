/* ================= LISTS ================= */
function createList(name){
  name=(name||'').trim() || 'Untitled List';
  if(STATE.lists.length>=15){ showToast(t('maxLists')); return null; }
  const list={id:'list_'+Date.now()+Math.floor(Math.random()*1000), name, createdAt:Date.now(), items:[]};
  STATE.lists.unshift(list); saveState();
  return list;
}
function titleCountLabel(n){ return `${n} ${n===1?t('title1'):t('titleN')}`; }
async function renderLists(root){
  root.innerHTML=`<div class="page">
      <div class="top-logo">B</div>
      <div class="lists-header"><h1>${t('myLists')}</h1>
        <button class="btn-gradient" data-action="new-list"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>${t('newList')}</button></div>
      <p class="lists-count" id="lists-count">${t('listsCount',STATE.lists.length)}</p>
      <div class="lists-grid-wrap" id="lists-wrap"></div>
    </div>`;
  renderListsBody();
}
function renderListsBody(){
  const wrap=document.getElementById('lists-wrap');
  if(!wrap) return;
  if(!STATE.lists.length){
    wrap.innerHTML=`<div class="empty-state"><svg viewBox="0 0 24 24"><path d="M4 6h11M4 6h.01M4 12h11M4 12h.01M4 18h7M4 18h.01"/></svg><h3>${t('noListsYet')}</h3><p>${t('createListDesc')}</p></div>`;
    return;
  }
  wrap.innerHTML=STATE.lists.map(list=>{
    const thumbs=list.items.slice(0,4).map(it=>it.poster_path?`<img src="${IMG_BASE}/w185${it.poster_path}" alt="">`:'<div></div>').join('') || '<div></div><div></div><div></div><div></div>';
    return `<div class="list-card" data-action="navigate" data-href="#/lists/${list.id}">
      <div class="thumbs">${thumbs}</div>
      <div class="info"><h4>${escapeHtml(list.name)}</h4><p>${titleCountLabel(list.items.length)}</p></div>
      <svg viewBox="0 0 24 24" style="flex:none;opacity:.5"><path d="M9 6l6 6-6 6"/></svg></div>`;
  }).join('');
}
function openNewListModal(){
  openModal(`<h3>${t('newList')}</h3><p class="sub">${t('giveListName')}</p>
    <div class="modal-field"><input id="new-list-name" type="text" placeholder="${t('listNamePlaceholder')}" maxlength="40"></div>
    <div class="modal-actions"><button class="btn-secondary" data-action="close-modal">${t('cancel')}</button><button class="btn-primary" data-action="confirm-new-list">${t('create')}</button></div>`);
  setTimeout(()=>document.getElementById('new-list-name')?.focus(),80);
}
function confirmNewList(){
  const name=document.getElementById('new-list-name')?.value;
  const list=createList(name);
  closeModal();
  if(list){
    showToast(t('listCreated'));
    const cnt=document.getElementById('lists-count'); if(cnt) cnt.textContent=t('listsCount',STATE.lists.length);
    renderListsBody();
  }
}
function openNewListInline(mediaType,id){
  openModal(`<h3>${t('newList')}</h3><p class="sub">${t('giveListName')}</p>
    <div class="modal-field"><input id="new-list-name" type="text" placeholder="${t('listNamePlaceholder')}" maxlength="40"></div>
    <div class="modal-actions"><button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
    <button class="btn-primary" data-action="confirm-new-list-inline" data-type="${mediaType}" data-id="${id}">${t('create')}</button></div>`);
  setTimeout(()=>document.getElementById('new-list-name')?.focus(),80);
}
async function confirmNewListInline(mediaType,id){
  const name=document.getElementById('new-list-name')?.value;
  const list=createList(name);
  if(!list) return;
  await toggleListItem(list.id, mediaType, id);
}
async function renderListDetail(root,listId){
  const list=STATE.lists.find(l=>l.id===listId);
  if(!list){ location.hash='#/lists'; return; }
  root.innerHTML=`<div class="page">
      <button class="back-btn" data-action="navigate" data-href="#/lists"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
      <div class="top-logo" style="left:64px">B</div>
      <div class="page-header"><h1>${escapeHtml(list.name)}</h1><p>${titleCountLabel(list.items.length)}</p></div>
      <div style="padding:0 20px 8px;display:flex;justify-content:flex-end">
        <button class="pill" data-action="delete-list" data-id="${list.id}" style="color:var(--danger)">
          <svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-8 0 1 13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1l1-13"/></svg>${t('deleteList')}</button>
      </div>
      <div class="grid-2col" id="list-detail-grid">
        ${list.items.length ? list.items.map(posterCardHtml).join('') : `<div class="empty-state" style="grid-column:1/-1"><svg viewBox="0 0 24 24"><path d="M4 6h11M4 12h11M4 18h7"/></svg><h3>${t('emptyList')}</h3><p>${t('longPressHint')}</p></div>`}
      </div>
    </div>`;
}
function confirmDeleteList(id){
  const list=STATE.lists.find(l=>l.id===id); if(!list) return;
  openModal(`<h3>${t('deleteListConfirm',escapeHtml(list.name))}</h3><p class="sub">${t('cantUndo')}</p>
    <div class="modal-actions"><button class="btn-secondary" data-action="close-modal">${t('cancel')}</button>
    <button class="btn-primary" style="background:var(--danger)" data-action="confirm-delete-list" data-id="${id}">${t('delete')}</button></div>`);
}
function doDeleteList(id){
  STATE.lists=STATE.lists.filter(l=>l.id!==id);
  saveState(); closeModal(); showToast(t('listDeleted'));
  goHashOrRefresh('#/lists');
}

/* ================= ADD TO LIST ================= */
async function openAddToListModal(mediaType,id){
  openModal(`<h3>${t('addToList')}</h3><div class="modal-field" id="atl-body" style="max-height:46vh;overflow-y:auto"><p style="color:var(--text-3);font-size:.85rem">${t('loadingLists')}</p></div>
    <button class="btn-gradient" style="width:100%;justify-content:center;margin-top:4px" data-action="new-list-inline" data-type="${mediaType}" data-id="${id}">
      <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>${t('createNewList')}</button>`);
  const body=document.getElementById('atl-body');
  if(!STATE.lists.length){ body.innerHTML=`<p style="color:var(--text-3);font-size:.85rem">${t('noListsCreateOne')}</p>`; return; }
  body.innerHTML=STATE.lists.map(l=>{
    const has=l.items.some(it=>String(it.id)===String(id) && it.media_type===mediaType);
    return `<button class="list-picker-item ${has?'checked':''}" style="width:100%" data-action="toggle-list-item" data-list="${l.id}" data-type="${mediaType}" data-id="${id}">
      <span class="check">${has?'<svg viewBox="0 0 24 24"><path d="M5 12l5 5 9-9"/></svg>':''}</span>
      <span style="flex:1;text-align:left">${escapeHtml(l.name)}</span>
      <span style="color:var(--text-3);font-size:.8rem">${l.items.length}</span></button>`;
  }).join('');
}
async function toggleListItem(listId,mediaType,id){
  const list=STATE.lists.find(l=>l.id===listId); if(!list) return;
  const idx=list.items.findIndex(it=>String(it.id)===String(id) && it.media_type===mediaType);
  if(idx>-1){ list.items.splice(idx,1); saveState(); showToast(t('removedFrom',list.name)); }
  else{
    showToast(t('adding'));
    try{
      const details=await tmdb(`/${mediaType}/${id}`);
      list.items.unshift({id:Number(id), media_type:mediaType, title:details.title||details.name, poster_path:details.poster_path||null, vote_average:details.vote_average, release_date:details.release_date, first_air_date:details.first_air_date});
      saveState(); showToast(t('addedTo',list.name));
    }catch(e){ showToast(t('couldNotAdd')); return; }
  }
  openAddToListModal(mediaType,id);
  const parts=parseHash();
  if(parts[0]==='lists' && parts[1]===listId){ renderListDetail(document.getElementById('view-root'), listId); }
}

