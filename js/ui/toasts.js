/* ================= TOASTS ================= */
function showToast(msg){
  const c=document.getElementById('toast-container');
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  c.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),350); },2400);
}

