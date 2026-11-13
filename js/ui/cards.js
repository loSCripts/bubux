/* ================= CARDS ================= */
function posterCardHtml(item){
  const mediaType=item.media_type || (item.title?'movie':'tv');
  const title=item.title||item.name||'Untitled';
  const year=(item.release_date||item.first_air_date||'').slice(0,4)||'—';
  const rating=item.vote_average?item.vote_average.toFixed(1):'–';
  const poster=item.poster_path?`${IMG_BASE}/${POSTER_SIZE}${item.poster_path}`:'';
  return `
    <div class="card" data-action="navigate" data-href="#/title/${mediaType}/${item.id}" data-longpress="1" data-lp-type="${mediaType}" data-lp-id="${item.id}">
      <div class="card-media">${poster?`<img src="${poster}" loading="lazy" alt="">`:`<div class="skel skel-card"></div>`}</div>
      <div class="card-title">${escapeHtml(title)}</div>
      <div class="card-meta">${iconSpan(STAR_PATH)}${rating}<span class="dot"></span>${year}</div>
    </div>`;
}
function cwCardHtml(item){
  const img=item.image?`${IMG_BASE}/w780${item.image}`:'';
  const isTv=item.media_type==='tv' && item.season && item.episode;
  const watchAttrs=isTv
    ? `data-action="watch" data-type="tv" data-id="${item.id}" data-title="${escapeHtml(item.title)}" data-image="${escapeHtml(item.image||'')}" data-season="${item.season}" data-episode="${item.episode}"`
    : `data-action="watch" data-type="${item.media_type}" data-id="${item.id}" data-title="${escapeHtml(item.title)}" data-image="${escapeHtml(item.image||'')}"`;
  return `
    <div class="card wide" data-longpress="1" data-lp-type="${item.media_type}" data-lp-id="${item.id}">
      <div class="card-media" ${watchAttrs} style="cursor:pointer">
        ${img?`<img src="${img}" loading="lazy" alt="">`:''}
        <button class="card-remove hidden" data-action="remove-cw" data-type="${item.media_type}" data-id="${item.id}" aria-label="Remove"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
      </div>
      <div class="card-title" data-action="navigate" data-href="#/title/${item.media_type}/${item.id}" style="cursor:pointer">${escapeHtml(item.title)}</div>
      <div class="card-progress-label">${escapeHtml(item.progressLabel||'')}</div>
    </div>`;
}


