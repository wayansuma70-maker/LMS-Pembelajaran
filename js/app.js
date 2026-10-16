// EduLMS Pintar — Frontend (vanilla JS) • komunikasi ke GAS via fetch()
const S = { token: localStorage.getItem('tk'), user: JSON.parse(localStorage.getItem('us') || 'null'), page: 'dashboard', charts: [] };
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MENU = [['dashboard', 'Dashboard Utama', '🏠'], ['mapel', 'Mata Pelajaran', '📚'], ['materi', 'Materi & Modul', '🎬'], ['tugas', 'Tugas & Pengumpulan', '📝'], ['nilai', 'Nilai & Evaluasi', '📊'], ['absensi', 'Absensi & Presensi', '✅'], ['pengguna', 'Kelola Pengguna', '👥', 'admin']];
const fmt = d => d ? new Date(d).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-';

// ---------- API ----------
async function api(action, data = {}) {
  // POST text/plain => tanpa CORS preflight (wajib untuk GAS)
  const r = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token: S.token, ...data }) });
  const j = await r.json();
  if (!j.success) { if (/Sesi berakhir/.test(j.message)) logout(); throw new Error(j.message); }
  return j.data;
}
const toast = (m, err) => { const t = $('#toast'); t.textContent = m; t.className = 'toast show' + (err ? ' err' : ''); setTimeout(() => t.classList.remove('show'), 3200); };
const busy = on => $('#busy').classList.toggle('hidden', !on);
const list = sheet => api('list', { sheet });

// ---------- Auth ----------
$('#loginForm').addEventListener('submit', async e => {
  e.preventDefault(); busy(true);
  try {
    const d = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'login', username: $('#lu').value, password: $('#lp').value }) }).then(r => r.json());
    if (!d.success) throw new Error(d.message);
    S.token = d.data.token; S.user = d.data.user;
    localStorage.setItem('tk', S.token); localStorage.setItem('us', JSON.stringify(S.user));
    start();
  } catch (err) { toast(err.message, 1); }
  busy(false);
});
function logout() { localStorage.clear(); S.token = null; location.reload(); }
$('#logout').onclick = logout;
$('#burger').onclick = () => $('#side').classList.toggle('open');

function start() {
  if (!S.token) { $('#login').classList.remove('hidden'); $('#app').classList.add('hidden'); return; }
  $('#login').classList.add('hidden'); $('#app').classList.remove('hidden');
  const u = S.user; $('#uName').textContent = u.nama; $('#uRole').textContent = u.role.toUpperCase(); $('#uAv').textContent = u.nama[0];
  $('#menu').innerHTML = MENU.filter(m => !m[3] || m[3] === u.role).map(m => `<a data-p="${m[0]}">${m[2]} ${m[1]}</a>`).join('');
  go('dashboard');
}
$('#menu').addEventListener('click', e => { const a = e.target.closest('a'); if (a) { go(a.dataset.p); $('#side').classList.remove('open'); } });

async function go(p) {
  S.page = p; $('#search').value = '';
  document.querySelectorAll('#menu a').forEach(a => a.classList.toggle('on', a.dataset.p === p));
  S.charts.forEach(c => c.destroy()); S.charts = [];
  busy(true);
  try { $('#view').innerHTML = await PAGES[p](); if (p === 'dashboard') drawCharts(); }
  catch (err) { $('#view').innerHTML = `<div class="card empty">⚠️ ${esc(err.message)}</div>`; }
  busy(false);
}

// Pencarian sederhana: filter kartu/baris di halaman aktif
$('#search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('#view .card.item, #view tbody tr').forEach(el => el.classList.toggle('hidden', !el.textContent.toLowerCase().includes(q)));
});

// ---------- Komponen ----------
const field = ([n, l, t, o]) => `<label>${l}${t === 'select' ? `<select name="${n}" ${o[0][0]===''?'':'required'}>${o.map(x => `<option value="${esc(x[0])}">${esc(x[1])}</option>`).join('')}</select>` : t === 'textarea' ? `<textarea name="${n}"></textarea>` : `<input name="${n}" type="${t || 'text'}" required>`}</label>`;
const FORM = (act, fs, btn) => `<form class="card form" data-act="${act}">${fs.map(field).join('')}<button class="btn">${btn}</button></form>`;
const stat = (ic, l, v, sub, c) => `<div class="card stat"><div class="ic" style="background:${c}22">${ic}</div><small>${l}</small><b>${v}</b> <small style="display:inline">${sub}</small></div>`;
const bd = s => `<span class="badge ${s === 'Tepat Waktu' || s === 'H' ? 'b-ok' : s === 'I' ? 'b-izin' : s === 'S' ? 'b-sakit' : 'b-late'}">${{ H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alpa' }[s] || esc(s)}</span>`;
const canEdit = () => S.user.role !== 'siswa';
const opt = (a, v, l) => a.map(x => [x[v], x[l]]);

// ---------- Halaman ----------
const PAGES = {
  async dashboard() {
    const d = S.data = await api('dashboard'), u = S.user, h = new Date().getHours();
    return `<section class="hero"><span class="pill">${u.role.toUpperCase()}</span>
      <h1>Selamat ${h < 11 ? 'Pagi' : h < 15 ? 'Siang' : h < 18 ? 'Sore' : 'Malam'}, ${esc(u.nama.split(' ')[0])}! 🌟</h1>
      <p>Konsistensi kecil setiap hari akan membuahkan prestasi besar.</p>
      <div class="hero-stats"><div><small>Tugas Aktif</small><b>${d.aktif}</b></div><div><small>Rerata Nilai</small><b>${d.rata}</b></div><div><small>Kehadiran</small><b>${d.hadir}%</b></div></div></section>
    <div class="cards4">${stat('⭐', 'Rata-rata Nilai', d.rata, '/100', '#4F46E5')}${stat('🙋', 'Tingkat Kehadiran', d.hadir + '%', '', '#10B981')}${stat('✅', 'Tugas Selesai', d.nSelesai, '/ ' + d.nTugas, '#6366F1')}${stat('📚', 'Mata Pelajaran', d.mapel.length, 'mapel', '#EC4899')}</div>
    <div class="grid2"><div class="card"><b>Tren Nilai per Mapel</b><canvas id="c1" height="140"></canvas></div>
      <div><div class="card"><b>Rasio Kehadiran</b><canvas id="c2" height="150"></canvas></div><div class="card" style="margin-top:16px"><b>Status Tugas</b><canvas id="c3" height="150"></canvas></div></div></div>
    <h2>⏰ Tugas Mendatang</h2><div class="grid">${d.deadline.map(t => `<div class="card item"><span class="tag" style="--c:#4F46E5">${esc(t.mapel)}</span><h3 style="margin:8px 0">${esc(t.judul)}</h3><small>Batas: ${fmt(t.batas)}</small></div>`).join('') || '<div class="card empty">Tidak ada tugas mendatang 🎉</div>'}</div>
    <h2>📚 Mata Pelajaran Aktif</h2>${mapelGrid(d.mapel)}`;
  },

  async mapel() {
    const [m, k, us] = await Promise.all([api('dashboard'), S.user.role === 'admin' ? list('Kelas') : [], S.user.role === 'admin' ? list('Users') : []]);
    const f = S.user.role === 'admin' ? FORM('Mapel', [['nama', 'Nama mapel'], ['kelas', 'Kelas', 'select', opt(k, 'id', 'nama')], ['guru_id', 'Guru pengampu', 'select', opt(us.filter(x => x.role === 'guru'), 'id', 'nama')]], '+ Tambah Mapel') : '';
    return `<h1>Mata Pelajaran</h1><br>${f}${mapelGrid(m.mapel)}`;
  },

  async materi() {
    const [mt, mp] = await Promise.all([list('Materi'), list('Mapel')]);
    const nm = id => (mp.find(m => m.id == id) || {}).nama, wr = id => (mp.find(m => m.id == id) || {}).warna || '#4F46E5';
    const f = canEdit() ? FORM('Materi', [['mapel_id', 'Mapel', 'select', opt(mp, 'id', 'nama')], ['judul', 'Judul materi'], ['tipe', 'Jenis', 'select', [['pdf', 'Modul PDF'], ['video', 'Video']]], ['url', 'Tautan (Google Drive / YouTube)', 'url']], '+ Tambah Materi') : '';
    return `<h1>Katalog Materi & Modul</h1><br>${f}<div class="grid">${mt.map(x => `<div class="card item subj" style="--c:${wr(x.mapel_id)}"><span class="tag" style="--c:${wr(x.mapel_id)}">${esc(nm(x.mapel_id))}</span> <small style="display:inline">${x.tipe === 'video' ? '🎬 Video' : '📄 PDF'}</small><h3 style="margin:10px 0">${esc(x.judul)}</h3><small>${fmt(x.tanggal)}</small><br><a class="btn sm" target="_blank" rel="noopener" href="${esc(x.url)}">${x.tipe === 'video' ? '▶ Tonton' : 'Baca Modul'}</a></div>`).join('') || '<div class="card empty">Belum ada materi.</div>'}</div>`;
  },

  async tugas() {
    const [tg, mp, pg] = await Promise.all([list('Tugas'), list('Mapel'), list('Pengumpulan')]);
    const nm = id => (mp.find(m => m.id == id) || {}).nama;
    const f = canEdit() ? FORM('Tugas', [['mapel_id', 'Mapel', 'select', opt(mp, 'id', 'nama')], ['judul', 'Judul tugas'], ['instruksi', 'Instruksi', 'textarea'], ['batas', 'Batas waktu', 'datetime-local']], '+ Buat Tugas') : '';
    return `<h1>Pusat Tugas & Pengumpulan</h1><br>${f}<div class="grid">${tg.map(t => {
      const mine = pg.find(x => x.tugas_id == t.id), n = pg.filter(x => x.tugas_id == t.id).length;
      return `<div class="card item"><span class="tag" style="--c:#4F46E5">${esc(nm(t.mapel_id))}</span><h3 style="margin:8px 0">${esc(t.judul)}</h3><p>${esc(t.instruksi)}</p><small>Batas: ${fmt(t.batas)}</small><br>
        ${canEdit() ? `<small>📥 ${n} pengumpulan</small>` : `${mine ? `${bd(mine.status)} <small>${fmt(mine.waktu)}</small><br>` : ''}
        <form class="up" data-id="${t.id}"><input type="file" name="f" required style="padding-top:8px"><input name="catatan" placeholder="Catatan untuk guru (opsional)"><button class="btn" style="width:100%;margin-top:8px">${mine ? 'Kumpulkan Ulang' : 'Kirim Tugas'}</button></form>`}</div>`;
    }).join('') || '<div class="card empty">Belum ada tugas.</div>'}</div>`;
  },

  async nilai() {
    const [pg, tg, us] = await Promise.all([list('Pengumpulan'), list('Tugas'), canEdit() ? list('Users') : []]);
    const jd = id => (tg.find(t => t.id == id) || {}).judul, sn = id => (us.find(x => x.id == id) || S.user).nama;
    return `<div class="row"><h1>Nilai & Evaluasi</h1><button class="btn soft" id="rekap">📄 Unduh Rekap PDF</button></div><br>
    <div class="scroll"><table><thead><tr><th>Siswa</th><th>Tugas</th><th>Waktu</th><th>Status</th><th>Berkas</th><th>Nilai</th><th>Komentar</th>${canEdit() ? '<th></th>' : ''}</tr></thead><tbody>
    ${pg.map(g => `<tr data-id="${g.id}"><td>${esc(sn(g.siswa_id))}</td><td>${esc(jd(g.tugas_id))}</td><td>${fmt(g.waktu)}</td><td>${bd(g.status)}</td><td><a target="_blank" rel="noopener" href="${esc(g.file_url)}">Lihat</a></td>
    ${canEdit() ? `<td><input class="n" type="number" min="0" max="100" value="${esc(g.nilai)}"></td><td><input class="k" value="${esc(g.komentar)}"></td><td><button class="btn sm" data-save>Simpan</button></td>` : `<td><b>${esc(g.nilai) || '-'}</b></td><td>${esc(g.komentar)}</td>`}</tr>`).join('') || '<tr><td colspan="8" class="empty">Belum ada data.</td></tr>'}</tbody></table></div>`;
  },

  async absensi() {
    const [mp, us, ab] = await Promise.all([list('Mapel'), canEdit() ? list('Users') : [], list('Absensi')]);
    if (!canEdit()) { const nm = id => (mp.find(m => m.id == id) || {}).nama; return `<h1>Absensi Saya</h1><br><div class="scroll"><table><thead><tr><th>Tanggal</th><th>Mapel</th><th>Status</th></tr></thead><tbody>${ab.map(a => `<tr><td>${esc(String(a.tanggal).slice(0, 10))}</td><td>${esc(nm(a.mapel_id))}</td><td>${bd(a.status)}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">Belum ada data.</td></tr>'}</tbody></table></div>`; }
    S.siswa = us; const today = new Date().toISOString().slice(0, 10);
    return `<h1>Absensi & Presensi</h1><br><form class="card form" id="absen"><label>Mapel<select name="mapel_id">${mp.map(m => `<option value="${m.id}">${esc(m.nama)}</option>`).join('')}</select></label><label>Tanggal<input type="date" name="tanggal" value="${today}" required></label></form>
    <div class="scroll"><table><tbody>${us.map(s => `<tr data-s="${s.id}"><td>${esc(s.nama)}</td><td><select>${['H', 'I', 'S', 'A'].map(x => `<option value="${x}">${{ H: 'Hadir', I: 'Izin', S: 'Sakit', A: 'Alpa' }[x]}</option>`).join('')}</select></td></tr>`).join('')}</tbody></table></div><br><button class="btn" id="saveAbsen">Simpan Presensi</button>`;
  },

  async pengguna() {
    const [us, k] = await Promise.all([list('Users'), list('Kelas')]);
    return `<h1>Kelola Pengguna</h1><br>${FORM('Users', [['nama', 'Nama lengkap'], ['username', 'Username'], ['email', 'Email', 'email'], ['password', 'Kata sandi', 'password'], ['role', 'Peran', 'select', [['siswa', 'Siswa'], ['guru', 'Guru'], ['admin', 'Admin']]], ['kelas', 'Kelas (siswa)', 'select', [['', '—'], ...opt(k, 'id', 'nama')]]], '+ Tambah Akun')}
    <div class="scroll"><table><thead><tr><th>Nama</th><th>Username</th><th>Email</th><th>Peran</th><th>Kelas</th></tr></thead><tbody>${us.map(x => `<tr><td>${esc(x.nama)}</td><td>${esc(x.username)}</td><td>${esc(x.email)}</td><td>${esc(x.role)}</td><td>${esc(x.kelas)}</td></tr>`).join('')}</tbody></table></div>`;
  }
};
const mapelGrid = m => `<div class="grid">${m.map(x => `<div class="card item subj" style="--c:${x.warna}"><span class="tag" style="--c:${x.warna}">Mapel</span><h3 style="margin:10px 0">${esc(x.nama)}</h3><small>👤 ${esc(x.guru)}</small><small>📄 ${x.materi} materi</small></div>`).join('') || '<div class="card empty">Belum ada mapel.</div>'}</div>`;

// ---------- Grafik ----------
function drawCharts() {
  const d = S.data, mk = (id, cfg) => S.charts.push(new Chart($(id), cfg));
  mk('#c1', { type: 'line', data: { labels: d.perMapel.map(x => x.nama), datasets: [{ data: d.perMapel.map(x => x.rata), borderColor: '#4F46E5', backgroundColor: 'rgba(79,70,229,.12)', fill: true, tension: .35 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { min: 0, max: 100 } } } });
  mk('#c2', { type: 'doughnut', data: { labels: ['Hadir', 'Izin', 'Sakit', 'Alpa'], datasets: [{ data: [d.absen.H, d.absen.I, d.absen.S, d.absen.A], backgroundColor: ['#10B981', '#F59E0B', '#3B82F6', '#E11D48'] }] }, options: { cutout: '68%' } });
  mk('#c3', { type: 'doughnut', data: { labels: ['Tepat Waktu', 'Terlambat', 'Belum'], datasets: [{ data: [d.status.tepat, d.status.terlambat, d.status.belum], backgroundColor: ['#4F46E5', '#10B981', '#E11D48'] }] }, options: { cutout: '68%' } });
}

// ---------- Aksi (delegasi event) ----------
document.addEventListener('submit', async e => {
  const f = e.target;
  if (f.dataset.act) { // buat data baru
    e.preventDefault(); busy(true);
    try { await api('create', { sheet: f.dataset.act, row: Object.fromEntries(new FormData(f)) }); toast('Berhasil disimpan ✔'); await go(S.page); }
    catch (err) { toast(err.message, 1); busy(false); }
  }
  if (f.classList.contains('up')) { // kumpul tugas
    e.preventDefault(); const file = f.f.files[0];
    if (file.size > 7 * 1024 * 1024) return toast('File maksimal 7 MB', 1);
    busy(true);
    try {
      const b64 = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result.split(',')[1]); r.onerror = no; r.readAsDataURL(file); });
      const r = await api('submit', { tugas_id: f.dataset.id, nama: file.name, mime: file.type, b64, catatan: f.catatan.value });
      toast('Tugas terkirim (' + r.status + ') ✔'); await go('tugas');
    } catch (err) { toast(err.message, 1); busy(false); }
  }
});
document.addEventListener('click', async e => {
  const t = e.target;
  try {
    if (t.matches('[data-save]')) { const tr = t.closest('tr'); busy(true); await api('grade', { id: tr.dataset.id, nilai: tr.querySelector('.n').value, komentar: tr.querySelector('.k').value }); toast('Nilai tersimpan ✔'); busy(false); }
    if (t.id === 'saveAbsen') { const f = $('#absen'); busy(true); await api('absen', { mapel_id: f.mapel_id.value, tanggal: f.tanggal.value, items: [...document.querySelectorAll('tr[data-s]')].map(r => ({ siswa_id: r.dataset.s, status: r.querySelector('select').value })) }); toast('Presensi tersimpan ✔'); busy(false); }
    if (t.id === 'rekap') { busy(true); const r = await api('rekap'); const a = document.createElement('a'); a.href = 'data:application/pdf;base64,' + r.b64; a.download = r.nama; a.click(); busy(false); }
  } catch (err) { busy(false); toast(err.message, 1); }
});

start();
