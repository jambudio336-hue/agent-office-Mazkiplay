/* Reusable task playbooks for Mazkiplay Agent Office.
 * A playbook helps plan work; actual execution depends on connected models and tools.
 */
(() => {
  "use strict";
  const KEY = "mazkiplay-agent-office-v1";
  const skills = [
    ["web-dev","Engineering","Full-Stack Web Developer","Frontend, APIs, databases, authentication, testing and deployment.","Design and implement a maintainable full-stack solution. State assumptions; cover UI, API, data model, authentication, validation, accessibility, error handling, tests and deployment. Do not claim changes or tests happened without evidence."],
    ["android-dev","Engineering","Android & APK Developer","Android architecture, permissions, local storage, builds and device QA.","Plan an Android implementation mindful of low-memory devices, lifecycle, least-privilege permissions, safe local storage, offline/error states, accessibility, reproducible builds and device acceptance tests. Separate static review from real-device validation."],
    ["debugger","Engineering","Programmer & Debugger","Root-cause analysis, minimal fixes and regression tests.","Find the root cause from evidence, make the smallest safe patch, add a regression test, run available checks and inspect the diff. Report commands and results accurately; if tests cannot run, say so."],
    ["qa","Engineering","QA & Test Engineer","Unit, integration, regression and acceptance tests.","Create positive, negative, boundary, accessibility and regression tests. Define expected results and severity. Clearly separate tests actually executed from proposed tests."],
    ["ai-agents","AI & Automation","AI Agent Engineer","Task planning, tool selection, memory, evaluation and recovery.","Break the goal into bounded steps, choose only available tools, track progress, validate outputs, retry transient errors within limits and save reusable lessons. Propose versioned improvements and regression tests instead of claiming automatic model retraining."],
    ["devops","Engineering","DevOps & Release Engineer","CI/CD, deployment health, observability and rollback.","Review reproducible builds, CI status, configuration, secret handling, monitoring, backups and rollback. Require approval before production changes and report the exact status of workflows and artifacts."],
    ["security-review","Security","Defensive Security Researcher","Secure coding, threat models, dependencies and remediation.","Review supplied code or explicitly authorized assets. Provide evidence-backed findings, severity, impact, safe validation steps and remediation. Require clear scope for active tests and do not claim a scan occurred unless a tool produced evidence."],
    ["authorized-pentest","Security","Authorized Penetration Tester","Scoped security test plans and professional reports.","Create a non-destructive test plan for systems with explicit permission. Define targets, allowed methods, rate limits, stop conditions, evidence, severity and remediation. Use lab or staging environments where possible."],
    ["team-defense","Security","Red / Blue / Purple Team Planner","Authorized simulation, detection coverage and incident response.","Plan a controlled security exercise with scope, objectives, safety limits, simulated techniques, detection signals, response playbooks and a lessons-learned review. Keep all activities within authorized systems."],
    ["grey-white-security","Security","Grey-Box & White-Hat Methodologist","Authorized testing with partial knowledge, ethical disclosure and scoped validation.","Plan a grey-box or white-hat assessment with explicit authorization, agreed scope, test limits, safe evidence collection, responsible disclosure and remediation verification. Do not exceed scope or access data unrelated to the test."],
    ["threat-actor-research","Security","Threat Actor & Hacktivism Researcher","Public-source analysis of threat groups, motivations, tactics and defensive lessons.","Analyze public reporting on threat actors and hacktivist activity for research and defense. Verify claims across sources, distinguish attribution confidence from fact, document defensive indicators and mitigations, and do not facilitate attacks or target selection."],
    ["forex-technical","Trading Research","Forex Technical Analyst","Chart structure, indicators, scenarios and risk management.","Analyze only supplied or verifiably sourced timestamped prices. Explain trend, support/resistance, price action and indicators, with invalidation levels, alternative scenarios, spread/slippage and risk/reward. Do not promise profit or place live trades."],
    ["forex-fundamental","Trading Research","Forex Fundamental Analyst","Rates, inflation, employment, central banks and event risk.","Use dated reputable sources when available. Distinguish actual releases, forecasts and opinions; explain macro scenarios and uncertainty. Never invent live prices or economic releases."],
    ["quant","Trading Research","Quant & Backtesting Analyst","Backtests, drawdown, transaction costs and paper trading.","Design reproducible tests with dataset provenance, out-of-sample validation, look-ahead bias checks, transaction costs, drawdown and risk metrics. Prefer paper trading before real funds; past performance does not guarantee future results."],
    ["marketing","Business","Digital Marketing Strategist","Audience, positioning, content, campaign tests and KPIs.","Identify audience, value proposition, channels, content pillars, funnel, budget assumptions and measurable KPIs. Follow platform rules and distinguish draft recommendations from campaigns actually published."],
    ["seo-commerce","Business","SEO & E-commerce Specialist","Search intent, product pages, customer journey and conversion.","Develop useful original content, SEO structure, product positioning, customer journey and conversion experiments. Do not invent analytics, reviews or guaranteed sales."],
    ["data-research","Research","Data & Public-Source Analyst","Data quality, source checking, analysis and citations.","Validate data provenance, units, missing values and assumptions. Prefer primary sources, cross-check important claims, cite dated evidence and separate observed facts from inference. Never fabricate citations or statistics."],
    ["ux-docs","Product","UI/UX & Documentation Specialist","Accessible interfaces, usability, README and release notes.","Design responsive and accessible user flows including loading, empty, success and error states. Produce accurate documentation, setup steps, changelog and known limitations; do not claim unverified features are working."]
  ].map(([id,category,name,summary,prompt])=>({id,category,name,summary,prompt}));
  const categories=["Semua",...new Set(skills.map(s=>s.category))];
  const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const panel=document.createElement("section");
  panel.id="skill-registry"; panel.className="panel";
  panel.innerHTML='<div class="heading"><div><small class="eyebrow">SKILL REGISTRY</small><h2>Pustaka Skill Spesialis AI</h2></div><span class="pill">PLAYBOOKS</span></div><p class="notice">Pilih playbook untuk membuat tugas siap dikerjakan di Task Board. Hasil nyata bergantung pada model, tools, data, izin dan tes yang tersedia; katalog ini tidak memberikan akses baru secara otomatis.</p><div class="skill-controls"><label>Cari skill<input id="skill-registry-search" type="search" maxlength="100" placeholder="Cari developer, security, forex, marketing…"></label><label>Divisi<select id="skill-registry-category"></select></label></div><p id="skill-registry-count" class="status" aria-live="polite"></p><div id="skill-registry-list" class="skill-registry-list"></div>';
  const main=document.querySelector("main");
  if(main){const anchor=document.getElementById("self-improvement")||document.getElementById("settings");if(anchor)main.insertBefore(panel,anchor);else main.appendChild(panel);}
  const select=panel.querySelector("#skill-registry-category");
  categories.forEach(c=>{const o=document.createElement("option");o.value=c;o.textContent=c;select.appendChild(o);});
  function createTask(skill){
    let data;
    try{data=JSON.parse(localStorage.getItem(KEY)||"{}");}catch{alert("Data lokal tidak dapat dibaca. Buat cadangan terlebih dahulu.");return;}
    if(!data||!Array.isArray(data.tasks)||!Array.isArray(data.workers)){alert("Task Board belum siap. Buka ulang aplikasi setelah data lokal dimuat.");return;}
    if(data.tasks.length>=500){alert("Batas 500 tugas tercapai. Hapus tugas lama atau buat cadangan.");return;}
    data.tasks.unshift({id:Date.now().toString(36)+Math.random().toString(36).slice(2,8),text:"["+skill.category+"] "+skill.name,prompt:skill.prompt,done:false,workerId:"",output:"",error:"",attempts:0,createdAt:new Date().toISOString(),skillId:skill.id});
    try{localStorage.setItem(KEY,JSON.stringify(data));alert("Tugas "+skill.name+" ditambahkan ke Task Board. Aplikasi dimuat ulang untuk menyinkronkan daftar.");window.location.reload();}catch{alert("Penyimpanan gagal. Periksa ruang lokal dan cadangkan data.");}
  }
  function render(){
    const q=panel.querySelector("#skill-registry-search").value.trim().toLocaleLowerCase("id-ID"),cat=select.value;
    const found=skills.filter(s=>(cat==="Semua"||s.category===cat)&&(s.name+" "+s.category+" "+s.summary).toLocaleLowerCase("id-ID").includes(q));
    panel.querySelector("#skill-registry-count").textContent=found.length+" playbook tersedia dari "+skills.length+" skill";
    const list=panel.querySelector("#skill-registry-list");list.replaceChildren();
    found.forEach(s=>{const card=document.createElement("article");card.className="skill-card";const badge=document.createElement("span");badge.className="skill-tag";badge.textContent=s.category;const title=document.createElement("h3");title.textContent=s.name;const desc=document.createElement("p");desc.textContent=s.summary;const btn=document.createElement("button");btn.type="button";btn.textContent="Buat tugas dengan skill ini";btn.addEventListener("click",()=>createTask(s));card.append(badge,title,desc,btn);list.appendChild(card);});
  }
  panel.querySelector("#skill-registry-search").addEventListener("input",render);select.addEventListener("change",render);render();
  window.MazkiplaySkillRegistry=Object.freeze({list:()=>skills.map(({id,category,name,summary})=>({id,category,name,summary})),categories:()=>[...categories],get:id=>{const s=skills.find(x=>x.id===id);return s?{...s}:null;}});
})();
