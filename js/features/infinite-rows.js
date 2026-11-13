/* ================= LIGNES INFINIES + NOUVEAUTES ================= */
function infiniteRow(rowEl,fetchPage,opts){
  opts=opts||{};
  const st={page:0,total:1,loading:false,seen:new Set(),dead:false};
  async function more(n){
    if(st.loading||st.dead||!rowEl.isConnected) return;
    if(st.page>=st.total){ if(!st.seen.size) return; st.page=0; st.seen.clear(); }
    st.loading=true;
    const first=st.page+1, last=Math.min(st.total,st.page+n);
    try{
      const pages=await Promise.all(Array.from({length:last-first+1},(_,i)=>fetchPage(first+i).catch(()=>null)));
      if(!pages.some(Boolean)){
        st.loading=false; st.fail=(st.fail||0)+1;
        if(st.fail<4) setTimeout(()=>more(n),2000*st.fail);
        else if(!st.seen.size) rowEl.innerHTML=emptyRowMsg();
        return;
      }
      st.fail=0;
      let html='';
      pages.forEach(d=>{
        if(!d) return;
        st.total=Math.min(d.total_pages||1,500);
        (d.results||[]).forEach(it=>{
          if(opts.filter && !opts.filter(it)) return;
          const k=(it.media_type||(it.title?'movie':'tv'))+it.id;
          if(st.seen.has(k)) return; st.seen.add(k);
          html+=posterCardHtml(it);
        });
      });
      st.page=last;
      if(st.page===last && !st.seen.size && rowEl.querySelector('.skel')) rowEl.innerHTML=emptyRowMsg();
      else{
        if(rowEl.querySelector('.skel')) rowEl.innerHTML='';
        rowEl.insertAdjacentHTML('beforeend',html);
      }
    }catch(e){ if(!st.seen.size) rowEl.innerHTML=emptyRowMsg(); }
    st.loading=false;
    if(rowEl.isConnected && (st.fill=(st.fill||0)+1)<8 && rowEl.scrollWidth<=rowEl.clientWidth+400) more(2);
  }
  rowEl.addEventListener('scroll',()=>{
    if(rowEl.scrollWidth-(rowEl.scrollLeft+rowEl.clientWidth)<900) more(2);
  },{passive:true});
  more(3);
  return st;
}
function isoDay(offsetDays){ const d=new Date(Date.now()+offsetDays*864e5); return d.toISOString().slice(0,10); }

