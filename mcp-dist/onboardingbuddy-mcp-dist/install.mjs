// One-shot installer: merges the OnboardingBuddy connector into Claude
// Desktop's config (keeping any existing connectors) and points it at the
// server file in THIS folder. Run automatically by INSTALL.bat.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const here = path.dirname(decodeURIComponent(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")));
const serverPath = path.join(here, "server.mjs");

const cfgPath =
  process.platform === "darwin"
    ? path.join(os.homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json")
    : path.join(os.homedir(), "AppData", "Roaming", "Claude", "claude_desktop_config.json");

let cfg = { mcpServers: {} };
if (fs.existsSync(cfgPath)) {
  try {
    cfg = JSON.parse(fs.readFileSync(cfgPath, "utf8"));
  } catch {
    console.log("  Existing config file was corrupted — starting fresh.");
    cfg = { mcpServers: {} };
  }
  try {
    fs.writeFileSync(cfgPath + ".backup", JSON.stringify(cfg, null, 2));
  } catch {
    /* backup is best-effort */
  }
} else {
  fs.mkdirSync(path.dirname(cfgPath), { recursive: true });
}

cfg.mcpServers = cfg.mcpServers || {};
cfg.mcpServers["onboardingbuddy"] = {
  // Full path, not bare "node" — Claude Desktop spawns this directly (not
  // through a shell), so it won't see PATH updates from a Node install that
  // just happened in this same session/without a reboot.
  command: process.execPath,
  args: [serverPath],
};

fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
console.log("\n  Connector installed. Restart Claude Desktop to use 'onboardingbuddy'.\n");
console.log("  Config file: " + cfgPath);
console.log("  Connectors now: " + Object.keys(cfg.mcpServers).join(", ") + "\n");
