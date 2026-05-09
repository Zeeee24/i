'use strict';
// ── Globals ─────────────────────────────────────────────────
const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const DB='iiui_app', ST='schedule', KEY='mySchedule';
let notifTimers = [];

// ── Tab switching ────────────────────────────────────────────
let curTab = 'map';
function switchTab(t) {
  if (curTab === t) return;
  curTab = t;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.querySelectorAll('.ntab').forEach(b => b.classList.remove('active'));
  document.getElementById(t+'-view').classList.add('active');
  document.getElementById('tab-'+t).classList.add('active');
}

// ripple on nav buttons
document.querySelectorAll('.ntab').forEach(btn => {
  btn.addEventListener('click', e => {
    const r = document.createElement('span');
    r.className = 'rip';
    btn.appendChild(r);
    setTimeout(() => r.remove(), 650);
  });
});

// ── IndexedDB ────────────────────────────────────────────────
function openDB() {
  return new Promise((res,rej) => {
    const r = indexedDB.open(DB,1);
    r.onupgradeneeded = e => e.target.result.createObjectStore(ST);
    r.onsuccess = e => res(e.target.result);
    r.onerror = e => rej(e.target.error);
  });
}
async function dbSave(v){ const db=await openDB(); return new Promise((res,rej)=>{const tx=db.transaction(ST,'readwrite');tx.objectStore(ST).put(v,KEY);tx.oncomplete=res;tx.onerror=e=>rej(e);}); }
async function dbLoad(){ const db=await openDB(); return new Promise((res,rej)=>{const tx=db.transaction(ST,'readonly');const r=tx.objectStore(ST).get(KEY);r.onsuccess=e=>res(e.target.result||null);r.onerror=e=>rej(e);}); }
async function dbClear(){ const db=await openDB(); return new Promise((res,rej)=>{const tx=db.transaction(ST,'readwrite');tx.objectStore(ST).delete(KEY);tx.oncomplete=res;tx.onerror=e=>rej(e);}); }

// ── PDF.js + Tesseract OCR ───────────────────────────────────
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function setProgress(msg, pct) {
  document.getElementById('prog-txt').textContent = msg;
  document.getElementById('prog-fill').style.width = pct + '%';
}

async function pdfToOCR(file) {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({data:buf}).promise;
  const n = pdf.numPages;
  const canvas = document.createElement('canvas');
  canvas.style.display = 'none';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const worker = await Tesseract.createWorker('eng', 1, {logger:()=>{}});
  let out = '';
  for (let i = 1; i <= n; i++) {
    setProgress(`Reading page ${i} of ${n}...`, Math.round((i-1)/n*85));
    const pg = await pdf.getPage(i);
    const vp = pg.getViewport({scale:2.0});
    canvas.width = vp.width; canvas.height = vp.height;
    await pg.render({canvasContext:ctx, viewport:vp}).promise;
    setProgress(`Recognising page ${i} of ${n}...`, Math.round((i-0.5)/n*85));
    const {data:{text}} = await worker.recognize(canvas);
    out += '\n--- Page '+i+' ---\n'+text;
  }
  setProgress('Finalising...', 95);
  await worker.terminate();
  document.body.removeChild(canvas);
  return out.trim();
}

// ── Schedule parser ──────────────────────────────────────────
function parseSchedule(txt) {
  const TIME_RE = /\b(\d{1,2}:\d{2}(?:\s*[AP]M)?(?:\s*[-–]\s*\d{1,2}:\d{2}(?:\s*[AP]M)?)?)\b/gi;
  const ROOM_RE = /\b(FG|MG|SF|MF|Admin)-?\d{1,3}\b/gi;
  const DAY_RE  = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday|Mon|Tue|Wed|Thu|Fri|Sat|Sun)\b/gi;
  const NORM = {mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday',sun:'Sunday'};
  const rows = [];
  let curDay = '';
  txt.split('\n').map(l=>l.trim()).filter(Boolean).forEach(line => {
    const dm = line.match(DAY_RE);
    if (dm && line.length < 35) { curDay = NORM[dm[0].toLowerCase().slice(0,3)] || dm[0]; return; }
    const tm = line.match(TIME_RE);
    const rm = line.match(ROOM_RE);
    if (tm) {
      const time = tm[0];
      const room = rm ? rm[0] : '';
      const rest = line.replace(time,'').replace(ROOM_RE,'').trim();
      const parts = rest.split(/\s{2,}|\t/).filter(Boolean);
      rows.push({day:curDay, time, subject:parts[0]||'Class', room, teacher:parts.slice(1).join(' ')});
    }
  });
  return rows;
}

// ── Schedule renderer — card style ───────────────────────────
function renderSchedule(rows) {
  if (!rows || !rows.length) return false;
  const today = DAYS[new Date().getDay()];
  // group by day
  const byDay = {};
  rows.forEach(r => { if (!byDay[r.day]) byDay[r.day] = []; byDay[r.day].push(r); });

  const dayOrder = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const DC = {Monday:'day-mon',Tuesday:'day-tue',Wednesday:'day-wed',Thursday:'day-thu',Friday:'day-fri',Saturday:'day-sat',Sunday:'day-sun'};
  const BC = {Monday:'#c9a84c',Tuesday:'#64ffda',Wednesday:'#e85d75',Thursday:'#a29bfe',Friday:'#55efc4',Saturday:'#fdcb6e',Sunday:'#fd79a8'};

  let html = '';
  dayOrder.forEach(day => {
    const classes = byDay[day];
    if (!classes) return;
    const isToday = day === today;
    html += `<div class="day-block" style="animation-delay:${dayOrder.indexOf(day)*50}ms">
      <div class="day-hdr">
        <span class="day-name">${isToday ? '★ ' : ''}${day}${isToday ? ' — Today' : ''}</span>
        <span class="day-count">${classes.length} class${classes.length>1?'es':''}</span>
      </div>`;
    classes.forEach(c => {
      const block = c.room.match(/^(FG|MG|SF|MF|Admin)/i);
      const pillHtml = c.room
        ? `<button class="room-pill" onclick="navigateToBlock('${block?block[1].toUpperCase():''}')">${esc(c.room)}</button>`
        : '';
      html += `<div class="class-card ${DC[day]||''} ${isToday?'today':''}" style="border-left-color:${BC[day]||'#c9a84c'}">
        <div class="cc-subj">${esc(c.subject)}</div>
        <div class="cc-time"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${esc(c.time)}</div>
        <div class="cc-meta">${pillHtml}<span class="cc-teacher"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>${esc(c.teacher||'—')}</span></div>
      </div>`;
    });
    html += '</div>';
  });
  document.getElementById('sched-out').innerHTML = html;
  show('sched-out'); hide('raw-card'); show('clear-btn');
  return true;
}

function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function show(id){document.getElementById(id).classList.add('on');}
function hide(id){document.getElementById(id).classList.remove('on');}

// ── Process uploaded PDF ─────────────────────────────────────
async function processPDF(file) {
  show('prog-wrap');
  document.getElementById('drop-zone').style.opacity = '0.4';
  document.getElementById('drop-zone').style.pointerEvents = 'none';
  try {
    await requestNotifPerm();
    const txt = await pdfToOCR(file);
    await dbSave(txt);
    apply(txt);
  } catch(e) {
    console.error('[IIUI]',e);
    alert('Could not process PDF. Please ensure it is a valid scanned timetable.');
  } finally {
    hide('prog-wrap');
    document.getElementById('drop-zone').style.opacity = '';
    document.getElementById('drop-zone').style.pointerEvents = '';
  }
}

function apply(txt) {
  const rows = parseSchedule(txt);
  if (!renderSchedule(rows)) {
    document.getElementById('raw-box').textContent = txt;
    show('raw-card'); hide('sched-out'); show('clear-btn');
  }
  if (rows.length) scheduleNotifs(rows);
}

// ── Notifications ────────────────────────────────────────────
async function requestNotifPerm() {
  if ('Notification' in window && Notification.permission === 'default')
    await Notification.requestPermission();
}

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

function scheduleNotifs(rows) {
  notifTimers.forEach(clearTimeout); notifTimers = [];
  const today = DAYS[new Date().getDay()];
  rows.filter(r => r.day === today).forEach(r => {
    const m = r.time.match(/(\d{1,2}):(\d{2})\s*([AP]M)?/i);
    if (!m) return;
    let h = +m[1], mn = +m[2];
    if ((m[3]||'').toUpperCase()==='PM' && h<12) h+=12;
    if ((m[3]||'').toUpperCase()==='AM' && h===12) h=0;
    const now = new Date();
    const t = new Date(now.getFullYear(),now.getMonth(),now.getDate(),h,mn,0) - 10*60000 - now;
    if (t <= 0) return;
    const body = `${r.subject} at ${r.room||'—'} — starts in 10 minutes`;
    notifTimers.push(setTimeout(() => {
      if (isIOS) {
        document.getElementById('bn-title').textContent = 'Class Starting Soon';
        document.getElementById('bn-body').textContent = body;
        show('ios-banner');
        setTimeout(() => hide('ios-banner'), 8000);
      } else if (Notification.permission === 'granted') {
        new Notification('Class Starting Soon', {body, icon:'icon-192.svg'});
      }
    }, t));
  });
}

// ── Clear ────────────────────────────────────────────────────
async function clearSchedule() {
  if (!confirm('Clear saved schedule?')) return;
  await dbClear();
  notifTimers.forEach(clearTimeout); notifTimers = [];
  document.getElementById('sched-out').innerHTML = '';
  hide('sched-out'); hide('raw-card'); hide('clear-btn');
  document.getElementById('pdf-inp').value = '';
}

// ── Offline badge ────────────────────────────────────────────
function syncOnline() { document.getElementById('offline-dot').classList.toggle('on', !navigator.onLine); }
window.addEventListener('online', syncOnline);
window.addEventListener('offline', syncOnline);

// ── Boot ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  syncOnline();
  document.getElementById('pdf-inp').addEventListener('change', e => { const f=e.target.files[0]; if(f) processPDF(f); });
  document.getElementById('drop-zone').addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('drag'); });
  document.getElementById('drop-zone').addEventListener('dragleave', e => e.currentTarget.classList.remove('drag'));
  document.getElementById('drop-zone').addEventListener('drop', e => { e.preventDefault(); e.currentTarget.classList.remove('drag'); const f=e.dataTransfer.files[0]; if(f) processPDF(f); });
  document.getElementById('clear-btn').addEventListener('click', clearSchedule);
  document.getElementById('b-close').addEventListener('click', () => hide('ios-banner'));
  try { const saved = await dbLoad(); if (saved) apply(saved); } catch(e) { console.warn(e); }
});

// ── Service Worker ───────────────────────────────────────────
if ('serviceWorker' in navigator)
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(()=>{}));
