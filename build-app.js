/**
 * Builds "Ambabe Karaoke.app" for single-click run on macOS.
 * Run once: node build-app.js
 * Then copy "Ambabe Karaoke.app" to your Big Sur laptop (e.g. Applications).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname);
const APP_NAME = 'Ambabe Karaoke.app';
const APP_PATH = path.join(ROOT, APP_NAME);
const RESOURCES_APP = path.join(APP_PATH, 'Contents', 'Resources', 'app');
const MACOS = path.join(APP_PATH, 'Contents', 'MacOS');

const LAUNCHER = `#!/bin/bash
cd "$(dirname "$0")/../Resources/app"
if ! command -v node &>/dev/null; then
  osascript -e 'display alert "Node.js required" message "Please install Node.js from https://nodejs.org then try again."'
  exit 1
fi
open "http://localhost:3847/" 2>/dev/null
exec node server.js
`;

const INFO_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>launcher</string>
  <key>CFBundleIdentifier</key>
  <string>tv.ambabe.karaoke</string>
  <key>CFBundleName</key>
  <string>Ambabe Karaoke</string>
  <key>CFBundlePackageType</key>
  <string>APPL</string>
</dict>
</plist>
`;

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  mkdirp(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    mkdirp(dest);
    for (const name of fs.readdirSync(src)) {
      copyRecursive(path.join(src, name), path.join(dest, name));
    }
  } else {
    copyFile(src, dest);
  }
}

// Clean previous build
if (fs.existsSync(APP_PATH)) {
  fs.rmSync(APP_PATH, { recursive: true });
}

mkdirp(RESOURCES_APP);
mkdirp(MACOS);

// Copy app files (exclude build script, .command, .app, node_modules, .git)
const toCopy = ['server.js', 'package.json', 'public'];
for (const name of toCopy) {
  const src = path.join(ROOT, name);
  if (fs.existsSync(src)) {
    copyRecursive(src, path.join(RESOURCES_APP, name));
  }
}

// Optional: copy queue.json if present so queue persists
const queueSrc = path.join(ROOT, 'queue.json');
if (fs.existsSync(queueSrc)) {
  fs.copyFileSync(queueSrc, path.join(RESOURCES_APP, 'queue.json'));
}

// Launcher script
const launcherPath = path.join(MACOS, 'launcher');
fs.writeFileSync(launcherPath, LAUNCHER, 'utf8');
fs.chmodSync(launcherPath, 0o755);

// Info.plist
fs.writeFileSync(path.join(APP_PATH, 'Contents', 'Info.plist'), INFO_PLIST, 'utf8');

console.log('Built:', APP_PATH);
console.log('Copy this app to your Big Sur laptop and double-click to run.');
