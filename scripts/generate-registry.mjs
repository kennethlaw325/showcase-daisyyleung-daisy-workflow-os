import { createHash } from "node:crypto";
import { access, readFile, readdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const outputPath = path.join(projectRoot, "app", "registry.generated.json");
const codexRoot = process.env.CODEX_HOME ?? path.join(os.homedir(), ".codex");
const obsidianCodexRoot =
  process.env.DEMO_OBSIDIAN_CODEX_ROOT ??
  path.join(os.homedir(), "Desktop", "Obsidian", "Codex");

async function hasReadableSkill(directory) {
  try {
    await access(path.join(directory, "SKILL.md"));
    return true;
  } catch {
    return false;
  }
}

async function listGlobalSkills() {
  const skillRoot = path.join(codexRoot, "skills");
  const entries = await readdir(skillRoot, { withFileTypes: true });
  const names = [];

  for (const entry of entries) {
    if (
      entry.isDirectory() &&
      entry.name !== ".system" &&
      (await hasReadableSkill(path.join(skillRoot, entry.name)))
    ) {
      names.push(entry.name);
    }
  }

  return names.sort();
}

async function listProjectSkills() {
  const projectRoot = path.join(obsidianCodexRoot, "Skills", "_projects");
  const projects = await readdir(projectRoot, { withFileTypes: true });
  const names = [];

  for (const project of projects) {
    if (!project.isDirectory()) continue;
    const projectPath = path.join(projectRoot, project.name);
    const skills = await readdir(projectPath, { withFileTypes: true });

    for (const skill of skills) {
      if (
        skill.isDirectory() &&
        (await hasReadableSkill(path.join(projectPath, skill.name)))
      ) {
        names.push(`${project.name}/${skill.name}`);
      }
    }
  }

  return names.sort();
}

function readTomlString(source, field) {
  return new RegExp(`^${field}\\s*=\\s*"([^"]+)"`, "mu").exec(source)?.[1] ?? null;
}

async function listAutomations() {
  const automationRoot = path.join(codexRoot, "automations");
  const entries = await readdir(automationRoot, { withFileTypes: true });
  const automations = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const configPath = path.join(automationRoot, entry.name, "automation.toml");

    try {
      const source = await readFile(configPath, "utf8");
      const status = readTomlString(source, "status");
      if (status !== "ACTIVE" && status !== "PAUSED") {
        throw new Error(`Unsupported automation status in ${entry.name}`);
      }
      automations.push(`${entry.name}:${status}`);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
  }

  return automations.sort();
}

function checksum(values) {
  return createHash("sha256").update(values.join("\n")).digest("hex");
}

function summarize(values) {
  return {
    count: values.length,
    checksum: checksum(values),
  };
}

async function createSnapshot() {
  const [globalSkills, projectSkills, automations] = await Promise.all([
    listGlobalSkills(),
    listProjectSkills(),
    listAutomations(),
  ]);

  return {
    schemaVersion: 1,
    capturedAt: new Date().toISOString(),
    status: "verified",
    sources: {
      globalSkills: summarize(globalSkills),
      projectSkills: summarize(projectSkills),
      automations: {
        ...summarize(automations),
        active: automations.filter((value) => value.endsWith(":ACTIVE")).length,
        paused: automations.filter((value) => value.endsWith(":PAUSED")).length,
      },
    },
  };
}

const snapshot = await createSnapshot();

if (process.argv.includes("--check")) {
  const committed = JSON.parse(await readFile(outputPath, "utf8"));
  const expected = JSON.stringify({
    schemaVersion: committed.schemaVersion,
    status: committed.status,
    sources: committed.sources,
  });
  const actual = JSON.stringify({
    schemaVersion: snapshot.schemaVersion,
    status: snapshot.status,
    sources: snapshot.sources,
  });

  if (actual !== expected) {
    throw new Error(
      "Registry snapshot is stale. Run `npm run registry:generate` and review the generated counts before publishing.",
    );
  }

  console.log(
    `Registry snapshot verified (${snapshot.sources.globalSkills.count} global skills, ${snapshot.sources.projectSkills.count} project skills, ${snapshot.sources.automations.count} automations).`,
  );
} else {
  await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  console.log(`Updated ${path.relative(projectRoot, outputPath)}.`);
}
