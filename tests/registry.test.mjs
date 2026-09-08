import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pageSource = await readFile(
  new URL("../app/page.tsx", import.meta.url),
  "utf8",
);
const registry = JSON.parse(
  await readFile(
    new URL("../app/registry.generated.json", import.meta.url),
    "utf8",
  ),
);

test("registry snapshot has verified, non-sensitive source summaries", () => {
  assert.equal(registry.schemaVersion, 1);
  assert.equal(registry.status, "verified");
  assert.ok(Number.isFinite(Date.parse(registry.capturedAt)));

  for (const source of [
    registry.sources.globalSkills,
    registry.sources.projectSkills,
    registry.sources.automations,
  ]) {
    assert.ok(Number.isInteger(source.count) && source.count > 0);
    assert.match(source.checksum, /^[a-f0-9]{64}$/u);
  }

  assert.equal(
    registry.sources.automations.active + registry.sources.automations.paused,
    registry.sources.automations.count,
  );
  assert.deepEqual(Object.keys(registry.sources.globalSkills).sort(), [
    "checksum",
    "count",
  ]);
  assert.deepEqual(Object.keys(registry.sources.projectSkills).sort(), [
    "checksum",
    "count",
  ]);
});

test("workflow and translation registries have the same IDs", () => {
  const workflowBlock = pageSource.slice(
    pageSource.indexOf("const workflows:"),
    pageSource.indexOf("const departments:"),
  );
  const translationBlock = pageSource.slice(
    pageSource.indexOf("const workflowZh:"),
    pageSource.indexOf("const globalSkills"),
  );
  const workflowIds = [
    ...workflowBlock.matchAll(/^\s{4}id:\s*"([^"]+)"/gmu),
  ].map((match) => match[1]);
  const translationIds = [
    ...translationBlock.matchAll(/^\s{2}"([^"]+)":\s*\{/gmu),
  ].map((match) => match[1]);

  assert.equal(new Set(workflowIds).size, workflowIds.length);
  assert.deepEqual(workflowIds.sort(), translationIds.sort());
});

test("dashboard derives counts and dates from current sources", () => {
  assert.match(pageSource, /operationalWorkflowCount/);
  assert.match(pageSource, /registeredSkillCount/);
  assert.match(pageSource, /registry\.capturedAt/);
  assert.doesNotMatch(pageSource, /OPS\.15|LIB\.20|18 Jul 2026|2026-07-18/);
});
