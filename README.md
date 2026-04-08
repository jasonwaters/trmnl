# TRMNL Custom Plugins

A collection of custom plugins for TRMNL e-ink displays, designed for [BYOS (Build Your Own Server)](https://docs.trmnl.com/go/diy/byos) users.

> **Note**: These plugins have been developed and tested with [LaraPaper](https://github.com/usetrmnl/larapaper). They may work with other BYOS implementations that support the plugin system, but compatibility is not guaranteed.

## Available Plugins

### Calendar
Full-featured calendar display using the FullCalendar library. Supports multiple event sources, webhook-based updates, and configurable view modes (one week, two weeks, or full month).

### Health Chart
Interactive health metrics tracking with Highcharts. Displays trends for body weight, body fat percentage, BMI, muscle mass, and other health measurements from webhook data.

### Parcel
Package delivery tracking using the [Parcel](https://parcelapp.net/) app. Polls the Parcel API directly to show active and recent deliveries with status badges, expected delivery dates, and latest tracking events. Based on the [official TRMNL Parcel plugin](https://github.com/usetrmnl/trmnl_plugins/tree/master/lib/parcel).

### Stock Price
Real-time stock price tracking using the [Finnhub](https://finnhub.io) API. Displays up to 12 stock tickers with price, daily change, and percentage change. Supports multiple view layouts and configurable currency symbols. Based on the [official TRMNL Stock Price plugin](https://github.com/usetrmnl/trmnl_plugins/tree/master/lib/stock_price).

## Prerequisites

- **BYOS Server**: A running instance of [LaraPaper](https://github.com/usetrmnl/larapaper) or another BYOS implementation with plugin support
- **Node.js**: v16+ for local development
- **Docker**: For local testing with [trmnlp](https://hub.docker.com/r/trmnl/trmnlp)
- **API Access**: Bearer token from your BYOS instance for publishing plugins

## Project Structure

```
trmnl-plugins/
├── package.json           # Workspace root with convenience scripts
├── packages/
│   └── trmnl-tools/      # Shared development & publishing tools
└── plugins/
    ├── .env              # Shared API credentials (git-ignored)
    ├── calendar/         # Calendar plugin with FullCalendar
    ├── health-chart/     # Health metrics tracking chart plugin
    ├── parcel/           # Package delivery tracking with Parcel app
    └── stock-price/      # Stock price tracking with Finnhub API
```

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/jasonwaters/trmnl.git
cd trmnl
npm install
```

This installs all workspace packages and dependencies.

### 2. Configure API Credentials

Create a shared `.env` file for publishing to your BYOS server:

```bash
cd plugins
cp calendar/.env.example .env
```

Edit `.env` with your BYOS credentials:

```env
LARAPAPER_URL=https://your-byos-instance.com
LARAPAPER_TOKEN=your-api-token-here
```

**Getting your API token:**
- For LaraPaper: Navigate to "Plugins & Recipes" → "API" tab (`/plugins/api`)
- For other BYOS: Consult your implementation's documentation

All plugins will use this shared configuration. Individual plugins can override by creating their own `.env` file.

### 3. Start Developing

From the workspace root, you can run:

```bash
# Start calendar plugin
npm run start:calendar

# Start health chart plugin
npm run start:health

# Start parcel plugin
npm run start:parcel

# Start stock price plugin
npm run start:stock
```

Or navigate to specific plugins:

```bash
cd plugins/calendar
npm start
```

This starts the trmnlp development server at http://localhost:4567 with live reload.

## Publishing to Your BYOS Server

Each plugin can be published to multiple recipes on your BYOS instance.

### First Time Setup

1. **Configure recipe publishing** for each plugin:
   ```bash
   cd plugins/calendar
   cp publish.config.yml.example publish.config.yml
   ```

2. **Edit `publish.config.yml`** with your recipe IDs:
   ```yaml
   recipes:
     - name: Family Calendar
       trmnlp_id: your-family-calendar-id
     - name: Work Calendar
       trmnlp_id: your-work-calendar-id
   ```

3. **Get recipe IDs** from your BYOS instance:
   - **LaraPaper**: Recipe page → Recipe Settings modal → "TRMNL Recipe ID" field
   - **Other BYOS**: Consult your implementation's documentation

### Publish Commands

From the workspace root:

```bash
# Publish specific plugins
npm run publish:calendar
npm run publish:health
npm run publish:parcel
npm run publish:stock
```

Or from within a plugin directory:

```bash
cd plugins/calendar
npm run publish          # Publish to your BYOS instance
npm run publish:prod     # Publish to production TRMNL (usetrmnl.com)
```

The publish script will:
1. Read all recipes from `publish.config.yml`
2. Create recipe-specific packages (injecting correct `id` and `name` for each)
3. Upload via API to each recipe sequentially
4. Preserve existing configuration fields in each recipe
5. Display a success summary for all recipes

## Development Workflow

### Local Testing

All plugins share a single Docker Compose configuration via `trmnl-dev`:

```bash
cd plugins/calendar
npm start              # Start trmnlp + auto-load test data
npm run logs           # View server logs
npm run webhook        # Reload test data
npm stop               # Stop services
```

View your plugin at http://localhost:4567/full

### Test Data

Each plugin includes a `tmp/data.example.json` with demo data. Copy it to get started:

```bash
cp tmp/data.example.json tmp/data.json
```

Edit `tmp/data.json` to simulate your own webhook payloads. After making changes, run:

```bash
npm run webhook
```

This reloads the data without restarting the server.

### Creating New Plugins

1. **Create plugin directory**:
   ```bash
   mkdir -p plugins/my-plugin/src
   mkdir -p plugins/my-plugin/tmp
   ```

2. **Copy configuration templates**:
   ```bash
   cp plugins/health-chart/{package.json,.trmnlp.yml,.env.example,.gitignore,publish.config.yml.example} plugins/my-plugin/
   ```

3. **Update configuration**:
   - Edit `package.json` with your plugin name and details
   - Update `src/settings.yml` with plugin metadata
   - Create your Liquid templates in `src/`
   - Copy `tmp/data.example.json` to `tmp/data.json` and customize

4. **Start developing**:
   ```bash
   cd plugins/my-plugin
   npm start
   ```

## Shared Tooling

All plugins use the `@trmnl-tools/core` package which provides:

- **`trmnl-dev`**: Wraps Docker Compose with a shared configuration -- updating the trmnlp version or dev setup happens in one place
- **`trmnl-publish`**: Multi-recipe publishing with dynamic ZIP creation and API upload

### Benefits

- **DRY Principle**: No code duplication across plugins
- **Consistency**: Identical workflow for all plugins
- **Maintainability**: Bug fixes and improvements benefit all plugins
- **Scalability**: Easy to add new plugins to the workspace

## BYOS Compatibility

These plugins are designed to work with BYOS implementations that support:

- ✅ **Plugins**: Custom plugin installation and hosting
- ✅ **Recipes**: Multiple recipe instances of the same plugin
- ✅ **JSON Data API**: Webhook-based data updates
- ✅ **Liquid Templates**: Dynamic rendering with Liquid templating

**Tested with:**
- ✅ [LaraPaper](https://github.com/usetrmnl/larapaper) (PHP/Laravel) - Full compatibility

**Potentially compatible with:**
- ⚠️ [Terminus](https://github.com/usetrmnl/terminus) (Ruby/Hanami) - Untested
- ⚠️ [Inker](https://github.com/usetrmnl/inker) (JavaScript) - Untested
- ⚠️ Other BYOS implementations - See [BYOS documentation](https://docs.trmnl.com/go/diy/byos)

If you successfully use these plugins with another BYOS implementation, please open an issue or PR to update this compatibility list!

## Plugin Documentation

Each plugin has detailed documentation in its own directory:

- [Calendar Plugin README](plugins/calendar/README.md)
- [Health Chart Plugin README](plugins/health-chart/README.md)
- [Parcel Plugin README](plugins/parcel/README.md)
- [Stock Price Plugin README](plugins/stock-price/README.md)

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT - See individual plugin directories for more details.

## Resources

- [TRMNL Documentation](https://docs.trmnl.com/)
- [BYOS (Build Your Own Server)](https://docs.trmnl.com/go/diy/byos)
- [LaraPaper](https://github.com/usetrmnl/larapaper)
- [trmnlp (Plugin Development Tool)](https://hub.docker.com/r/trmnl/trmnlp)
