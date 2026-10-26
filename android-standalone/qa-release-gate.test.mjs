import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");
const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
const css = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

test("QA Lab app script parses", () => {
  assert.doesNotThrow(() => new vm.Script(app, { filename: "android-standalone/app.js" }));
});

test("QA release gate contains live CI and manual verification controls", () => {
  for (const id of ["qa-release-gate", "qa-repo", "qa-branch", "qa-ci-refresh", "qa-ci-status", "qa-ci-details", "qa-ci-link", "qa-release-status"]) {
    assert.ok(html.includes(`id="${id}"`), `missing QA control: ${id}`);
  }
  for (const key of ["sourceReview", "apkInstall", "localAi", "permissions", "artifactChecksum"]) {
    assert.ok(html.includes(`data-qa-check="${key}"`), `missing manual verification: ${key}`);
  }
  assert.ok(html.includes('href="#qa-release-gate"'), "drawer must link to QA gate");
});

test("CI result must match the latest branch HEAD and successful conclusion", () => {
  assert.ok(app.includes('ci.conclusion==="success"&&ci.headSha&&ci.headSha===ci.branchSha'));
  assert.ok(app.includes('item.path===".github/workflows/android-apk.yml"'));
  assert.ok(app.includes('githubRequest("/repos/"+owner+"/"+name+"/branches/"+branchPath)'));
  assert.ok(app.includes('githubRequest("/repos/"+owner+"/"+name+"/actions/runs?branch="'));
});

test("release gate never treats unchecked manual tests as complete", () => {
  assert.ok(app.includes('const checks=["sourceReview","apkInstall","localAi","permissions","artifactChecksum"]'));
  assert.ok(app.includes("checked===checks.length"));
  assert.ok(app.includes("data.qaReleaseChecks[input.dataset.qaCheck]=input.checked"));
  assert.ok(css.includes(".qa-release-gate"));
  assert.ok(css.includes(".qa-checklist"));
});

test("provider secrets restore from Android Keystore after restart without persisting API keys", () => {
  assert.ok(app.includes("async function readProviderSecret(id)"));
  assert.ok(app.includes('key = await readProviderSecret(id) || ""'));
  assert.ok(app.includes('p.key=await readProviderSecret(providerId)||""'));
  assert.ok(app.includes("async function loadProvider()"));
  assert.ok(app.includes('delete copy.key'));
  assert.ok(app.includes('filter(p=>p&&p.model&&p.url).length'), "configured providers should remain visible without plaintext keys in local state");
});

test("clear-data removes all known app-owned local stores and reloads module state", () => {
  const clearHandler = app.slice(app.indexOf('$("clear-data").onclick=async()=>{'), app.indexOf('window.addEventListener("mazkiplay:plugin-context"'));
  for (const key of ["mazkiplay-agent-office-v1", "mazkiplay-plugin-manager-v1", "mazkiplay-canvas-workspace-v2", "mazkiplay-self-improvement-v1", "mazkiplay-performance-v1", "mazkiplay-theme"]) {
    assert.ok(clearHandler.includes(key), `clear-data must remove ${key}`);
  }
  assert.ok(clearHandler.includes("window.location.reload()"), "reload resets module state after storage is cleared");
});

test("provider benchmark also restores its key from secure storage", () => {
  assert.ok(app.includes('if(!p.key&&id!=="custom"){try{p.key=await readProviderSecret(id)||"";}catch{p.key="";}}'));
  assert.ok(app.includes('API key tidak tersedia. Masukkan key atau periksa penyimpanan aman Android.'));
});

test("all Android standalone HTML assets exist and script entrypoints parse", () => {
  const scriptPaths = [...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g)].map(match => match[1]);
  const stylePaths = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(match => match[1]);
  assert.ok(scriptPaths.length >= 5, "expected all standalone script entrypoints");
  for (const assetPath of [...scriptPaths, ...stylePaths]) {
    assert.doesNotThrow(() => readFileSync(new URL(assetPath, import.meta.url), "utf8"), `missing HTML asset: ${assetPath}`);
  }
  for (const assetPath of scriptPaths) {
    const source = readFileSync(new URL(assetPath, import.meta.url), "utf8");
    assert.doesNotThrow(() => new vm.Script(source, { filename: assetPath }), `syntax error in ${assetPath}`);
  }
});

test("HTML IDs are unique and all app/patch DOM references resolve", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(new Set(ids).size, ids.length, "duplicate HTML IDs found");
  for (const source of [app, readFileSync(new URL("./github-pr.js", import.meta.url), "utf8")]) {
    for (const match of source.matchAll(/\$\("([^"]+)"\)/g)) {
      assert.ok(ids.includes(match[1]), `missing DOM ID referenced by script: ${match[1]}`);
    }
  }
});
