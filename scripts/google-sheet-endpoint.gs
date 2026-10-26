/**
 * Space Craft — website enquiries → Google Sheet.
 * Bound to the "Space Craft — Website enquiries" spreadsheet; deployed as a Web app
 * (Execute as: Me, Who has access: Anyone). The site posts form-encoded fields here.
 *
 * @OnlyCurrentDoc
 */
const SHEET = 'Enquiries';
// New columns go at the end so earlier rows stay aligned.
const HEADERS = ['Received', 'Source', 'Name', 'Email', 'Company', 'Location', 'Interest', 'Area', 'Message', 'Page',
  'Phone', 'Website', 'Team size', 'Works in'];
const LIMITS = { name: 100, email: 200, company: 150, location: 150, interest: 150, area: 100, brief: 4000, page: 300,
  phone: 20, portfolio: 300, team: 40, coverage: 200 };
const SOURCES = ['project', 'career', 'partner'];

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

// Trim, cap length and neutralise spreadsheet formulas (=, +, -, @) so cells are always plain text.
function clean_(value, max) {
  let v = String(value == null ? '' : value).replace(/\r/g, '').trim().slice(0, max);
  if (/^[=+\-@]/.test(v)) v = "'" + v;
  return v;
}

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};
    if (p.website) return json_({ ok: true }); // honeypot: bots fill the hidden field, people never see it

    const row = {
      source: SOURCES.indexOf(p.source) > -1 ? p.source : 'project',
      name: clean_(p.name, LIMITS.name),
      email: clean_(p.email, LIMITS.email),
      company: clean_(p.company, LIMITS.company),
      location: clean_(p.location, LIMITS.location),
      interest: clean_(p.service || p.interest || p.specialism, LIMITS.interest),
      area: clean_(p.area, LIMITS.area),
      brief: clean_(p.brief, LIMITS.brief),
      page: clean_(p.page, LIMITS.page),
      phone: clean_(p.phone, LIMITS.phone),
      portfolio: clean_(p.portfolio, LIMITS.portfolio),
      team: clean_(p.team, LIMITS.team),
      coverage: clean_(p.coverage, LIMITS.coverage)
    };
    if (!row.name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(row.email)) {
      return json_({ ok: false, error: 'invalid' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      const sheet = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
      if (sheet.getLastRow() === 0 || sheet.getLastColumn() < HEADERS.length) {
        sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      sheet.appendRow([new Date(), row.source, row.name, row.email, row.company, row.location,
        row.interest, row.area, row.brief, row.page, row.phone, row.portfolio, row.team, row.coverage]);
    } finally {
      lock.releaseLock();
    }
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server' });
  }
}

function doGet() {
  return json_({ ok: true, service: 'Space Craft enquiries' });
}
