/* ================= LONG PRESS (add to list from a card) ================= */
let lpTimer=null, lpFired=false;
document.addEventListener('pointerdown', e=>{
  const card=e.target.closest('[data-longpress]');
  if(!card) return;
  lpFired=false;
  lpTimer=setTimeout(()=>{ lpFired=true; openAddToListModal(card.dataset.lpType, card.dataset.lpId); if(navigator.vibrate) navigator.vibrate(15); }, 500);
});
['pointerup','pointerleave','pointercancel','pointermove'].forEach(evt=>document.addEventListener(evt, ()=>clearTimeout(lpTimer)));

/* ================= BROKEN IMAGE HANDLING ================= */
document.addEventListener('error', function(e){
  if(e.target && e.target.tagName==='IMG'){ e.target.style.visibility='hidden'; }
}, true);

