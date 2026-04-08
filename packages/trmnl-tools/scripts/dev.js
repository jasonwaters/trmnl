#!/usr/bin/env node

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COMPOSE_FILE = path.join(__dirname, '..', 'templates', 'docker-compose.yml');
const PROJECT_DIR = process.cwd();

const dataFile = path.join(PROJECT_DIR, 'tmp', 'data.json');
const exampleFile = path.join(PROJECT_DIR, 'tmp', 'data.example.json');

if (!fs.existsSync(dataFile)) {
  fs.mkdirSync(path.join(PROJECT_DIR, 'tmp'), { recursive: true });

  if (fs.existsSync(exampleFile)) {
    fs.copyFileSync(exampleFile, dataFile);
    console.log('Created tmp/data.json from data.example.json');
  } else {
    fs.writeFileSync(dataFile, '{}');
    console.log('Created empty tmp/data.json');
  }
}

const args = process.argv.slice(2);

const result = spawnSync(
  'docker',
  ['compose', '-f', COMPOSE_FILE, '--project-directory', PROJECT_DIR, ...args],
  { stdio: 'inherit', cwd: PROJECT_DIR }
);

process.exit(result.status ?? 1);
