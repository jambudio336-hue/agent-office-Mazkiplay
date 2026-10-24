const starter = `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Proyek pertamaku</title>
<style>
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:system-ui,sans-serif;color:#eaf2ff;background:radial-gradient(circle at top,#173d68,#08111f 65%)}
main{width:min(90%,520px);padding:32px;border:1px solid #42648a;border-radius:22px;background:#0b1b2ddd;box-shadow:0 24px 70px #0006}
small{color:#7dd3fc;letter-spacing:.16em}h1{font-size:clamp(28px,7vw,44px);margin:12px 0}p{color:#b9cce3;line-height:1.65}
button{border:0;border-radius:10px;padding:12px 18px;background:#38bdf8;color:#062039;font-weight:800;cursor:pointer}
#count{font-weight:800;color:#7dd3fc}
</style></head>
<body><main><small>MAZKIPLAY BUILD STUDIO</small><h1>Halo, Developer! 👋</h1><p>Ini contoh preview interaktif. Ubah HTML/CSS/JavaScript di panel source, lalu jalankan preview lagi.</p><p>Jumlah klik: <span id="count">0</span></p><button id="go">Tes interaksi</button></main><script>let n=0;document.getElementById('go').addEventListener('click',()=>document.getElementById('count').textContent=++n)<\/script></body></html>`;
const kind=document.getElementById('canvas-kind'),filename=document.getElementById('canvas-filename'),source=document.getElementById('canvas-source'),frame=document.getElementById('canvas-frame'),status=document.getElementById('canvas-status'),previewStatus=document.getElementById('canvas-preview-status'),count=document.getElementById('canvas-char-count');
const $=id=>document.getElementById(id);
function updateCount(){count.textContent=source.value.length.toLocaleString('id-ID')+' karakter'}
function runPreview(){
 const k=kind.value;
 if(k!=='html'){frame.srcdoc='<main style="font:16px system-ui;padding:24px;color:#172033"><h2>Preview belum tersedia untuk format ini</h2><p>Source code tetap bisa diedit dan diekspor. Pilih <b>Web / HTML</b> untuk menjalankan preview lokal langsung.</p><p>React perlu bundler/dependency; Kotlin perlu proyek dan toolchain Android.</p></main>';previewStatus.textContent='Source saja';status.textContent='Preview eksekusi hanya mendukung HTML/CSS/JavaScript mandiri.';return}
 frame.srcdoc=source.value;
 previewStatus.textContent='Dijalankan lokal';
 status.textContent='Preview HTML diperbarui. Kode berjalan di iframe sandbox.';
}
function setStarter(){kind.value='html';filename.value='index.html';source.value=starter;updateCount();runPreview()}
source.addEventListener('input',updateCount);
kind.addEventListener('change',()=>{if(kind.value==='html'&&filename.value==='MainActivity.kt')filename.value='index.html';else if(kind.value==='android')filename.value='MainActivity.kt';else if(kind.value==='react')filename.value='App.jsx';else if(kind.value==='other')filename.value='source.txt';});
$('canvas-preview').addEventListener('click',runPreview);
$('canvas-reset').addEventListener('click',setStarter);
$('canvas-download').addEventListener('click',()=>{
 const name=(filename.value.trim()||'source.txt').replace(/[\\/:*?"<>|]/g,'_');
 const blob=new Blob([source.value],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 status.textContent='File diekspor ke perangkat: '+name;
});
setStarter();
