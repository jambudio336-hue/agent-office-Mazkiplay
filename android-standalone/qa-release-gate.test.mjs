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
