# Log Prompt AI — Task Tracker v2 (Tugas 1)

Deklarasi: kode ditulis dengan bantuan AI lalu diverifikasi manual
(syntax `node --check`, uji logika Mock API, review alur async).
Wajib paham tanpa AI saat asistensi: `api()`, `muat()`, `render()`,
POST/PATCH/DELETE, debounce, optimistic update.

1. "Rancang mock-api.js: sadap fetch /api/*, __API.setMode normal/lambat/offline"
2. "Ubah app.js: helper api() cek res.ok + GET saat dibuka"
3. "Tambah status loading/skeleton, error + coba lagi, select matkul Promise.all"
4. "Form POST JSON, tombol disabled saat kirim, error 400 tampil"
5. "Delegation PATCH/DELETE, state dari respons server"
6. "Mode jaringan + pastikan tanpa unhandled rejection"
7. "Bonus: cari debounce 300ms + optimistic update revert saat gagal"
