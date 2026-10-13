// Mock REST API untuk Task Tracker v2 (pengganti server asli saat praktikum).
// Menyadap fetch() untuk path /api/* dan menyediakan:
//   GET    /api/tugas
//   GET    /api/matkul
//   POST   /api/tugas        (body JSON {judul, matkul, deadline}; 400 bila tak valid)
//   PATCH  /api/tugas/:id    (body JSON {selesai}; 404 bila tak ada)
//   DELETE /api/tugas/:id    (204 bila sukses; 404 bila tak ada)
// Uji ketahanan dari Console: __API.setMode("normal" | "offline" | "lambat").
(function () {
  "use strict";

  var MODE_DELAY = { normal: 150, lambat: 1800 };
  var mode = "normal";
  var KEY = "mock-api-tugas-v1";

  var SEED = [
    { id: "1", judul: "Laporan praktikum 3", matkul: "Pemrograman Web", deadline: "2026-10-20", selesai: false },
    { id: "2", judul: "ERD sistem perpustakaan", matkul: "Basis Data", deadline: "2026-10-12", selesai: false },
    { id: "3", judul: "Latihan rekurens", matkul: "Struktur Data", deadline: "2026-10-15", selesai: true },
  ];
  var SEED_MATKUL = ["Pemrograman Web", "Basis Data", "Struktur Data", "Sistem Operasi"];

  function load() {
    try {
      var db = JSON.parse(localStorage.getItem(KEY));
      if (Array.isArray(db)) return db;
    } catch (e) { /* abaikan, pakai seed */ }
    return SEED.map(function (t) { return { ...t }; });
  }

  var db = load();
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* mode privat */ }
  }
  persist();

  function json(data, status) {
    return new Response(JSON.stringify(data), {
      status: status || 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  function err(message, status) { return json({ message }, status); }
  function wait(ms) { return new Promise(function (res) { setTimeout(res, ms); }); }

  async function bacaBody(opts) {
    try { return JSON.parse(opts.body || "{}"); } catch (e) { return {}; }
  }

  var realFetch = window.fetch.bind(window);

  window.fetch = async function (url, opts) {
    var u = String((url && url.url) || url || "");
    if (u.indexOf("/api/") !== 0) return realFetch(url, opts);
    opts = opts || {};

    if (mode === "offline") throw new TypeError("Failed to fetch (mode offline aktif)");
    await wait(MODE_DELAY[mode] || 150);

    var method = (opts.method || "GET").toUpperCase();
    var bagian = u.split("?")[0].split("/").filter(Boolean); // ["api","tugas",":id?"]

    if (bagian[1] === "matkul" && method === "GET") return json(SEED_MATKUL);

    if (bagian[1] === "tugas" && bagian.length === 2) {
      if (method === "GET") return json(db);
      if (method === "POST") {
        var body = await bacaBody(opts);
        var judul = String(body.judul || "").trim();
        if (judul.length < 3) return err("Judul minimal 3 karakter.", 400);
        if (!body.deadline) return err("Deadline wajib diisi.", 400);
        var buat = {
          id: String(Date.now()),
          judul,
          matkul: String(body.matkul || "").trim(),
          deadline: body.deadline,
          selesai: false,
        };
        db.push(buat);
        persist();
        return json(buat, 201);
      }
    }

    if (bagian[1] === "tugas" && bagian.length === 3) {
      var id = bagian[2];
      var item = db.find(function (t) { return t.id === id; });
      if (!item) return err("Tugas tidak ditemukan.", 404);
      if (method === "PATCH") {
        var patch = await bacaBody(opts);
        if (typeof patch.selesai === "boolean") item.selesai = patch.selesai;
        persist();
        return json(item);
      }
      if (method === "DELETE") {
        db = db.filter(function (t) { return t.id !== id; });
        persist();
        return new Response(null, { status: 204 });
      }
    }

    return err("Endpoint tidak dikenal.", 404);
  };

  window.__API = {
    setMode(m) {
      if (m === "normal" || m === "offline" || m === "lambat") mode = m;
      return mode;
    },
    getMode: () => mode,
    reset() { db = SEED.map(function (t) { return { ...t }; }); persist(); },
  };
})();
