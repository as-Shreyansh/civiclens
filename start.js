import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("\n=======================================================");
console.log("  CIVICLENS — Smart Road Intelligence Platform");
console.log("=======================================================\n");

// 1. Check Node.js version
const nodeVersion = process.versions.node;
const [major, minor] = nodeVersion.split(".").map(Number);
if (major < 22 || (major === 22 && minor < 5)) {
  console.warn(`[WARNING] Your Node.js version is v${nodeVersion}.`);
  console.warn("Node.js v22.5.0+ is recommended for the built-in native SQLite engine.");
  console.warn("If you encounter any issues, please update Node.js at https://nodejs.org/\n");
}

// 2. Check if dependencies are installed in root
const rootModules = path.join(__dirname, "node_modules");
if (!fs.existsSync(rootModules)) {
  console.log("[Setup] First-time setup detected. Installing root dependencies...");
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  execSync(`${npmCmd} install`, { stdio: "inherit", cwd: __dirname });
}

// 3. Check if backend dependencies are installed in server/
const serverModules = path.join(__dirname, "server", "node_modules");
if (!fs.existsSync(serverModules)) {
  console.log("[Setup] Installing backend dependencies in server/...");
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
  execSync(`${npmCmd} install`, { stdio: "inherit", cwd: path.join(__dirname, "server") });
}

// 4. Ensure .env exists with default API URL
const envPath = path.join(__dirname, ".env");
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, "VITE_API_BASE_URL=http://localhost:5000/api\n");
}

// 5. Ensure vite runner wrapper exists on Windows
if (process.platform === "win32") {
  const binDir = path.join(rootModules, ".bin");
  if (!fs.existsSync(binDir)) fs.mkdirSync(binDir, { recursive: true });
  const viteCmd = path.join(binDir, "vite.cmd");
  if (!fs.existsSync(viteCmd)) {
    fs.writeFileSync(
      viteCmd,
      `@ECHO off\r\nnode "%~dp0\\..\\vite\\bin\\vite.js" %*\r\n`
    );
  }
}

console.log("🚀 Launching backend and frontend concurrently...");
console.log("   • Frontend App:   http://localhost:8080");
console.log("   • Backend Server: http://localhost:5000\n");

// 6. Launch Backend Server
const serverScript = path.join(__dirname, "server", "index.js");
const backend = spawn(process.execPath, [serverScript], {
  stdio: "inherit",
  shell: false,
});

// 7. Launch Frontend Dev Server
const viteScript = path.join(__dirname, "node_modules", "vite", "bin", "vite.js");
const frontend = spawn(process.execPath, [viteScript, "dev"], {
  stdio: "inherit",
  shell: false,
});

function cleanup() {
  console.log("\n[CIVICLENS] Stopping servers...");
  try { backend.kill(); } catch {}
  try { frontend.kill(); } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

backend.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`[CIVICLENS] Backend stopped with code ${code}`);
  }
});

frontend.on("exit", (code) => {
  if (code && code !== 0) {
    console.error(`[CIVICLENS] Frontend stopped with code ${code}`);
  }
});
