// api/sheet-preview.js

import { google } from 'googleapis';

// --- Configuration ---
// The ID of the target spreadsheet.
const SHEET_ID = '1oinFFhzNE7-tWzIdfjqGc1QwXO3-FJOCAUuFNeFDpI4';

// The range to read (Sheet Name!StartCell:EndCell). Adjust this range based on your sheet.
// This example covers columns A through I and rows 1 through 15 on the '3rd SEM' sheet.
const RANGE = '3rd SEM!A1:I15'; 

// Load credentials from the secure Vercel environment variable
// The environment variable MUST contain the full JSON content of your Google Service Account key.
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);

export default async function handler(req, res) {
  // 1. Enforce GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. Authorize the service account (Authentication)
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      // We use a read-only scope
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'], 
    });
    
    // 3. Create the Sheets client
    const sheets = google.sheets({ version: 'v4', auth });

    // 4. Fetch the data (Data Fetching)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
    });
    
    // 5. Success Response Handling
    // Return the fetched data (a 2D array of values) to the client.
    return res.status(200).json({ 
      success: true, 
      data: response.data.values,
      message: `Successfully fetched ${response.data.values.length} rows.` 
    });

  } catch (error) {
    // 6. Error Response Handling
    console.error('Sheet API Error:', error.message);
    
    // Default error message for security
    let publicError = 'Failed to fetch sheet data. Check service account permissions and the Vercel environment variable.';
    
    if (error.code === 403) {
      publicError = 'Permission denied. Ensure your Service Account email has Editor access to the Google Sheet.';
    }
    
    return res.status(500).json({ 
      success: false, 
      error: publicError 
    });
  }
}
