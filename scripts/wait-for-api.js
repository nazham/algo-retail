const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 0. Bypass wait if in a CI environment (Vercel, GitHub Actions, etc.)
if (process.env.CI) {
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
