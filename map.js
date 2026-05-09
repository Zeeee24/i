// Map Logic
const mapView = document.getElementById('map-view');
const buildingsData = [
  { id: 'FG', name: 'FG Block', subtitle: 'Faculty of Sciences', x: 80, y: 80, w: 160, h: 120, fill: '#1a5276', floors: 4, rooms: 60, inside: ['Science Labs', 'Lecture Halls'] },
  { id: 'MG', name: 'MG Block', subtitle: 'Mgmt Sciences', x: 320, y: 80, w: 160, h: 120, fill: '#1a5276', floors: 3, rooms: 45, inside: ['Seminar Halls', 'Computer Lab'] },
  { id: 'SF', name: 'SF Block', subtitle: 'Shaikh Faculty', x: 560, y: 80, w: 160, h: 120, fill: '#1a5276', floors: 3, rooms: 35, inside: ['Faculty Offices', 'Classrooms'] },
  { id: 'MF', name: 'MF Block', subtitle: 'Main Faculty', x: 800, y: 80, w: 160, h: 120, fill: '#164a6b', floors: 3, rooms: 40, inside: ['Main Lecture Halls'] },
  { id: 'LIB', name: 'Library', subtitle: 'Central Library', x: 180, y: 320, w: 140, h: 100, fill: '#c9a84c', floors: 3, rooms: null, inside: ['Study Halls', 'Book Stacks'] },
  { id: 'ADMIN', name: 'Admin Block', subtitle: 'Administration', x: 420, y: 320, w: 140, h: 100, fill: '#164a6b', floors: 2, rooms: 30, inside: ['Administrative Offices'] },
  { id: 'MOSQUE', name: 'Mosque', subtitle: 'Campus Mosque', x: 660, y: 300, w: 120, h: 120, fill: '#2e7d32', floors: 1, rooms: null, inside: ['Prayer Area'] },
  { id: 'CAF', name: 'Cafeteria', subtitle: 'Student Cafe', x: 820, y: 320, w: 120, h: 100, fill: '#164a6b', floors: 1, rooms: null, inside: ['Dining', 'Student Lounge'] }
];

const svgHTML = `
<svg viewBox="0 0 1000 680" preserveAspectRatio="xMidYMid meet">
  <rect x="20" y="20" width="960" height="640" rx="30" fill="#e8f5e9" stroke="#2e7d32" stroke-width="3"/>
  
  <g stroke="#b0bec5" stroke-width="1.5">
    <line x1="280" y1="20" x2="280" y2="660"/>
    <line x1="520" y1="20" x2="520" y2="660"/>
    <line x1="760" y1="20" x2="760" y2="660"/>
    <line x1="20" y1="260" x2="980" y2="260"/>
    <line x1="20" y1="460" x2="980" y2="460"/>
  </g>

  ${[
    [100,200], [300,230], [550,210], [780,240], [150,480], [350,500], [550,490], [800,470],
    [50,300], [400,100], [700,50], [900,150]
  ].map(pos => `<circle cx="${pos[0]}" cy="${pos[1]}" r="8" fill="#4caf50" stroke="#388e3c" stroke-width="1.5"/>`).join('')}

  <g transform="translate(900, 80)">
    <circle cx="0" cy="0" r="25" fill="#fff" stroke="#1a5276" stroke-width="2"/>
    <polygon points="0,-20 5,0 0,5 -5,0" fill="#e74c3c"/>
    <polygon points="0,20 5,0 0,5 -5,0" fill="#1a5276"/>
    <text x="0" y="-28" font-size="12" font-family="Poppins" fill="#1a5276" text-anchor="middle" font-weight="bold">N</text>
  </g>

  ${buildingsData.map(b => `
    <g class="building pulse" data-block="${b.id}">
      <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="12" fill="${b.fill}"/>
      <text x="${b.x + b.w/2}" y="${b.y + b.h/2 - 5}" font-family="Poppins" font-size="16" font-weight="bold" fill="#fff" text-anchor="middle">${b.name}</text>
      <text x="${b.x + b.w/2}" y="${b.y + b.h/2 + 15}" font-family="Poppins" font-size="12" fill="rgba(255,255,255,0.8)" text-anchor="middle">${b.subtitle}</text>
      ${b.id === 'MOSQUE' ? `
        <svg x="${b.x + b.w/2 - 10}" y="${b.y + 10}" width="20" height="20" viewBox="0 0 24 24" fill="#fff">
          <path d="M12 21a9 9 0 1 1 6.36-2.64"/>
        </svg>
      ` : ''}
    </g>
  `).join('')}
</svg>
`;

mapView.innerHTML = svgHTML;

const bottomSheet = document.getElementById('bottom-sheet');
const backdrop = document.getElementById('sheet-backdrop');

function showBuildingCard(blockCode) {
  const b = buildingsData.find(x => x.id === blockCode || x.id === blockCode.toUpperCase().replace('-', ''));
  if (!b) return;

  let info = '';
  if (b.floors) info += `${b.floors} Floors`;
  if (b.rooms) info += ` • ${b.rooms} Rooms`;

  const content = `
    <h2 style="color: var(--primary-gold); font-size: 1.5rem; margin-bottom: 5px;">${b.name}</h2>
    <span style="display: inline-block; background: var(--primary-gold); color: #000; padding: 2px 8px; border-radius: 8px; font-size: 0.8rem; font-weight: bold; margin-bottom: 10px;">${b.id}</span>
    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 15px;">${info}</p>
    <ul style="list-style: none; padding: 0; margin-bottom: 20px;">
      ${b.inside.map(item => `<li style="padding: 5px 0; border-bottom: 1px solid var(--glass-border); color: #fff; font-size: 0.95rem;">• ${item}</li>`).join('')}
    </ul>
    <button class="gold-btn" onclick="switchTab('schedule-view'); closeSheet();">View in Schedule</button>
  `;

  document.getElementById('sheet-content').innerHTML = content;
  backdrop.classList.add('show');
  bottomSheet.classList.add('show');
}

function closeSheet() {
  backdrop.classList.remove('show');
  bottomSheet.classList.remove('show');
}

backdrop.addEventListener('click', closeSheet);
let startY;
bottomSheet.addEventListener('touchstart', e => startY = e.touches[0].clientY);
bottomSheet.addEventListener('touchmove', e => {
  if (e.touches[0].clientY - startY > 50) closeSheet();
});

document.querySelectorAll('.building').forEach(b => {
  b.addEventListener('click', () => showBuildingCard(b.dataset.block));
});

window.navigateToBlock = function(code) {
  let blockCode = code.split('-')[0].toUpperCase();
  switchTab('map-view');
  showBuildingCard(blockCode);
};
