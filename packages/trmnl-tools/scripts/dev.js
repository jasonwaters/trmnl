#!/usr/bin/env node

const { spawnSync } = require('child_process');
const path = require('path');

const COMPOSE_FILE = path.join(__dirname, '..', 'templates', 'docker-compose.yml');
const PROJECT_DIR = process.cwd();

const args = process.argv.slice(2);

const result = spawnSync(
  'docker',
  ['compose', '-f', COMPOSE_FILE, '--project-directory', PROJECT_DIR, ...args],
  { stdio: 'inherit', cwd: PROJECT_DIR }
);

process.exit(result.status ?? 1);
