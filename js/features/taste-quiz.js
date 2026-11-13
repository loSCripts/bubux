/* ================= QUESTIONNAIRE DE GOUTS ================= */
const TL=(fr,en)=>CURRENT_LANG==='fr'?fr:en;
let tasteDraft=null;
function renderForYou(){
  const el=document.getElementById('for-you-section'); if(!el) return;
  const tz=STATE.tastes;
  if(!tz||!tz.genres||!tz.genres.length){
    el.innerHTML=`<div class="section"><button class="taste-chip" data-action="edit-tastes">${TL('Personnaliser mon accueil','Personalize my home')}</button></div>`;
    return;
  }
  const types=tz.type==='movie'?['movie']:tz.type==='tv'?['tv']:['movie','tv'];
  el.innerHTML=types.map((mt,i)=>`<div class="section"><div class="section-head"><h2>${mt==='movie'?TL('Films pour vous','Movies for you'):TL('Séries pour vous','Series for you')}</h2>
    ${i===0?`<button class="view-all" data-action="edit-tastes">${TL('Modifier mes goûts','Edit my tastes')}</button>`:''}</div>
    <div class="row-scroll" id="foryou-${mt}">${skeletonRow(4)}</div></div>`).join('');
  types.forEach(mt=>{
    const row=document.getElementById('foryou-'+mt); if(!row) return;
    const dk=mt==='movie'?'primary_release_date':'first_air_date';
    infiniteRow(row,pg=>{
      const prm={sort_by:'popularity.desc',with_genres:tasteGenreIds(mt).join('|'),include_adult:false,page:pg,'vote_count.gte':30};
      if(tz.era==='new') prm[dk+'.gte']=isoDay(-1095);
      if(tz.era==='classic'){ prm[dk+'.lte']='2005-12-31'; prm['vote_count.gte']=300; }
      return TMDBApi.discover(mt,prm);
    });
  });
}
async function openTasteQuiz(){
  await ensureGenres('movie');
  const list=genresOrFallback('movie');
  const tz=STATE.tastes||{};
  tasteDraft={type:tz.type||'both',era:tz.era||'any',genres:new Set(tz.genres||[])};
  const chips=(arr,act,cur)=>arr.map(o=>`<button class="taste-chip ${cur(o)?'on':''}" data-action="${act}" data-v="${o.v}">${escapeHtml(o.l)}</button>`).join('');
  openModal(`<h3>${TL('Tes goûts','Your tastes')}</h3>
    <p style="color:var(--text-2);font-size:.88rem;margin:6px 0 0">${TL("Choisis ce que tu aimes, l'accueil s'adapte.",'Pick what you like, your home adapts.')}</p>
    <div class="taste-label">${TL('Tu regardes plutôt','You mostly watch')}</div>
    <div class="taste-chips" id="taste-types">${chips([{v:'movie',l:TL('Films','Movies')},{v:'tv',l:TL('Séries','Series')},{v:'both',l:TL('Les deux','Both')}],'taste-type',o=>o.v===tasteDraft.type)}</div>
    <div class="taste-label">${TL('Tu préfères','You prefer')}</div>
    <div class="taste-chips" id="taste-eras">${chips([{v:'new',l:TL('Les nouveautés','New releases')},{v:'classic',l:TL('Les classiques','Classics')},{v:'any',l:TL('Peu importe','Any')}],'taste-era',o=>o.v===tasteDraft.era)}</div>
    <div class="taste-label">${TL('Tes genres préférés','Your favorite genres')}</div>
    <div class="taste-chips">${list.map(g=>`<button class="taste-chip ${tasteDraft.genres.has(g.id)?'on':''}" data-action="taste-genre" data-v="${g.id}">${escapeHtml(g.name)}</button>`).join('')}</div>
    <div style="display:flex;align-items:center;gap:16px;margin-top:22px">
      <button class="btn-primary" data-action="taste-save">${TL('Valider','Done')}</button>
      <button class="modal-link" data-action="close-modal-x">${TL('Passer','Skip')}</button>
    </div>`);
}
function tasteSave(){
  if(!tasteDraft) return;
  STATE.tastes={type:tasteDraft.type,era:tasteDraft.era,genres:[...tasteDraft.genres]};
  saveState(); closeModal(); router();
}

