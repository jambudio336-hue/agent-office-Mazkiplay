/* Mazkiplay Agent Office — local multi-file Build Studio.
 * HTML preview is sandboxed; non-HTML projects remain editable source until built with their toolchain.
 */
(() => {
  "use strict";
  const STORE = "mazkiplay-canvas-workspace-v2";
  const $ = id => document.getElementById(id);
  const starter = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Proyek pertamaku</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;color:#eaf2ff;background:radial-gradient(circle at top,#173d68,#08111f 65%)}
main{width:min(90%,520px);padding:32px;border:1px solid #42648a;border-radius:22px;background:#0b1b2ddd;box-shadow:0 24px 70px #0006}
small{color:#7dd3fc;letter-spacing:.16em}h1{font-size:clamp(28px,7vw,44px);margin:12px 0}p{color:#b9cce3;line-height:1.65}
button{border:0;border-radius:10px;padding:12px 18px;background:#38bdf8;color:#062039;font-weight:800;cursor:pointer}#count{font-weight:800;color:#7dd3fc}
</style></head>
<body><main><small>MAZKIPLAY BUILD STUDIO</small><h1>Halo, Developer! 👋</h1><p>Ini preview interaktif. Edit HTML/CSS/JavaScript di panel source, lalu jalankan preview lagi.</p><p>Jumlah klik: <span id="count">0</span></p><button id="go">Tes interaksi</button></main><script>let n=0;document.getElementById('go').addEventListener('click',()=>document.getElementById('count').textContent=++n)<\\/script></body></html>`;
  const kind = $("canvas-kind"), filename = $("canvas-filename"), source = $("canvas-source"), frame = $("canvas-frame");
  const status = $("canvas-status"), previewStatus = $("canvas-preview-status"), count = $("canvas-char-count");
  let files = {};
  let activePath = "index.html";
  let dirty = false;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function starterFiles() { return {"index.html": starter, "README.md": "# Proyek Mazkiplay\n\nEdit file dari Explorer. Preview langsung tersedia untuk index.html mandiri.\n"}; }
  function safePath(value) {
    const path = String(value || "").trim().replace(/\\/g, "/").replace(/^\/+/, "");
    if (!path || path.length > 180 || path.split("/").some(part => !part || part === "." || part === "..") || /[<>:"|?*\u0000-\u001f]/.test(path)) return "";
    return path;
  }
  function setStatus(message, bad = false) { if (status) { status.textContent = message; status.style.color = bad ? "#ff9aa8" : "#8fe4c0"; } }
  function saveActive() {
    if (!activePath) return;
    files[activePath] = source.value;
    dirty = false;
  }
  function updateCount() { count.textContent = source.value.length.toLocaleString("id-ID") + " karakter" + (dirty ? " · belum disimpan" : ""); }
  function inferKind(path) {
    if (/\.html?$/i.test(path)) return "html";
    if (/\.(jsx|tsx)$/i.test(path)) return "react";
    if (/\.(kt|kts)$/i.test(path)) return "android";
    return "other";
  }
  function renderTree() {
    const host = $("canvas-file-tree");
    const paths = Object.keys(files).sort((a,b)=>a.localeCompare(b));
    $("canvas-file-count").textContent = paths.length + (paths.length === 1 ? " file" : " file");
    host.innerHTML = paths.map(path => '<button type="button" role="treeitem" class="canvas-file-item'+(path===activePath?' active':'')+'" data-file-path="'+esc(path)+'" title="'+esc(path)+'"><span class="canvas-file-icon">'+(path.includes("/")?"▱":"▤")+'</span><span>'+esc(path)+'</span></button>').join("");
  }
  function selectFile(path) {
    if (!Object.prototype.hasOwnProperty.call(files,path)) return;
    if (dirty && !confirm("Perubahan file aktif belum disimpan ke workspace. Pindah file dan simpan perubahan ke workspace lokal?")) return;
    saveActive(); activePath = path; filename.value = path; source.value = files[path]; kind.value = inferKind(path); dirty = false;
    renderTree(); updateCount(); setStatus("File dibuka: " + path); previewStatus.textContent = "Pilih Jalankan preview";
  }
  function persist() {
    saveActive();
    try { localStorage.setItem(STORE, JSON.stringify({version:2,files,activePath,updatedAt:new Date().toISOString()})); setStatus("Workspace tersimpan lokal · " + Object.keys(files).length + " file."); renderTree(); updateCount(); return true; }
    catch { setStatus("Gagal menyimpan. Ruang penyimpanan lokal mungkin penuh; ekspor proyek JSON sebagai cadangan.", true); return false; }
  }
  function runPreview() {
    saveActive();
    const htmlPath = activePath.toLowerCase().endsWith(".html") ? activePath : (Object.keys(files).find(p=>p.toLowerCase()==="index.html") || Object.keys(files).find(p=>p.toLowerCase().endsWith(".html")));
    if (!htmlPath) {
      frame.srcdoc = '<main style="font:16px system-ui;padding:24px;color:#172033"><h2>Preview belum tersedia</h2><p>Proyek ini belum memiliki file HTML. Source tetap bisa diedit dan diekspor; React perlu bundler/dependency, Kotlin perlu proyek Gradle dan Android toolchain.</p></main>';
      previewStatus.textContent = "Source saja"; $("canvas-preview-note").textContent = "Belum ada file HTML yang bisa dijalankan."; setStatus("Preview eksekusi hanya mendukung HTML mandiri."); return;
    }
    const html = files[htmlPath];
    frame.srcdoc = html;
    previewStatus.textContent = "Dijalankan: " + htmlPath;
    $("canvas-preview-note").textContent = "Preview HTML dijalankan dalam iframe sandbox. File CSS/JS terpisah belum dibundel otomatis.";
    setStatus("Preview HTML diperbarui dari " + htmlPath + ".");
  }
  function loadWorkspace() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE) || "null");
      if (saved && saved.files && typeof saved.files === "object" && Object.keys(saved.files).length) {
        files = Object.fromEntries(Object.entries(saved.files).filter(([p,v]) => safePath(p) && typeof v === "string").slice(0,150));
        activePath = Object.prototype.hasOwnProperty.call(files,saved.activePath) ? saved.activePath : (Object.keys(files)[0] || "index.html");
      } else { files = starterFiles(); activePath = "index.html"; }
    } catch { files = starterFiles(); activePath = "index.html"; }
    if (!Object.keys(files).length) { files = starterFiles(); activePath = "index.html"; }
    filename.value = activePath; source.value = files[activePath] || ""; kind.value = inferKind(activePath); renderTree(); updateCount(); runPreview();
  }
  source.addEventListener("input",()=>{dirty=true;files[activePath]=source.value;updateCount();});
  filename.addEventListener("change",()=>{
    const next = safePath(filename.value);
    if (!next) { filename.value = activePath; setStatus("Path tidak valid. Hindari .., nama kosong, dan karakter khusus.",true); return; }
    if (next !== activePath && Object.prototype.hasOwnProperty.call(files,next)) { filename.value = activePath; setStatus("Path sudah ada. Pilih file tersebut di Explorer.",true); return; }
    saveActive(); delete files[activePath]; activePath = next; files[activePath] = source.value; kind.value = inferKind(activePath); dirty = true; renderTree(); updateCount(); setStatus("Path file diubah. Tekan Simpan proyek untuk menyimpan.");
  });
  $("canvas-file-tree").addEventListener("click", e => { const button=e.target.closest("[data-file-path]"); if(button) selectFile(button.dataset.filePath); });
  $("canvas-preview").addEventListener("click",()=>{saveActive();runPreview();});
  $("canvas-save-project").addEventListener("click",persist);
  $("canvas-new-file").addEventListener("click",()=>{
    const path=safePath(prompt("Path file baru, contoh: src/app.js"));
    if(!path) return;
    if(Object.prototype.hasOwnProperty.call(files,path)) { setStatus("File sudah ada: "+path,true); return; }
    saveActive(); files[path] = ""; activePath=path; filename.value=path; source.value=""; kind.value=inferKind(path); dirty=false; renderTree(); updateCount(); setStatus("File baru dibuat: "+path+" · edit lalu simpan.");
  });
  $("canvas-reset").addEventListener("click",()=>{
    if(!confirm("Pulihkan contoh dan mengganti semua file workspace saat ini? Ekspor cadangan dahulu jika perlu.")) return;
    files=starterFiles(); activePath="index.html"; dirty=false; source.value=files[activePath]; filename.value=activePath; kind.value="html"; persist(); renderTree(); runPreview();
  });
  $("canvas-download").addEventListener("click",()=>{
    saveActive(); const name=safePath(filename.value)||"source.txt";
    const blob=new Blob([source.value],{type:"text/plain;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
    a.href=url;a.download=name.split("/").pop();document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setStatus("File diekspor ke perangkat: "+name);
  });
  $("canvas-export-project").addEventListener("click",()=>{
    saveActive(); const blob=new Blob([JSON.stringify({name:"Mazkiplay project",version:1,exportedAt:new Date().toISOString(),files},null,2)],{type:"application/json;charset=utf-8"});
    const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="mazkiplay-project.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setStatus("Ekspor JSON proyek selesai. Ini cadangan struktur dan isi file, bukan ZIP/build APK.");
  });
  $("canvas-send-task").addEventListener("click",()=>{
    saveActive();
    window.dispatchEvent(new CustomEvent("mazkiplay:canvas-source",{detail:{filename:activePath,kind:kind.value,source:source.value,files:{...files}}}));
    setStatus("File aktif dikirim ke Task Board untuk ditinjau AI.");
  });
  window.addEventListener("mazkiplay:canvas-result", event => {
    const detail=event.detail||{}; const raw=String(detail.output||"");
    const match=raw.match(/```([a-zA-Z0-9_+-]*)\s*\n([\s\S]*?)\n```/);
    const lang=(match?.[1]||"").toLowerCase();
    const code=match?.[2]||raw;
    const ext=lang==="html"||lang==="htm"?"html":lang==="jsx"||lang==="tsx"?"jsx":lang==="kotlin"||lang==="kt"?"kt":lang==="css"?"css":lang==="javascript"||lang==="js"?"js":"txt";
    const path=safePath(detail.filename || (ext==="html"?"index.html":ext==="kt"?"MainActivity.kt":ext==="jsx"?"App.jsx":"agent-output."+ext)) || "agent-output.txt";
    if (dirty && !confirm("Perubahan Canvas belum disimpan. Ganti file aktif dengan hasil AI?")) return;
    saveActive(); files[path]=code; activePath=path; filename.value=path; source.value=code; kind.value=inferKind(path); dirty=false; persist(); renderTree(); runPreview();
    $("code-canvas").scrollIntoView({behavior:"smooth",block:"start"});
    setStatus("Hasil tugas AI dimuat ke Canvas: "+path+(match?" (blok kode ditemukan)":" (teks keluaran utuh)"));
  });
  window.addEventListener("mazkiplay:canvas-source",event=>{
    const d=event.detail||{};
    if(d.source!==undefined) { files[d.filename||"index.html"]=String(d.source); activePath=d.filename||"index.html"; persist(); renderTree(); }
  });
  loadWorkspace();
})();