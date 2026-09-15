// Googleスプレッドシートに回答を保存するGoogle Apps Scriptです。
const SHEET_NAME = '回答';
const ADMIN_KEY = 'change-this-key';
const SPREADSHEET_ID = '1JN5JCw9o-1xbx9ruHd-JkWF3mXAPFpPO83oxMt5D-AY';

function getResponseSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function doPost(event) {
  const data = JSON.parse(event.postData.contents || '{}');

  if (data.action === 'delete') {
    if (data.key !== ADMIN_KEY || !Number.isInteger(Number(data.rowNumber))) {
      return ContentService.createTextOutput('unauthorized');
    }
    const sheet = getResponseSheet();
    const rowNumber = Number(data.rowNumber);
    if (rowNumber < 2 || rowNumber > sheet.getLastRow()) {
      return ContentService.createTextOutput('invalid row');
    }
    sheet.deleteRow(rowNumber);
    return ContentService.createTextOutput('deleted');
  }

  const sheet = getResponseSheet();

  if (!data.name || !data.subject || !data.body) {
    return ContentService.createTextOutput('missing required fields');
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['回答日時', '回答者名', '件名', '本文', '得点']);
  }
  sheet.appendRow([new Date(), data.name, data.subject, data.body, Number(data.score) || 0]);
  return ContentService.createTextOutput('ok');
}

function doGet(event) {
  const callback = event.parameter.callback || 'callback';
  const key = event.parameter.key || '';
  if (key !== ADMIN_KEY) {
    return ContentService.createTextOutput(`${callback}(${JSON.stringify({ error: 'unauthorized' })});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  const sheet = getResponseSheet();
  const rows = sheet ? sheet.getDataRange().getValues() : [];
  const responses = rows.slice(1).map((row, index) => ({
    rowNumber: index + 2,
    submittedAt: row[0],
    name: row[1],
    subject: row[2],
    body: row[3],
    score: row[4]
  })).reverse();
  return ContentService.createTextOutput(`${callback}(${JSON.stringify({ responses })});`)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}
