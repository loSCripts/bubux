/* ================= STATE / STORAGE ================= */
const STORAGE_KEY='luma_state';
let memoryFallback={};
function safeStorageGet(key){ try{ return localStorage.getItem(key); }catch(e){ return memoryFallback[key] ?? null; } }
function safeStorageSet(key,value){ try{ localStorage.setItem(key,value); }catch(e){ memoryFallback[key]=value; } }
function defaultState(){ return { auth:null, profile:null, region:'US', language:null, lists:[], continueWatching:[], seenOnboarding:false, selectedProvider:null }; }
function loadState(){
  const raw=safeStorageGet(STORAGE_KEY);
  if(!raw) return defaultState();
  try{ return Object.assign(defaultState(), JSON.parse(raw)); }catch(e){ return defaultState(); }
}
function saveState(){ const copy=Object.assign({},STATE); delete copy._tempColor; delete copy._installDismissed; safeStorageSet(STORAGE_KEY, JSON.stringify(copy)); }
let STATE=loadState();
const CACHE={genresMovie:null,genresTV:null};
async function ensureGenres(mediaType){
  const key=mediaType==='movie'?'genresMovie':'genresTV';
  if(!CACHE[key]){ try{ const data=await TMDBApi.genres(mediaType); CACHE[key]=data.genres||[]; }catch(e){ CACHE[key]=[]; } }
  return CACHE[key];
}
function genreNameFor(mediaType,id){
  const key=mediaType==='movie'?'genresMovie':'genresTV';
  const found=(CACHE[key]||[]).find(g=>g.id===id);
  return found?found.name:null;
}

