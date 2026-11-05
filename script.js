// GANTI DENGAN URL DEPLOYMENT APPS SCRIPT ANDA
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwcUl6Q8OWBy8o1QRzPPzaP97JZulgwNI4h6HznzrIprS4JHuwqzU_4RhTverz904MO/exec";

let masterGuru = [];
let masterKategori = [];
let currentSiswa = null;
let dashboardRawData = { hasilVote: [], siswa: [], kategori: [] };

window.onload = async function() {
  try {
    const res = await fetch(`${WEB_APP_URL}?action=getMasterData`);
    const data = await res.json();
    if (data.success) {
      masterGuru = data.guru;
      masterKategori = data.kategori;
      buildFormVotingDinamis();
    }
  } catch (e) {
    console.error("Gagal memuat master data:", e);
  }
};

function buildFormVotingDinamis() {
  const container = document.getElementById('container-kategori-voting');
  container.innerHTML = "";

  masterKategori.forEach((kat, index) => {
    let optionsHtml = `<option value="">-- Pilih Nama Guru --</option>`;
    masterGuru.forEach(g => {
      optionsHtml += `<option value="${g.nama}">${g.nama}</option>`;
    });

    const cardHtml = `
      <div class="category-card p-4 rounded-xl space-y-3">
        <div class="flex justify-between items-center">
          <div>
            <label class="block text-sm font-bold text-amber-300">
              <i class="fa-solid fa-award text-xs mr-1 text-amber-400"></i> ${index + 1}. ${kat.nama.toUpperCase()}
            </label>
            <p class="text-xs text-slate-300">${kat.deskripsi}</p>
          </div>
          <img id="preview-kat-${index}" src="" class="w-12 h-12 rounded-full object-cover border-2 border-amber-400/50 hidden shadow-md">
        </div>
        <select id="select-kat-${index}" data-kategori="${kat.nama}" onchange="updateFotoDinamis(${index})" required class="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-amber-400 focus:outline-none">
          ${optionsHtml}
        </select>
      </div>
    `;
    container.innerHTML += cardHtml;
  });
}

function updateFotoDinamis(index) {
  const select = document.getElementById(`select-kat-${index}`);
  const preview = document.getElementById(`preview-kat-${index}`);
  const namaGuru = select.value;
  const guruObj = masterGuru.find(g => g.nama === namaGuru);
  
  if (guruObj && guruObj.foto) {
    preview.src = guruObj.foto;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
}

async function verifikasiNISN() {
  const nisn = document.getElementById('input-nisn').value.trim();
  const btn = document.getElementById('btn-cek-nisn');
  if (!nisn) return alert("Masukkan NISN kamu terlebih dahulu!");

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>`;

  try {
    const res = await fetch(`${WEB_APP_URL}?action=verifySiswa&nisn=${encodeURIComponent(nisn)}`);
    const data = await res.json();
    if (data.success) {
      currentSiswa = data.siswa;
      document.getElementById('input-nama').textContent = data.siswa.nama;
      document.getElementById('input-kelas').textContent = data.siswa.kelas;
      document.getElementById('identitas-terdeteksi').classList.remove('hidden');
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Gagal terhubung ke server.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `Cek Data`;
  }
}

function lanjutKeVoting() {
  document.getElementById('step-1').classList.add('hidden');
  document.getElementById('step-2').classList.remove('hidden');
  document.getElementById('step-dot-2').className = "flex items-center space-x-2 text-amber-300 font-bold text-xs";
  document.getElementById('step-dot-2').querySelector('span').className = "w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md";
}

async function kirimVoting() {
  let votesPayload = [];
  let isValid = true;

  masterKategori.forEach((kat, index) => {
    const val = document.getElementById(`select-kat-${index}`).value;
    if (!val) isValid = false;
    votesPayload.push({ kategori: kat.nama, pilihan: val });
  });

  if (!isValid) return alert("Harap lengkapi pilihan untuk semua kategori penghargaan!");

  const btn = document.getElementById('btn-submit-vote');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin mr-2"></i> Mengirim...`;

  const payload = {
    action: "submitVote",
    nisn: currentSiswa.nisn,
    nama: currentSiswa.nama,
    kelas: currentSiswa.kelas,
    votes: votesPayload
  };

  try {
    const res = await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('step-2').classList.add('hidden');
      document.getElementById('step-3').classList.remove('hidden');
      document.getElementById('success-nama-siswa').textContent = currentSiswa.nama;
      document.getElementById('step-dot-3').className = "flex items-center space-x-2 text-emerald-400 font-bold text-xs";
      document.getElementById('step-dot-3').querySelector('span').className = "w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md";
    } else {
      alert(data.message);
      btn.disabled = false;
      btn.innerHTML = `Kirim Pilihan Suara`;
    }
  } catch (err) {
    alert("Gagal mengirim voting.");
    btn.disabled = false;
    btn.innerHTML = `Kirim Pilihan Suara`;
  }
}

function openAdminModal() { document.getElementById('admin-modal').classList.remove('hidden'); }
function closeAdminModal() { document.getElementById('admin-modal').classList.add('hidden'); }

function togglePassword() {
  const passInput = document.getElementById('admin-pass');
  const icon = document.getElementById('toggle-icon');
  if (passInput.type === "password") {
    passInput.type = "text";
    icon.className = "fa-solid fa-eye-slash";
  } else {
    passInput.type = "password";
    icon.className = "fa-solid fa-eye";
  }
}

async function loginAdmin() {
  const user = document.getElementById('admin-user').value.trim();
  const pass = document.getElementById('admin-pass').value.trim();
  const btn = document.getElementById('btn-login-admin');

  if (!user || !pass) return alert("Masukkan Username dan Password Admin!");

  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Memeriksa...`;

  try {
    const res = await fetch(`${WEB_APP_URL}?action=loginAdmin&username=${encodeURIComponent(user)}&password=${encodeURIComponent(pass)}`);
    const data = await res.json();

    if (data.success) {
      closeAdminModal();
      document.getElementById('main-voting-view').classList.add('hidden');
      document.getElementById('main-admin-dashboard').classList.remove('hidden');
      document.getElementById('nav-right-btn').innerHTML = `
        <span class="text-xs text-amber-300 font-bold px-3 py-1.5 bg-slate-900 border border-amber-400/40 rounded-xl">
          <i class="fa-solid fa-user-shield mr-1"></i> ${data.user.username}
        </span>
      `;
      loadDashboardDataPro();
    } else {
      alert(data.message);
    }
  } catch (err) {
    alert("Gagal verifikasi login admin.");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `Masuk Dashboard`;
  }
}

function keluarAdmin() { window.location.reload(); }

async function loadDashboardDataPro() {
  try {
    const res = await fetch(`${WEB_APP_URL}?action=getDashboardData`);
    const result = await res.json();

    if (result.success) {
      dashboardRawData.hasilVote = result.hasilVote;
      dashboardRawData.siswa = result.siswa;
      dashboardRawData.kategori = result.kategori;

      const totalSiswa = dashboardRawData.siswa.length > 1 ? dashboardRawData.siswa.length - 1 : 0;
      const totalVote = dashboardRawData.hasilVote.length > 1 ? dashboardRawData.hasilVote.length - 1 : 0;
      const persen = totalSiswa > 0 ? Math.round((totalVote / totalSiswa) * 100) : 0;

      document.getElementById('dash-total-siswa').textContent = totalSiswa;
      document.getElementById('dash-sudah-vote').textContent = totalVote;
      document.getElementById('dash-persen-vote').textContent = `${persen}%`;

      // Kalkulasi Pemenang Sementara per Kategori
      renderLiveWinners();

      let kelasSet = new Set();
      for (let i = 1; i < dashboardRawData.siswa.length; i++) {
        if (dashboardRawData.siswa[i][2]) kelasSet.add(dashboardRawData.siswa[i][2]);
      }
      
      const selectKelas = document.getElementById('filter-kelas');
      selectKelas.innerHTML = `<option value="ALL">Semua Kelas (${kelasSet.size} Kelas)</option>`;
      kelasSet.forEach(k => { selectKelas.innerHTML += `<option value="${k}">${k}</option>`; });

      renderTabelAdmin();
    }
  } catch (e) {
    console.error("Gagal memuat analitik dashboard:", e);
  }
}

// Fitur Hitung Pemenang & Persentase per Kategori
function renderLiveWinners() {
  const container = document.getElementById('admin-live-winners');
  container.innerHTML = "";

  const hasilRows = dashboardRawData.hasilVote;
  const totalVote = hasilRows.length > 1 ? hasilRows.length - 1 : 0;

  if (totalVote === 0) {
    container.innerHTML = "<p class='text-slate-400 text-xs col-span-full'>Belum ada data suara masuk untuk menghitung pemenang.</p>";
    return;
  }

  // Kolom hasil vote mulai dari index 4 (E = index 4, F = index 5, dst)
  masterKategori.forEach((kat, katIndex) => {
    let colIndex = 4 + katIndex;
    let counts = {};

    for (let i = 1; i < hasilRows.length; i++) {
      let guruPilihan = hasilRows[i][colIndex];
      if (guruPilihan) {
        counts[guruPilihan] = (counts[guruPilihan] || 0) + 1;
      }
    }

    // Cari guru dengan suara terbanyak
    let topGuru = "-";
    let maxSuara = 0;
    for (let guru in counts) {
      if (counts[guru] > maxSuara) {
        maxSuara = counts[guru];
        topGuru = guru;
      }
    }

    let p = totalVote > 0 ? Math.round((maxSuara / totalVote) * 100) : 0;
    let guruObj = masterGuru.find(g => g.nama === topGuru);
    let fotoUrl = guruObj ? guruObj.foto : "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150";

    container.innerHTML += `
      <div class="bg-slate-950/80 p-3.5 rounded-xl border border-slate-700/60 flex items-center space-x-3 shadow-inner">
        <img src="${fotoUrl}" class="w-12 h-12 rounded-full object-cover border border-amber-400/40 shadow">
        <div class="overflow-hidden">
          <span class="text-[10px] font-bold text-amber-400 uppercase tracking-wide block truncate">${kat.nama}</span>
          <h4 class="font-bold text-white text-xs truncate">${topGuru}</h4>
          <span class="text-[11px] text-emerald-400 font-semibold">${maxSuara} suara (${p}%)</span>
        </div>
      </div>
    `;
  });
}

function renderTabelAdmin() {
  const keyword = document.getElementById('filter-search').value.toLowerCase();
  const kelasFilter = document.getElementById('filter-kelas').value;
  const tbody = document.getElementById('tabel-log-voting');
  
  const siswaRows = dashboardRawData.siswa;
  let html = "";
  let countDitampilkan = 0;

  let voteMap = {};
  for (let i = 1; i < dashboardRawData.hasilVote.length; i++) {
    let r = dashboardRawData.hasilVote[i];
    voteMap[String(r[1]).trim()] = r[0];
  }

  for (let i = 1; i < siswaRows.length; i++) {
    const nisn = String(siswaRows[i][0]).trim();
    const nama = String(siswaRows[i][1]);
    const kelas = String(siswaRows[i][2]);
    const status = String(siswaRows[i][3]);

    let matchKeyword = nama.toLowerCase().includes(keyword) || nisn.includes(keyword);
    let matchKelas = (kelasFilter === "ALL" || kelas === kelasFilter);

    if (matchKeyword && matchKelas) {
      countDitampilkan++;
      let waktuVote = voteMap[nisn] ? new Date(voteMap[nisn]).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : "-";
      let badgeStatus = status === "Sudah" 
        ? `<span class='px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full font-bold border border-emerald-500/30'>Sudah Vote</span>`
        : `<span class='px-2.5 py-1 bg-slate-800 text-slate-400 rounded-full'>Belum</span>`;

      html += `
        <tr class="hover:bg-slate-900/60 transition">
          <td class="p-3.5 text-slate-300 font-mono">${waktuVote}</td>
          <td class="p-3.5 font-mono text-amber-300">${nisn}</td>
          <td class="p-3.5 font-bold text-white">${nama}</td>
          <td class="p-3.5 text-slate-200">${kelas}</td>
          <td class="p-3.5">${badgeStatus}</td>
        </tr>
      `;
    }
  }

  tbody.innerHTML = html || `<tr><td colspan="5" class="p-6 text-center text-slate-400">Tidak ada data siswa yang ditemukan.</td></tr>`;
  document.getElementById('badge-total-ditampilkan').textContent = `Menampilkan ${countDitampilkan} data`;
}