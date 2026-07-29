const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 0. Bypass wait if in a CI environment (Vercel, GitHub Actions, etc.)
if (process.env.CI) {
  process.exit(0);
}

function getProcessInfoWin32(pid) {
  try {
    const cmd = `powershell -NoProfile -NonInteractive -Command "try { $p = Get-CimInstance Win32_Process -Filter 'ProcessId = ${pid}'; if (-not $p) { $p = Get-WmiObject Win32_Process -Filter 'ProcessId = ${pid}' }; if ($p) { @{ ppid = $p.ParentProcessId; command = $p.CommandLine } | ConvertTo-Json -Compress } } catch {}"`;
    const out = execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 })
      .toString()
      .trim();
    if (out) {
      const data = JSON.parse(out);
      if (data && data.ppid) {
        return { ppid: Number(data.ppid), command: data.command || '' };
      }
    }
  } catch (e) {}

  try {
    const out = execSync(
      `wmic process where processid=${pid} get commandline,parentprocessid /format:csv`,
      {
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 3000,
      },
    )
      .toString()
      .trim();
    const lines = out.split(/\r?\n/).filter(Boolean);
    if (lines.length >= 2) {
      const lastLine = lines[lines.length - 1];
      const parts = lastLine.split(',');
      if (parts.length >= 3) {
        const ppid = parseInt(parts[parts.length - 1], 10);
        const command = parts.slice(1, -1).join(',');
        if (!isNaN(ppid)) {
          return { ppid, command };
        }
      }
    }
  } catch (e) {}

  return null;
}

// 0.5. Bypass wait if the command is running with a pnpm filter (e.g. pnpm --filter desktop-pos dev)
function isPnpmFiltered() {
  if (process.env.npm_config_filter || process.env.npm_config_F) {
    return true;
  }

  let pid = process.pid;
  const regex = /(?:^|\s|["'])(--filter|-F)(?:\s|=|["']|$)/;
  while (pid && pid > 0) {
    try {
      let ppid = null;
      let command = '';

      if (process.platform === 'win32') {
        const info = getProcessInfoWin32(pid);
        if (!info) break;
        ppid = info.ppid;
        command = info.command;
      } else {
        const out = execSync(`ps -p ${pid} -o ppid= -o args=`, {
          stdio: ['ignore', 'pipe', 'ignore'],
        })
          .toString()
          .trim();
        const match = out.match(/^(\d+)\s+(.+)$/);
        if (!match) break;
        ppid = parseInt(match[1], 10);
        command = match[2];
      }

      if (command.toLowerCase().includes('pnpm') && regex.test(command)) {
        return true;
      }

      if (!ppid || ppid === pid) break;
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
