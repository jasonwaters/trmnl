# Stock Price Plugin

Real-time stock price tracking for TRMNL e-ink displays using the [Finnhub API](https://finnhub.io).

## Features

- 📈 Track up to 12 stock tickers simultaneously
- 💰 Real-time price quotes with daily change (points or percentage)
- 🌍 Multiple currency symbol options (USD, EUR, GBP, JPY, CAD, CHF)
- 📱 Responsive layouts that adapt to ticker count
- 🔄 Polling-based updates (no webhook setup required)
- 🎨 All 4 TRMNL view sizes supported (full, half horizontal, half vertical, quadrant)

## Setup

### 1. Get a Finnhub API Key

1. Visit [finnhub.io](https://finnhub.io) and create a free account
2. Navigate to your dashboard to get your API key
3. Free tier includes 60 API calls per minute

### 2. Configure the Plugin

This plugin uses a **polling strategy** to fetch data from Finnhub. Configure custom fields in your BYOS recipe settings:

- **Stock Tickers**: Comma-separated symbols (e.g., `AAPL,GOOG,MSFT,AMZN`)
- **Finnhub API Key**: Your API key from finnhub.io
- **Change Display**: Show daily change as "Percentage" or "Points"
- **Currency Symbol**: Display symbol for prices (cosmetic only, Finnhub returns USD)

### 3. Local Development

Copy example data to get started:

```bash
cd plugins/stock-price
cp tmp/data.example.json tmp/data.json
npm start
```

Visit http://localhost:4567/full to see the plugin.

Edit `.trmnlp.yml` to change stock symbols for local testing:

```yaml
custom_fields:
  symbol: AAPL,GOOG,MSFT,AMZN
  api_key: demo
  change_display: percentage
  currency_symbol: usd
```

Note: The `api_key` in `.trmnlp.yml` is not used for local development since data is loaded from `tmp/data.json`. It's only used when publishing to your BYOS server.

### 4. Publishing

1. **Configure publishing targets**:
   ```bash
   cp publish.config.yml.example publish.config.yml
   ```

2. **Edit `publish.config.yml`** with your recipe IDs:
   ```yaml
   recipes:
     - name: Stock Prices
       trmnlp_id: your-stock-recipe-id
   ```

3. **Publish to your BYOS server**:
   ```bash
   npm run publish
   ```

**Note**: The `polling_url` in `settings.yml` uses a Liquid `{% for %}` loop to dynamically generate API URLs for each ticker. If this causes issues with trmnlp during local development, it's harmless - the local data still loads from `tmp/data.json`.

## Data Format

The plugin expects data in Finnhub's [quote endpoint format](https://finnhub.io/docs/api/quote):

```json
{
  "IDX_0": {
    "c": 189.84,    // Current price
    "d": 1.23,      // Change in points
    "dp": 0.652,    // Change in percentage
    "h": 191.25,    // High price of the day
    "l": 188.50,    // Low price of the day
    "o": 188.75,    // Open price
    "pc": 188.61,   // Previous close price
    "t": 1714080000 // UNIX timestamp
  },
  "IDX_1": { ... },
  "IDX_2": { ... }
}
```

Each `IDX_N` key corresponds to the Nth ticker in your comma-separated symbol list.

## Layouts by Ticker Count

The plugin automatically adjusts its layout based on the number of tickers:

### Full View (800x480)

- **1 ticker**: XXLarge - symbol, name, change, and extra-large price
- **2 tickers**: XLarge - stacked, horizontal dividers
- **3 tickers**: Large - compact grid layout
- **4 tickers**: Medium - 2×2 grid layout
- **5-6 tickers**: Small - 2-column layout
- **7-12 tickers**: XSmall - dense 2-column layout

### Half Horizontal View

- **1 ticker**: XLarge layout
- **2 tickers**: Medium layout, stacked
- **3-4 tickers**: XSmall layout
- **5+ tickers**: XXSmall layout (most compact)

### Half Vertical View

- **1-2 tickers**: Medium layout
- **3 tickers**: Small layout
- **4 tickers**: XSmall layout
- **5+ tickers**: XXSmall layout

### Quadrant View

- **1 ticker**: Medium layout
- **2 tickers**: XSmall layout, stacked
- **3+ tickers**: XXSmall layout

## Supported Symbols

The Finnhub API supports:

- US stocks (e.g., `AAPL`, `GOOG`, `MSFT`)
- Major indices (e.g., `^GSPC` for S&P 500, `^DJI` for Dow Jones)
- International exchanges (with exchange prefix, e.g., `TSM` for Taiwan Semiconductor)

Check [Finnhub's symbol search](https://finnhub.io/docs/api/symbol-search) to verify symbol availability.

## Customization

### Change Display Format

Choose between:
- **Percentage**: `+0.65%` or `-0.61%`
- **Points**: `+1.23` or `-0.87`

### Currency Symbols

Supported options:
- US Dollar: `$`
- Euro: `€`
- British Pound: `£`
- Japanese Yen: `¥`
- Canadian Dollar: `$`
- Swiss Franc: `₣`

Note: Currency symbols are display-only. The Finnhub API returns prices in USD regardless of the selected symbol.

## Polling Configuration

This plugin uses LaraPaper's polling mechanism with a Liquid `for` loop to generate multiple API requests:

```yaml
polling_url: |
  {% assign symbols = symbol | split: "," %}{% for s in symbols %}https://finnhub.io/api/v1/quote?symbol={{ s | strip }}&token={{ api_key }}
  {% endfor %}
```

Each ticker generates one URL (one line), and LaraPaper fetches them all, merging results as `IDX_0`, `IDX_1`, etc.

## API Rate Limits

Finnhub free tier:
- 60 API calls per minute
- No credit card required

If you track 4 stocks and refresh every 15 minutes, you'll use 4 calls every 15 minutes (16 calls/hour, well within limits).

## Troubleshooting

### "Failed to fetch data" Error

1. **Check API key**: Verify your Finnhub API key is correct in the recipe's custom fields
2. **Verify symbols**: Make sure stock symbols are valid (check [Finnhub symbol search](https://finnhub.io/docs/api/symbol-search))
3. **Check rate limits**: Ensure you haven't exceeded 60 calls/minute
4. **Test manually**: Try fetching data directly:
   ```bash
   curl "https://finnhub.io/api/v1/quote?symbol=AAPL&token=YOUR_KEY"
   ```

### Blank Display

1. **Check data format**: Ensure `tmp/data.json` matches the expected format for local dev
2. **Inspect browser console**: Look for JavaScript errors when viewing in trmnlp
3. **Verify ticker count**: Make sure symbols in `.trmnlp.yml` match data keys in `tmp/data.json`

### Price Formatting Issues

Different currency symbols use different decimal separators:
- USD, GBP, JPY, CAD, CHF: `1,234.56` (period for decimal)
- EUR: `1.234,56` (comma for decimal)

The plugin handles this automatically based on your currency symbol selection.

## Resources

- [Finnhub API Documentation](https://finnhub.io/docs/api)
- [Finnhub Symbol Search](https://finnhub.io/docs/api/symbol-search)
- [Original TRMNL Stock Price Plugin](https://github.com/usetrmnl/trmnl_plugins/tree/master/lib/stock_price)
- [trmnlp Development Tool](https://hub.docker.com/r/trmnl/trmnlp)

## License

MIT
