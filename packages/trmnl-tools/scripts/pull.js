#!/usr/bin/env node

const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
const http = require('http');
const { spawnSync } = require('child_process');
const yaml = require('js-yaml');

// Load .env from current directory or parent directories
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
require('dotenv').config({ path: path.join(process.cwd(), '..', '.env') });
require('dotenv').config({ path: path.join(process.cwd(), '../..', '.env') });

const LARAPAPER_URL = process.env.LARAPAPER_URL;
const LARAPAPER_TOKEN = process.env.LARAPAPER_TOKEN;

function printUsage() {
  console.log('Usage: trmnl-pull <trmnlp_recipe_id> [output_directory]');
  console.log('');
  console.log('Examples:');
  console.log('  trmnl-pull 210616');
  console.log('  trmnl-pull 210616 ./plugins/pretty-calendar');
  console.log('');
}

function parseArgs() {
  const args = process.argv.slice(2).filter(Boolean);
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(args.length === 0 ? 1 : 0);
  }

  const recipeId = args[0];
  const outputDir = args[1] ? path.resolve(args[1]) : process.cwd();

  if (!/^\d+$/.test(recipeId)) {
    console.error('❌ Error: recipe ID must be numeric');
    process.exit(1);
  }

  return { recipeId, outputDir };
}

function ensureEnv() {
  if (!LARAPAPER_URL) {
    console.error('❌ Error: LARAPAPER_URL not set in .env');
    process.exit(1);
  }

  if (!LARAPAPER_TOKEN) {
    console.error('❌ Error: LARAPAPER_TOKEN not set in .env');
    console.error(`   Get token from: ${LARAPAPER_URL}/plugins/api`);
    process.exit(1);
  }
}

function fetchArchive(recipeId) {
  return new Promise((resolve, reject) => {
    const apiUrl = new URL(`/api/plugin_settings/${recipeId}/archive`, LARAPAPER_URL);
    const isHttps = apiUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const req = httpModule.request(
      {
        method: 'GET',
        hostname: apiUrl.hostname,
        port: apiUrl.port || (isHttps ? 443 : 80),
        path: apiUrl.pathname + apiUrl.search,
        headers: {
          Authorization: `Bearer ${LARAPAPER_TOKEN}`,
          Accept: 'application/zip,application/json'
        }
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body);
            return;
          }

          let message = `HTTP ${res.statusCode}`;
          try {
            const json = JSON.parse(body.toString('utf8'));
            if (json.message) {
              message = json.message;
            }
          } catch (_) {
            // ignore parse error for non-json body
          }

          reject(new Error(`Failed to download archive: ${message}`));
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.end();
  });
}

function unzipArchive(zipPath, extractDir) {
  const result = spawnSync('unzip', ['-o', zipPath, '-d', extractDir], {
    stdio: 'pipe',
    encoding: 'utf8'
  });

  if (result.status !== 0) {
    const details = (result.stderr || result.stdout || '').trim();
    throw new Error(`unzip failed${details ? `: ${details}` : ''}`);
  }
}

function buildDefaultCustomFields(settings) {
  const customFields = Array.isArray(settings.custom_fields) ? settings.custom_fields : [];
  const defaults = {};
  customFields.forEach((field) => {
    if (!field || !field.keyname) return;
    if (Object.hasOwn(field, 'default')) {
      defaults[field.keyname] = field.default;
    }
  });
  return defaults;
}

function ensurePluginScaffold(outputDir, recipeId, settings) {
  const srcDir = path.join(outputDir, 'src');
  const tmpDir = path.join(outputDir, 'tmp');
  const pluginSlug = path.basename(outputDir);
  const prettyName = settings.name || pluginSlug;

  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  const packageJsonPath = path.join(outputDir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    const packageJson = {
      name: `@trmnl/${pluginSlug}`,
      version: '1.0.0',
      description: `${prettyName} plugin for TRMNL`,
      scripts: {
        start: 'trmnl-dev up',
        'start:detached': 'trmnl-dev up -d',
        stop: 'trmnl-dev down',
        restart: 'trmnl-dev restart',
        logs: 'trmnl-dev logs -f trmnlp',
        webhook: 'trmnl-dev up webhook-loader',
        publish: 'trmnl-publish',
        'publish:prod': 'LARAPAPER_URL=https://usetrmnl.com trmnl-publish'
      },
      dependencies: {
        '@trmnl-tools/core': '*'
      }
    };
    fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  }

  const gitignorePath = path.join(outputDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(
      gitignorePath,
      ['node_modules/', 'npm-debug.log', '.DS_Store', 'tmp/*', '!tmp/data.example.json', 'publish.config.yml', 'dist/'].join('\n') + '\n'
    );
  }

  const trmnlpPath = path.join(outputDir, '.trmnlp.yml');
  if (!fs.existsSync(trmnlpPath)) {
    const customFieldDefaults = buildDefaultCustomFields(settings);
    const trmnlpConfig = {
      watch: ['.trmnlp.yml', 'src'],
      custom_fields: customFieldDefaults,
      variables: { trmnl: {} }
    };
    fs.writeFileSync(trmnlpPath, `# TRMNLP configuration\n---\n${yaml.dump(trmnlpConfig, { lineWidth: -1 })}`);
  }

  const publishExamplePath = path.join(outputDir, 'publish.config.yml.example');
  if (!fs.existsSync(publishExamplePath)) {
    const publishExample = {
      recipes: [{ name: prettyName, trmnlp_id: recipeId }]
    };
    fs.writeFileSync(
      publishExamplePath,
      '# Copy to publish.config.yml and customize if needed\n' + yaml.dump(publishExample, { lineWidth: -1 })
    );
  }

  const tmpDataExample = path.join(tmpDir, 'data.example.json');
  if (!fs.existsSync(tmpDataExample)) {
    fs.writeFileSync(tmpDataExample, '{\n  "events": []\n}\n');
  }
}

function writePluginSourceFiles(extractDir, outputDir) {
  const srcDir = path.join(outputDir, 'src');
  fs.mkdirSync(srcDir, { recursive: true });

  const files = fs.readdirSync(extractDir);
  const copied = [];
  files.forEach((file) => {
    const lower = file.toLowerCase();
    if (!(lower.endsWith('.liquid') || lower === 'settings.yml')) return;
    const from = path.join(extractDir, file);
    const to = path.join(srcDir, file);
    fs.copyFileSync(from, to);
    copied.push(path.relative(outputDir, to));
  });
  return copied;
}

async function main() {
  console.log('⬇️  Pulling TRMNL plugin from LaraPaper...\n');

  ensureEnv();
  const { recipeId, outputDir } = parseArgs();
  fs.mkdirSync(outputDir, { recursive: true });

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'trmnl-pull-'));
  const zipPath = path.join(tempRoot, `recipe-${recipeId}.zip`);
  const extractDir = path.join(tempRoot, 'extract');
  fs.mkdirSync(extractDir, { recursive: true });

  try {
    console.log(`Fetching recipe archive for ID ${recipeId}...`);
    const zipBuffer = await fetchArchive(recipeId);
    fs.writeFileSync(zipPath, zipBuffer);

    console.log('Extracting archive...');
    unzipArchive(zipPath, extractDir);

    const settingsPath = path.join(extractDir, 'settings.yml');
    if (!fs.existsSync(settingsPath)) {
      throw new Error('Archive missing settings.yml');
    }

    const settings = yaml.load(fs.readFileSync(settingsPath, 'utf8')) || {};
    ensurePluginScaffold(outputDir, recipeId, settings);
    const copiedFiles = writePluginSourceFiles(extractDir, outputDir);

    console.log('\n✅ Pull complete!');
    console.log(`Output directory: ${outputDir}`);
    console.log('Files written:');
    copiedFiles.forEach((file) => {
      console.log(`  - ${file}`);
    });
    console.log('\nNext steps:');
    console.log(`  1. cd ${outputDir}`);
    console.log('  2. npm start');
    console.log('  3. Review src/settings.yml and templates');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
