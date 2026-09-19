import { watch, existsSync } from 'node:fs';
import { exec } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const deploy = process.argv.includes('--deploy');
const WATCH_DIRS = ['./src', './public'];
const FILES = ['./astro.config.mjs', './package.json'];

let timer = null;
let building = false;
let pending = false;

function log(msg) {
  console.log(`[watch] ${new Date().toLocaleTimeString()} ${msg}`);
}

function runBuild() {
  if (building) {
    pending = true;
    return;
  }
  building = true;
  const cmd = deploy ? 'bash deploy.sh' : 'npm run build';
  log(`Rebuilding… (${cmd})`);
  exec(cmd, { cwd: root }, (err, stdout, stderr) => {
    if (err) {
      log(`Build FAILED:\n${stdout}${stderr}`);
    } else {
      log(deploy ? '✔ Deployed ✔' : '✔ Build ok — xem tại dist/ ');
    }
    building = false;
    if (pending) {
      pending = false;
      runBuild();
    }
  });
}

function schedule() {
  clearTimeout(timer);
  timer = setTimeout(runBuild, 400);
}

WATCH_DIRS.forEach((dir) => {
  if (!existsSync(join(root, dir.replace('./', '')))) {
    console.warn(`[watch] Bỏ qua thư mục không tồn tại: ${dir}`);
    return;
  }
  watch(join(root, dir.replace('./', '')), { recursive: true }, (_evt, filename) => {
    if (!filename) return;
    log(`Thay đổi: ${filename}`);
    schedule();
  });
});

FILES.forEach((file) => {
  const abs = join(root, file.replace('./', ''));
  if (!existsSync(abs)) return;
  watch(abs, () => {
    log(`Thay đổi: ${file}`);
    schedule();
  });
});

log(`Watching: ${WATCH_DIRS.join(', ')}${deploy ? ' (auto-deploy ON)' : ''} — Ctrl+C để dừng`);
