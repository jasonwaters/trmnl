# `@trmnl-tools/core`

Shared CLI tooling for TRMNL plugin development and LaraPaper sync workflows.

## Commands

### `trmnl-dev`

Runs local TRMNL plugin development services (Docker-based).

```bash
trmnl-dev up
```

### `trmnl-publish`

Publishes local plugin source files to one or more LaraPaper recipes configured in `publish.config.yml`.

```bash
trmnl-publish
```

### `trmnl-pull`

Pulls (downloads) an existing LaraPaper recipe archive and recreates plugin files locally.

This is the inverse of `trmnl-publish`.

```bash
trmnl-pull <trmnlp_recipe_id> [output_directory]
```

Examples:

```bash
trmnl-pull 210616
trmnl-pull 210616 ./plugins/pretty-calendar
```

## `trmnl-pull` behavior

- Downloads archive from LaraPaper API:
  - `GET /api/plugin_settings/<id>/archive`
- Extracts and writes:
  - `src/settings.yml`
  - `src/*.liquid` (including shared templates like `shared.liquid`)
- If missing, scaffolds plugin basics:
  - `package.json`
  - `.gitignore`
  - `.trmnlp.yml` (using defaults from `settings.yml` custom fields)
  - `publish.config.yml.example`
  - `tmp/data.example.json`

## Required environment variables

These are read from `.env` in the current directory and parent directories:

- `LARAPAPER_URL` (e.g. `https://trmnl.radfam.com`)
- `LARAPAPER_TOKEN` (Bearer token from `/plugins/api`)

## Typical workflow

```bash
# 1) Pull recipe to local plugin folder
trmnl-pull 210616 ./plugins/pretty-calendar

# 2) Iterate locally
cd ./plugins/pretty-calendar
npm start

# 3) Publish updates back when ready
npm run publish
```
# @trmnl-tools/core

Shared development and publishing tools for TRMNL plugins.

## Features

- **`trmnl-dev`** - Local development server wrapping Docker Compose with a shared `docker-compose.yml`
- **`trmnl-publish`** - Multi-recipe publishing to LaraPaper (or other BYOS servers)

## Installation

This package is designed to be used in an npm workspace:

```json
{
  "dependencies": {
    "@trmnl-tools/core": "*"
  }
}
```

## Commands

### `trmnl-dev` - Local Development

Wraps `docker compose` using a shared compose configuration. All arguments are passed through to Docker Compose, with volume mounts resolving relative to the plugin directory.

```bash
trmnl-dev up              # Start trmnlp + webhook loader
trmnl-dev up -d           # Start in background
trmnl-dev down            # Stop services
trmnl-dev restart         # Restart services
trmnl-dev logs -f trmnlp  # Follow server logs
trmnl-dev up webhook-loader  # Reload webhook data
```

Plugins use these via npm scripts (`npm start`, `npm stop`, etc.).

### `trmnl-publish` - Publishing

Publishes plugin templates to one or more recipes on your BYOS server. Reads recipe configuration from `publish.config.yml` in the plugin directory.

```bash
trmnl-publish             # Publish to configured recipes
```

## License

MIT
