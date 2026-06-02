const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env.publish');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

process.env.GH_TOKEN ||= process.env.GITHUB_TOKEN;
process.env.GITHUB_TOKEN ||= process.env.GH_TOKEN;

if (!process.env.GH_TOKEN) {
  console.error('GH_TOKEN is not set. Add it to .env.publish or your shell environment.');
  process.exit(1);
}

const builderCli = path.join(rootDir, 'node_modules', 'electron-builder', 'cli.js');
const result = spawnSync(process.execPath, [builderCli, '--publish', 'always'], {
  cwd: rootDir,
  env: process.env,
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
