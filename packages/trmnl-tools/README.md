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
