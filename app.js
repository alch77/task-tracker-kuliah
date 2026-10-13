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
