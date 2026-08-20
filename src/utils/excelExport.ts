import ExcelJS from 'exceljs';
import { DayReport, UserProfile } from '../types';
import { formatFullDateHeader } from './dateUtils';

/**
 * Generate a styled Excel file matching the original Daily Report template:
 * - Yellow Header: "DAILY REPORT / DATE / [EMPLOYEE NAME]"
 * - Red "Schedule" Column
 * - Time slot, task, status, completion timestamp, notes
 */
export async function exportReportToExcel(report: DayReport, userProfile: UserProfile): Promise<void> {
  const { formattedText, dayOfWeek } = formatFullDateHeader(report.date);

  // Create a new workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  workbook.creator = userProfile.employeeName || 'ROTH DARO';
  workbook.created = new Date();

  const sheetName = `Report_${report.date}`;
  const worksheet = workbook.addWorksheet(sheetName, {
    views: [{ showGridLines: true }]
  });

  // Set column widths
  worksheet.columns = [
    { key: 'no', width: 8 },
    { key: 'timeSlot', width: 18 },
    { key: 'taskName', width: 34 },
    { key: 'scheduleType', width: 16 },
    { key: 'status', width: 16 },
    { key: 'notes', width: 32 }
  ];

  // 1. TOP HEADER BANNER - YELLOW (Merged A1:F1)
  worksheet.mergeCells('A1:F1');
  const titleCell = worksheet.getCell('A1');
  const companyPrefix = userProfile.companyName ? `${userProfile.companyName.toUpperCase()} - ` : '';
  titleCell.value = `${companyPrefix}DAILY REPORT / ${formattedText.toUpperCase()} / ${userProfile.employeeName.toUpperCase()}`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFDE047' } // Bright Yellow (#FDE047)
  };
  worksheet.getRow(1).height = 36;

  // 2. SUB-HEADER METADATA (Row 2 & 3)
  worksheet.mergeCells('A2:C2');
  worksheet.getCell('A2').value = `Department: ${userProfile.department}`;
  worksheet.getCell('A2').font = { name: 'Calibri', size: 10, italic: true };

  worksheet.mergeCells('D2:F2');
  worksheet.getCell('D2').value = `Supervisor: ${userProfile.supervisorName}`;
  worksheet.getCell('D2').font = { name: 'Calibri', size: 10, italic: true };
  worksheet.getCell('D2').alignment = { horizontal: 'right' };

  worksheet.getRow(2).height = 20;

  // Blank row for spacing
  worksheet.getRow(3).height = 10;

  // 3. TABLE HEADERS (Row 4)
  const headers = ['No.', 'Time Slot', 'Task / Activity', 'Schedule', 'Status', 'Remarks'];
  const headerRow = worksheet.getRow(4);
  headerRow.height = 26;

  headers.forEach((headerText, index) => {
    const colLetter = String.fromCharCode(65 + index); // A, B, C...
    const cell = worksheet.getCell(`${colLetter}4`);
    cell.value = headerText;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };

    // Red accent background specifically for the "Schedule" column header
    if (headerText === 'Schedule') {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFDC2626' } // Red accent (#DC2626)
      };
    } else {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' } // Dark slate (#1E293B)
      };
    }

    cell.border = {
      top: { style: 'thin', color: { argb: 'FF94A3B8' } },
      left: { style: 'thin', color: { argb: 'FF94A3B8' } },
      bottom: { style: 'medium', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF94A3B8' } }
    };
  });

  // 4. DATA ROWS
  let startRow = 5;

  if (report.isHoliday) {
    // Holiday row
    worksheet.mergeCells(`A${startRow}:F${startRow}`);
    const holidayCell = worksheet.getCell(`A${startRow}`);
    holidayCell.value = `🏖️ HOLIDAY — ${dayOfWeek.toUpperCase()} OFF DAY (NO SCHEDULED TASKS)`;
    holidayCell.font = { name: 'Calibri', size: 12, bold: true, color: { argb: 'FFB45309' } };
    holidayCell.alignment = { horizontal: 'center', vertical: 'middle' };
    holidayCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFEF3C7' } // Light amber
    };
    worksheet.getRow(startRow).height = 32;
    startRow++;
  } else if (!report.tasks || report.tasks.length === 0) {
    worksheet.mergeCells(`A${startRow}:F${startRow}`);
    const emptyCell = worksheet.getCell(`A${startRow}`);
    emptyCell.value = 'No tasks recorded for this date.';
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    startRow++;
  } else {
    report.tasks.forEach((task, index) => {
      const currentRowNum = startRow + index;
      const row = worksheet.getRow(currentRowNum);
      row.height = 24;

      const statusText = task.isCompleted ? 'DONE' : 'PENDING';
      const scheduleText = task.scheduleType || 'Schedule';

      // Set values
      row.getCell(1).value = index + 1; // No.
      row.getCell(2).value = task.timeSlot; // Time
      row.getCell(3).value = task.taskName; // Task
      row.getCell(4).value = scheduleText; // Schedule
      row.getCell(5).value = statusText; // Status
      row.getCell(6).value = task.notes || '-'; // Remarks

      // Alignments & Styles
      row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(3).alignment = { horizontal: 'left', vertical: 'middle' };
      row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(5).alignment = { horizontal: 'center', vertical: 'middle' };
      row.getCell(6).alignment = { horizontal: 'left', vertical: 'middle' };

      // STYLING SPECIFIC RED "SCHEDULE" COLUMN
      const scheduleCell = row.getCell(4);
      scheduleCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFB91C1C' } }; // Red text
      scheduleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFEE2E2' } // Light red tint background (#FEE2E2)
      };

      // STATUS STYLING
      const statusCell = row.getCell(5);
      if (task.isCompleted) {
        statusCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF15803D' } };
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFDCFCE7' } // Soft green
        };
      } else {
        statusCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFC2410C' } };
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFEDD5' } // Soft orange
        };
      }

      // Zebra striping for other columns
      const isEven = index % 2 === 0;
      const rowBg = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

      [1, 2, 3, 6].forEach((colIdx) => {
        const c = row.getCell(colIdx);
        c.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: rowBg }
        };
      });

      // Borders
      for (let c = 1; c <= 6; c++) {
        row.getCell(c).border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
        };
      }
    });

    startRow += report.tasks.length;
  }

  // 5. SUMMARY STATS FOOTER
  startRow += 1; // Spacing
  if (!report.isHoliday && report.tasks.length > 0) {
    const completedCount = report.tasks.filter((t) => t.isCompleted).length;
    const totalCount = report.tasks.length;
    const pct = Math.round((completedCount / totalCount) * 100);

    worksheet.mergeCells(`A${startRow}:C${startRow}`);
    const summaryCell = worksheet.getCell(`A${startRow}`);
    summaryCell.value = `SUMMARY: ${completedCount} / ${totalCount} Tasks Completed (${pct}%)`;
    summaryCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
    summaryCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE2E8F0' }
    };
    worksheet.getRow(startRow).height = 24;

    startRow += 2;
  }

  // 6. SIGN-OFF BLOCK
  worksheet.mergeCells(`A${startRow}:C${startRow}`);
  worksheet.getCell(`A${startRow}`).value = `Prepared by: _____________________ (${userProfile.employeeName})`;
  worksheet.getCell(`A${startRow}`).font = { name: 'Calibri', size: 10, italic: true };

  worksheet.mergeCells(`D${startRow}:F${startRow}`);
  worksheet.getCell(`D${startRow}`).value = `Approved by: _____________________ (${userProfile.supervisorName})`;
  worksheet.getCell(`D${startRow}`).font = { name: 'Calibri', size: 10, italic: true };
  worksheet.getCell(`D${startRow}`).alignment = { horizontal: 'right' };

  // Write workbook to buffer and trigger browser download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Daily_Report_${report.date}_${userProfile.employeeName.replace(/\s+/g, '_')}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

/**
 * Export multiple day reports to a single Excel workbook with a Summary Tab!
 */
export async function exportAllReportsToExcel(reportsList: DayReport[], userProfile: UserProfile): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = userProfile.employeeName;

  // Master Summary Sheet
  const masterSheet = workbook.addWorksheet('Master Summary', { views: [{ showGridLines: true }] });
  masterSheet.columns = [
    { key: 'date', width: 14 },
    { key: 'day', width: 12 },
    { key: 'status', width: 14 },
    { key: 'timeSlot', width: 16 },
    { key: 'task', width: 32 },
    { key: 'schedule', width: 14 },
    { key: 'taskStatus', width: 12 },
    { key: 'remarks', width: 28 }
  ];

  // Title
  masterSheet.mergeCells('A1:H1');
  const title = masterSheet.getCell('A1');
  const companyPrefix = userProfile.companyName ? `${userProfile.companyName.toUpperCase()} - ` : '';
  title.value = `${companyPrefix}ALL DAILY REPORTS SUMMARY - ${userProfile.employeeName.toUpperCase()} (${userProfile.department})`;
  title.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0F172A' } };
  title.alignment = { horizontal: 'center', vertical: 'middle' };
  title.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE047' } };
  masterSheet.getRow(1).height = 32;

  // Header Row
  const headers = ['Date', 'Day', 'Day Type', 'Time Slot', 'Task / Activity', 'Schedule', 'Status', 'Remarks'];
  const headerRow = masterSheet.getRow(3);
  headerRow.height = 24;

  headers.forEach((h, i) => {
    const col = String.fromCharCode(65 + i);
    const cell = masterSheet.getCell(`${col}3`);
    cell.value = h;
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: h === 'Schedule' ? { argb: 'FFDC2626' } : { argb: 'FF1E293B' }
    };
  });

  let rowIdx = 4;
  reportsList.sort((a, b) => b.date.localeCompare(a.date));

  reportsList.forEach((report) => {
    if (report.isHoliday) {
      const row = masterSheet.getRow(rowIdx);
      row.getCell(1).value = report.date;
      row.getCell(2).value = report.dayOfWeek;
      row.getCell(3).value = 'Holiday';
      row.getCell(4).value = '-';
      row.getCell(5).value = `Holiday — ${report.holidayReason || 'Off Day'}`;
      row.getCell(6).value = '-';
      row.getCell(7).value = '-';
      row.getCell(8).value = '-';

      row.font = { name: 'Calibri', size: 10, italic: true };
      row.getCell(3).font = { bold: true, color: { argb: 'FFB45309' } };
      rowIdx++;
    } else {
      report.tasks.forEach((task) => {
        const row = masterSheet.getRow(rowIdx);
        row.getCell(1).value = report.date;
        row.getCell(2).value = report.dayOfWeek;
        row.getCell(3).value = 'Working Day';
        row.getCell(4).value = task.timeSlot;
        row.getCell(5).value = task.taskName;
        row.getCell(6).value = task.scheduleType || 'Schedule';
        row.getCell(7).value = task.isCompleted ? 'DONE' : 'PENDING';
        row.getCell(8).value = task.notes || '-';

        // Red Schedule cell
        row.getCell(6).font = { bold: true, color: { argb: 'FFB91C1C' } };
        row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };

        rowIdx++;
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Master_Daily_Reports_${userProfile.employeeName.replace(/\s+/g, '_')}.xlsx`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
