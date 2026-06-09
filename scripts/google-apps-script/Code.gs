/**
 * Appyto → Google Sheet sync (Apps Script Web App).
 *
 * Deploy:
 *   1. sheets.google.com → new sheet → Extensions → Apps Script.
 *   2. Paste this file. Deploy → New deployment → Web app.
 *      Execute as: Me.  Who has access: Anyone.
 *   3. Copy the /exec URL into GOOGLE_SHEETS_WEBHOOK_URL in your .env.
 *
 * The scraper POSTs { columns: [...], rows: [[...], ...] }. We upsert by the
 * "source_uid" + "source" pair so re-scrapes update rather than duplicate.
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Jobs") ||
                  SpreadsheetApp.getActiveSpreadsheet().insertSheet("Jobs");

    // Write header once.
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(body.columns);
      sheet.setFrozenRows(1);
    }

    const header = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const srcIdx = header.indexOf("source");
    const uidIdx = header.indexOf("source_uid");

    // Build an index of existing rows keyed by source|source_uid.
    const existing = {};
    const last = sheet.getLastRow();
    if (last > 1) {
      const keys = sheet.getRange(2, 1, last - 1, sheet.getLastColumn()).getValues();
      keys.forEach(function (r, i) {
        existing[r[srcIdx] + "|" + r[uidIdx]] = i + 2; // sheet row number
      });
    }

    const toAppend = [];
    body.rows.forEach(function (row) {
      const key = row[srcIdx] + "|" + row[uidIdx];
      if (existing[key]) {
        sheet.getRange(existing[key], 1, 1, row.length).setValues([row]);
      } else {
        toAppend.push(row);
      }
    });
    if (toAppend.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, toAppend.length, body.columns.length)
           .setValues(toAppend);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, appended: toAppend.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return ContentService.createTextOutput("Appyto Sheets sync is live.");
}
