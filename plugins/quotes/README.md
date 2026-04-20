# Quotes Plugin

Displays quotes from a public Google Sheet in any TRMNL layout size.

## Settings

- `Spreadsheet ID`: The Google Sheet ID to read from.
- `Sheet Number`: The worksheet tab identifier to export, using the Google Sheets `gid` value. Defaults to `0`.
- `Quote Selection`: Choose between a random quote or a fixed quote row.
- `Specific Quote Row`: Used when `Quote Selection` is set to `Specific`. This is a 1-based row number within the quote data, after any detected header row is skipped.
- `Quote Column Index`: Zero-based column index for the quote text.
- `Author Column Index`: Zero-based column index for the quote author/source.

## Notes

- The plugin automatically detects and skips a header row when the first row looks like column labels such as `quote` and `author`.
- TRMNL plugin settings are static in `settings.yml`, so the specific-quote control uses a row number instead of a live dropdown populated from sheet data.
