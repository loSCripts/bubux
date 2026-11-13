/* Heros : dernieres sorties, melangees a chaque visite, adaptees aux gouts */
async function fetchLatestHeroItems(){
  const today=isoDay(0), mFrom=isoDay(-75), tFrom=isoDay(-90), type=tasteType();
  const reqs=[];
  if(type!=='tv') [1,2].forEach(pg=>reqs.push(TMDBApi.discover('movie',{sort_by:'popularity.desc','primary_release_date.gte':mFrom,'primary_release_date.lte':today,'vote_count.gte':1,include_adult:false,with_release_type:'2|3',region:STATE.region||'FR',page:pg}).then(r=>(r.results||[]).map(x=>Object.assign({media_type:'movie'},x))).catch(()=>[])));
  if(type!=='movie') [1,2].forEach(pg=>reqs.push(TMDBApi.discover('tv',{sort_by:'popularity.desc','first_air_date.gte':tFrom,'first_air_date.lte':today,include_adult:false,page:pg}).then(r=>(r.results||[]).map(x=>Object.assign({media_type:'tv'},x))).catch(()=>[])));
  let list=(await Promise.all(reqs)).flat().filter(it=>it.backdrop_path);
  const seen=new Set(); list=list.filter(it=>{ const k=it.media_type+it.id; if(seen.has(k)) return false; seen.add(k); return true; });
  list=shuffleArr(list);
  if(STATE.tastes&&STATE.tastes.genres&&STATE.tastes.genres.length){
    const score=it=>{ const ids=tasteGenreIds(it.media_type); return (it.genre_ids||[]).filter(g=>ids.includes(g)).length; };
    list.sort((a,b)=>score(b)-score(a));
  }
  const lang=(LANG_TO_TMDB[CURRENT_LANG]||'en-US').slice(0,2);
  const withKeys=await Promise.all(list.slice(0,24).map(async it=>{
    try{
      const d=await tmdb(`/${it.media_type}/${it.id}/videos`,{include_video_language:`${lang},en,null`});
      const v=(d.results||[]).filter(x=>x.site==='YouTube');
      const pick=v.find(x=>x.type==='Trailer'&&x.official)||v.find(x=>x.type==='Trailer')||v.find(x=>x.type==='Teaser');
      if(pick) it._ytKey=pick.key;
    }catch(e){}
    return it;
  }));
  const ok=withKeys.filter(it=>it._ytKey);
  return (ok.length?ok:withKeys).slice(0,12);
}

