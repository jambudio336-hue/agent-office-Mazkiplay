type Preset = 'indexed'|'documents'|'login'|'subdomains'|'technology'|'custom';
const byId = <T extends HTMLElement>(id:string) => {
  const el=document.getElementById(id);
  if(!el) throw new Error('Missing UI element: '+id);
  return el as T;
};
const domainInput=byId<HTMLInputElement>('domain');
const presetInput=byId<HTMLSelectElement>('preset');
const keywordInput=byId<HTMLInputElement>('keyword');
const filetypeInput=byId<HTMLSelectElement>('filetype');
const customInput=byId<HTMLInputElement>('custom');
const customWrap=byId<HTMLDivElement>('custom-wrap');
const results=byId<HTMLDivElement>('results');
const status=byId<HTMLParagraphElement>('status');
const presets:Record<Preset,string[]> = {
 indexed:[''],
 documents:['filetype:pdf','filetype:docx','filetype:xlsx'],
 login:['(intitle:login OR inurl:login OR inurl:signin)'],
 subdomains:['-www'],
 technology:['(intitle:"documentation" OR inurl:docs OR inurl:api)'],
 custom:['']
};
function cleanDomain(raw:string):string {
 const value=raw.trim().replace(/^https?:\/\//i,'').replace(/\/.*$/,'').replace(/:\d+$/,'').toLowerCase();
 if(!value) return '';
 if(value.length>253 || !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(value)) {
   throw new Error('Domain tidak valid. Masukkan hostname seperti example.com, tanpa path.');
 }
 return value;
}
function safeExtra(raw:string):string {
 const value=raw.trim();
 if(/[\r\n<>]/.test(value) || value.length>160) throw new Error('Operator tambahan tidak valid atau terlalu panjang.');
 if(/https?:\/\/|javascript:|data:/i.test(value)) throw new Error('Masukkan operator pencarian, bukan URL.');
 return value;
}
function buildQueries():string[] {
 const domain=cleanDomain(domainInput.value);
 const preset=presetInput.value as Preset;
 const keyword=keywordInput.value.trim();
 if(keyword.length>100 || /[\r\n<>]/.test(keyword)) throw new Error('Kata kunci terlalu panjang atau berisi karakter yang tidak didukung.');
 const filetype=filetypeInput.value;
 const base=domain ? 'site:'+domain : '';
 const generated=presets[preset].map(part=>{
   const pieces=[base,part,keyword ? '"'+keyword.replace(/"/g,'')+'"' : '',filetype ? 'filetype:'+filetype : ''].filter(Boolean);
   return pieces.join(' ').trim();
 }).filter((q,i,a)=>q && a.indexOf(q)===i);
 if(preset==='custom') {
   const extra=safeExtra(customInput.value);
   const q=[base,extra,keyword ? '"'+keyword.replace(/"/g,'')+'"' : '',filetype ? 'filetype:'+filetype : ''].filter(Boolean).join(' ').trim();
   if(!q) throw new Error('Masukkan domain atau operator/kata kunci.');
   return [q];
 }
 return generated.length ? generated : [base || keyword || 'site:example.com'];
}
function el<K extends keyof HTMLElementTagNameMap>(tag:K, cls?:string, text?:string):HTMLElementTagNameMap[K] {
 const node=document.createElement(tag);
 if(cls) node.className=cls;
 if(text!==undefined) node.textContent=text;
 return node;
}
function render() {
 try {
  const queries=buildQueries();
  results.replaceChildren();
  for(const query of queries) {
   const card=el('section','result');
   card.append(el('code','',query));
   const actions=el('div','actions');
   const search=el('button','primary','Cari di Google');
   search.type='button';
   search.addEventListener('click',()=>window.open('https://www.google.com/search?q='+encodeURIComponent(query),'_blank','noopener,noreferrer'));
   const copy=el('button','','Salin query');
   copy.type='button';
   copy.addEventListener('click',async()=>{
     try { await navigator.clipboard.writeText(query); status.textContent='Query berhasil disalin.'; }
     catch { status.textContent='Clipboard tidak tersedia; pilih dan salin teks query secara manual.'; }
   });
   actions.append(search,copy);card.append(actions);results.append(card);
  }
  status.textContent=queries.length+' query dibuat. Hasil pencarian belum diverifikasi sebagai temuan keamanan.';
 } catch(error) {
  status.textContent=error instanceof Error?error.message:'Gagal membuat query.';
 }
}
presetInput.addEventListener('change',()=>customWrap.classList.toggle('hidden',presetInput.value!=='custom'));
byId<HTMLButtonElement>('generate').addEventListener('click',render);
byId<HTMLButtonElement>('clear').addEventListener('click',()=>{
 domainInput.value='';presetInput.value='indexed';keywordInput.value='';filetypeInput.value='';customInput.value='';
 customWrap.classList.add('hidden');results.replaceChildren(el('p','muted','Isi preset lalu tekan Generate query.'));status.textContent='';
});
render();

export {};
