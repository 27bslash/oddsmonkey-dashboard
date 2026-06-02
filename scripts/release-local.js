const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const dotenv = require('dotenv');

const rootDir = path.resolve(__dirname, '..');
const envPath = path.join(rootDir, '.env.publish');
const isWindows = process.platform === 'win32';
const npmBin = isWindows ? 'npm.cmd' : 'npm';
const npxBin = isWindows ? 'npx.cmd' : 'npx';

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

process.env.GH_TOKEN ||= process.env.GITHUB_TOKEN;
process.env.GITHUB_TOKEN ||= process.env.GH_TOKEN;

function run(command, args, options = {}) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: rootDir,
    env: process.env,
    stdio: options.capture ? 'pipe' : 'inherit',
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    if (options.capture && result.stderr) {
      console.error(result.stderr.trim());
    }

    process.exit(result.status ?? 1);
  }

  return options.capture ? result.stdout.trim() : '';
}

function requireCleanWorkingTree() {
  const status = run('git', ['status', '--porcelain'], { capture: true });

  if (status) {
    console.error(
      '\nWorking tree is not clean. Commit or stash your changes before running a local release.'
    );
    console.error(status);
    process.exit(1);
  }
}

if (!process.env.GH_TOKEN) {
  console.error('GH_TOKEN is not set. Add it to .env.publish before running a local release.');
  process.exit(1);
}

const branch = run('git', ['branch', '--show-current'], { capture: true });

if (branch !== 'main') {
  console.error(`Local releases must run from main. Current branch: ${branch || '(detached)'}`);
  process.exit(1);
}

requireCleanWorkingTree();

run('git', ['fetch', 'origin', 'main', '--tags']);
run('git', ['push', 'origin', 'main']);
run(npxBin, ['semantic-release', '--no-ci']);
run('git', ['fetch', 'origin', 'main', '--tags']);
run(npmBin, ['run', 'publish']);
