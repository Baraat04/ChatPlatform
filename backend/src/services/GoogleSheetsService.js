import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const keyFilePath = path.join(__dirname, '../../google-key.json');

let auth;

try {
  if (fs.existsSync(keyFilePath)) {
    auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  } else {
    console.warn('[GoogleSheetsService] google-key.json not found. Sheets integration will not work.');
  }
} catch (e) {
  console.error('[GoogleSheetsService] Error initializing Google Auth:', e.message);
}

// Helper to extract spreadsheet ID from URL
function extractSpreadsheetId(url) {
  if (!url) return null;
  const match = url.match(/\/d\/([a-zA-Z0-9\-_]+)/);
  return match ? match[1] : null;
}

/**
 * Appends data to a Google Sheet
 * @param {string} spreadsheetUrl 
 * @param {string} columnNamesCommaSeparated - The columns defined by the user (e.g. "Name, Phone, Service")
 * @param {object} extractedData - The JSON extracted by Gemini matching the columns
 */
/**
 * Find a value in extractedData using fuzzy, case-insensitive matching
 * Gemini may return data with different key casing or slight name variations
 */
function findValue(extractedData, colName) {
  if (!extractedData || typeof extractedData !== 'object') return '';
  
  // 1. Exact match
  if (extractedData[colName] !== undefined) return String(extractedData[colName] || '');
  
  const colLower = colName.toLowerCase().trim();
  
  // 2. Case-insensitive exact match
  for (const key of Object.keys(extractedData)) {
    if (key.toLowerCase().trim() === colLower) return String(extractedData[key] || '');
  }
  
  // 3. Partial match: column name contains key or key contains column name
  for (const key of Object.keys(extractedData)) {
    const keyLower = key.toLowerCase().trim();
    if (colLower.includes(keyLower) || keyLower.includes(colLower)) {
      return String(extractedData[key] || '');
    }
  }
  
  return '';
}

export async function appendToSheet(spreadsheetUrl, columnNamesCommaSeparated, extractedData) {
  if (!auth) throw new Error('Google Auth not initialized (missing google-key.json)');
  const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
  if (!spreadsheetId) throw new Error('Invalid Google Sheets URL');

  console.log('[GoogleSheets] appendToSheet called. Columns:', columnNamesCommaSeparated);
  console.log('[GoogleSheets] Data received:', JSON.stringify(extractedData));

  const sheets = google.sheets({ version: 'v4', auth });
  
  // Parse the columns the user defined
  const expectedColumns = columnNamesCommaSeparated.split(',').map(c => c.trim()).filter(c => c);
  if (expectedColumns.length === 0) throw new Error('No columns defined for Google Sheets');

  // Build the row using fuzzy matching so Gemini's response keys map correctly
  const rowData = expectedColumns.map(colName => findValue(extractedData, colName));

  console.log('[GoogleSheets] Row to append:', rowData);

  // We append the row to the first sheet
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'A:Z',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [rowData],
    },
  });

  console.log('[GoogleSheets] Row appended successfully!');
  return true;
}
