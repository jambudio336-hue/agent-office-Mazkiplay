export {};

type Workspace = { id:string; name:string; description:string; created_at:string; updated_at:string };
type Task = { id:string; workspace_id:string|null; title:string; prompt:string; status:string; priority:number; result_summary:string; error_summary:string; created_at:string; updated_at:string };
type CloudStatus = { configured:boolean; provider:string; mode:string; accountEligible:boolean };
const notice=document.querySelector<HTMLDivElement>('#notice')!;
const workspaceList=document.querySelector<HTMLDivElement>('#workspaces')!;
const taskList=document.querySelector<HTMLDivElement>('#tasks')!;
const workspaceForm=document.querySelector<HTMLFormElement>('#workspace-form')!;
const taskForm=document.querySelector<HTMLFormElement>('#task-form')!;
const workspaceName=document.querySelector<HTMLInputElement>('#workspace-name')!;
const workspaceDescription=document.querySelector<HTMLTextAreaElement>('#workspace-description')!;
const taskTitle=document.querySelector<HTMLInputElement>('#task-title')!;
const taskPrompt=document.querySelector<HTMLTextAreaElement>('#task-prompt')!;
const taskWorkspace=document.querySelector<HTMLSelectElement>('#task-workspace')!;
const taskPriority=document.querySelector<HTMLSelectElement>('#task-priority')!;
const workspaceSubmit=document.querySelector<HTMLButtonElement>('#workspace-submit')!;
const taskSubmit=document.querySelector<HTMLButtonElement>('#task-submit')!;
let workspaces:Workspace[]=[];
let tasks:Task[]=[];
let enabled=false;

async function api<T>(path:string, init:RequestInit={}):Promise<T>{
  const response=await fetch(path,{...init,credentials:'same-origin',cache:'no-store',headers:{'content-type':'application/json'}});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(typeof data.error==='string'?data.error:`Permintaan gagal (HTTP ${response.status})`);
  return data as T;
}
function setNotice(message:string,state:'info'|'good'|'bad'='info'){
  notice.textContent=message;
  notice.dataset.state=state==='info'?'':state;
}
function node<K extends keyof HTMLElementTagNameMap>(tag:K,className=''):HTMLElementTagNameMap[K]{
  const el=document.createElement(tag); if(className)el.className=className;return el;
}
function empty(container:HTMLElement,message:string){container.replaceChildren();const el=node('div','empty');el.textContent=message;container.append(el);}
function renderWorkspaces(){
  workspaceList.replaceChildren();
  taskWorkspace.replaceChildren();
  const none=node('option');none.value='';none.textContent='Tanpa workspace';taskWorkspace.append(none);
  if(!workspaces.length)empty(workspaceList,'Belum ada workspace cloud.');
  for(const w of workspaces){
    const opt=node('option');opt.value=w.id;opt.textContent=w.name;taskWorkspace.append(opt);
    const item=node('div','item');const row=node('div','row');const name=node('strong');name.textContent=w.name;const id=node('span','pill');id.textContent='Workspace';row.append(name,id);
    item.append(row);if(w.description){const desc=node('p');desc.textContent=w.description;item.append(desc)}
    const meta=node('div','muted');meta.textContent=new Date(w.created_at).toLocaleString('id-ID');item.append(meta);workspaceList.append(item);
  }
}
function renderTasks(){
  taskList.replaceChildren();
  if(!tasks.length)empty(taskList,'Belum ada tugas cloud.');
  for(const t of tasks){
    const item=node('div','item');const row=node('div','row');const title=node('strong');title.textContent=t.title;const status=node('span','pill');status.textContent=t.status;row.append(title,status);item.append(row);
    const meta=node('div','muted');meta.textContent=`Prioritas ${t.priority} · ${new Date(t.created_at).toLocaleString('id-ID')}`;item.append(meta);
    if(t.prompt){const prompt=node('p');prompt.textContent=t.prompt;item.append(prompt)}
    if(t.result_summary){const result=node('p');result.textContent='Hasil: '+t.result_summary;item.append(result)}
    if(t.error_summary){const error=node('p');error.textContent='Catatan error: '+t.error_summary;item.append(error)}
    if(t.status==='queued'){const cancel=node('button','danger');cancel.type='button';cancel.textContent='Batalkan tugas';cancel.addEventListener('click',()=>void cancelTask(t.id,cancel));item.append(cancel)}
    taskList.append(item);
  }
}
async function refresh(){
  const [w,t]=await Promise.all([
    api<{workspaces:Workspace[]}>('/api/cloud/workspaces'),
    api<{tasks:Task[]}>('/api/cloud/tasks')
  ]);
  workspaces=w.workspaces;tasks=t.tasks;renderWorkspaces();renderTasks();
}
async function cancelTask(id:string,button:HTMLButtonElement){
  button.disabled=true;
  try{await api('/api/cloud/tasks/'+encodeURIComponent(id),{method:'PATCH',body:JSON.stringify({status:'cancelled'})});setNotice('Tugas dibatalkan. Ini hanya mengubah metadata antrean; tidak menghentikan proses worker lokal.','good');await refresh()}
  catch(e){setNotice(e instanceof Error?e.message:'Gagal membatalkan tugas','bad');button.disabled=false}
}
workspaceForm.addEventListener('submit',async event=>{
  event.preventDefault();workspaceSubmit.disabled=true;
  try{
    await api('/api/cloud/workspaces',{method:'POST',body:JSON.stringify({name:workspaceName.value,description:workspaceDescription.value})});
    workspaceName.value='';workspaceDescription.value='';setNotice('Workspace tersimpan di Supabase.','good');await refresh();
  }catch(e){setNotice(e instanceof Error?e.message:'Gagal membuat workspace','bad')}
  finally{workspaceSubmit.disabled=false}
});
taskForm.addEventListener('submit',async event=>{
  event.preventDefault();taskSubmit.disabled=true;
  try{
    await api('/api/cloud/tasks',{method:'POST',body:JSON.stringify({title:taskTitle.value,prompt:taskPrompt.value,workspace_id:taskWorkspace.value||null,priority:Number(taskPriority.value)})});
    taskTitle.value='';taskPrompt.value='';setNotice('Metadata tugas tersimpan di Supabase. Worker belum menjalankan tugas ini.','good');await refresh();
  }catch(e){setNotice(e instanceof Error?e.message:'Gagal menyimpan tugas','bad')}
  finally{taskSubmit.disabled=false}
});
async function start(){
  try{
    const status=await api<CloudStatus>('/api/cloud/status');
    if(!status.configured){enabled=false;setNotice('Cloud sync belum aktif di server. Atur AGENT_OFFICE_SUPABASE_SECRET_KEY di environment rahasia Node.js; jangan masukkan key ke browser, APK, atau GitHub.','bad')}
    else if(!status.accountEligible){enabled=false;setNotice('Cloud sync membutuhkan akun bernama. Sesi dengan password kantor bersama hanya dapat memakai mode lokal.','bad')}
    else{enabled=true;setNotice('Cloud database tersambung melalui server. Tugas cloud saat ini menyimpan metadata saja; worker belum terhubung.','good');await refresh()}
  }catch(e){setNotice(e instanceof Error?e.message:'Tidak dapat memeriksa status cloud','bad')}
  for(const form of [workspaceForm,taskForm])for(const input of Array.from(form.elements))if(input instanceof HTMLInputElement||input instanceof HTMLTextAreaElement||input instanceof HTMLSelectElement||input instanceof HTMLButtonElement)input.disabled=!enabled;
}
void start();
