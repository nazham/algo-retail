const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 0. Bypass wait if in a CI environment (Vercel, GitHub Actions, etc.)
if (process.env.CI) {
  process.exit(0);
}

// 0.5. Bypass wait if the command is running with a pnpm filter (e.g. pnpm --filter desktop-pos dev)
function isPnpmFiltered() {
  let pid = process.pid;
  const regex = /(?:^|\s)(--filter|-F)(?:\s|=|$)/;
  while (pid) {
    try {
      const out = execSync(`ps -p ${pid} -o ppid= -o args=`, {
        stdio: ['ignore', 'pipe', 'ignore'],
      })
        .toString()
        .trim();
      const match = out.match(/^(\d+)\s+(.+)$/);
      if (!match) break;
      const ppid = parseInt(match[1], 10);
      const command = match[2];
      if (command.includes('pnpm') && regex.test(command)) {
        return true;
      }
      pid = ppid;
    } catch (e) {
      break;
    }
  }
  return false;
}

if (isPnpmFiltered()) {
  console.log('\x1b[36m[wait-for-api]\x1b[0m Bypassing wait check for filtered command.');
  process.exit(0);
}

// 1. Resolve path to backend .env
const apiEnvPath = path.join(__dirname, '../apps/backend-api/.env');
let port = 8080; // Default fallback

// 2. Try to parse PORT from backend .env
if (fs.existsSync(apiEnvPath)) {
  const envContent = fs.readFileSync(apiEnvPath, 'utf8');
  const match = envContent.match(/^PORT=(\d+)/m);
  if (match) {
    port = match[1];
  }
}

// 3. Wait for the port to be ready
console.log(`\x1b[36m[wait-for-api]\x1b[0m Waiting for backend on port ${port}...`);
try {
  execSync(`npx -y wait-on tcp:${port}`, { stdio: 'inherit' });
} catch (e) {
  process.exit(1);
}
