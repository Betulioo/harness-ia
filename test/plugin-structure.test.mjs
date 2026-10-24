// Estructura del plugin: lo que Claude Code necesita para cargarlo (manifiestos, hooks y frontmatter de skills).
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const PLUGIN_ROOT = path.join(REPO_ROOT, "plugin");

const readJson = (filePath) => JSON.parse(readFileSync(filePath, "utf8"));

function frontmatter(markdownPath) {
  const match = readFileSync(markdownPath, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([\w-]+):\s*(.*)$/))
      .filter(Boolean)
      .map((fieldMatch) => [fieldMatch[1], fieldMatch[2].replace(/^"|"$/g, "")]),
  );
}

describe("Manifiestos del plugin", () => {
  it("el marketplace apunta a la carpeta del plugin y los nombres coinciden", () => {
    const marketplace = readJson(path.join(REPO_ROOT, ".claude-plugin", "marketplace.json"));
    const plugin = readJson(path.join(PLUGIN_ROOT, ".claude-plugin", "plugin.json"));

    const result = marketplace.plugins.map((entry) => ({ name: entry.name, exists: existsSync(path.join(REPO_ROOT, entry.source)) }));

    assert.deepEqual(result, [{ name: plugin.name, exists: true }]);
  });

  it("cada hook apunta a un script que existe", () => {
    const { hooks } = readJson(path.join(PLUGIN_ROOT, "hooks", "hooks.json"));
    const commands = Object.values(hooks).flatMap((groups) => groups.flatMap((group) => group.hooks.map((hook) => hook.command)));

    const missing = commands
      .map((command) => command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"]+)/)?.[1])
      .filter((scriptPath) => !scriptPath || !existsSync(path.join(PLUGIN_ROOT, scriptPath)));

    assert.deepEqual(missing, []);
  });
});

describe("Skills y agentes", () => {
  it("cada skill tiene name igual a su carpeta y una description", () => {
    const skillsDir = path.join(PLUGIN_ROOT, "skills");

    const problems = readdirSync(skillsDir).flatMap((skillName) => {
      const fields = frontmatter(path.join(skillsDir, skillName, "SKILL.md"));
      return fields.name === skillName && fields.description ? [] : [skillName];
    });

    assert.deepEqual(problems, []);
  });

  it("cada agente tiene name igual a su archivo y una description", () => {
    const agentsDir = path.join(PLUGIN_ROOT, "agents");

    const problems = readdirSync(agentsDir).flatMap((fileName) => {
      const fields = frontmatter(path.join(agentsDir, fileName));
      return fields.name === path.basename(fileName, ".md") && fields.description ? [] : [fileName];
    });

    assert.deepEqual(problems, []);
  });
});
