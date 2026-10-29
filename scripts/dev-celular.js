// Sobe API + frontend acessíveis pela rede local e mostra a URL para abrir no celular.
// Uso: npm run dev:celular   (ou clique duplo em dev-celular.bat no Windows)
import { spawn, spawnSync } from 'node:child_process';
import { connect } from 'node:net';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const FRONTEND_PORT = 5173;
const API_PORT = Number(process.env.PORT) || 3333;
const IS_WINDOWS = process.platform === 'win32';

// Adaptadores virtuais (WSL, Docker, VPN, VMs) têm IPs que o celular não alcança.
const VIRTUAL_ADAPTER =
  /vethernet|virtual|vmware|vbox|docker|wsl|hyper-v|loopback|tailscale|zerotier|vpn|utun|bridge/i;

function findLocalIp() {
  const candidates = [];
  for (const [name, addresses] of Object.entries(networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family !== 'IPv4' || address.internal) continue;
      if (address.address.startsWith('169.254.')) continue; // sem DHCP
      candidates.push({ name, ip: address.address, virtual: VIRTUAL_ADAPTER.test(name) });
    }
  }
  const isPrivate = ({ ip }) => /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
  const best =
    candidates.find((c) => !c.virtual && c.ip.startsWith('192.168.')) ??
    candidates.find((c) => !c.virtual && isPrivate(c)) ??
    candidates.find((c) => !c.virtual) ??
    candidates[0];
  return best?.ip;
}

const ip = findLocalIp();
if (!ip) {
  console.error('Não encontrei um IP de rede local. Verifique se o Wi-Fi/cabo está conectado.');
  process.exit(1);
}
// Testa se já existe algum servidor escutando na porta (em IPv4 ou IPv6).
function isPortBusy(port) {
  const tryHost = (host) =>
    new Promise((resolve) => {
      const socket = connect({ port, host });
      socket.setTimeout(500);
      socket.once('connect', () => (socket.destroy(), resolve(true)));
      socket.once('error', () => resolve(false));
      socket.once('timeout', () => (socket.destroy(), resolve(false)));
    });
  return Promise.all([tryHost('127.0.0.1'), tryHost('::1')]).then((r) => r.some(Boolean));
}

// Se outro servidor (outro terminal) já ocupa a porta padrão, usa a próxima livre.
async function findFreePort(preferred) {
  for (let port = preferred; port < preferred + 20; port++) {
    if (!(await isPortBusy(port))) {
      if (port !== preferred) console.log(`Porta ${preferred} ocupada; usando ${port}.`);
      return port;
    }
  }
  console.error(`Nenhuma porta livre entre ${preferred} e ${preferred + 19}.`);
  process.exit(1);
}

const apiPort = await findFreePort(API_PORT);
const webPort = await findFreePort(FRONTEND_PORT);
const publicUrl = `http://${ip}:${webPort}`;

const env = {
  ...process.env,
  PORT: String(apiPort),
  // O proxy do Vite precisa apontar para a API desta execução, não para outra que esteja aberta.
  API_PROXY_TARGET: `http://localhost:${apiPort}`,
  // APP_PUBLIC_URL com o IP: libera login/edições vindos do celular e faz o QR Code apontar para cá.
  APP_PUBLIC_URL: publicUrl,
  FORCE_COLOR: '1',
};

const children = [
  run('API', ['run', 'dev', '-w', 'backend']),
  run('WEB', [
    'run',
    'dev',
    '-w',
    'frontend',
    '--',
    '--host',
    '0.0.0.0',
    '--port',
    String(webPort),
    '--strictPort',
  ]),
];

function run(label, args) {
  // No Windows o npm é um .cmd e precisa de shell; os argumentos são fixos, sem entrada do usuário.
  const child = spawn(IS_WINDOWS ? `npm ${args.join(' ')}` : 'npm', IS_WINDOWS ? [] : args, {
    cwd: ROOT,
    env,
    shell: IS_WINDOWS,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const prefix = (chunk) =>
    chunk
      .toString()
      .split(/\r?\n/)
      .filter((line) => line.trim())
      .map((line) => `[${label}] ${line}`)
      .join('\n') + '\n';
  child.stdout.on('data', (chunk) => process.stdout.write(prefix(chunk)));
  child.stderr.on('data', (chunk) => process.stderr.write(prefix(chunk)));
  child.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`\n[${label}] parou (código ${code}). Encerrando tudo...`);
      shutdown(code ?? 1);
    }
  });
  return child;
}

function printBanner() {
  const lines = [
    'ACESSE PELO CELULAR (mesma rede Wi-Fi):',
    '',
    `  ${publicUrl}`,
    '',
    `  Cardápio demo:  ${publicUrl}/cardapio/demo`,
    `  Retaguarda:     ${publicUrl}/admin`,
    '',
    'Para parar: Ctrl+C',
  ];
  const width = Math.max(...lines.map((l) => l.length)) + 4;
  const bar = '='.repeat(width);
  console.log(`\n${bar}\n${lines.map((l) => `  ${l}`).join('\n')}\n${bar}\n`);
}

// Mostra a URL depois que os logs iniciais passaram, e de novo a cada vez que o Vite reinicia.
setTimeout(printBanner, 4000);

let shuttingDown = false;
function shutdown(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode !== null || !child.pid) continue;
    // No Windows o npm abre subprocessos; taskkill /T encerra a árvore inteira.
    if (IS_WINDOWS)
      spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
    else child.kill('SIGTERM');
  }
  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
