const KEY="mazkiplay-agent-office-v1",MAX=20;
const P={
 openrouter:{label:"OpenRouter",url:"https://openrouter.ai/api/v1/chat/completions",model:"openrouter/auto",format:"openai"},
 openai:{label:"OpenAI",url:"https://api.openai.com/v1/chat/completions",model:"gpt-4o-mini",format:"openai"},
 gemini:{label:"Google Gemini",url:"https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",model:"gemini-2.5-flash",format:"openai"},
 deepseek:{label:"DeepSeek",url:"https://api.deepseek.com/chat/completions",model:"deepseek-chat",format:"openai"},
 anthropic:{label:"Anthropic Claude",url:"https://api.anthropic.com/v1/messages",model:"claude-3-5-haiku-latest",format:"anthropic"},
 custom:{label:"Endpoint custom",url:"",model:"",format:"openai"}
};
const $=id=>document.getElementById(id);
const parse=s=>{try{return JSON.parse(s)}catch{return null}};
let data=parse(localStorage.getItem(KEY))||{workers:[],tasks:[],providers:{}};
if(!Array.isArray(data.workers))data.workers=[];
if(!Array.isArray(data.tasks))data.tasks=[];
if(!data.providers||typeof data.providers!=="object")data.providers={};
function status(message,bad=false){$("status").textContent=message;$("status").style.color=bad?"#ff7e8a":"#64e0a4"}
function save(){try{localStorage.setItem(KEY,JSON.stringify(data));return true}catch{status("Penyimpanan lokal penuh atau tidak tersedia.",true);return false}}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function optionsForWorkers(selected=""){return '<option value="">Tanpa penugasan</option>'+data.workers.map(w=>'<option value="'+esc(w.id)+'" '+(w.id===selected?"selected":"")+'>'+esc(w.name)+" — "+esc(w.role)+"</option>").join("")}
function render(){
 $("worker-count").textContent=data.workers.length;$("task-count").textContent=data.tasks.length;
 $("provider-count").textContent=Object.values(data.providers).filter(p=>p&&p.key&&p.model).length;
 $("cap").textContent=data.workers.length+" / "+MAX;$("add-worker").disabled=data.workers.length>=MAX;
 $("workers").innerHTML=data.workers.length?data.workers.map(w=>'<div class="card"><div class="avatar">'+esc(w.name.slice(0,2).toUpperCase())+'</div><div class="meta"><b>'+esc(w.name)+'</b><small>'+esc(w.role)+' · '+esc((P[w.provider]||P.custom).label)+'</small>'+(w.task?'<small>Tugas awal: '+esc(w.task)+'</small>':'<small>Profil tersimpan lokal</small>')+'</div><button class="remove" data-remove="'+esc(w.id)+'" aria-label="Hapus pekerja">×</button></div>').join(""):'<div class="empty">Belum ada pekerja. Tambahkan anggota tim pertamamu.</div>';
 const assign=$("task-worker");if(assign){const previous=assign.value;assign.innerHTML=optionsForWorkers(previous);if([...assign.options].some(o=>o.value===previous))assign.value=previous}
 $("tasks").innerHTML=data.tasks.length?data.tasks.map(t=>{
 const worker=data.workers.find(w=>w.id===t.workerId);
 return '<article class="task-card"><div class="task"><input type="checkbox" data-done="'+esc(t.id)+'" '+(t.done?"checked":"")+' aria-label="Tandai tugas selesai"><span class="'+(t.done?"done":"")+'">'+esc(t.text)+'</span><button class="delete" data-delete="'+esc(t.id)+'">Hapus</button></div><div class="task-tools"><label>Pekerja<select data-assign="'+esc(t.id)+'">'+optionsForWorkers(t.workerId||"")+'</select></label><button class="run-ai" data-run="'+esc(t.id)+'" '+(t.running?"disabled":"")+'>'+(t.running?"AI sedang bekerja…":"▶ Jalankan AI")+'</button></div>'+(t.output?'<pre class="task-output">'+esc(t.output)+'</pre>':"")+(t.error?'<p class="task-error">'+esc(t.error)+'</p>':"")+'</article>'
 }).join(""):'<div class="empty">Belum ada tugas. Tambahkan pekerjaan untuk timmu.</div>';
}
function openDialog(){if(data.workers.length>=MAX){alert("Maksimum 20 pekerja. Hapus profil yang tidak dipakai dahulu.");return}$("worker-name").value="";$("worker-task").value="";$("worker-dialog").showModal()}
$("add-worker").onclick=openDialog;$("close-dialog").onclick=()=>$("worker-dialog").close();
$("open-settings").onclick=()=>$("settings").scrollIntoView({behavior:"smooth",block:"start"});
$("worker-form").onsubmit=e=>{e.preventDefault();if(data.workers.length>=MAX)return alert("Maksimum 20 pekerja.");const name=$("worker-name").value.trim();if(!name)return;const w={id:String(Date.now())+Math.random().toString(16).slice(2),name,role:$("worker-role").value,provider:$("worker-provider").value,task:$("worker-task").value.trim()};data.workers.push(w);if(w.task)data.tasks.unshift({id:w.id,text:w.task,done:false,workerId:w.id});save();render();$("worker-dialog").close()};
$("workers").onclick=e=>{const b=e.target.closest("[data-remove]");if(!b)return;const w=data.workers.find(x=>x.id===b.dataset.remove);if(w&&confirm("Hapus profil pekerja "+w.name+"?")){data.workers=data.workers.filter(x=>x.id!==w.id);save();render()}};
$("task-form").onsubmit=e=>{e.preventDefault();const text=$("task-input").value.trim();if(!text)return;data.tasks.unshift({id:String(Date.now())+Math.random().toString(16).slice(2),text,done:false,workerId:$("task-worker")?.value||"",output:"",error:""});$("task-input").value="";save();render()};
$("tasks").onchange=e=>{
 if(e.target.dataset.done){const t=data.tasks.find(x=>x.id===e.target.dataset.done);if(t)t.done=e.target.checked}
 if(e.target.dataset.assign){const t=data.tasks.find(x=>x.id===e.target.dataset.assign);if(t){t.workerId=e.target.value;t.output="";t.error=""}}
 save();render()
};
$("tasks").onclick=async e=>{
 const del=e.target.closest("[data-delete]");if(del){data.tasks=data.tasks.filter(x=>x.id!==del.dataset.delete);save();render();return}
 const run=e.target.closest("[data-run]");if(run){await runTask(run.dataset.run)}
};
function loadProvider(){const id=$("provider").value,p=P[id],s=data.providers[id]||{};$("api-key").value=s.key||"";$("model-id").value=s.model||p.model;$("endpoint").value=s.url||p.url;$("endpoint").readOnly=id!=="custom";$("endpoint-label").style.display=id==="custom"?"grid":"none"}
$("provider").onchange=loadProvider;
$("provider-form").onsubmit=e=>{e.preventDefault();const id=$("provider").value,p={key:$("api-key").value.trim(),model:$("model-id").value.trim(),url:$("endpoint").value.trim(),format:P[id].format};if(p.key&&(!p.model||!p.url))return status("API key, model, dan endpoint harus lengkap.",true);if(p.key)data.providers[id]=p;else delete data.providers[id];save();render();status(p.key?"Konfigurasi "+P[id].label+" disimpan lokal.":"Konfigurasi provider dihapus.")};
async function request(url,options){
 const http=window.Capacitor?.Plugins?.CapacitorHttp;
 if(http?.request){const r=await http.request({url,method:options.method||"GET",headers:options.headers,data:options.body?JSON.parse(options.body):undefined,connectTimeout:20000,readTimeout:60000});return{ok:r.status>=200&&r.status<300,status:r.status,data:r.data}}
 const r=await fetch(url,options);let d={};try{d=await r.json()}catch{}return{ok:r.ok,status:r.status,data:d}
}
async function callModel(providerId,prompt,role){
 const p=data.providers[providerId]||{};
 if(!p.key||!p.model||!p.url)throw Error("Provider "+(P[providerId]?.label||providerId)+" belum dikonfigurasi. Buka Pengaturan AI dan simpan API key, model, serta endpoint.");
 let headers={"Content-Type":"application/json"},body;
 const roleGuidance={
 "Founder / Owner":"Bertindak sebagai pemilik produk: jelaskan prioritas, nilai bisnis, risiko, biaya, dan metrik keberhasilan.",
 "Manajer proyek":"Susun langkah kerja berurutan, estimasi relatif, dependensi, risiko, dan kriteria penerimaan.",
 "Developer Full-stack":"Berikan rancangan frontend/backend, kontrak API, skema data, validasi, keamanan, dan pengujian integrasi.",
 "Developer Android":"Fokus pada arsitektur Android, lifecycle, izin, penyimpanan aman, kompatibilitas perangkat, dan pengujian APK.",
 "Developer Web":"Fokus pada HTML/CSS/JavaScript atau framework yang diminta, responsivitas, aksesibilitas, performa, dan keamanan web.",
 "Developer Game":"Fokus pada loop permainan, input, scene/state, aset, performa, dan target platform.",
 "Cybersecurity":"Lakukan analisis defensif dan berizin; uraikan ancaman, tingkat risiko, bukti, serta mitigasi tanpa mengklaim telah memindai sistem.",
 "QA / Tester":"Buat test case positif/negatif, langkah reproduksi, hasil yang diharapkan, dan prioritas bug.",
 "UI/UX Designer":"Jelaskan alur pengguna, hierarki visual, aksesibilitas, state kosong/error/loading, dan desain responsif.",
 "Data Analyst":"Nyatakan asumsi, metode analisis, metrik, batasan data, dan rekomendasi berbasis bukti.",
 "Penulis dokumentasi":"Susun dokumentasi ringkas dengan prasyarat, langkah, contoh, dan troubleshooting.",
 "Asisten umum":"Pecah tugas menjadi langkah praktis, jelaskan asumsi, dan utamakan solusi yang bisa diverifikasi."
};
const system="Kamu adalah "+(role||"Asisten umum")+" di Mazkiplay Agent Office. "+(roleGuidance[role]||roleGuidance["Asisten umum"])+" Jawab dalam Bahasa Indonesia. Berikan hasil praktis, jelaskan file/komponen yang disarankan dan cara menguji bila relevan. Kamu tidak memiliki akses otomatis ke repository, shell, atau perangkat pengguna; jangan mengaku sudah mengubah atau menjalankan sesuatu yang belum benar-benar dilakukan.";
 if(p.format==="anthropic"||providerId==="anthropic"){
   headers["x-api-key"]=p.key;headers["anthropic-version"]="2023-06-01";headers["anthropic-dangerous-direct-browser-access"]="true";
   body={model:p.model,max_tokens:1200,system,messages:[{role:"user",content:prompt}]};
 }else{
   headers.Authorization="Bearer "+p.key;
   body={model:p.model,max_tokens:1200,messages:[{role:"system",content:system},{role:"user",content:prompt}]};
 }
 const result=await request(p.url,{method:"POST",headers,body:JSON.stringify(body)});
 if(!result.ok)throw Error("Provider mengembalikan HTTP "+result.status+": "+(result.data?.error?.message||result.data?.message||"periksa API key, model, kuota, dan izin jaringan"));
 let answer="";
 if(providerId==="anthropic"||p.format==="anthropic")answer=(result.data?.content||[]).map(c=>c.text||"").join("\n");
 else answer=result.data?.choices?.[0]?.message?.content||"";
 if(!answer)throw Error("Respons provider kosong atau format respons belum didukung.");
 return answer;
}
async function runTask(id){
 const t=data.tasks.find(x=>x.id===id);if(!t||t.running)return;
 const worker=data.workers.find(w=>w.id===t.workerId);
 const providerId=worker?.provider||$("provider").value;
 t.running=true;t.error="";t.output="";save();render();
 try{
   const prompt="Kerjakan permintaan berikut dengan hasil yang bisa ditinjau. Untuk coding, berikan ringkasan pendek, daftar file beserta isi kode yang relevan, langkah pemasangan, cara uji, dan risiko/asumsi. Jika informasi kurang, sebutkan asumsi. Jangan mengklaim perubahan file atau pengujian sudah dilakukan. Jawaban AI bukan berarti tugas sudah benar-benar selesai; pengguna akan menandai selesai setelah memeriksa hasil.\n\nTUGAS: "+t.text;
   t.output=await callModel(providerId,prompt,worker?.role||"Asisten umum");
   t.done=false;
 }catch(err){t.error=err?.message||"Gagal menjalankan tugas AI";}finally{t.running=false;save();render()}
}
$("test-provider").onclick=async()=>{
 const id=$("provider").value,p={key:$("api-key").value.trim(),model:$("model-id").value.trim(),url:$("endpoint").value.trim(),format:P[$("provider").value].format};
 if(!p.key)return status("Masukkan API key terlebih dahulu.",true);if(!p.url||!p.model)return status("Model dan endpoint wajib diisi.",true);
 const b=$("test-provider"),previous=data.providers[id];b.disabled=true;b.textContent="Menguji…";
 data.providers[id]=p;
 try{
  const answer=await callModel(id,"Balas singkat hanya dengan: koneksi berhasil.","penguji koneksi");
  save();render();status("Koneksi "+P[id].label+" berhasil. "+answer.slice(0,100));
 }catch(err){
  if(previous)data.providers[id]=previous;else delete data.providers[id];
  status("Uji gagal: "+(err?.message||"jaringan/provider bermasalah")+". Periksa key, model, kuota, dan koneksi.",true);
 }finally{b.disabled=false;b.textContent="Uji koneksi"}
};

function backupStatus(message,bad=false){const el=$("backup-status");if(el){el.textContent=message;el.style.color=bad?"#ff7e8a":"#64e0a4"}}
$("export-data").onclick=()=>{
 try{
  const backup={format:"mazkiplay-agent-office-backup",version:1,createdAt:new Date().toISOString(),workers:data.workers.map(w=>({id:w.id,name:w.name,role:w.role,provider:w.provider,task:w.task||""})),tasks:data.tasks.map(t=>({id:t.id,text:t.text,done:!!t.done,workerId:t.workerId||"",output:t.output||"",error:t.error||""}))};
  const blob=new Blob([JSON.stringify(backup,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="mazkiplay-agent-office-backup.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  backupStatus("Cadangan dibuat. Simpan file JSON di lokasi aman; API key tidak ikut diekspor.");
 }catch(err){backupStatus("Gagal membuat cadangan: "+(err?.message||"kesalahan tidak diketahui"),true)}
};
$("import-data").onclick=()=>$("import-file").click();
$("import-file").onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;
 try{
  if(file.size>2*1024*1024)throw Error("File cadangan terlalu besar (maksimum 2 MB).");
  const backup=parse(await file.text());
  if(!backup||backup.format!=="mazkiplay-agent-office-backup"||backup.version!==1||!Array.isArray(backup.workers)||!Array.isArray(backup.tasks))throw Error("Format cadangan tidak dikenali.");
  if(backup.workers.length>MAX)throw Error("Cadangan memiliki lebih dari 20 pekerja.");
  if(backup.workers.some(w=>!w||typeof w.name!=="string"||typeof w.id!=="string")||backup.tasks.some(t=>!t||typeof t.text!=="string"||typeof t.id!=="string"))throw Error("Data pekerja atau tugas tidak valid.");
  if(!confirm("Impor akan mengganti daftar pekerja dan tugas saat ini. Pengaturan AI dan API key tetap dipertahankan. Lanjutkan?"))return;
  data.workers=backup.workers.map(w=>({id:w.id.slice(0,100),name:w.name.slice(0,32),role:String(w.role||"Asisten umum").slice(0,80),provider:P[w.provider]?w.provider:"openrouter",task:String(w.task||"").slice(0,180)}));
  const workerIds=new Set(data.workers.map(w=>w.id));
  data.tasks=backup.tasks.map(t=>({id:t.id.slice(0,100),text:t.text.slice(0,240),done:!!t.done,workerId:workerIds.has(t.workerId)?t.workerId:"",output:String(t.output||"").slice(0,20000),error:String(t.error||"").slice(0,1000),running:false}));
  if(!save())throw Error("Penyimpanan lokal gagal. Pastikan ruang perangkat tersedia.");
  render();backupStatus("Cadangan berhasil diimpor. Konfigurasi AI lokal tidak diubah.");
 }catch(err){backupStatus("Impor gagal: "+(err?.message||"file tidak valid"),true)}
 finally{e.target.value=""}
};
$("clear-data").onclick=()=>{
 if(!confirm("Hapus SEMUA profil pekerja, tugas, konfigurasi provider, dan API key dari penyimpanan lokal aplikasi? Tindakan ini tidak bisa dibatalkan."))return;
 data={workers:[],tasks:[],providers:{}};
 try{localStorage.removeItem(KEY);save();loadProvider();render();backupStatus("Data lokal aplikasi sudah dihapus.");status("Data lokal dihapus.")}catch(err){backupStatus("Gagal menghapus data lokal.",true)}
};

loadProvider();render();
