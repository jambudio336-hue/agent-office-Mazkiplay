/* Mazkiplay Self-Improvement Monitor
 * Local-first diagnostics. It never edits source code, installs updates, or sends logs automatically.
 */
(() => {
  "use strict";
  const STORE = "mazkiplay-self-improvement-v1";
  const MAX_EVENTS = 100;
  const $ = (id) => document.getElementById(id);
  const read = () => {
    try {
      const value = JSON.parse(localStorage.getItem(STORE) || "{}");
      return { events: Array.isArray(value.events) ? value.events.slice(-MAX_EVENTS) : [], lastReview: value.lastReview || null };
    } catch {
      return { events: [], lastReview: null };
    }
  };
  let state = read();
  const save = () => {
    try { localStorage.setItem(STORE, JSON.stringify(state)); }
    catch { setStatus("Penyimpanan diagnostik penuh; ekspor lalu hapus riwayat lama.", true); }
  };
  const setStatus = (message, bad = false) => {
    const el = $("self-improve-status");
    if (el) { el.textContent = message; el.style.color = bad ? "#ff9aa8" : "#8fe4c0"; }
  };
  const record = (kind, message, source = "") => {
    const clean = String(message || kind).slice(0, 800);
    const duplicate = state.events.find((event) => event.kind === kind && event.message === clean && Date.now() - event.at < 30000);
    if (duplicate) { duplicate.count = (duplicate.count || 1) + 1; duplicate.at = Date.now(); }
    else state.events.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), at: Date.now(), kind, message: clean, source: String(source || "").slice(0, 300), count: 1 });
    state.events = state.events.slice(-MAX_EVENTS);
    save();
    render();
  };
  const panel = document.createElement("section");
  panel.id = "self-improvement";
  panel.className = "panel";
  panel.innerHTML = `
    <div class="heading"><div><small class="eyebrow">SELF-IMPROVEMENT ENGINE</small><h2>Monitor & Evolusi AI</h2></div><span class="pill">LOCAL-FIRST</span></div>
    <p class="notice">Monitor ini mencatat error JavaScript, memeriksa komponen penting, dan menyusun rekomendasi dari kondisi aplikasi. Riwayat tersimpan di perangkat. Agent tidak mengubah kode atau memasang upgrade diam-diam.</p>
    <div class="self-health-grid">
      <article><small>Status aplikasi</small><strong id="self-health-state">Memeriksa…</strong></article>
      <article><small>Event tercatat</small><strong id="self-event-count">0</strong></article>
      <article><small>Temuan aktif</small><strong id="self-finding-count">0</strong></article>
    </div>
    <div id="self-findings" class="self-findings" aria-live="polite"></div>
    <div class="actions">
      <button type="button" id="self-run-check">Jalankan pemeriksaan</button>
      <button type="button" class="secondary" id="self-create-task">Buat tugas perbaikan</button>
      <button type="button" class="secondary" id="self-export">Ekspor diagnostik</button>
      <button type="button" class="secondary" id="self-clear">Bersihkan riwayat</button>
    </div>
    <p id="self-improve-status" class="status" aria-live="polite">Pemeriksaan lokal siap.</p>
    <details><summary>Riwayat diagnostik terbaru</summary><div id="self-event-list" class="self-event-list"></div></details>
  `;
  const insert = () => {
    const main = document.querySelector("main");
    const anchor = $("github-workspace") || $("settings");
    if (main && anchor) main.insertBefore(panel, anchor);
    else if (main) main.appendChild(panel);
  };
  function review() {
    const findings = [];
    const required = ["workers", "tasks", "task-form", "free-chat-form", "github-workspace", "backup", "settings"];
    const missing = required.filter((id) => !$(id));
    if (missing.length) findings.push({ level: "error", title: "Komponen UI tidak ditemukan", detail: "Elemen hilang: " + missing.join(", ") });
    try { localStorage.setItem("__mazkiplay_health_probe__", "1"); localStorage.removeItem("__mazkiplay_health_probe__"); }
    catch { findings.push({ level: "error", title: "Penyimpanan lokal bermasalah", detail: "Browser/WebView menolak penulisan localStorage. Data tugas mungkin tidak tersimpan." }); }
    const app = (() => { try { return JSON.parse(localStorage.getItem("mazkiplay-agent-office-v1") || "{}"); } catch { return {}; } })();
    if (!Array.isArray(app.tasks)) findings.push({ level: "warning", title: "Task Board belum bisa dibaca", detail: "Struktur data tugas tidak sesuai. Ekspor cadangan jika data lama masih tersedia." });
    const failedTasks = (app.tasks || []).filter((task) => task.error);
    if (failedTasks.length) findings.push({ level: "warning", title: "Tugas mengalami error", detail: failedTasks.length + " tugas menyimpan pesan error. Buka Task Board untuk memeriksa detailnya." });
    const unfinished = (app.tasks || []).filter((task) => !task.done);
    if (unfinished.length > 10) findings.push({ level: "info", title: "Antrean tugas menumpuk", detail: unfinished.length + " tugas belum selesai. Prioritaskan tugas dan pecah pekerjaan besar menjadi langkah kecil." });
    if (!window.Capacitor?.Plugins?.MazkiplayLocalLLM) findings.push({ level: "info", title: "AI lokal native tidak terdeteksi", detail: "Pemeriksaan browser tidak membuktikan APK rusak. Jalankan pemeriksaan ini dari APK untuk mengecek plugin perangkat." });
    const recentErrors = state.events.filter((event) => event.kind === "error" || event.kind === "rejection").length;
    if (recentErrors) findings.push({ level: "warning", title: "Error runtime tercatat", detail: recentErrors + " event error/rejection ada di jurnal lokal. Ekspor diagnostik untuk analisis." });
    state.lastReview = { at: Date.now(), findings };
    save();
    return findings;
  }
  function render() {
    if (!$("self-findings")) return;
    const findings = reviewWithoutSaving();
    $("self-health-state").textContent = findings.some((f) => f.level === "error") ? "Perlu perhatian" : findings.some((f) => f.level === "warning") ? "Ada peringatan" : "Stabil";
    $("self-event-count").textContent = String(state.events.reduce((sum, event) => sum + (event.count || 1), 0));
    $("self-finding-count").textContent = String(findings.length);
    $("self-findings").innerHTML = findings.length ? findings.map((f) => '<article class="self-finding ' + f.level + '"><b>' + escapeHtml(f.title) + '</b><p>' + escapeHtml(f.detail) + '</p></article>').join("") : '<div class="empty">Pemeriksaan dasar tidak menemukan masalah yang diketahui.</div>';
    $("self-event-list").innerHTML = state.events.slice().reverse().slice(0, 12).map((event) => '<article><small>' + escapeHtml(new Date(event.at).toLocaleString()) + ' · ' + escapeHtml(event.kind) + ' ×' + (event.count || 1) + '</small><p>' + escapeHtml(event.message) + '</p></article>').join("") || '<p class="status">Belum ada error tercatat.</p>';
  }
  function reviewWithoutSaving() {
    const required = ["workers", "tasks", "task-form", "free-chat-form", "github-workspace", "backup", "settings"];
    const findings = [];
    const missing = required.filter((id) => !$(id));
    if (missing.length) findings.push({ level: "error", title: "Komponen UI tidak ditemukan", detail: "Elemen hilang: " + missing.join(", ") });
    try { localStorage.setItem("__mazkiplay_health_probe__", "1"); localStorage.removeItem("__mazkiplay_health_probe__"); }
    catch { findings.push({ level: "error", title: "Penyimpanan lokal bermasalah", detail: "WebView menolak penulisan localStorage; periksa ruang penyimpanan dan cadangan." }); }
    let app = {};
    try { app = JSON.parse(localStorage.getItem("mazkiplay-agent-office-v1") || "{}"); } catch {}
    if (!Array.isArray(app.tasks)) findings.push({ level: "warning", title: "Task Board belum bisa dibaca", detail: "Struktur data tugas tidak sesuai. Jangan hapus data sebelum mencoba ekspor cadangan." });
    const failed = (app.tasks || []).filter((task) => task.error);
    if (failed.length) findings.push({ level: "warning", title: "Tugas mengalami error", detail: failed.length + " tugas menyimpan error. Buka Task Board dan periksa hasilnya." });
    const pending = (app.tasks || []).filter((task) => !task.done);
    if (pending.length > 10) findings.push({ level: "info", title: "Antrean tugas menumpuk", detail: pending.length + " tugas belum selesai. Urutkan berdasarkan dampak dan urgensi." });
    if (!window.Capacitor?.Plugins?.MazkiplayLocalLLM) findings.push({ level: "info", title: "Plugin AI lokal tidak terdeteksi di sesi ini", detail: "Di browser ini wajar; jika berjalan di APK, periksa integrasi plugin native." });
    const errors = state.events.filter((event) => event.kind === "error" || event.kind === "rejection");
    if (errors.length) findings.push({ level: "warning", title: "Error runtime tercatat", detail: errors.length + " jenis/event error ada di jurnal lokal. Ekspor untuk analisis." });
    return findings;
  }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  panel.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.id === "self-run-check") {
      const findings = review();
      render();
      setStatus("Pemeriksaan selesai: " + findings.length + " temuan. Ini pemeriksaan dasar, bukan jaminan semua bug terdeteksi.");
    } else if (button.id === "self-create-task") {
      const findings = reviewWithoutSaving();
      const errors = state.events.slice(-15).filter((event) => event.kind === "error" || event.kind === "rejection");
      const summary = findings.map((f) => "- [" + f.level.toUpperCase() + "] " + f.title + ": " + f.detail).join("\n") || "Pemeriksaan dasar tidak menemukan temuan aktif.";
      const log = errors.map((e) => "- " + new Date(e.at).toISOString() + " " + e.kind + ": " + e.message).join("\n");
      const input = $("task-input");
      if (!input) return setStatus("Kolom Task Board tidak ditemukan.", true);
      input.value = "SELF-IMPROVEMENT: analisis diagnostik dan usulkan perbaikan yang aman. Jangan mengubah kode produksi tanpa review.\n\nTemuan:\n" + summary + (log ? "\n\nError terbaru:\n" + log : "") + "\n\nKriteria selesai: akar masalah, langkah reproduksi, patch terpisah, tes regresi, dan rencana rollback.";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      $("task-form").requestSubmit();
      setStatus("Laporan diagnostik dikirim ke Task Board sebagai tugas. Jalankan AI pada tugas itu untuk analisis lanjutan.");
    } else if (button.id === "self-export") {
      const payload = { app: "Mazkiplay Agent Office", generatedAt: new Date().toISOString(), scope: "local diagnostics only", events: state.events, lastReview: state.lastReview };
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = "mazkiplay-diagnostics.json"; a.click(); URL.revokeObjectURL(url);
      setStatus("Diagnostik diekspor. Periksa isi file sebelum membagikannya.");
    } else if (button.id === "self-clear") {
      if (confirm("Bersihkan jurnal error lokal? Ini tidak memperbaiki bug atau menghapus tugas.")) { state.events = []; state.lastReview = null; save(); render(); setStatus("Jurnal diagnostik dibersihkan."); }
    }
  });
  window.addEventListener("error", (event) => record("error", event.message || "JavaScript error", (event.filename || "") + ":" + (event.lineno || 0)));
  window.addEventListener("unhandledrejection", (event) => {
    const reason = event.reason;
    record("rejection", reason?.message || String(reason || "Unhandled promise rejection"));
  });
  insert();
  render();
  setStatus("Monitor aktif. Error dicatat lokal; tidak ada pengiriman otomatis ke luar perangkat.");
})();
