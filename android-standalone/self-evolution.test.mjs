import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("./self-improvement.js", import.meta.url), "utf8");

test("self-improvement module parses", () => {
  assert.doesNotThrow(() => new vm.Script(source, { filename: "android-standalone/self-improvement.js" }));
});

test("evolution cycle derives proposals from local runtime errors and failed tasks", () => {
  assert.match(source, /function autoEvolve\(manual = false\)/);
  assert.match(source, /state\.events\.filter\(event => event\.kind === "error" \|\| event\.kind === "rejection"\)/);
  assert.match(source, /tasks\.filter\(task => task && task\.error\)/);
  assert.match(source, /addIdea\("Evolusi otomatis: kurangi error runtime"/);
  assert.match(source, /addIdea\("Evolusi otomatis: tingkatkan pemulihan tugas gagal"/);
});

test("automatic evolution is bounded, local-only, and does not silently change code", () => {
  assert.match(source, /30 \* 86400000/);
  assert.match(source, /state\.lastEvolution = \{ at: Date\.now\(\), source: "local-evidence"/);
  assert.match(source, /tidak ada kode yang diubah otomatis/);
  assert.match(source, /tidak ada pengiriman log otomatis/);
  assert.doesNotMatch(source, /fetch\(["']https?:\/\/[^"']+["']/);
});

test("evolution can run automatically on startup and manually from the UI", () => {
  assert.match(source, /id="self-evolve-now"/);
  assert.match(source, /button\.id === "self-evolve-now"/);
  assert.match(source, /autoEvolve\(false\);\s*render\(\);/);
});
