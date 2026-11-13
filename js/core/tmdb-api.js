/* ================= TMDB API ================= */
function buildAuth(url,params){
  const key=(STATE.auth&&STATE.auth.key)||'';
  const isJWT = key.split('.').length===3 && key.length>60;
  const usp=new URLSearchParams(params||{});
  let headers={};
  if(isJWT){ headers['Authorization']='Bearer '+key; } else { usp.set('api_key',key); }
  const qs=usp.toString();
  return {url:url+(qs?'?'+qs:''),headers};
}
async function tmdb(path,params={}){
  const qs=new URLSearchParams(Object.assign({language:LANG_TO_TMDB[CURRENT_LANG]||'en-US'},params)).toString();
  const res=await fetch(TMDB_BASE+path+(qs?'?'+qs:''));
  if(res.status===401){ const err=new Error('INVALID_KEY'); err.code=401; throw err; }
  if(!res.ok){ const err=new Error('TMDB_ERROR'); err.code=res.status; throw err; }
  return res.json();
}
const TMDBApi={
  trending:(mediaType='all',win='day',page=1)=>tmdb(`/trending/${mediaType}/${win}`,{page}),
  popular:(mediaType='movie',page=1)=>tmdb(`/${mediaType}/popular`,{page}),
  discover:(mediaType='movie',params={})=>tmdb(`/discover/${mediaType}`,params),
  searchMulti:(query,page=1)=>tmdb('/search/multi',{query,page,include_adult:false}),
  genres:(mediaType='movie')=>tmdb(`/genre/${mediaType}/list`),
  providersList:(mediaType='movie',region='US')=>tmdb(`/watch/providers/${mediaType}`,{watch_region:region}),
};
function handleApiError(e){
  console.error(e);
  showToast(t('somethingWrongData')+' ['+((e&&(e.code||e.message))||'?')+']');
}

