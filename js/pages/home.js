/* ================= HOME ================= */
let heroState={items:[],index:0,timer:null,logoCache:{}};
let recsRefOverride=null;
let providerRowState={mediaType:'movie',selected:null,list:[]};

async function renderHome(root){
  root.innerHTML=`
    <div class="page" id="home-page">
      <div class="top-logo">B</div>
      <section class="hero" id="home-hero"></section>
      <div id="install-banner-slot"></div>
      <div id="continue-watching-section"></div>
      <div id="for-you-section"></div>
      <div id="because-you-watched-section"></div>
      <div id="provider-row-section"></div>
      <div id="trending-movies-section"></div>
      <div id="trending-tv-section"></div>
      <div id="home-more"></div>
    </div>`;
  await Promise.all([ensureGenres('movie'),ensureGenres('tv')]);
  maybeShowInstallBanner();
  try{
    let heroItems=await fetchLatestHeroItems();
    if(!heroItems.length){
      const trendingAll=await TMDBApi.trending('all','day');
      heroItems=(trendingAll.results||[]).filter(it=>it.backdrop_path && (it.media_type==='movie'||it.media_type==='tv')).slice(0,5);
    }
    mountHero(heroItems);
  }catch(e){ handleApiError(e); }
  renderContinueWatching();
  renderForYou();
  renderBecauseYouWatched();
  renderProviderRow('movie');
  renderTrendingRow('movie',t('trendingMovies'),document.getElementById('trending-movies-section'),'movies');
  renderTrendingRow('tv',t('trendingTV'),document.getElementById('trending-tv-section'),'tv');
  homeRowN=0; homeRowLast=0;
  window.__infiniteScrollHandler=addHomeRows;
  addHomeRows(true); addHomeRows(true);
  if(!STATE.tastesAsked){ STATE.tastesAsked=true; saveState(); setTimeout(()=>{ if(document.getElementById('home-page')) openTasteQuiz(); },700); }
}

/* ================= LIGNES INFINIES SUR L'ACCUEIL ================= */
const FALLBACK_GENRES_MOVIE=[[28,'Action','Action'],[12,'Aventure','Adventure'],[16,'Animation','Animation'],[35,'Comédie','Comedy'],[80,'Crime','Crime'],[99,'Documentaire','Documentary'],[18,'Drame','Drama'],[10751,'Famille','Family'],[14,'Fantastique','Fantasy'],[27,'Horreur','Horror'],[9648,'Mystère','Mystery'],[10749,'Romance','Romance'],[878,'Science-fiction','Science Fiction'],[53,'Thriller','Thriller'],[10752,'Guerre','War'],[37,'Western','Western']];
const FALLBACK_GENRES_TV=[[10759,'Action et aventure','Action & Adventure'],[16,'Animation','Animation'],[35,'Comédie','Comedy'],[80,'Crime','Crime'],[99,'Documentaire','Documentary'],[18,'Drame','Drama'],[10751,'Famille','Family'],[9648,'Mystère','Mystery'],[10765,'SF et fantastique','Sci-Fi & Fantasy'],[37,'Western','Western']];
function genresOrFallback(mt){
  const got=(mt==='movie'?CACHE.genresMovie:CACHE.genresTV)||[];
  if(got.length) return got;
  return (mt==='movie'?FALLBACK_GENRES_MOVIE:FALLBACK_GENRES_TV).map(g=>({id:g[0],name:CURRENT_LANG==='fr'?g[1]:g[2]}));
}
let homeRowN=0, homeRowLast=0;
function homeRowDef(n){
  const mt=n%2===0?'movie':'tv';
  const gl=genresOrFallback(mt);
  const idx=Math.floor(n/2), g=gl[idx%gl.length], cycle=Math.floor(idx/gl.length);
  const nowY=new Date().getFullYear(), dk=mt==='movie'?'primary_release_date':'first_air_date';
  const prm={with_genres:g.id,include_adult:false,sort_by:'popularity.desc','vote_count.gte':20};
  let suffix='';
  const v=cycle%3, yr=nowY-Math.floor(cycle/3);
  if(v===1){ prm.sort_by='vote_average.desc'; prm['vote_count.gte']=300; suffix=' ('+TL('les mieux notés','top rated')+')'; }
  if(v===2){ prm.sort_by=dk+'.desc'; prm[dk+'.lte']=isoDay(0); suffix=' ('+TL('nouveautés','latest')+')'; }
  if(cycle>=3){ const y=2000+((yr-2000)%27+27)%27; prm[dk+'.gte']=y+'-01-01'; prm[dk+'.lte']=y+'-12-31'; prm.sort_by='popularity.desc'; suffix=' '+y; }
  const label=(mt==='movie'?TL('Films','Movies'):TL('Séries','Series'))+' : '+g.name+suffix;
  return {mt,label,prm};
}
function addHomeRows(force){
  const host=document.getElementById('home-more');
  if(!host){ if(window.__infiniteScrollHandler===addHomeRows) window.__infiniteScrollHandler=null; return; }
  const now=Date.now();
  if(force!==true && now-homeRowLast<350) return;
  homeRowLast=now;
  for(let k=0;k<2;k++){
    const def=homeRowDef(homeRowN++); if(!def) return;
    const id='homerow-'+homeRowN;
    host.insertAdjacentHTML('beforeend',`<div class="section"><div class="section-head"><h2>${escapeHtml(def.label)}</h2></div><div class="row-scroll" id="${id}">${skeletonRow(4)}</div></div>`);
    const row=document.getElementById(id);
    infiniteRow(row,pg=>TMDBApi.discover(def.mt,Object.assign({},def.prm,{page:pg})));
  }
}

