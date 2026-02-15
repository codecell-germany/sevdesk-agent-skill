#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { access, cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { Command } from "commander";

function resolveCodexHome(explicit?: string): string {
  if (explicit && explicit.trim()) return path.resolve(explicit.trim());
  const env = process.env.CODEX_HOME;
  if (env && env.trim()) return path.resolve(env.trim());
  return path.join(os.homedir(), ".codex");
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

async function isNonEmptyDir(p: string): Promise<boolean> {
  try {
    const s = await stat(p);
    if (!s.isDirectory()) return false;
    const items = await readdir(p);
    return items.length > 0;
  } catch {
    return false;
  }
}

function getPackageRoot(): string {
  // dist/installer.js -> package root is one level up
  return path.resolve(__dirname, "..");
}

function getSourceSkillDir(): string {
  return path.join(getPackageRoot(), "skills", "sevdesk-agent-cli");
}

function getTargetSkillDir(codexHome: string): string {
  return path.join(codexHome, "skills", "sevdesk-agent-cli");
}

function readPackageVersion(): string {
  try {
    const pkgPath = path.join(getPackageRoot(), "package.json");
    const raw = readFileSync(pkgPath, "utf8");
    const parsed = JSON.parse(raw) as { version?: unknown };
    return typeof parsed.version === "string" && parsed.version.trim() ? parsed.version : "0.0.0";
  } catch {
    return "0.0.0";
  }
}

async function installSkill(opts: { codexHome?: string; force?: boolean; dryRun?: boolean }) {
  const codexHome = resolveCodexHome(opts.codexHome);
  const src = getSourceSkillDir();
  const dst = getTargetSkillDir(codexHome);

  if (!(await pathExists(src))) {
    throw new Error(`Skill payload not found in package: ${src}`);
  }

  if (await isNonEmptyDir(dst)) {
    if (!opts.force) {
      throw new Error(
        `Skill already exists at ${dst}. Re-run with --force to overwrite.`
      );
    }
  }

  const skillsDir = path.dirname(dst);

  if (opts.dryRun) {
    process.stdout.write(
      [
        "[sevdesk-agent-skill] DRY RUN",
        `Would ensure: ${skillsDir}`,
        `Would ${opts.force ? "replace" : "create"}: ${dst}`,
        `From: ${src}`,
        "",
      ].join("\n") + "\n"
    );
    return;
  }

  await mkdir(skillsDir, { recursive: true });

  if (opts.force) {
    await rm(dst, { recursive: true, force: true });
  }

  // Node 20+: fs.cp is available.
  await cp(src, dst, { recursive: true });

  process.stdout.write(
    [
      "[sevdesk-agent-skill] Installed:",
      `- ${dst}`,
      "",
      "Next:",
      "- In Codex App, select/use skill: sevdesk-agent-cli",
      "",
    ].join("\n") + "\n"
  );
}

async function uninstallSkill(opts: { codexHome?: string; dryRun?: boolean }) {
  const codexHome = resolveCodexHome(opts.codexHome);
  const dst = getTargetSkillDir(codexHome);

  if (!(await pathExists(dst))) {
    process.stdout.write(`[sevdesk-agent-skill] Not installed: ${dst}\n`);
    return;
  }

  if (opts.dryRun) {
    process.stdout.write(
      ["[sevdesk-agent-skill] DRY RUN", `Would remove: ${dst}`, ""].join("\n") +
        "\n"
    );
    return;
  }

  await rm(dst, { recursive: true, force: true });
  process.stdout.write(`[sevdesk-agent-skill] Removed: ${dst}\n`);
}

async function doctor(opts: { codexHome?: string }) {
  const codexHome = resolveCodexHome(opts.codexHome);
  const src = getSourceSkillDir();
  const dst = getTargetSkillDir(codexHome);

  const checks: Array<{ ok: boolean; label: string }> = [];
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  checks.push({ ok: Number.isFinite(nodeMajor) && nodeMajor >= 20, label: "node >= 20" });
  checks.push({ ok: await pathExists(src), label: `payload exists (${src})` });
  checks.push({ ok: await pathExists(path.join(src, "SKILL.md")), label: "payload has SKILL.md" });
  checks.push({ ok: true, label: `codex home = ${codexHome}` });
  checks.push({
    ok: true,
    label: "codex home/skills dir will be created on install if missing",
  });
  checks.push({ ok: await pathExists(dst), label: `installed (${dst})` });

  const lines = ["[sevdesk-agent-skill] doctor", ...checks.map((c) => `${c.ok ? "ok" : "no"}\t${c.label}`)];
  process.stdout.write(`${lines.join("\n")}\n`);

  const failed = checks.some((c) => !c.ok && c.label.startsWith("payload"));
  if (failed) process.exitCode = 2;
}

const program = new Command();
program
  .name("sevdesk-agent-skill")
  .description("Install/remove the sevdesk-agent-cli skill for Codex (~/.codex/skills)")
  .version(readPackageVersion());

program
  .command("install")
  .description("Install the skill into Codex skills folder")
  .option("--codex-home <path>", "Override CODEX_HOME (default: ~/.codex)")
  .option("--force", "Overwrite existing installation", false)
  .option("--dry-run", "Print actions without writing", false)
  .action(async (opts) => {
    await installSkill({ codexHome: opts.codexHome, force: opts.force, dryRun: opts.dryRun });
  });

program
  .command("uninstall")
  .description("Remove the skill from Codex skills folder")
  .option("--codex-home <path>", "Override CODEX_HOME (default: ~/.codex)")
  .option("--dry-run", "Print actions without writing", false)
  .action(async (opts) => {
    await uninstallSkill({ codexHome: opts.codexHome, dryRun: opts.dryRun });
  });

program
  .command("doctor")
  .description("Print environment and installation diagnostics")
  .option("--codex-home <path>", "Override CODEX_HOME (default: ~/.codex)")
  .action(async (opts) => {
    await doctor({ codexHome: opts.codexHome });
  });

program.parseAsync(process.argv).catch((error) => {
  process.stderr.write(`[sevdesk-agent-skill] ${error.message}\n`);
  process.exitCode = 1;
});
