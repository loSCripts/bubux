/* ================= CATALOG (Movies / TV) ================= */
let catalogState={mediaType:'movie',page:0,totalPages:1,loading:false,filters:{genre:null,year:null,sort:'popularity.desc',provider:null}};
async function renderCatalog(root,mediaType){
  catalogState={mediaType,page:0,totalPages:1,loading:false,filters:{genre:null,year:null,sort:'popularity.desc',provider:(STATE.selectedProvider?STATE.selectedProvider.id:null)}};
  const label=mediaType==='movie'?{title:t('movies'),sub:t('discoverMovies')}:{title:t('tvSeries'),sub:t('discoverTV')};
  const providerLabel=STATE.selectedProvider?STATE.selectedProvider.name:t('allProviders');
  root.innerHTML=`<div class="page">
      <div class="top-logo">B</div>
      <div class="page-header"><h1>${label.title}</h1><p>${label.sub}</p></div>
      <div class="filters-row">
        <button class="pill icon-only" data-action="surprise-me" data-media="${mediaType}" aria-label="${t('surpriseMe')}">
          <svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.1" fill="currentColor"/><circle cx="15" cy="9" r="1.1" fill="currentColor"/><circle cx="9" cy="15" r="1.1" fill="currentColor"/><circle cx="15" cy="15" r="1.1" fill="currentColor"/><circle cx="12" cy="12" r="1.1" fill="currentColor"/></svg>
        </button>
        <button class="pill" id="filter-pill-genre" data-action="open-filter" data-filter="genre">${t('allGenres')} <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
        <button class="pill" id="filter-pill-year" data-action="open-filter" data-filter="year">${t('allYears')} <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
        <button class="pill" id="filter-pill-sort" data-action="open-filter" data-filter="sort"><span class="dot-active"></span>${t('popular')} <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
        <button class="pill" id="filter-pill-provider" data-action="open-filter" data-filter="provider">${escapeHtml(providerLabel)} <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button>
      </div>
      <div class="grid-2col" id="catalog-grid"></div>
    </div>`;
  window.__infiniteScrollHandler=()=>loadCatalogMore(false);
  await ensureGenres(mediaType);
  loadCatalogMore(true);
}
async function loadCatalogMore(reset){
  if(catalogState.loading) return;
  catalogState.loading=true;
  const grid=document.getElementById('catalog-grid');
  if(!grid){ catalogState.loading=false; return; }
  if(reset){ grid.innerHTML=Array.from({length:8}).map(()=>'<div class="card"><div class="skel skel-card"></div></div>').join(''); catalogState.page=0; catalogState.known=false; }
  const nextPage=catalogState.page+1;
  const params={page:nextPage, sort_by:catalogState.filters.sort, include_adult:false};
  if(catalogState.filters.genre) params.with_genres=catalogState.filters.genre;
  if(catalogState.filters.year) params[catalogState.mediaType==='movie'?'primary_release_year':'first_air_date_year']=catalogState.filters.year;
  if(catalogState.filters.provider){ params.with_watch_providers=catalogState.filters.provider; params.watch_region=STATE.region; }
  try{
    const tot=catalogState.known?Math.max(1,catalogState.totalPages):0;
    const pn=i=>tot?(((nextPage-1+i)%tot)+1):(nextPage+i);
    const datas=await Promise.all([0,1,2].map(i=>TMDBApi.discover(catalogState.mediaType,Object.assign({},params,{page:pn(i)})).catch(()=>null)));
    const okd=datas.filter(Boolean); if(!okd.length) throw new Error('TMDB_ERROR');
    const last=okd[okd.length-1];
    catalogState.page=nextPage+2; catalogState.totalPages=Math.min(last.total_pages||1,500); catalogState.known=true;
    const seenC=new Set(); let html='';
    okd.forEach(dd=>(dd.results||[]).forEach(it=>{ if(seenC.has(it.id)) return; seenC.add(it.id); html+=posterCardHtml(it); }));
    if(reset) grid.innerHTML=html || `<p style="grid-column:1/-1;color:var(--text-3);padding:20px 0">${t('noResultsFilters')}</p>`;
    else grid.insertAdjacentHTML('beforeend',html);
  }catch(e){ handleApiError(e); if(reset) grid.innerHTML=''; }
  catalogState.loading=false;
}
async function openFilterSheet(kind){
  let title,options;
  if(kind==='genre'){
    const list=await ensureGenres(catalogState.mediaType);
    title=t('genre'); options=[{value:'',label:t('allGenres')}].concat(list.map(g=>({value:String(g.id),label:g.name})));
  } else if(kind==='year'){
    title=t('year'); const now=new Date().getFullYear();
    options=[{value:'',label:t('allYears')}].concat(Array.from({length:now-1949},(_,i)=>({value:String(now-i),label:String(now-i)})));
  } else if(kind==='sort'){
    title=t('sortBy');
    options=[
      {value:'popularity.desc',label:t('popular')},
      {value:'vote_average.desc',label:t('topRated')},
      {value:catalogState.mediaType==='movie'?'primary_release_date.desc':'first_air_date.desc',label:t('newest')},
      {value:catalogState.mediaType==='movie'?'primary_release_date.asc':'first_air_date.asc',label:t('oldest')},
    ];
  } else if(kind==='provider'){
    title=t('provider');
    try{
      const data=await TMDBApi.providersList(catalogState.mediaType, STATE.region);
      const list=(data.results||[]).slice().sort((a,b)=>(a.display_priority||99)-(b.display_priority||99));
      options=[{value:'',label:t('allProviders')}].concat(list.map(p=>({value:String(p.provider_id),label:p.provider_name})));
    }catch(e){ options=[{value:'',label:t('allProviders')}]; }
  }
  openModal(`<h3>${title}</h3><div class="modal-field" style="max-height:52vh;overflow-y:auto">
    ${options.map(o=>`<button class="list-picker-item" data-action="apply-filter" data-kind="${kind}" data-value="${o.value}" data-label="${escapeHtml(o.label)}" style="width:100%;text-align:left">${escapeHtml(o.label)}</button>`).join('')}
  </div>`);
}
function applyFilterValue(kind,value,label){
  if(kind==='sort') catalogState.filters.sort=value; else catalogState.filters[kind]=value||null;
  if(kind==='provider'){
    STATE.selectedProvider=value?{id:value,name:label}:null;
    saveState();
  }
  const pill=document.getElementById('filter-pill-'+kind);
  if(pill){
    const svgHtml=pill.querySelector('svg').outerHTML;
    if(kind==='sort') pill.innerHTML=`<span class="dot-active"></span>${escapeHtml(label)} `+svgHtml;
    else { const dflt={genre:t('allGenres'),year:t('allYears'),provider:t('allProviders')}[kind]; pill.innerHTML=`${escapeHtml(value?label:dflt)} `+svgHtml; }
  }
  closeModal();
  loadCatalogMore(true);
}
async function surpriseMe(mediaType){
  showToast(t('findingForYou'));
  try{
    const page=Math.floor(Math.random()*20)+1;
    const data=await TMDBApi.discover(mediaType,{sort_by:'popularity.desc',page});
    const list=data.results||[];
    if(!list.length){ showToast(t('nothingFoundRetry')); return; }
    const pick=list[Math.floor(Math.random()*list.length)];
    location.hash=`#/title/${mediaType}/${pick.id}`;
  }catch(e){ handleApiError(e); }
}

