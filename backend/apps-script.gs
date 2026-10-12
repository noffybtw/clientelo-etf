/**
 * Google Apps Script web app: appends one lead per row to the bound Sheet.
 * Deliberately has NO MailApp/GmailApp calls (DECISIONS.md D4), so its OAuth
 * scope is limited to this spreadsheet.
 *
 * Setup (once):
 * 1. Create a Google Sheet "ETF dvojcata - leady", Extensions -> Apps Script, paste this file.
 * 2. Project Settings -> Script properties -> add SECRET = <long random string>.
 * 3. Deploy -> New deployment -> Web app; Execute as: Me; Who has access: Anyone.
 * 4. Put the web app URL into Vercel env LEAD_WEBHOOK_URL and the same secret into LEAD_WEBHOOK_SECRET.
 */
const HEADERS = ['received_at', 'email', 'consent', 'consent_text_version', 'etf', 'ad_version',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secret || data.secret !== secret) return json_({ ok: false, error: 'forbidden' });

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);
    // Prefix with ' so a value starting with = + - @ is never run as a formula.
    sheet.appendRow(HEADERS.map((h) => {
      const v = data[h] === undefined ? '' : String(data[h]);
      return /^[=+\-@]/.test(v) ? "'" + v : v;
    }));
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
