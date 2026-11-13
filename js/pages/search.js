/* ================= SEARCH ================= */
let searchState={query:''};
let searchDebounce=null;
let searchPage={page:1,totalPages:1};
async function renderSearch(root){
  root.innerHTML=`<div class="page">
      <button class="back-btn" data-action="go-back" aria-label="Back"><svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg></button>
      <div class="top-logo" style="left:64px">B</div>
      <div class="search-hero"><h1>${t('discoverSomethingNew')}</h1>
        <div class="search-bar"><svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>
          <input id="search-input" type="text" placeholder="${t('searchPlaceholder')}" autocomplete="off" value="${escapeHtml(searchState.query)}"></div>
      </div>
      <div id="search-results-wrap"></div>
    </div>`;
  const input=document.getElementById('search-input');
  input.addEventListener('input', onSearchInput);
  if(searchState.query) runSearch(searchState.query); else loadTrendingToday();
}
function onSearchInput(e){
  searchState.query=e.target.value;
  clearTimeout(searchDebounce);
  searchDebounce=setTimeout(()=>{ const q=searchState.query.trim(); q?runSearch(q):loadTrendingToday(); },350);
}
async function loadTrendingToday(){
  const wrap=document.getElementById('search-results-wrap');
  if(!wrap) return;
  window.__infiniteScrollHandler=null;
  wrap.innerHTML=`<p class="trending-label">${t('trendingToday')}</p><div class="grid-2col">${skeletonRow(8)}</div>`;
  try{
    const data=await TMDBApi.trending('all','day');
    const g=wrap.querySelector('.grid-2col'); if(g) g.innerHTML=(data.results||[]).map(posterCardHtml).join('');
    let tp=data.page, tt=Math.min(data.total_pages||1,500), tl=false;
    window.__infiniteScrollHandler=async()=>{
      if(tl) return; if(tp>=tt) tp=0; tl=true;
      try{ const d2=await TMDBApi.trending('all','day',tp+1); tp=d2.page;
        const g2=wrap.querySelector('.grid-2col'); if(g2) g2.insertAdjacentHTML('beforeend',(d2.results||[]).filter(r=>r.media_type!=='person').map(posterCardHtml).join('')); }catch(e){}
      tl=false;
    };
  }catch(e){ handleApiError(e); }
}
async function runSearch(q){
  const wrap=document.getElementById('search-results-wrap');
  if(!wrap) return;
  wrap.innerHTML=`<div class="grid-2col">${skeletonRow(8)}</div>`;
  window.__infiniteScrollHandler=null;
  try{
    const data=await TMDBApi.searchMulti(q,1);
    searchPage={page:data.page,totalPages:data.total_pages};
    const results=(data.results||[]).filter(r=>r.media_type==='movie'||r.media_type==='tv');
    const g=wrap.querySelector('.grid-2col');
    if(g) g.innerHTML=results.map(posterCardHtml).join('') || `<p style="grid-column:1/-1;color:var(--text-3)">${t('noResultsFor',escapeHtml(q))}</p>`;
    window.__infiniteScrollHandler=async ()=>{
      if(searchPage.page>=searchPage.totalPages) return;
      try{
        const d2=await TMDBApi.searchMulti(q, searchPage.page+1);
        searchPage.page=d2.page;
        const more=(d2.results||[]).filter(r=>r.media_type==='movie'||r.media_type==='tv').map(posterCardHtml).join('');
        const g2=wrap.querySelector('.grid-2col'); if(g2) g2.insertAdjacentHTML('beforeend',more);
      }catch(e){}
    };
  }catch(e){ handleApiError(e); }
}

