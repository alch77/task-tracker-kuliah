// Deklarasi Tugas 1: dibuat dengan bantuan AI, diverifikasi manual.
// Deklarasi Tugas 1 v2: dibuat dengan bantuan AI, diverifikasi manual (lihat AI_LOG.md).
"use strict";

const form = document.getElementById("form-tambah");
const inputJudul = document.getElementById("judul");
const selectMatkul = document.getElementById("matkul");
const inputDeadline = document.getElementById("deadline");
const btnTambah = document.getElementById("btn-tambah");
const inputCari = document.getElementById("cari");
const errorEl = document.getElementById("error");
const daftar = document.getElementById("daftar-tugas");
const counterEl = document.getElementById("counter");
const kosongEl = document.getElementById("kosong");
const statusEl = document.getElementById("status");
const errorMuatEl = document.getElementById("error-muat");
const pesanMuatEl = document.getElementById("pesan-muat");
const btnCobaLagi = document.getElementById("btn-coba-lagi");
const filterBtns = document.querySelectorAll("[data-filter]");
const modeBtns = document.querySelectorAll("[data-mode]");

// Langkah v2-1 — api(): helper fetch JSON yang melempar Error berisi pesan server.
async function api(path, options = {}) {
  let res;
  try {
    res = await fetch("/api" + path, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch {
    throw new Error("Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.");
  }
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `Server merespons ${res.status}.`);
  return data;
}

let tugas = []; // {id, judul, matkul, deadline, selesai}, sumber: server
let filter = "semua";
let cari = "";
let status = "loading"; // loading | siap | error
let pesanMuat = "";

// Langkah v2-2 — render mengenal status: skeleton saat loading,
// kotak error + coba lagi saat gagal, daftar + kosong saat siap.
function render() {
  statusEl.hidden = status !== "loading";
  errorMuatEl.hidden = status !== "error";
  if (status === "error") pesanMuatEl.textContent = pesanMuat;

  daftar.replaceChildren();
  let tampil = [];
  if (status === "loading") {
    for (let i = 0; i < 3; i++) {
      const li = document.createElement("li");
      li.className = "skeleton";
      li.textContent = "Memuat…";
      daftar.append(li);
    }
  } else if (status === "siap") {
    tampil = tugas
      .filter((t) => filter === "semua" || (filter === "aktif" ? !t.selesai : t.selesai))
      .filter(
        (t) =>
          !cari ||
          t.judul.toLowerCase().includes(cari) ||
          (t.matkul || "").toLowerCase().includes(cari)
      )
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    for (const t of tampil) {
    const li = document.createElement("li");

    const cek = document.createElement("input");
    cek.type = "checkbox";
    cek.checked = t.selesai;
    cek.dataset.id = t.id;

    const info = document.createElement("div");
    info.className = "info";
    const judul = document.createElement("div");
    judul.className = t.selesai ? "judul done" : "judul";
    judul.textContent = t.judul;
    const meta = document.createElement("small");
    meta.textContent = (t.matkul ? t.matkul + " · " : "") + t.deadline;
    info.append(judul, meta);

    const hapus = document.createElement("button");
    hapus.type = "button";
    hapus.className = "hapus";
    hapus.dataset.id = t.id;
    hapus.textContent = "Hapus";

    li.append(cek, info, hapus);
    daftar.append(li);
    }
  }

  const aktif = tugas.filter((t) => !t.selesai).length;
  counterEl.textContent = `${aktif} tugas aktif`;
  kosongEl.hidden = status !== "siap" || tampil.length !== 0;
  filterBtns.forEach((b) => b.classList.toggle("on", b.dataset.filter === filter));
}

// Langkah v2-2 — isi <select> matkul dari server, pilihan user dipertahankan.
function isiMatkul(daftarMatkul) {
  const pilih = selectMatkul.value;
  selectMatkul.replaceChildren();
  const kosong = document.createElement("option");
  kosong.value = "";
  kosong.textContent = "— Pilih mata kuliah —";
  selectMatkul.append(kosong);
  for (const nama of daftarMatkul) {
    const opt = document.createElement("option");
    opt.value = nama;
    opt.textContent = nama;
    selectMatkul.append(opt);
  }
  selectMatkul.value = pilih;
}

// Langkah v2-3 — form → POST /api/tugas (header & body JSON).
// Tombol nonaktif selama mengirim; error server (400) tampil di halaman.
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const judul = inputJudul.value.trim();
  const deadline = inputDeadline.value;

  if (judul.length < 3) {
    errorEl.textContent = "Judul minimal 3 karakter.";
    return;
  }
  if (!deadline) {
    errorEl.textContent = "Deadline wajib diisi.";
    return;
  }
  errorEl.textContent = "";

  btnTambah.disabled = true;
  try {
    const dibuat = await api("/tugas", {
      method: "POST",
      body: JSON.stringify({ judul, matkul: selectMatkul.value, deadline }),
    });
    tugas.push(dibuat);
    form.reset();
    inputJudul.focus();
    render();
  } catch (err) {
    errorEl.textContent = err.message;
  } finally {
    btnTambah.disabled = false;
  }
});

// Langkah v2-4 — delegation: PATCH selesai & DELETE (204) lewat <ul>.
// Bonus optimistic update: tampilan berubah dulu, dibatalkan bila server gagal.
daftar.addEventListener("change", async (e) => {
  const id = e.target.dataset.id;
  if (e.target.type !== "checkbox" || !id) return;
  const item = tugas.find((t) => t.id === id);
  if (!item) return;
  const semula = item.selesai;
  item.selesai = e.target.checked;
  render();
  try {
    const baru = await api(`/tugas/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ selesai: item.selesai }),
    });
    Object.assign(item, baru);
  } catch (err) {
    item.selesai = semula;
    errorEl.textContent = err.message;
  }
  render();
});

daftar.addEventListener("click", async (e) => {
  const btn = e.target.closest(".hapus");
  if (!btn) return;
  const id = btn.dataset.id;
  const idx = tugas.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const [lepas] = tugas.splice(idx, 1);
  render();
  try {
    await api(`/tugas/${id}`, { method: "DELETE" });
  } catch (err) {
    tugas.splice(Math.min(idx, tugas.length), 0, lepas);
    errorEl.textContent = err.message;
  }
  render();
});

// Bonus — pencarian dengan debounce 300ms.
let timerCari;
inputCari.addEventListener("input", () => {
  clearTimeout(timerCari);
  timerCari = setTimeout(() => {
    cari = inputCari.value.trim().toLowerCase();
    render();
  }, 300);
});

// Langkah 5 — filter Semua/Aktif/Selesai, tombol aktif berkelaas on.
filterBtns.forEach((b) =>
  b.addEventListener("click", () => {
    filter = b.dataset.filter;
    render();
  })
);

// Langkah v2-2 — muat paralel: tugas & daftar matkul sekaligus via Promise.all.
async function muat() {
  status = "loading";
  pesanMuat = "";
  render();
  try {
    const [dataTugas, dataMatkul] = await Promise.all([api("/tugas"), api("/matkul")]);
    tugas = dataTugas;
    isiMatkul(dataMatkul);
    status = "siap";
  } catch (err) {
    status = "error";
    pesanMuat = err.message;
  }
  render();
}

btnCobaLagi.addEventListener("click", muat);

// Langkah v2-5 — ganti mode jaringan (__API.setMode) lalu muat ulang.
// Semua alur async sudah try/catch: tidak ada unhandled rejection di Console.
modeBtns.forEach((b) =>
  b.addEventListener("click", () => {
    if (window.__API) window.__API.setMode(b.dataset.mode);
    modeBtns.forEach((x) => x.classList.toggle("on", x === b));
    muat();
  })
);

muat();
