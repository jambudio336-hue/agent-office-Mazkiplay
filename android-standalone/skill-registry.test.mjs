import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
const source=readFileSync(new URL("./skill-registry.js",import.meta.url),"utf8");
test("skill playbooks cover software, AI, security, trading and business",()=>{
 for(const name of ["Full-Stack Web Developer","Android & APK Developer","AI Agent Engineer","Defensive Security Researcher","Authorized Penetration Tester","Forex Technical Analyst","Forex Fundamental Analyst","Quant & Backtesting Analyst","Digital Marketing Strategist","Data & Public-Source Analyst"])assert.ok(source.includes(name),"missing playbook "+name);
});
test("skill playbooks require evidence, authorization and financial caution",()=>{
 assert.ok(source.includes("explicit permission"));assert.ok(source.includes("Do not promise profit or place live trades"));assert.ok(source.includes("Do not claim changes or tests happened without evidence"));
});
test("skill registry JavaScript parses",()=>{assert.doesNotThrow(()=>new vm.Script(source,{filename:"skill-registry.js"}));});
