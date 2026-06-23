/* ═══════════════════════════════════════════
   SEARCH.JS — Battalion Search Logic
   Cadet Connection Portal
   ═══════════════════════════════════════════ */

// ─── Mock Battalion Data ───
const battalions = [
  {
    id: '15th-tripura', name: '15th Tripura Bn NCC', state: 'Tripura', city: 'Agartala',
    wing: 'Army', established: '1985', co: 'Col. Rajesh Kumar Sharma',
    coContact: '+91 98XXX XXXXX', coEmail: 'co15tripura@ncc.gov.in',
    totalCadets: 450, colleges: 12, activeCamps: 2, certificates: 890, awards: 45, attendance: 87,
    collegeList: [
      { name: 'Tripura University', cadets: 60, ano: 'Capt. Anil Deb' },
      { name: 'MBB College', cadets: 38, ano: 'Lt. Suresh Roy' },
      { name: "Women's College, Agartala", cadets: 45, ano: 'Capt. Mita Devi' },
      { name: 'Ramthakur College', cadets: 27, ano: 'Lt. Bikash Dhar' }
    ],
    achievements: ['RDC Delhi 2024 — Best Cadet NER', 'TSC Winner 2023', 'PM Rally Selected — 3 Cadets'],
    recentCamps: ['ATC Jul 2025 — Agartala', 'CATC Aug 2025 — Shillong']
  },
  {
    id: '1st-tripura', name: '1st Tripura Bn NCC', state: 'Tripura', city: 'Agartala',
    wing: 'Army', established: '1963', co: 'Col. Deepak Sinha',
    coContact: '+91 97XXX XXXXX', coEmail: 'co1tripura@ncc.gov.in',
    totalCadets: 380, colleges: 9, activeCamps: 1, certificates: 720, awards: 38, attendance: 84,
    collegeList: [
      { name: 'Maharaja Bir Bikram College', cadets: 55, ano: 'Capt. Ratan Das' },
      { name: 'Holy Cross College', cadets: 40, ano: 'Lt. Mary Joseph' }
    ],
    achievements: ['Best Bn NER 2023', 'Blood Donation Award 2024'],
    recentCamps: ['ATC Jun 2025 — Agartala']
  },
  {
    id: '1st-assam', name: '1st Assam Bn NCC', state: 'Assam', city: 'Guwahati',
    wing: 'Army', established: '1952', co: 'Col. Bhaskar Barua',
    coContact: '+91 96XXX XXXXX', coEmail: 'co1assam@ncc.gov.in',
    totalCadets: 520, colleges: 15, activeCamps: 3, certificates: 1100, awards: 52, attendance: 89,
    collegeList: [
      { name: 'Cotton University', cadets: 80, ano: 'Capt. Pranab Goswami' },
      { name: 'Gauhati University', cadets: 65, ano: 'Maj. Rina Kalita' }
    ],
    achievements: ['PM Rally 2024 — 5 Cadets', 'Best Drill Squad NER 2023'],
    recentCamps: ['CATC Jul 2025 — Guwahati', 'ATC Aug 2025 — Tezpur']
  },
  {
    id: '2nd-assam', name: '2nd Assam Bn NCC', state: 'Assam', city: 'Silchar',
    wing: 'Army', established: '1968', co: 'Col. Manash Das',
    coContact: '+91 95XXX XXXXX', coEmail: 'co2assam@ncc.gov.in',
    totalCadets: 410, colleges: 11, activeCamps: 1, certificates: 800, awards: 30, attendance: 82,
    collegeList: [
      { name: 'Assam University', cadets: 70, ano: 'Capt. Jyoti Nath' }
    ],
    achievements: ['Adventure Camp Winner 2024', 'Social Service Award NER'],
    recentCamps: ['ATC Jul 2025 — Silchar']
  },
  {
    id: '1st-meghalaya', name: '1st Meghalaya Bn NCC', state: 'Meghalaya', city: 'Shillong',
    wing: 'Army', established: '1972', co: 'Col. David Lyngdoh',
    coContact: '+91 94XXX XXXXX', coEmail: 'co1meghalaya@ncc.gov.in',
    totalCadets: 300, colleges: 8, activeCamps: 2, certificates: 580, awards: 28, attendance: 86,
    collegeList: [
      { name: 'NEHU Shillong', cadets: 50, ano: 'Capt. Robert Khonglam' }
    ],
    achievements: ['Cultural Fest Winner 2024', 'Trekking Excellence Award'],
    recentCamps: ['CATC Aug 2025 — Shillong']
  },
  {
    id: '1st-manipur', name: '1st Manipur Bn NCC', state: 'Manipur', city: 'Imphal',
    wing: 'Army', established: '1965', co: 'Col. Ibomcha Singh',
    coContact: '+91 93XXX XXXXX', coEmail: 'co1manipur@ncc.gov.in',
    totalCadets: 350, colleges: 10, activeCamps: 1, certificates: 650, awards: 35, attendance: 88,
    collegeList: [
      { name: 'Manipur University', cadets: 55, ano: 'Capt. Thangjam Devi' }
    ],
    achievements: ['Best Firing NER 2024', 'Republic Day Camp Selected 2025'],
    recentCamps: ['ATC Sep 2025 — Imphal']
  },
  {
    id: '1st-mizoram', name: '1st Mizoram Bn NCC', state: 'Mizoram', city: 'Aizawl',
    wing: 'Army', established: '1975', co: 'Col. Lalremruata',
    coContact: '+91 92XXX XXXXX', coEmail: 'co1mizoram@ncc.gov.in',
    totalCadets: 280, colleges: 7, activeCamps: 1, certificates: 500, awards: 22, attendance: 90,
    collegeList: [
      { name: 'Mizoram University', cadets: 45, ano: 'Capt. Zothansanga' }
    ],
    achievements: ['Discipline Award NER 2024', 'Best Attendance BN'],
    recentCamps: ['ATC Aug 2025 — Aizawl']
  },
  {
    id: '1st-nagaland', name: '1st Nagaland Bn NCC', state: 'Nagaland', city: 'Kohima',
    wing: 'Army', established: '1970', co: 'Col. Kevisetuo Basa',
    coContact: '+91 91XXX XXXXX', coEmail: 'co1nagaland@ncc.gov.in',
    totalCadets: 310, colleges: 8, activeCamps: 1, certificates: 550, awards: 26, attendance: 85,
    collegeList: [
      { name: 'Nagaland University', cadets: 48, ano: 'Capt. Imtiwapang' }
    ],
    achievements: ['Adventure Activity Best BN 2024'],
    recentCamps: ['ATC Jul 2025 — Kohima']
  },
  {
    id: '1st-arunachal', name: '1st Arunachal Bn NCC', state: 'Arunachal Pradesh', city: 'Itanagar',
    wing: 'Army', established: '1980', co: 'Col. Tamo Riba',
    coContact: '+91 90XXX XXXXX', coEmail: 'co1arunachal@ncc.gov.in',
    totalCadets: 250, colleges: 6, activeCamps: 1, certificates: 400, awards: 18, attendance: 83,
    collegeList: [
      { name: 'Rajiv Gandhi University', cadets: 40, ano: 'Capt. Nabam Tara' }
    ],
    achievements: ['Mountaineering Award 2024'],
    recentCamps: ['ATC Aug 2025 — Itanagar']
  },
  {
    id: '1st-sikkim', name: '1st Sikkim Bn NCC', state: 'Sikkim', city: 'Gangtok',
    wing: 'Army', established: '1978', co: 'Col. Pemba Sherpa',
    coContact: '+91 89XXX XXXXX', coEmail: 'co1sikkim@ncc.gov.in',
    totalCadets: 220, colleges: 5, activeCamps: 1, certificates: 350, awards: 20, attendance: 91,
    collegeList: [
      { name: 'Sikkim University', cadets: 38, ano: 'Capt. Tshering Dorjee' }
    ],
    achievements: ['Best Discipline Award NER 2024', 'Eco-camp Winner'],
    recentCamps: ['ATC Sep 2025 — Gangtok']
  }
];

// ─── Initialize ───
document.addEventListener('DOMContentLoaded', function () {
  renderBnGrid(battalions);
  initSearch();
  initFilters();
  checkURLParam();
});

// ─── Render Battalion Grid ───
function renderBnGrid(data) {
  const grid = document.getElementById('bnGrid');
  if (!grid) return;

  grid.innerHTML = data.map(function (bn) {
    return '<div class="bn-grid-card" onclick="showBnProfile(\'' + bn.id + '\')">' +
      '<div class="card-top">' +
      '<div class="card-icon"><i class="fas fa-shield-alt"></i></div>' +
      '<div><h4>' + bn.name + '</h4><p class="card-meta">' + bn.city + ', ' + bn.state + '</p></div>' +
      '</div>' +
      '<p class="card-meta"><i class="fas fa-user-tie"></i> ' + bn.co + '</p>' +
      '<div class="card-stats">' +
      '<span><strong>' + bn.totalCadets + '</strong> Cadets</span>' +
      '<span><strong>' + bn.colleges + '</strong> Colleges</span>' +
      '<span><strong>' + bn.wing + '</strong></span>' +
      '</div></div>';
  }).join('');
}

// ─── Init Search with Auto-suggest ───
function initSearch() {
  const input = document.getElementById('searchInput');
  const suggestions = document.getElementById('suggestions');
  if (!input) return;

  input.addEventListener('input', function () {
    const query = input.value.trim().toLowerCase();
    if (query.length < 2) {
      suggestions.classList.remove('show');
      return;
    }

    const matches = battalions.filter(function (bn) {
      return bn.name.toLowerCase().includes(query) ||
        bn.state.toLowerCase().includes(query) ||
        bn.city.toLowerCase().includes(query) ||
        bn.id.includes(query);
    });

    if (matches.length > 0) {
      suggestions.innerHTML = matches.map(function (bn) {
        return '<div class="suggestion-item" onclick="showBnProfile(\'' + bn.id + '\')">' +
          '<i class="fas fa-shield-alt"></i><span>' + bn.name + ' — ' + bn.city + '</span></div>';
      }).join('');
      suggestions.classList.add('show');
    } else {
      suggestions.innerHTML = '<div class="suggestion-item"><i class="fas fa-info-circle"></i><span>No battalion found</span></div>';
      suggestions.classList.add('show');
    }
  });

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      searchBattalion();
    }
  });

  document.addEventListener('click', function (e) {
    if (!input.contains(e.target) && !suggestions.contains(e.target)) {
      suggestions.classList.remove('show');
    }
  });
}

// ─── Search Battalion ───
function searchBattalion() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  document.getElementById('suggestions').classList.remove('show');

  if (!query) return;

  const match = battalions.find(function (bn) {
    return bn.name.toLowerCase().includes(query) ||
      bn.state.toLowerCase().includes(query) ||
      bn.id.includes(query);
  });

  if (match) {
    showBnProfile(match.id);
  }
}

// ─── Show BN Profile Card ───
function showBnProfile(bnId) {
  const bn = battalions.find(function (b) { return b.id === bnId; });
  if (!bn) return;

  document.getElementById('suggestions').classList.remove('show');
  document.getElementById('searchInput').value = bn.name;

  const card = document.getElementById('bnProfileCard');
  card.innerHTML =
    '<div class="bn-profile-header">' +
    '<div class="bn-icon"><i class="fas fa-shield-alt"></i></div>' +
    '<div><h2>' + bn.name + '</h2><p>' + bn.city + ', ' + bn.state + ' | Wing: ' + bn.wing + '</p></div>' +
    '</div>' +
    '<div class="bn-profile-section">' +
    '<h4><i class="fas fa-user-tie"></i> Officer Details</h4>' +
    '<div class="bn-info-grid">' +
    '<div class="bn-info-item"><strong>CO Name:</strong><span>' + bn.co + '</span></div>' +
    '<div class="bn-info-item"><strong>Contact:</strong><span>' + bn.coContact + '</span></div>' +
    '<div class="bn-info-item"><strong>Email:</strong><span>' + bn.coEmail + '</span></div>' +
    '<div class="bn-info-item"><strong>Location:</strong><span>' + bn.city + ', ' + bn.state + '</span></div>' +
    '<div class="bn-info-item"><strong>Established:</strong><span>' + bn.established + '</span></div>' +
    '<div class="bn-info-item"><strong>Wing:</strong><span>' + bn.wing + '</span></div>' +
    '</div></div>' +
    '<div class="bn-profile-section">' +
    '<h4><i class="fas fa-chart-bar"></i> Statistics</h4>' +
    '<div class="bn-stats-grid">' +
    '<div class="bn-stat-item"><div class="num">' + bn.totalCadets + '</div><div class="label">Total Cadets</div></div>' +
    '<div class="bn-stat-item"><div class="num">' + bn.colleges + '</div><div class="label">Colleges</div></div>' +
    '<div class="bn-stat-item"><div class="num">' + bn.activeCamps + '</div><div class="label">Active Camps</div></div>' +
    '<div class="bn-stat-item"><div class="num">' + bn.certificates + '</div><div class="label">Certificates</div></div>' +
    '<div class="bn-stat-item"><div class="num">' + bn.awards + '</div><div class="label">Awards</div></div>' +
    '<div class="bn-stat-item"><div class="num">' + bn.attendance + '%</div><div class="label">Attendance</div></div>' +
    '</div></div>' +
    '<div class="bn-profile-section">' +
    '<h4><i class="fas fa-school"></i> Colleges Under This BN</h4>' +
    '<div class="table-container"><table><thead><tr><th>College Name</th><th>Cadets</th><th>ANO</th></tr></thead><tbody>' +
    bn.collegeList.map(function (c) { return '<tr><td>' + c.name + '</td><td>' + c.cadets + '</td><td>' + c.ano + '</td></tr>'; }).join('') +
    '</tbody></table></div></div>' +
    '<div class="bn-profile-section">' +
    '<h4><i class="fas fa-trophy"></i> Recent Achievements</h4>' +
    '<ul style="padding-left:1.5rem;list-style:disc;">' + bn.achievements.map(function (a) { return '<li style="margin-bottom:0.5rem;color:var(--text-light);">' + a + '</li>'; }).join('') + '</ul>' +
    '</div>' +
    '<div class="bn-profile-section">' +
    '<h4><i class="fas fa-campground"></i> Recent Camps</h4>' +
    '<ul style="padding-left:1.5rem;list-style:disc;">' + bn.recentCamps.map(function (c) { return '<li style="margin-bottom:0.5rem;color:var(--text-light);">' + c + '</li>'; }).join('') + '</ul>' +
    '</div>' +
    '<button class="share-btn" onclick="shareBnProfile(\'' + bn.id + '\')"><i class="fas fa-share-alt"></i> Share this BN Profile</button>';

  document.getElementById('searchResult').style.display = 'block';
  document.getElementById('searchResult').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── Filters ───
function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      if (filter === 'all') {
        renderBnGrid(battalions);
      } else {
        renderBnGrid(battalions.filter(function (bn) { return bn.wing === filter; }));
      }
    });
  });
}

// ─── URL Parameter Support ───
function checkURLParam() {
  const params = new URLSearchParams(window.location.search);
  const bnParam = params.get('bn');
  if (bnParam) {
    showBnProfile(bnParam);
  }
}

// ─── Share BN Profile ───
function shareBnProfile(bnId) {
  const url = window.location.origin + window.location.pathname + '?bn=' + bnId;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
    alert('Link copied! Share this URL:\n' + url);
  } else {
    prompt('Copy this link:', url);
  }
}
