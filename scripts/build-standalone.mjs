import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const outputPath = path.join(projectRoot, "Demo-Workflow-OS.html");

const buildResult = await build({
  absWorkingDir: projectRoot,
  bundle: true,
  entryPoints: ["standalone/entry.tsx"],
  format: "iife",
  jsx: "automatic",
  logLevel: "warning",
  minify: true,
  platform: "browser",
  sourcemap: false,
  target: ["es2018"],
  write: false,
});

const entryChunk = buildResult.outputFiles?.[0];

if (!entryChunk) {
  throw new Error("Standalone build did not produce JavaScript.");
}

const poster = await readFile(
  path.join(projectRoot, "public", "workflow-os-journey-v2-poster.jpg"),
);
const posterDataUrl = `data:image/jpeg;base64,${poster.toString("base64")}`;
const css = (await readFile(path.join(projectRoot, "app/globals.css"), "utf8"))
  .replace(/^@import\s+["']tailwindcss["'];?\s*/u, "")
  .replace(
    'url("/workflow-os-journey-v2-poster.jpg")',
    `url("${posterDataUrl}")`,
  )
  .replaceAll("</style", "<\\/style");
const javascript = entryChunk.text.replaceAll("</script", "<\\/script");

const html = `<!doctype html>
<html lang="zh-HK">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="示範用戶的中英雙語工作流程、automation 與底層技能地圖。">
    <title>Demo Workflow OS</title>
    <style>${css}</style>
  </head>
  <body>
    <div id="root"></div>
    <noscript>請啟用 JavaScript 以使用 Demo Workflow OS 的篩選與中英切換功能。</noscript>
    <script>${javascript}</script>
  </body>
</html>
`;

const forbiddenExternalDependencies = [
  /<script[^>]+src=/i,
  /<link[^>]+rel=["']stylesheet["']/i,
  /https?:\/\/localhost(?::\d+)?/i,
];

if (forbiddenExternalDependencies.some((pattern) => pattern.test(html))) {
  throw new Error("Standalone HTML still contains an external runtime dependency.");
}

await writeFile(outputPath, html, "utf8");

console.log(
  `Created ${path.basename(outputPath)} (${Math.round(Buffer.byteLength(html) / 1024)} KB)`,
);
