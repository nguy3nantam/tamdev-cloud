import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const SECRET_FILE = join(__dirname, '.secret');
const PORT = Number(process.env.PORT || 8777);

let running = false;
let queued = false;

function log(msg) {
  console.log(`[hook ${new Date().toLocaleTimeString()}] ${msg}`);
}

async function readSecret() {
  try {
    await stat(SECRET_FILE);
    return (await readFile(SECRET_FILE, 'utf8')).trim();
  } catch {
    return '';
  }
}

function validSignature(secret, body, provided) {
  if (!secret || !provided) return false;
  const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function deploy() {
  if (running) {
    queued = true;
    log('Có deploy đang chạy — đã xếp hàng.');
    return;
  }
  running = true;
  log('Bắt đầu deploy (git pull + rebuild)...');
  const child = spawn('bash', [join(ROOT, 'deploy.sh'), '--pull'], {
    cwd: ROOT,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (d) => process.stdout.write(d));
  child.stderr.on('data', (d) => process.stderr.write(d));
  child.on('close', (code) => {
    log(code === 0 ? '✔ Deploy xong.' : `✘ Deploy thất bại (exit ${code}).`);
    running = false;
    if (queued) {
      queued = false;
      deploy();
    }
  });
}

const server = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === 'POST' && req.url === '/deploy') {
    const secret = await readSecret();
    const signature = req.headers['x-hub-signature-256'];
    if (!validSignature(secret, body, signature)) {
      log('Từ chối: chữ ký không hợp lệ.');
      res.writeHead(401);
      res.end(JSON.stringify({ ok: false, error: 'invalid signature' }));
      return;
    }
    res.writeHead(202);
    res.end(JSON.stringify({ ok: true, message: 'deploy queued' }));
    deploy();
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ ok: false, error: 'not found' }));
});

server.listen(PORT, '0.0.0.0', () => log(`Webhook listen → http://0.0.0.0:${PORT} (POST /deploy, GET /health)`));
