/* ================= MODALS ================= */
function openModal(innerHtml){
  document.getElementById('modal-root').innerHTML=`<div class="modal-backdrop"><div class="modal-card">${innerHtml}</div></div>`;
  document.body.style.overflow='hidden';
}
function closeModal(){
  document.getElementById('modal-root').innerHTML='';
  document.body.style.overflow='';
  try{ if(typeof heroYT!=='undefined' && (heroYT.killed||heroYT.paused) && document.getElementById('home-hero')) heroResume(); }catch(e){}
}

