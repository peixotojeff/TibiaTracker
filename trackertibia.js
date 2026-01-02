function TibiaTracker() {
  // Configuration
  const WORLD = "######"; // Replace with your Tibia world (e.g., "Antica", "Calmera")
  const CATEGORY = "experience";
  const VOCATION = "######"; // Replace with your vocation (e.g., "knight", "sorcerer", "druid", "paladin", or "all")
  const CHARACTER_NAME = "######"; // Replace with the character name to track
  const START_PAGE = 1;
  const END_PAGE = 4;
  const SPREADSHEET_ID = "######"; // Replace with your Google Sheet ID
  const SHEET_NAME = "######"; // Replace with your desired sheet name
  const TIMEZONE = "GMT-3"; // Adjust to your timezone (e.g., "GMT-3" for Brazil)

  // Access the spreadsheet and sheet
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  // Create sheet and add headers if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(["Date", "Name", "Vocation", "Level", "Experience"]);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(["Date", "Name", "Vocation", "Level", "Experience"]);
  }

  // Iterate through pages 1 to 10
  for (let page = START_PAGE; page <= END_PAGE; page++) {
    try {
      // Construct and fetch API URL
      const url = `https://dev.tibiadata.com/v4/highscores/${WORLD}/${CATEGORY}/${VOCATION}/${page}`;
      const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
      if (response.getResponseCode() !== 200) {
        Logger.log(`Error fetching page ${page}: HTTP ${response.getResponseCode()}`);
        continue;
      }

      // Parse JSON response
      const data = JSON.parse(response.getContentText());
      const highscores = data.highscores?.highscore_list;

      if (!highscores || !Array.isArray(highscores)) {
        Logger.log(`No highscore list on page ${page}`);
        continue;
      }

      // Search for the character
      for (let entry of highscores) {
        if (entry.name.toLowerCase() === CHARACTER_NAME.toLowerCase()) {
          // Format date as dd-mm-yyyy
          const date = new Date();
          const formattedDate = Utilities.formatDate(date, TIMEZONE, "dd-MM-yyyy");

          // Log data to sheet
          const row = [
            formattedDate,
            entry.name,
            entry.vocation,
            entry.level,
            entry.value // Experience points
          ];
          sheet.appendRow(row);
          Logger.log(`Logged data for ${entry.name} on page ${page}`);
          return; // Exit after logging
        }
      }
    } catch (error) {
      Logger.log(`Error on page ${page}: ${error.message}`);
      continue;
    }
  }

  Logger.log(`Character ${CHARACTER_NAME} not found in pages ${START_PAGE} to ${END_PAGE}`);
}

// Set up a daily trigger
function createDailyTrigger() {
  ScriptApp.newTrigger("TibiaTracker")
    .timeBased()
    .everyDays(1)
    .atHour(8) // Runs daily at 8 AM (adjust as needed)
    .create();
}