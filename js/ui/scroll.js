/* ================= SCROLL (parallax / hue-rotate / scroll-top / infinite scroll) ================= */
let scrollTicking=false;
function onScrollThrottled(){ if(!scrollTicking){ requestAnimationFrame(()=>{ onScroll(); scrollTicking=false; }); scrollTicking=true; } }
function scrollRoot(){ const de=document.documentElement; return de.scrollHeight>de.clientHeight+1?de:document.body; }
function onScroll(){
  try{
    const sr=scrollRoot();
    const y=Math.max(window.scrollY||0, sr.scrollTop||0);
    const aurora=document.getElementById('aurora-bg');
    if(aurora && aurora.classList.contains('active')){
      aurora.style.transform=`translateY(${y*-0.25}px)`;
      aurora.style.filter=`hue-rotate(${(y*0.04)%360}deg)`;
    }
    const heroWrap=document.getElementById('hero-bg-wrap');
    if(heroWrap){ heroWrap.style.transform=`translateY(${y*0.4}px)`; }
    const stt=document.getElementById('scroll-top-btn');
    if(stt) stt.classList.toggle('show', y>300);
    if(window.__infiniteScrollHandler){
      if(sr.scrollHeight-(y+sr.clientHeight) < 2500){ window.__infiniteScrollHandler(); }
    }
  }catch(e){ console.error('onScroll error:', e); }
}

