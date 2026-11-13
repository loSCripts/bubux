/* ================= UTIL ================= */
function escapeHtml(str){ return String(str==null?'':str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function skeletonRow(n){ return Array.from({length:n}).map(()=>'<div class="card"><div class="skel skel-card"></div></div>').join(''); }
function emptyRowMsg(msg){ return `<p style="color:var(--text-3);padding:20px 4px;font-size:.85rem">${msg||t('nothingToShow')}</p>`; }
function goHashOrRefresh(hash){ if(location.hash===hash) router(); else location.hash=hash; }

