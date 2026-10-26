import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const app = readFileSync(new URL("./app.js", import.meta.url), "utf8");

test("task runner JavaScript parses", () => {
  assert.doesNotThrow(() => new vm.Script(app, { filename: "android-standalone/app.js" }));
});

test("manual AI task execution has a bounded concurrency limit", () => {
  assert.ok(app.includes("const MAX_CONCURRENT_TASK_RUNS=2"));
  assert.ok(app.includes("if(activeTaskRuns>=MAX_CONCURRENT_TASK_RUNS)"));
  assert.ok(app.includes("activeTaskRuns++"));
  assert.ok(app.includes("activeTaskRuns=Math.max(0,activeTaskRuns-1)"));
  assert.ok(app.includes("Dua tugas AI sedang berjalan"));
});

test("task runner releases its concurrency slot in finally after success or error", () => {
  const start = app.indexOf("async function runTask(id)");
  const end = app.indexOf("\nlet missionRunnerActive", start);
  assert.ok(start >= 0 && end > start, "runTask function must be present");
  const runner = app.slice(start, end);
  assert.ok(runner.includes("try{"));
  assert.ok(runner.includes("}catch(err){"));
  assert.ok(runner.includes("}finally{activeTaskRuns=Math.max(0,activeTaskRuns-1)"));
});
