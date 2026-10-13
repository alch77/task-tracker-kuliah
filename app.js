// Deklarasi Tugas 1: dibuat dengan bantuan AI, diverifikasi manual.
// Langkah 1 — struktur: referensi elemen + state dasar.
"use strict";

const form = document.getElementById("form-tambah");
const inputJudul = document.getElementById("judul");
const selectMatkul = document.getElementById("matkul");
const inputDeadline = document.getElementById("deadline");
const btnTambah = document.getElementById("btn-tambah");
const errorEl = document.getElementById("error");
const daftar = document.getElementById("daftar-tugas");
const counterEl = document.getElementById("counter");
const kosongEl = document.getElementById("kosong");
const statusEl = document.getElementById("status");
const errorMuatEl = document.getElementById("error-muat");
const pesanMuatEl = document.getElementById("pesan-muat");
const btnCobaLagi = document.getElementById("btn-coba-lagi");
const filterBtns = document.querySelectorAll("[data-filter]");

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
// State diperbarui dari respons server, lalu render().
daftar.addEventListener("change", async (e) => {
  const id = e.target.dataset.id;
  if (e.target.type !== "checkbox" || !id) return;
  const item = tugas.find((t) => t.id === id);
  if (!item) return;
  try {
    const baru = await api(`/tugas/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ selesai: e.target.checked }),
    });
    Object.assign(item, baru);
    render();
  } catch (err) {
    errorEl.textContent = err.message;
    render();
  }
});

daftar.addEventListener("click", async (e) => {
  const btn = e.target.closest(".hapus");
  if (!btn) return;
  try {
    await api(`/tugas/${btn.dataset.id}`, { method: "DELETE" });
    tugas = tugas.filter((t) => t.id !== btn.dataset.id);
    render();
  } catch (err) {
    errorEl.textContent = err.message;
  }
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

muat();
