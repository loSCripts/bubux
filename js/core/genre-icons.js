/* ================= GENRE ICONS ================= */
const GENRE_ICON_MAP=[
 ['action & adventure','<path d="M4 20 18 6"/><path d="M14 4h6v6"/><path d="M20 20 6 6"/><path d="M10 4H4v6"/>'],
 ['action','<path d="M4 20 18 6"/><path d="M14 4h6v6"/><path d="M20 20 6 6"/><path d="M10 4H4v6"/>'],
 ['adventure','<circle cx="12" cy="12" r="9"/><path d="M15 9l-2 6-6 2 2-6 6-2Z"/>'],
 ['animation','<path d="M12 3l1.6 4.8L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.2Z"/><path d="M19 15.5l.6 1.8 1.9.7-1.9.7-.6 1.8-.6-1.8-1.9-.7 1.9-.7Z"/>'],
 ['comedy','<circle cx="12" cy="12" r="8.5"/><path d="M8.5 9.8h.01M15.5 9.8h.01"/><path d="M8 14c1.2 1.6 6.8 1.6 8 0"/>'],
 ['crime','<circle cx="8" cy="12" r="4"/><circle cx="16" cy="12" r="4"/><path d="M11 10.5h2M11 13.5h2"/>'],
 ['documentary','<path d="M4 8.5h3.2L9 6.3h6L16.8 8.5H20V19H4Z"/><circle cx="12" cy="13.2" r="3.4"/>'],
 ['drama','<circle cx="12" cy="12" r="8.5"/><path d="M8.5 9.8h.01M15.5 9.8h.01"/><path d="M8 15.6c1.2-1.6 6.8-1.6 8 0"/>'],
 ['famil','<path d="M4 11.5 12 4l8 7.5"/><path d="M6 10.5V20h5v-5.2h2V20h5v-9.5"/>'],
 ['fantasy','<path d="M5 19 17 7"/><path d="M14.2 3.6l1 2.2 2.2 1-2.2 1-1 2.2-1-2.2-2.2-1 2.2-1Z"/>'],
 ['histor','<path d="M7 4h9a2 2 0 0 1 2 2v13a1.6 1.6 0 0 1-1.6 1.6H9A2 2 0 0 1 7 18.6Z"/><path d="M7 4a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2"/><path d="M9.5 9.5h6M9.5 13h6"/>'],
 ['horror','<path d="M6.5 20V10.5a5.5 5.5 0 0 1 11 0V20l-2.3-1.8-1.9 1.8-1.8-1.8-1.9 1.8Z"/><circle cx="10" cy="10.6" r=".9"/><circle cx="14.6" cy="10.6" r=".9"/>'],
 ['music','<circle cx="7" cy="18" r="2.3"/><circle cx="17" cy="16" r="2.3"/><path d="M9.3 18V6.5L19 4.5V15"/>'],
 ['mystery','<circle cx="10.6" cy="10.6" r="6.2"/><path d="M15.2 15.2 20.5 20.5"/>'],
 ['romance','<path d="M12 20.5s-7-4.4-9.2-8.5C1.4 8.7 2.6 5.6 5.3 5c2-.5 3.8.4 6.7 3.6 2.9-3.2 4.7-4.1 6.7-3.6 2.7.6 3.9 3.7 2.5 7-2.2 4.1-9.2 8.5-9.2 8.5Z"/>'],
 ['science fiction','<path d="M12 2.5c2.8 2 3.8 6 3.8 9.5 0 2-1 3.6-1 3.6h-5.6s-1-1.6-1-3.6c0-3.5 1-7.5 3.8-9.5Z"/><circle cx="12" cy="9" r="1.4"/><path d="M9 15.6l-2.6 4.4 3.6-1.8M15 15.6l2.6 4.4-3.6-1.8"/>'],
 ['sci-fi','<path d="M12 2.5c2.8 2 3.8 6 3.8 9.5 0 2-1 3.6-1 3.6h-5.6s-1-1.6-1-3.6c0-3.5 1-7.5 3.8-9.5Z"/><circle cx="12" cy="9" r="1.4"/><path d="M9 15.6l-2.6 4.4 3.6-1.8M15 15.6l2.6 4.4-3.6-1.8"/>'],
 ['tv movie','<rect x="3" y="6.5" width="18" height="12" rx="2"/><path d="M8 3.2 12 6.5 16 3.2"/>'],
 ['thriller','<path d="M2.5 12S6.5 5.5 12 5.5 21.5 12 21.5 12 17.5 18.5 12 18.5 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>'],
 ['war','<path d="M12 3 19 6v6c0 4.8-3.3 7.3-7 8.7-3.7-1.4-7-3.9-7-8.7V6Z"/><path d="M12 8v6.5M9.2 11h5.6"/>'],
 ['western','<path d="M4 15.8c0-.9 3.2-1.8 8-1.8s8 .9 8 1.8-3.2 1.8-8 1.8-8-.9-8-1.8Z"/><path d="M8 14c0-3.8 1.5-8 4-8s4 4.2 4 8"/>'],
 ['kids','<rect x="4" y="4" width="7" height="7" rx="1.4"/><rect x="13" y="4" width="7" height="7" rx="1.4"/><rect x="4" y="13" width="7" height="7" rx="1.4"/><rect x="13" y="13" width="7" height="7" rx="1.4"/>'],
 ['news','<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="M7 9.5h6M7 12.5h10M7 15.5h10"/>'],
 ['reality','<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>'],
 ['soap','<circle cx="9" cy="15" r="3.4"/><circle cx="16" cy="9" r="2.2"/><circle cx="15.5" cy="16.5" r="1.4"/>'],
 ['talk','<rect x="8" y="3" width="8" height="12" rx="4"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5v3.2M9 20.7h6"/>'],
];
const GENRE_ICON_DEFAULT='<rect x="3" y="3" width="18" height="18" rx="2.5"/><circle cx="7.8" cy="7.8" r="1.3"/><circle cx="16.2" cy="7.8" r="1.3"/><circle cx="7.8" cy="16.2" r="1.3"/><circle cx="16.2" cy="16.2" r="1.3"/>';
function iconForGenre(name){
  if(!name) return GENRE_ICON_DEFAULT;
  const n=name.toLowerCase();
  const found=GENRE_ICON_MAP.find(([key])=>n.includes(key));
  return found?found[1]:GENRE_ICON_DEFAULT;
}
function iconSpan(pathMarkup){ return `<svg viewBox="0 0 24 24">${pathMarkup}</svg>`; }
const STAR_PATH='<path d="M12 2l3 6.5 7 .9-5.1 4.8 1.3 7-6.2-3.4-6.2 3.4 1.3-7L2 9.4l7-.9Z"/>';

