import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const source = readFileSync(new URL("./github-pr.js", import.meta.url), "utf8");
const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");

test("Patch Lab script parses and UI controls exist", () => {
  assert.doesNotThrow(() => new vm.Script(source, { filename: "android-standalone/github-pr.js" }));
  for (const id of ["github-patch-lab", "github-pr-load", "github-pr-generate", "github-pr-code", "github-pr-create", "multi-pr-load", "multi-pr-generate", "multi-pr-editors", "multi-pr-create"]) {
    assert.ok(html.includes(`id="${id}"`), `missing Patch Lab control: ${id}`);
  }
});

test("single-file patch requires a freshly loaded source and explicit confirmation", () => {
  assert.ok(source.includes('if (!loaded || loaded.repo !== repo || loaded.base !== base || loaded.path !== path)'));
  assert.ok(source.includes('if (!confirm("Buat branch baru, commit isi file ini, lalu buka DRAFT pull request?')));
  assert.ok(source.includes('draft: true'));
  assert.ok(source.includes('head: branch,'));
  assert.ok(source.includes('base,'));
});

test("branch and repository paths are validated before write operations", () => {
  assert.ok(source.includes("function validRepo(value)"));
  assert.ok(source.includes('branch === base'));
  assert.ok(source.includes('branch.includes("..")'));
  assert.ok(source.includes("function safeRepoPath(path)"));
  assert.ok(source.includes('!value.startsWith("/")'));
  assert.ok(source.includes('part !== ".."'));
});

test("multi-file patch bounds file count and context size", () => {
  assert.ok(source.includes("paths.length > 5"));
  assert.ok(source.includes("total > 18000"));
  assert.ok(source.includes('if (multiLoaded.some(file => !safeRepoPath(file.path) || !file.currentContent.trim()))'));
  assert.ok(source.includes('draft: true'));
  assert.ok(source.includes('Periksa branch di GitHub sebelum mencoba ulang.'));
});
