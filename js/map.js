'use strict';
const BLDS = [
  {id:'fg', code:'FG', name:'FG Block', detail:'Faculty of General Sciences', floors:4, rooms:60,
   items:['Physics & Chemistry Labs','Biology Labs','Lecture Halls (60 seats)','Computer Lab','Faculty Offices'],
   svg:{x:60,y:60,w:170,h:110}, fill:'#1a5276', tx:145, ty:121},
  {id:'mg', code:'MG', name:'MG Block', detail:'Management Sciences', floors:3, rooms:45,
   items:['Business Administration Classes','Economics Labs','Seminar Hall','MBA Classrooms','Faculty Offices'],
   svg:{x:290,y:60,w:170,h:110}, fill:'#1a5276', tx:375, ty:121},
  {id:'sf', code:'SF', name:'SF Block', detail:'Shaikh Faculty Block', floors:3, rooms:35,
   items:['Lecture Halls','Faculty Offices','Conference Room','Tutorial Rooms','Study Lounge'],
   svg:{x:520,y:60,w:170,h:110}, fill:'#1a5276', tx:605, ty:121},
  {id:'mf', code:'MF', name:'MF Block', detail:'Main Faculty Block', floors:3, rooms:40,
   items:['Main Lecture Theatres','Staff Rooms','Examination Hall','Seminar Rooms'],
   svg:{x:60,y:240,w:170,h:110}, fill:'#164a6b', tx:145, ty:301},
  {id:'lib', code:null, name:'Library', detail:'Central Library', floors:3, rooms:null,
   items:['Reading Halls','Digital Resource Centre','Book Stacks (50,000+)','Research Journals','Study Pods'],
   svg:{x:350,y:240,w:150,h:110}, fill:'#c9a84c', tx:425, ty:301},
  {id:'adm', code:'Admin', name:'Admin Block', detail:'Administration Block', floors:2, rooms:30,
   items:['Vice Chancellor Office','Registrar','Fee Office','Student Affairs','IT Department'],
   svg:{x:60,y:450,w:170,h:110}, fill:'#164a6b', tx:145, ty:511},
  {id:'msq', code:null, name:'Mosque', detail:'Campus Mosque', floors:1, rooms:null,
   items:['Prayer Hall (Women)','Wudu Area','Quran Learning Centre'],
   svg:{x:360,y:450,w:150,h:110}, fill:'#2e7d32', tx:435, ty:511},
  {id:'caf', code:null, name:'Cafeteria', detail:'Student Cafeteria', floors:1, rooms:null,
   items:['Main Dining Area','Hot Food Counter','Snack Corner','Outdoor Seating'],
   svg:{x:570,y:440,w:170,h:120}, fill:'#164a6b', tx:655, ty:506}
];

const CODE_MAP = {};
BLDS.forEach(b => { if (b.code) CODE_MAP[b.code.toUpperCase()] = b.id; });

const sheet = document.getElementById('sheet');
const backdrop = document.getElementById('sheet-backdrop');

function openSheet(id) {
  const b = BLDS.find(x => x.id === id);
  if (!b) return;
  document.getElementById('sh-badge').textContent = b.code || '★';
  document.getElementById('sh-name').textContent = b.name;
  const parts = [b.detail];
  if (b.floors) parts.push(b.floors + ' floors');
  if (b.rooms) parts.push(b.rooms + ' rooms');
  document.getElementById('sh-info').textContent = parts.join(' · ');
  document.getElementById('sh-list').innerHTML = (b.items||[]).map(i=>`<li>${i}</li>`).join('');
  document.getElementById('sh-sched-btn').onclick = () => { closeSheet(); switchTab('sched'); };
  sheet.classList.add('on');
  backdrop.classList.add('on');
}

function closeSheet() {
  sheet.classList.remove('on');
  backdrop.classList.remove('on');
}

function navigateToBlock(code) {
  const b = BLDS.find(x => x.code && x.code.toUpperCase() === code.toUpperCase());
  if (!b) return;
  switchTab('map');
  setTimeout(() => openSheet(b.id), 320);
}

backdrop.addEventListener('click', closeSheet);
document.getElementById('sh-close').addEventListener('click', closeSheet);
document.querySelectorAll('.bld').forEach(el => {
  el.addEventListener('click', () => openSheet(el.dataset.id));
  el.addEventListener('keydown', e => { if (e.key==='Enter'||e.key===' ') openSheet(el.dataset.id); });
});
