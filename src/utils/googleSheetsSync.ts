import { DayReport, UserProfile } from '../types';

export const APPS_SCRIPT_SNIPPET = `/**
 * GOOGLE APPS SCRIPT CODE FOR DAILY REPORT SCHEDULE TRACKER
 * 
 * Instructions:
 * 1. Open your Google Sheet.
 * 2. Click Extensions > Apps Script.
 * 3. Delete any default code and paste this script.
 * 4. Click Deploy > New Deployment.
 * 5. Select type: "Web app".
 * 6. Execute as: "Me", Who has access: "Anyone".
 * 7. Copy the Web App URL and paste it into the Settings in your Daily Report App!
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Ensure header row exists
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Date", "Day", "Employee", "Department", "Time Slot", "Task Name", "Schedule", "Status", "Time Checked", "Remarks", "Timestamp"]);
      sheet.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#FDE047");
    }
    
    // Append rows
    if (data.tasks && data.tasks.length > 0) {
      data.tasks.forEach(function(task) {
        sheet.appendRow([
          data.date,
          data.dayOfWeek,
          data.employeeName,
          data.department,
          task.timeSlot,
          task.taskName,
          task.scheduleType || "Schedule",
          task.isCompleted ? "DONE" : "PENDING",
          task.completedAt || "",
          task.notes || "",
          new Date().toISOString()
        ]);
      });
    } else if (data.isHoliday) {
      sheet.appendRow([
        data.date,
        data.dayOfWeek,
        data.employeeName,
        data.department,
        "-",
        "Holiday (" + (data.holidayReason || "Off Day") + ")",
        "-",
        "HOLIDAY",
        "-",
        "-",
        new Date().toISOString()
      ]);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ result: "success", message: "Rows synced successfully" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

/**
 * Sync a day report payload to Google Sheets Web App
 */
export async function syncReportToGoogleSheets(
  report: DayReport,
  userProfile: UserProfile
): Promise<{ success: boolean; message: string }> {
  if (!userProfile.googleSheetWebAppUrl || !userProfile.googleSheetWebAppUrl.trim()) {
    return {
      success: false,
      message: 'Google Sheets Web App URL is not configured. Please set it in Settings.'
    };
  }

  const payload = {
    date: report.date,
    dayOfWeek: report.dayOfWeek,
    isHoliday: report.isHoliday,
    holidayReason: report.holidayReason,
    employeeName: userProfile.employeeName,
    department: userProfile.department,
    tasks: report.tasks,
    lastUpdated: report.lastUpdated || new Date().toISOString()
  };

  try {
    // Note: Google Apps Script Web Apps require no-cors or redirect handling
    const response = await fetch(userProfile.googleSheetWebAppUrl.trim(), {
      method: 'POST',
      mode: 'no-cors', // Standard Google Apps Script CORS policy
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return {
      success: true,
      message: 'Successfully sent report data to Google Sheets!'
    };
  } catch (error: any) {
    console.error('Error syncing to Google Sheets:', error);
    return {
      success: false,
      message: error?.message || 'Failed to sync with Google Sheets endpoint.'
    };
  }
}
