const byId=<T extends HTMLElement>(id:string)=>{const e=document.getElementById(id);if(!e)throw new Error('Missing UI element '+id);return e as T};
const domainInput=byId<HTMLInputElement>('domain'), status=byId<HTMLParagraphElement>('status'), rdap=byId<HTMLDivElement>('rdap'), dns=byId<HTMLDivElement>('dns'), links=byId<HTMLDivElement>('links');
function domainName(raw:string){const d=raw.trim().replace(/^https?:\/\//i,'').replace(/\/.*$/,'').replace(/:\d+$/,'').toLowerCase();if(!/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(d))throw new Error('Domain tidak valid. Contoh: example.com');return d}
function node(tag:string,cls:string,text:string){const e=document.createElement(tag);e.className=cls;e.textContent=text;return e}
function row(parent:HTMLElement,key:string,value:string){const e=node('div','kv','');e.append(node('strong','',key),node('div','value',value));parent.append(e)}
function link(parent:HTMLElement,label:string,url:string){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;parent.append(a,node('span','',' · '))}
async function fetchJson(url:string,signal:AbortSignal){const r=await fetch(url,{headers:{accept:'application/json'},signal});if(!r.ok)throw new Error('HTTP '+r.status+' dari '+new URL(url).hostname);return await r.json() as Record<string,unknown>}
async function run(){
 let d='';try{d=domainName(domainInput.value)}catch(e){status.textContent=e instanceof Error?e.message:'Domain tidak valid';return}
 const controller=new AbortController(), timeout=window.setTimeout(()=>controller.abort(),12000);
 byId<HTMLButtonElement>('run').disabled=true;status.textContent='Mengambil data publik…';rdap.replaceChildren(node('p','muted','Meminta RDAP…'));dns.replaceChildren(node('p','muted','Meminta DNS…'));links.replaceChildren();
 const errors:string[]=[];
 try{
  try{
   const data=await fetchJson('https://rdap.org/domain/'+encodeURIComponent(d),controller.signal);rdap.replaceChildren();
   row(rdap,'Domain',String(data.ldhName??data.unicodeName??d));
   if(Array.isArray(data.status))row(rdap,'Status',data.status.map(String).join(', '));
   if(Array.isArray(data.nameservers))row(rdap,'Nameserver',data.nameservers.map((n)=>String((n as Record<string,unknown>).ldhName??'')).filter(Boolean).join(', ')||'Tidak tersedia');
   if(Array.isArray(data.events))row(rdap,'Tanggal',data.events.map((v)=>{const o=v as Record<string,unknown>;return String(o.eventAction??'event')+': '+String(o.eventDate??'')}).join('\n'));
   row(rdap,'Sumber','RDAP via rdap.org');row(rdap,'Diambil pada',new Date().toISOString());
  }catch(e){rdap.replaceChildren(node('p','muted','RDAP tidak tersedia: '+(e instanceof Error?e.message:'kesalahan tidak diketahui')));errors.push('RDAP');}
  const types=['A','AAAA','MX','NS','TXT','CAA'];
  dns.replaceChildren();
  for(const type of types){
   try{const data=await fetchJson('https://dns.google/resolve?name='+encodeURIComponent(d)+'&type='+type,controller.signal);const answers=Array.isArray(data.Answer)?data.Answer as Record<string,unknown>[]:[];const values=answers.map(a=>String(a.data??'')).filter(Boolean);row(dns,type,values.length?values.join('\n'):String(data.Status)=== '0'?'Tidak ada jawaban untuk tipe ini':'Tidak tersedia (status '+String(data.Status??'unknown')+')')}
   catch(e){row(dns,type,'Gagal: '+(e instanceof Error?e.message:'kesalahan'));errors.push('DNS '+type)}
  }
  link(links,'Certificate Transparency (crt.sh)','https://crt.sh/?q=%25.'+encodeURIComponent(d));link(links,'Google Dorking','/dork.html');link(links,'SecurityTrails (provider eksternal)','https://securitytrails.com/domain/'+encodeURIComponent(d)+'/dns');
  status.textContent='Selesai '+new Date().toLocaleString()+(errors.length?'. Sebagian sumber gagal: '+errors.join(', '):'. Semua sumber yang dicoba merespons.'); 
 }finally{window.clearTimeout(timeout);byId<HTMLButtonElement>('run').disabled=false}
}
byId<HTMLButtonElement>('run').addEventListener('click',()=>{void run().catch(e=>status.textContent='Pemeriksaan gagal: '+(e instanceof Error?e.message:'kesalahan tidak diketahui'))});
byId<HTMLButtonElement>('clear').addEventListener('click',()=>{domainInput.value='';rdap.replaceChildren(node('p','muted','Belum dijalankan.'));dns.replaceChildren(node('p','muted','Belum dijalankan.'));links.replaceChildren(node('p','muted','Jalankan pemeriksaan untuk menyiapkan tautan referensi.'));status.textContent=''});
