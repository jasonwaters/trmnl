/**
 * Guest Recommendation - Google Apps Script Web App
 *
 * Serves one recommendation per request to the TRMNL "guest-recommendation"
 * plugin, reading rows from a Google Sheet. Because it runs as you on Google's
 * servers under your own authorization, it can also WRITE state back to the
 * sheet - which the read-only CSV export URL cannot do. That is what lets
 * sequential mode remember its place across refreshes without ever exposing a
 * credential in the plugin.
 *
 * Spreadsheet layout:
 *   "data"  tab - row 1 is a header (icon, tag, title, body); one recommendation
 *                 per row after. Fully empty rows are skipped, so sequential mode
 *                 wraps cleanly back to the first item at the end of the list.
 *   "state" tab - stores a single shared "last shown" index. The script keeps the
 *                 index in cell B2 (with the label "shared" written to A2). Every
 *                 poll advances it by one and wraps at the end of the list.
 *
 * Note on state: TRMNL/LaraPaper polling is per-plugin (not per-device) and has no
 * device context in the polling URL, so this counter is shared. That is the correct
 * model for a single device; per-device counters are not achievable via polling.
 *
 * Setup:
 *   1. Open your Google Sheet (tabs named "data" and "state").
 *   2. Extensions -> Apps Script, replace the contents with this file, Save.
 *   3. Deploy -> New deployment -> Web app:
 *        Execute as:      Me
 *        Who has access:  Anyone
 *   4. Copy the Web app URL (ends in /exec) into the plugin's
 *      "Apps Script Web App URL" setting.
 *
 * Request:  GET <web-app-url>?mode=sequence|random
 * Response: { rec_icon, rec_tag, rec_title, rec_body,
 *             rec_mode, rec_index, rec_count, rec_error }
 */

var DATA_SHEET_NAME = 'data';
var STATE_SHEET_NAME = 'state';
var STATE_LABEL_CELL = 'A2';
var STATE_INDEX_CELL = 'B2';
var STATE_LABEL = 'shared';

// Leave blank to use the spreadsheet this script is bound to (recommended: create
// the script from your sheet via Extensions -> Apps Script). Set an ID only if you
// deploy this as a standalone script targeting a specific spreadsheet.
var SPREADSHEET_ID = '';

var LOCK_TIMEOUT_MS = 10000;

function doGet(request) {
  var mode = resolveMode(request);
  var lock = LockService.getScriptLock();

  try {
    lock.waitLock(LOCK_TIMEOUT_MS);
  } catch (lockError) {
    return jsonResponse(errorPayload(mode, 'Could not obtain lock: ' + lockError.message));
  }

  try {
    var spreadsheet = openSpreadsheet();
    if (!spreadsheet) {
      return jsonResponse(errorPayload(mode, 'Spreadsheet not found. Bind the script to a sheet or set SPREADSHEET_ID.'));
    }

    var items = readItems(spreadsheet);
    if (items.length === 0) {
      return jsonResponse(errorPayload(mode, 'No recommendation rows found in the "' + DATA_SHEET_NAME + '" tab.'));
    }

    var index = mode === 'random'
      ? Math.floor(Math.random() * items.length)
      : nextSequentialIndex(spreadsheet, items.length);

    writeIndex(spreadsheet, index);

    return jsonResponse(successPayload(items[index], mode, index, items.length));
  } catch (runError) {
    return jsonResponse(errorPayload(mode, runError.message));
  } finally {
    lock.releaseLock();
  }
}

function resolveMode(request) {
  var raw = request && request.parameter ? request.parameter.mode : '';
  return raw === 'random' ? 'random' : 'sequence';
}

function openSpreadsheet() {
  return SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function readItems(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(DATA_SHEET_NAME) || spreadsheet.getSheets()[0];
  var values = sheet.getDataRange().getValues();
  var items = [];

  // Row 0 is the header; recommendations start at row 1.
  for (var row = 1; row < values.length; row++) {
    var icon = trim(values[row][0]);
    var tag = trim(values[row][1]);
    var title = trim(values[row][2]);
    var body = trim(values[row][3]);

    if (!icon && !tag && !title && !body) {
      continue;
    }

    items.push({ icon: icon || 'palm', tag: tag, title: title, body: body });
  }

  return items;
}

function nextSequentialIndex(spreadsheet, count) {
  var last = readIndex(spreadsheet);
  var next = last + 1;

  if (next < 0 || next >= count) {
    next = 0;
  }

  return next;
}

function readIndex(spreadsheet) {
  var sheet = getStateSheet(spreadsheet);
  var parsed = parseInt(sheet.getRange(STATE_INDEX_CELL).getValue(), 10);
  return isNaN(parsed) ? -1 : parsed;
}

function writeIndex(spreadsheet, index) {
  var sheet = getStateSheet(spreadsheet);
  sheet.getRange(STATE_LABEL_CELL).setValue(STATE_LABEL);
  sheet.getRange(STATE_INDEX_CELL).setValue(index);
}

function getStateSheet(spreadsheet) {
  var sheet = spreadsheet.getSheetByName(STATE_SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(STATE_SHEET_NAME);
  }

  return sheet;
}

function successPayload(item, mode, index, count) {
  return {
    rec_icon: item.icon,
    rec_tag: item.tag,
    rec_title: item.title,
    rec_body: item.body,
    rec_mode: mode,
    rec_index: index,
    rec_count: count,
    rec_error: ''
  };
}

function errorPayload(mode, message) {
  return {
    rec_icon: '',
    rec_tag: '',
    rec_title: '',
    rec_body: '',
    rec_mode: mode,
    rec_index: -1,
    rec_count: 0,
    rec_error: String(message || 'Unknown error')
  };
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function trim(value) {
  return value === null || value === undefined ? '' : String(value).trim();
}
