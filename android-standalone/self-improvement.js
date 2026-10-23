/* Mazkiplay Agent Office — self-health, local learning notes and safe improvement queue.
 * It diagnoses and proposes work; it never silently rewrites code or installs updates.
 */
(() => {
  "use strict";
  const STORE = "mazkiplay-self-improvement-v1";
  const MAX = 100;
  const $ = id => document.getElementById(id);
  const day = () => new Date().toISOString().slice(0, 10);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const initial = { events: [], lessons: [], ideas: [], activeDays: [], lastReview: null };
  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(STORE) || "null") || {};
      return {
        events: Array.isArray(value.events) ? value.events.slice(-MAX) : [],
        lessons: Array.isArray(value.lessons) ? value.lessons.slice(-MAX) : [],
        ideas: Array.isArray(value.ideas) ? value.ideas.slice(-MAX) : [],
        activeDays: Array.isArray(value.activeDays) ? value.activeDays.slice(-365) : [],
        lastReview: value.lastReview || null
      };
    } catch { return { ...initial, events: [], lessons: [], ideas: [], activeDays: [] }; }
  }
  let state = read();
  function status(message, bad = false) {
    const el = $("self-improve-status");
    if (el) { el.textContent = message; el.style.color = bad ? "#ff9aa8" : "#8fe4c0"; }
  }
  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); return true; }
    catch { status("Penyimpanan diagnostik penuh. Ekspor laporan dan hapus riwayat lama.", true); return false; }
  }
  function record(kind, message, source = "") {
    const clean = String(message || kind).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ").slice(0, 800);
    const now = Date.now();
    const duplicate = state.events.find(event => event.kind === kind && event.message === clean && now - event.at < 30000);
    if (duplicate) { duplicate.count = (duplicate.count || 1) + 1; duplicate.at = now; }
    else state.events.push({ id: now.toString(36) + Math.random().toString(36).slice(2, 7), at: now, kind, message: clean, source: String(source || "").slice(0, 250), count: 1 });
    state.events = state.events.slice(-MAX);
    save(); render();
  }
  function addIdea(title, detail, priority = "Sedang") {
    if (state.ideas.some(item => item.title === title && item.status !== "Selesai")) return;
    state.ideas.unshift({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: String(title).slice(0, 160), detail: String(detail).slice(0, 700), priority, status: "Terbuka", at: Date.now() });
    state.ideas = state.ideas.slice(0, MAX);
  }
  const panel = document.createElement("section");
  panel.id = "self-improvement";
  panel.className = "panel";
  panel.innerHTML = `
    <div class="heading"><div><small class="eyebrow">SELF-IMPROVEMENT ENGINE</small><h2>Monitor & Evolusi AI</h2></div><span class="pill" id="self-health-state">LOCAL-FIRST</span></div>
    <p class="notice">Agent mencatat error runtime, memeriksa fungsi dasar, menyimpan pelajaran lokal, dan mengusulkan peningkatan. Ia tidak mengubah kode atau memasang upgrade diam-diam. Patch kode harus lewat branch, tes, Draft PR, review, dan build APK yang tervalidasi.</p>
    <div class="self-health-grid">
      <article><small>Status aplikasi</small><strong id="self-health-label">Memeriksa…</strong></article>
      <article><small>Event error tercatat</small><strong id="self-event-count">0</strong></article>
      <article><small>Usulan aktif</small><strong id="self-idea-count">0</strong></article>
      <article><small>Hari aktif tercatat</small><strong id="self-day-count">0</strong></article>
    </div>
    <div class="actions">
      <button type="button" id="self-run-check">Jalankan pemeriksaan</button>
      <button type="button" class="secondary" id="self-create-task">Buat tugas perbaikan</button>
      <button type="button" class="secondary" id="self-export">Ekspor diagnostik</button>
      <button type="button" class="secondary" id="self-clear">Bersihkan log error</button>
    </div>
    <p id="self-improve-status" class="status" aria-live="polite">Monitor lokal siap.</p>
    <div id="self-findings" class="self-findings" aria-live="polite"></div>
    <h3 class="self-subhead">Memori pengalaman</h3>
    <p class="notice">Simpan pelajaran dan keputusan untuk dipakai sebagai referensi berikutnya. Ini memori catatan, bukan pelatihan otomatis atau perubahan bobot model AI.</p>
    <form id="self-learning-form" class="self-learning-form"><label>Pelajaran / temuan<textarea id="self-learning-note" rows="2" maxlength="1200" placeholder="Contoh: uji alur saat offline dan ketika model belum diunduh." required></textarea></label><button type="submit">Simpan pelajaran</button></form>
    <div id="self-learning-list" class="self-event-list"></div>
    <h3 class="self-subhead">Antrean peningkatan</h3><div id="self-ideas" class="self-ideas"></div>
    <details id="self-improvement-summary"><summary>Bagaimana agent berkembang dengan aman?</summary><p>1. Pantau error dan kondisi nyata. 2. Buat hipotesis akar masalah. 3. Siapkan patch di branch terpisah melalui Patch Lab. 4. Jalankan tes regresi dan build. 5. Minta review sebelum merge/rilis. 6. Simpan hasil dan siapkan rollback. AI tidak otomatis melatih ulang dirinya sendiri dari chat; peningkatan kecerdasan datang dari model yang lebih baik, konteks terkurasi, tools, tes, dan upgrade kode yang tervalidasi.</p></details>
  `;
  const insert = () => {
    const main = document.querySelector("main");
    const anchor = $("github-workspace") || $("settings");
    if (main && anchor) main.insertBefore(panel, anchor);
    else if (main) main.appendChild(panel);
  };
  function review() {
    const findings = [];
    const check = (title, ok, detail, level = "warning") => { if (!ok) findings.push({ title, detail, level }); };
    const required = ["workers", "tasks", "task-form", "free-chat-form", "github-workspace", "backup", "settings", "github-pr-load", "github-pr-generate", "github-pr-create"];
    const missing = required.filter(id => !$(id));
    check("Komponen UI tidak ditemukan", missing.length === 0, missing.length ? "Elemen hilang: " + missing.join(", ") : "", "error");
    let storageOK = false;
    try { const key = "__mazkiplay_health_probe__"; localStorage.setItem(key, "1"); storageOK = localStorage.getItem(key) === "1"; localStorage.removeItem(key); } catch {}
    check("Penyimpanan lokal", storageOK, "WebView tidak dapat menulis/membaca localStorage. Periksa ruang perangkat dan buat cadangan.", "error");
    let app = {};
    try { app = JSON.parse(localStorage.getItem("mazkiplay-agent-office-v1") || "{}"); } catch {}
    check("Struktur Task Board", Array.isArray(app.tasks), "Struktur data tugas tidak terbaca. Ekspor cadangan bila memungkinkan sebelum pemulihan.", "warning");
    const tasks = Array.isArray(app.tasks) ? app.tasks : [];
    const failed = tasks.filter(task => task.error);
    if (failed.length) findings.push({ title: "Tugas dengan error", detail: failed.length + " tugas menyimpan pesan error. Periksa hasil tugas dan buat kasus reproduksi.", level: "warning" });
    const pending = tasks.filter(task => !task.done);
    if (pending.length > 10) findings.push({ title: "Antrean tugas menumpuk", detail: pending.length + " tugas belum selesai. Prioritaskan dampak dan pecah pekerjaan besar.", level: "info" });
    if (!window.Capacitor?.Plugins?.MazkiplayLocalLLM) findings.push({ title: "Plugin AI lokal tidak terdeteksi pada sesi ini", detail: "Di browser preview hal ini wajar. Jika berjalan di APK, periksa plugin native dan status model.", level: "info" });
    const runtime = state.events.filter(event => event.kind === "error" || event.kind === "rejection");
    if (runtime.length) findings.push({ title: "Error runtime tercatat", detail: runtime.reduce((n, e) => n + (e.count || 1), 0) + " kejadian error/rejection tercatat lokal. Ekspor log untuk analisis.", level: "warning" });
    state.lastReview = { at: Date.now(), findings };
    if (!state.activeDays.includes(day())) state.activeDays.push(day());
    state.activeDays = state.activeDays.slice(-365);
    save();
    return findings;
  }
  function render() {
    if (!$("self-findings")) return;
    const findings = reviewWithoutSaving();
    $("self-health-label").textContent = findings.some(f => f.level === "error") ? "Perlu perhatian" : findings.some(f => f.level === "warning") ? "Ada peringatan" : "Stabil";
    $("self-health-state").textContent = findings.some(f => f.level === "error") ? "PERLU DITINJAU" : "MONITOR LOKAL";
    $("self-event-count").textContent = String(state.events.reduce((n, event) => n + (event.count || 1), 0));
    $("self-idea-count").textContent = String(state.ideas.filter(idea => idea.status !== "Selesai").length);
    $("self-day-count").textContent = String(state.activeDays.length);
    $("self-findings").innerHTML = findings.length ? findings.map(f => '<article class="self-finding ' + f.level + '"><b>' + esc(f.title) + '</b><p>' + esc(f.detail) + '</p></article>').join("") : '<div class="empty">Pemeriksaan dasar tidak menemukan masalah yang diketahui. Ini bukan jaminan bebas bug.</div>';
    $("self-event-list").innerHTML = state.events.slice().reverse().slice(0, 12).map(event => '<article><small>' + esc(new Date(event.at).toLocaleString("id-ID")) + ' · ' + esc(event.kind) + ' ×' + (event.count || 1) + '</small><p>' + esc(event.message) + '</p></article>').join("") || '<p class="status">Belum ada error tercatat.</p>';
    $("self-learning-list").innerHTML = state.lessons.slice(0, 6).map(item => '<article><small>' + esc(new Date(item.at).toLocaleString("id-ID")) + '</small><p>' + esc(item.note) + '</p></article>').join("") || '<p class="status">Belum ada pelajaran tersimpan.</p>';
    $("self-ideas").innerHTML = state.ideas.slice(0, 10).map(item => '<article class="self-finding ' + (item.status === "Selesai" ? "info" : "warning") + '"><b>' + esc(item.title) + ' · ' + esc(item.priority) + '</b><p>' + esc(item.detail) + '</p><div class="actions"><button type="button" class="secondary" data-idea-done="' + esc(item.id) + '">' + (item.status === "Selesai" ? "Buka kembali" : "Tandai selesai") + '</button><button type="button" class="secondary" data-idea-task="' + esc(item.id) + '">Kirim ke Task Board</button></div></article>').join("") || '<div class="empty">Belum ada usulan. Jalankan pemeriksaan atau tinjau error.</div>';
  }
  function reviewWithoutSaving() {
    const findings = [];
    const required = ["workers", "tasks", "task-form", "free-chat-form", "github-workspace", "backup", "settings"];
    const missing = required.filter(id => !$(id));
    if (missing.length) findings.push({ level: "error", title: "Komponen UI tidak ditemukan", detail: "Elemen hilang: " + missing.join(", ") });
    try { localStorage.setItem("__mazkiplay_health_probe__", "1"); localStorage.removeItem("__mazkiplay_health_probe__"); }
    catch { findings.push({ level: "error", title: "Penyimpanan lokal bermasalah", detail: "WebView menolak penulisan localStorage; periksa ruang penyimpanan dan cadangan." }); }
    let app = {}; try { app = JSON.parse(localStorage.getItem("mazkiplay-agent-office-v1") || "{}"); } catch {}
    if (!Array.isArray(app.tasks)) findings.push({ level: "warning", title: "Task Board belum bisa dibaca", detail: "Struktur data tugas tidak sesuai. Jangan hapus data sebelum mencoba ekspor cadangan." });
    const failed = (Array.isArray(app.tasks) ? app.tasks : []).filter(task => task.error);
    if (failed.length) findings.push({ level: "warning", title: "Tugas mengalami error", detail: failed.length + " tugas menyimpan pesan error." });
    if (!window.Capacitor?.Plugins?.MazkiplayLocalLLM) findings.push({ level: "info", title: "Plugin AI lokal tidak terdeteksi di sesi ini", detail: "Di browser preview hal ini wajar; cek lagi dari APK Android." });
    if (state.events.some(event => event.kind === "error" || event.kind === "rejection")) findings.push({ level: "warning", title: "Ada error runtime di jurnal", detail: "Tinjau riwayat error dan ekspor diagnostik untuk dianalisis." });
    return findings;
  }
  panel.addEventListener("click", event => {
    const button = event.target.closest("button");
    if (!button) return;
    if (button.id === "self-run-check") {
      const findings = review(); render();
      findings.forEach(f => addIdea(f.title, f.detail, f.level === "error" ? "Tinggi" : f.level === "warning" ? "Sedang" : "Rendah"));
      render();
      status("Pemeriksaan selesai: " + findings.length + " temuan. Pemeriksaan dasar tidak menjamin semua bug terdeteksi.");
    } else if (button.id === "self-create-task") {
      const findings = reviewWithoutSaving();
      const recent = state.events.slice(-12).filter(e => e.kind === "error" || e.kind === "rejection");
      const report = "SELF-IMPROVEMENT: analisis diagnostik secara aman. Jangan mengubah kode produksi tanpa review.\n\nTemuan:\n" + (findings.map(f => "- [" + f.level + "] " + f.title + ": " + f.detail).join("\n") || "Tidak ada temuan dasar.") + "\n\nError terbaru:\n" + (recent.map(e => "- " + new Date(e.at).toISOString() + " " + e.kind + ": " + e.message).join("\n") || "Tidak ada error tercatat.") + "\n\nKriteria selesai: akar masalah, reproduksi, patch di branch terpisah, tes regresi, build, rollback.";
      const input = $("task-input");
      if (!input || !$("task-form")) return status("Kolom Task Board tidak ditemukan.", true);
      input.value = report; input.dispatchEvent(new Event("input", { bubbles: true })); $("task-form").requestSubmit();
      status("Laporan diagnostik dikirim ke Task Board sebagai tugas.");
    } else if (button.id === "self-export") {
      const payload = { app: "Mazkiplay Agent Office", generatedAt: new Date().toISOString(), scope: "local diagnostics only", events: state.events, lessons: state.lessons, ideas: state.ideas, activeDays: state.activeDays, lastReview: state.lastReview, note: "Periksa isi file sebelum dibagikan. Modul ini tidak sengaja mengumpulkan API key." };
      const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
      const a = document.createElement("a"); a.href = url; a.download = "mazkiplay-diagnostics-" + day() + ".json"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      status("Laporan diagnostik diekspor. Periksa informasi sebelum membagikan.");
    } else if (button.id === "self-clear") {
      if (confirm("Bersihkan jurnal error lokal? Pelajaran dan antrean peningkatan tidak akan dihapus.")) { state.events = []; save(); render(); status("Jurnal error dibersihkan."); }
    } else if (button.dataset.ideaDone) {
      const idea = state.ideas.find(item => item.id === button.dataset.ideaDone);
      if (idea) idea.status = idea.status === "Selesai" ? "Terbuka" : "Selesai";
      save(); render();
    } else if (button.dataset.ideaTask) {
      const idea = state.ideas.find(item => item.id === button.dataset.ideaTask);
      if (!idea) return;
      const input = $("task-input");
      if (!input || !$("task-form")) return status("Task Board tidak ditemukan.", true);
      input.value = "[Evolusi Agent] " + idea.title + " — " + idea.detail;
      input.dispatchEvent(new Event("input", { bubbles: true })); $("task-form").requestSubmit();
      status("Usulan peningkatan dikirim ke Task Board.");
    }
  });
  panel.addEventListener("submit", event => {
    if (event.target.id !== "self-learning-form") return;
    event.preventDefault();
    const note = $("self-learning-note").value.trim();
    if (!note) return;
    state.lessons.unshift({ at: Date.now(), note: note.slice(0, 1200) });
    state.lessons = state.lessons.slice(0, MAX);
    if (!state.activeDays.includes(day())) state.activeDays.push(day());
    state.activeDays = state.activeDays.slice(-365);
    save(); $("self-learning-note").value = ""; render();
    status("Pelajaran tersimpan lokal. Ini memori catatan, bukan pelatihan otomatis model.");
  });
  window.addEventListener("error", event => record("error", event.message || "JavaScript error", (event.filename || "") + ":" + (event.lineno || 0)));
  window.addEventListener("unhandledrejection", event => record("rejection", event.reason?.message || String(event.reason || "Unhandled promise rejection")));
  insert();
  if (!state.activeDays.includes(day())) { state.activeDays.push(day()); state.activeDays = state.activeDays.slice(-365); save(); }
  render();
  status("Monitor lokal aktif. Tidak ada pengiriman log otomatis dan tidak ada perubahan kode diam-diam.");
})();