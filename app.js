// Deklarasi Tugas 1: dibuat dengan bantuan AI, diverifikasi manual.
// Langkah 1 — struktur: referensi elemen + state dasar.
"use strict";

const form = document.getElementById("form-tambah");
const inputJudul = document.getElementById("judul");
const inputMatkul = document.getElementById("matkul");
const inputDeadline = document.getElementById("deadline");
const errorEl = document.getElementById("error");
const daftar = document.getElementById("daftar-tugas");
const counterEl = document.getElementById("counter");
const kosongEl = document.getElementById("kosong");
const filterBtns = document.querySelectorAll("[data-filter]");

let tugas = []; // {id, judul, matkul, deadline, selesai}
let filter = "semua";

// Langkah 2 — render: satu-satunya fungsi pembangun tampilan (textContent, aman dari XSS).
function render() {
  daftar.replaceChildren();
  for (const t of tugas) {
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

  const aktif = tugas.filter((t) => !t.selesai).length;
  counterEl.textContent = `${aktif} tugas aktif`;
  kosongEl.hidden = tugas.length !== 0;
}

render();

// Langkah 3 — form: submit + preventDefault, validasi, pesan error di halaman.
form.addEventListener("submit", (e) => {
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

  tugas.push({
    id: String(Date.now()),
    judul,
    matkul: inputMatkul.value.trim(),
    deadline,
    selesai: false,
  });
  form.reset();
  inputJudul.focus();
  render();
});

// Langkah 4 — delegation: checkbox + hapus ditangani di <ul> (berlaku untuk item baru).
daftar.addEventListener("change", (e) => {
  const id = e.target.dataset.id;
  if (e.target.type !== "checkbox" || !id) return;
  const item = tugas.find((t) => t.id === id);
  if (item) {
    item.selesai = e.target.checked;
    render();
  }
});

daftar.addEventListener("click", (e) => {
  const btn = e.target.closest(".hapus");
  if (!btn) return;
  tugas = tugas.filter((t) => t.id !== btn.dataset.id);
  render();
});
