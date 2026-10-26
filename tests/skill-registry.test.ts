import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const skills = readFileSync(new URL("../android-standalone/skill-registry.js", import.meta.url), "utf8");

test("AI skill registry contains actionable playbooks across requested disciplines", () => {
  for (const skill of [
    "Full-Stack Web Developer", "Android & APK Developer", "AI Agent Engineer",
    "Defensive Security Researcher", "Authorized Penetration Tester",
    "Red / Blue / Purple Team Planner", "Grey-Box & White-Hat Methodologist",
    "Threat Actor & Hacktivism Researcher", "Forex Technical Analyst",
    "Forex Fundamental Analyst", "Quant & Backtesting Analyst",
    "Digital Marketing Strategist", "Data & Public-Source Analyst"
  ]) assert.ok(skills.includes(skill), "missing skill playbook: " + skill);
});

test("high-impact skill playbooks enforce authorization, evidence and trading risk limits", () => {
  assert.ok(skills.includes("explicit permission"));
  assert.ok(skills.includes("Do not claim changes or tests happened without evidence"));
  assert.ok(skills.includes("Do not promise profit or place live trades"));
});
