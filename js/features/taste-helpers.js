/* Gouts de l'utilisateur (questionnaire) */
function tasteType(){ return (STATE.tastes&&STATE.tastes.type)||'both'; }
function tasteGenreIds(mediaType){
  const g=(STATE.tastes&&STATE.tastes.genres)||[];
  if(mediaType==='movie') return g;
  const map={28:10759,12:10759,878:10765,14:10765,10752:10768,27:9648,53:9648};
  return [...new Set(g.map(x=>map[x]||x))];
}
function shuffleArr(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

