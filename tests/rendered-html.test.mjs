import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("standalone build contains the Workflow OS product", async () => {
  const html = await readFile(
    new URL("../Demo-Workflow-OS.html", import.meta.url),
    "utf8",
  );

  assert.match(html, /^<!doctype html>/i);
  assert.match(html, /<html lang="zh-HK">/i);
  assert.match(html, /<title>Demo Workflow OS<\/title>/i);
  assert.match(html, /Demo Workflow OS/);
  assert.match(html, /Registry snapshot verified/);
  assert.match(html, /data:image\/jpeg;base64,/);
  assert.doesNotMatch(html, /<script[^>]+src=/i);
  assert.doesNotMatch(html, /<link[^>]+rel=["']stylesheet["']/i);
  assert.doesNotMatch(html, /Your site is taking shape|Codex is working/i);
});

test("source and metadata no longer use starter contracts", async () => {
  const [page, journey, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/ScrollScrubJourney.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /registry\.generated\.json/);
  assert.match(page, /document\.documentElement\.lang/);
  assert.match(journey, /window\.location\.protocol !== "file:"/);
  assert.match(layout, /title:\s*"Demo Workflow OS"/);
  assert.match(packageJson, /"name":\s*"demo-workflow-os"/);
  assert.doesNotMatch(page, /codex-preview|<SkeletonPreview/);
  assert.doesNotMatch(layout, /Starter Project|codex-preview/);
});
