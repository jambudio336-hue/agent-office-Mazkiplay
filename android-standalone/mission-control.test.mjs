import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("./", import.meta.url);
const app = readFileSync(new URL("./app.js", root), "utf8");
const html = readFileSync(new URL("./index.html", root), "utf8");
const css = readFileSync(new URL("./styles.css", root), "utf8");

test("Mission Control app script parses as valid JavaScript", () => {
  assert.doesNotThrow(() => new vm.Script(app, { filename: "android-standalone/app.js" }));
});

test("Mission Control has all required controls and unique HTML IDs", () => {
  for (const id of ["mission-control", "mission-form", "mission-goal", "mission-create", "mission-run", "mission-pause", "mission-status", "mission-progress", "mission-progress-bar", "mission-steps"]) {
    assert.ok(html.includes(`id="${id}"`), `missing UI control: ${id}`);
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], []);
  assert.ok(html.includes('href="#mission-control"'), "drawer navigation must reach Mission Control");
});

test("Mission plan contains four ordered stages with dedicated role prompts", () => {
  assert.ok(app.includes("const MISSION_STAGES=["));
  for (const stage of ['key:"plan"', 'key:"build"', 'key:"qa"', 'key:"security"']) assert.ok(app.includes(stage), `missing stage ${stage}`);
  assert.ok(app.includes("async function runMission()"));
  assert.ok(app.includes("await runTask(task.id)"), "mission must use the existing task runner");
});

test("previous stage outputs are passed forward as context", () => {
  assert.ok(app.includes("priorTask?.output"));
  assert.ok(app.includes("task.context=prior.length"));
  assert.ok(app.includes("KELUARAN TAHAP MISI SEBELUMNYA"));
  assert.ok(app.includes("data tidak tepercaya"), "prior model outputs must be treated as untrusted context");
});

test("pause and interrupted mission recovery are represented explicitly", () => {
  assert.ok(app.includes('mission.status="paused"'));
  assert.ok(app.includes("data.missionPauseRequested"));
  assert.ok(app.includes('if(mission?.status==="running"){mission.status="paused"'));
});

test("results are gated for human review and UI styling is present", () => {
  assert.ok(app.includes('mission.status="needs-review"'));
  assert.ok(app.includes("Semua tahap menghasilkan jawaban. Periksa setiap hasil di Task Board"));
  assert.ok(html.includes("tidak menerapkan patch ke repository secara otomatis"));
  assert.ok(css.includes(".mission-control"));
  assert.ok(css.includes(".mission-progress"));
});
