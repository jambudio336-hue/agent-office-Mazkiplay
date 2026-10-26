/* Mazkiplay Agent Office — adaptive performance and diagnostics.
 * No external telemetry, network requests, or secret reads.
 */
const PREF_KEY="mazkiplay-performance-v1";
const $=id=>document.getElementById(id);
const safeRead=()=>{try{return JSON.parse(localStorage.getItem(PREF_KEY)||"{}")}catch{return {}}};
const pref=safeRead();
function setLiteMode(enabled){
 document.body.classList.toggle("perf-lite",enabled);
 const toggle=$("performance-lite");
 if(toggle){toggle.checked=enabled;toggle.setAttribute("aria-checked",String(enabled))}
 try{localStorage.setItem(PREF_KEY,JSON.stringify({liteMode:enabled}))}catch{}
 const status=$("performance-status");
 if(status)status.textContent=enabled
  ?"Mode Hemat Performa aktif: animasi dekoratif dikurangi untuk mengutamakan responsivitas dan baterai."
  :"Mode Performa Normal aktif. Animasi dekoratif mengikuti pengaturan perangkat.";
}
function fmtBytes(value){
 if(!Number.isFinite(value)||value<0)return"tidak tersedia";
 if(value<1024)return value+" B";
 if(value<1024*1024)return(value/1024).toFixed(1)+" KB";
 return(value/(1024*1024)).toFixed(2)+" MB";
}
async function diagnose(){
 const output=$("performance-diagnostics");
 const button=$("performance-check");
 if(!output)return;
 if(button)button.disabled=true;
 output.textContent="Memeriksa kemampuan perangkat dan penyimpanan lokal…";
 try{
  const lines=[];
  const cores=Number(navigator.hardwareConcurrency)||0;
  const memory=Number(navigator.deviceMemory)||0;
  lines.push("Thread logis: "+(cores?cores+" (indikator, bukan ukuran kecepatan CPU)":"tidak dilaporkan browser"));
  lines.push("RAM perkiraan: "+(memory?memory+" GB (informasi browser, jika didukung)":"tidak dilaporkan browser"));
  lines.push("Platform: "+(navigator.userAgentData?.platform||navigator.platform||"tidak dilaporkan"));
  lines.push("Koneksi: "+(navigator.onLine?"perangkat melaporkan online":"perangkat melaporkan offline")+"; ini tidak menjamin akses internet/provider");
  try{
   const estimate=await navigator.storage?.estimate?.();
   if(estimate){
    lines.push("Penyimpanan origin terpakai: "+fmtBytes(estimate.usage));
    lines.push("Kuota origin perkiraan: "+fmtBytes(estimate.quota));
   }else lines.push("Estimasi kuota penyimpanan: tidak didukung runtime");
  }catch{lines.push("Estimasi penyimpanan tidak dapat dibaca")}
  try{
   const state=JSON.parse(localStorage.getItem("mazkiplay-agent-office-v1")||"{}");
   lines.push("Profil karyawan tersimpan: "+(Array.isArray(state.workers)?state.workers.length:0));
   lines.push("Tugas tersimpan: "+(Array.isArray(state.tasks)?state.tasks.length:0));
  }catch{lines.push("Ringkasan data aplikasi tidak dapat dibaca")}
  lines.push("Model AI lokal/cloud: belum diuji oleh diagnostik ini; gunakan uji provider atau jalankan tugas uji.");
  lines.push("Privasi: diagnostik berjalan lokal dan tidak mengirim data ke server.");
  output.textContent=lines.join("\n");
 }catch(error){
  output.textContent="Diagnostik gagal diselesaikan: "+(error?.message||"kesalahan runtime tidak diketahui")+". Coba lagi atau periksa kompatibilitas WebView.";
 }finally{
  if(button)button.disabled=false;
 }
}
document.addEventListener("DOMContentLoaded",()=>{
 setLiteMode(pref.liteMode===true);
 $("performance-lite")?.addEventListener("change",event=>setLiteMode(event.target.checked));
 $("performance-check")?.addEventListener("click",()=>diagnose());
 void diagnose();
});
