#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const FormData = require('form-data');
const yaml = require('js-yaml');
const archiver = require('archiver');

// Load .env from current directory or parent directories
require('dotenv').config({ path: path.join(process.cwd(), '.env') });
require('dotenv').config({ path: path.join(process.cwd(), '..', '.env') });
require('dotenv').config({ path: path.join(process.cwd(), '../..', '.env') });

const ROOT_DIR = process.cwd();
const CONFIG_PATH = path.join(ROOT_DIR, 'publish.config.yml');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const SETTINGS_PATH = path.join(SRC_DIR, 'settings.yml');

console.log('🚀 Publishing TRMNL plugin to LaraPaper...\n');

const LARAPAPER_URL = process.env.LARAPAPER_URL;
const LARAPAPER_TOKEN = process.env.LARAPAPER_TOKEN;

if (!LARAPAPER_URL) {
  console.error('❌ Error: LARAPAPER_URL not set in .env file');
  console.error('   Example: LARAPAPER_URL=https://your-larapaper-instance.com');
  process.exit(1);
}

if (!LARAPAPER_TOKEN) {
  console.error('❌ Error: LARAPAPER_TOKEN not set in .env file');
  console.error(`   Get your token from: ${LARAPAPER_URL}/plugins/api`);
  process.exit(1);
}

let publishConfig;
try {
  const configContent = fs.readFileSync(CONFIG_PATH, 'utf8');
  publishConfig = yaml.load(configContent);
} catch (err) {
  console.error(`❌ Error reading ${path.basename(CONFIG_PATH)}:`, err.message);
  console.error('   Make sure the file exists and is valid YAML');
  process.exit(1);
}

if (!publishConfig.recipes || !Array.isArray(publishConfig.recipes) || publishConfig.recipes.length === 0) {
  console.error(`❌ Error: No recipes configured in ${path.basename(CONFIG_PATH)}`);
  console.error('   Add at least one recipe with name and trmnlp_id');
  process.exit(1);
}

for (const recipe of publishConfig.recipes) {
  if (!recipe.name || !recipe.trmnlp_id) {
    console.error(`❌ Error: Invalid recipe configuration in ${path.basename(CONFIG_PATH)}`);
    console.error('   Each recipe must have both "name" and "trmnlp_id" fields');
    process.exit(1);
  }
}

console.log(`Found ${publishConfig.recipes.length} recipe(s) to publish:\n`);
publishConfig.recipes.forEach((recipe, index) => {
  console.log(`  ${index + 1}. ${recipe.name} (${recipe.trmnlp_id})`);
});
console.log('');

if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

async function packageForRecipe(recipe) {
  return new Promise((resolve, reject) => {
    const zipPath = path.join(DIST_DIR, `plugin-${recipe.trmnlp_id}.zip`);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      resolve(zipPath);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    const settingsContent = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const settings = yaml.load(settingsContent);
    
    settings.id = recipe.trmnlp_id;
    settings.name = recipe.name;
    
    const modifiedSettings = yaml.dump(settings, { lineWidth: -1 });
    archive.append(modifiedSettings, { name: 'src/settings.yml' });

    const files = fs.readdirSync(SRC_DIR);
    for (const file of files) {
      if (file.endsWith('.liquid') && file !== 'settings.yml') {
        const filePath = path.join(SRC_DIR, file);
        archive.file(filePath, { name: path.join('src', file) });
      }
    }

    archive.finalize();
  });
}

async function publishToRecipe(recipe, zipPath) {
  return new Promise((resolve, reject) => {
    console.log(`\n📤 Publishing to: ${recipe.name}`);
    console.log(`   Recipe ID: ${recipe.trmnlp_id}`);
    
    const form = new FormData();
    form.append('file', fs.createReadStream(zipPath), {
      filename: 'plugin.zip',
      contentType: 'application/zip'
    });

    const apiUrl = new URL(`/api/plugin_settings/${recipe.trmnlp_id}/archive`, LARAPAPER_URL);
    const isHttps = apiUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const options = {
      method: 'POST',
      hostname: apiUrl.hostname,
      port: apiUrl.port || (isHttps ? 443 : 80),
      path: apiUrl.pathname + apiUrl.search,
      headers: {
        ...form.getHeaders(),
        'Authorization': `Bearer ${LARAPAPER_TOKEN}`,
        'Accept': 'application/json'
      }
    };

    const req = httpModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`   ✅ Published successfully!`);
            console.log(`   URL: ${LARAPAPER_URL}/plugins/recipe/${recipe.trmnlp_id}`);
            resolve({ recipe, success: true });
          } else {
            console.error(`   ❌ Publishing failed (${res.statusCode})`);
            if (response.message) {
              console.error(`   Error: ${response.message}`);
            }
            if (response.errors) {
              console.error('   Validation errors:', JSON.stringify(response.errors, null, 2));
            }
            resolve({ recipe, success: false, error: response.message || 'Unknown error' });
          }
        } catch (err) {
          console.error(`   ❌ Error parsing response:`, data);
          resolve({ recipe, success: false, error: 'Invalid response' });
        }
      });
    });

    req.on('error', (err) => {
      console.error(`   ❌ Request failed:`, err.message);
      resolve({ recipe, success: false, error: err.message });
    });

    form.pipe(req);
  });
}

async function publishAll() {
  const results = [];
  
  console.log('📦 Creating recipe-specific packages...\n');
  
  for (const recipe of publishConfig.recipes) {
    try {
      console.log(`   Packaging for: ${recipe.name}`);
      const zipPath = await packageForRecipe(recipe);
      const result = await publishToRecipe(recipe, zipPath);
      results.push(result);
      
      fs.unlinkSync(zipPath);
    } catch (err) {
      console.error(`   ❌ Error packaging/publishing ${recipe.name}:`, err.message);
      results.push({ recipe, success: false, error: err.message });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Publishing Summary\n');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (successful.length > 0) {
    console.log(`✅ Successfully published to ${successful.length} recipe(s):`);
    successful.forEach(r => console.log(`   - ${r.recipe.name}`));
    console.log('');
  }
  
  if (failed.length > 0) {
    console.log(`❌ Failed to publish to ${failed.length} recipe(s):`);
    failed.forEach(r => console.log(`   - ${r.recipe.name}: ${r.error}`));
    console.log('');
    process.exit(1);
  }
  
  console.log('🎉 All recipes updated successfully!');
}

publishAll().catch(err => {
  console.error('\n❌ Unexpected error:', err);
  process.exit(1);
});
