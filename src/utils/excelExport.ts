import ExcelJS from 'exceljs';
import { DayReport, DefaultTimeSlotTemplate, UserProfile } from '../types';
import { formatFullDateHeader, formatDateKey, getMonthWeekBuckets, MONTH_NAMES } from './dateUtils';
import { createNewDayReport } from './storage';

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

      const statusText = task.isCompleted ? '✓' : '✗';
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
        statusCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' } // Soft red
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
 * Export Monthly Report with Distinct WEEK-BY-WEEK TABLES for easy checking!
 * - Overview tab with separate tables for Week 1, Week 2, Week 3, Week 4, Week 5
 * - Individual tabs for each week
 */
export async function exportMonthlyReportToExcel(
  reportsMap: Record<string, DayReport>,
  userProfile: UserProfile,
  targetMonthKey?: string,
  defaultSchedule?: DefaultTimeSlotTemplate[]
): Promise<void> {
  const currentKey = targetMonthKey || formatDateKey(new Date()).slice(0, 7);
  const [yearStr, monthStr] = currentKey.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const monthName = MONTH_NAMES[monthIndex];

  const workbook = new ExcelJS.Workbook();
  workbook.creator = userProfile.employeeName;
  workbook.created = new Date();

  // Get week buckets for this month
  const weekBuckets = getMonthWeekBuckets(year, monthIndex);

  // Prepare full data for each week
  const weekDataList = weekBuckets.map((bucket) => {
    const daysList: DayReport[] = [];
    let weekTasks = 0;
    let weekDone = 0;
    let weekPending = 0;
    let weekWorkingDays = 0;
    let weekHolidays = 0;

    for (let d = bucket.startDay; d <= bucket.endDay; d++) {
      const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      let rep = reportsMap[dateStr];
      if (!rep && defaultSchedule) {
        rep = createNewDayReport(dateStr, defaultSchedule, userProfile);
      }

      if (rep) {
        daysList.push(rep);
        if (rep.isHoliday) {
          weekHolidays++;
        } else {
          weekWorkingDays++;
          rep.tasks.forEach((t) => {
            weekTasks++;
            if (t.isCompleted) weekDone++;
            else weekPending++;
          });
        }
      }
    }

    const weekRate = weekTasks > 0 ? Math.round((weekDone / weekTasks) * 100) : 100;

    return {
      ...bucket,
      daysList,
      totalTasks: weekTasks,
      completedTasks: weekDone,
      pendingTasks: weekPending,
      completionRate: weekRate,
      workingDays: weekWorkingDays,
      holidays: weekHolidays
    };
  });

  // Calculate Month Totals
  const monthTotalTasks = weekDataList.reduce((acc, w) => acc + w.totalTasks, 0);
  const monthTotalDone = weekDataList.reduce((acc, w) => acc + w.completedTasks, 0);
  const monthTotalPending = weekDataList.reduce((acc, w) => acc + w.pendingTasks, 0);
  const monthWorkingDays = weekDataList.reduce((acc, w) => acc + w.workingDays, 0);
  const monthHolidays = weekDataList.reduce((acc, w) => acc + w.holidays, 0);
  const monthOverallRate = monthTotalTasks > 0 ? Math.round((monthTotalDone / monthTotalTasks) * 100) : 100;

  // ==========================================
  // SHEET 1: Master Monthly Overview (By Week)
  // ==========================================
  const masterSheet = workbook.addWorksheet(`Monthly Overview (${monthName})`, {
    views: [{ showGridLines: true }]
  });

  masterSheet.columns = [
    { key: 'no', width: 6 },
    { key: 'date', width: 13 },
    { key: 'day', width: 12 },
    { key: 'timeSlot', width: 16 },
    { key: 'taskName', width: 34 },
    { key: 'schedule', width: 14 },
    { key: 'status', width: 12 },
    { key: 'remarks', width: 28 }
  ];

  // 1. TOP TITLE BANNER (Yellow)
  masterSheet.mergeCells('A1:H1');
  const titleCell = masterSheet.getCell('A1');
  const companyPrefix = userProfile.companyName ? `${userProfile.companyName.toUpperCase()} - ` : '';
  titleCell.value = `${companyPrefix}MONTHLY REPORT / ${monthName.toUpperCase()} ${year} / ${userProfile.employeeName.toUpperCase()}`;
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: 'FF0F172A' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE047' } };
  masterSheet.getRow(1).height = 36;

  // 2. SUBHEADER METADATA
  masterSheet.mergeCells('A2:D2');
  masterSheet.getCell('A2').value = `Department: ${userProfile.department}`;
  masterSheet.getCell('A2').font = { name: 'Calibri', size: 10, italic: true };

  masterSheet.mergeCells('E2:H2');
  masterSheet.getCell('E2').value = `Supervisor: ${userProfile.supervisorName}`;
  masterSheet.getCell('E2').font = { name: 'Calibri', size: 10, italic: true };
  masterSheet.getCell('E2').alignment = { horizontal: 'right' };
  masterSheet.getRow(2).height = 20;

  // 3. MONTH EXECUTIVE KPI BAR
  masterSheet.mergeCells('A3:H3');
  const kpiCell = masterSheet.getCell('A3');
  kpiCell.value = `📊 MONTH SUMMARY: ${monthTotalDone}/${monthTotalTasks} Tasks Done (${monthOverallRate}%)  |  ${monthTotalPending} Pending  |  ${monthWorkingDays} Working Days  |  ${monthHolidays} Holidays`;
  kpiCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF0F172A' } };
  kpiCell.alignment = { horizontal: 'center', vertical: 'middle' };
  kpiCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
  masterSheet.getRow(3).height = 24;

  let currentRow = 5;

  // 4. RENDER DISTINCT WEEK-BY-WEEK TABLES
  weekDataList.forEach((week) => {
    // Week Header Bar (Navy/Dark Slate)
    masterSheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const weekHeaderCell = masterSheet.getCell(`A${currentRow}`);
    weekHeaderCell.value = `📅 ${week.label.toUpperCase()}  —  ${week.completedTasks}/${week.totalTasks} Tasks Done (${week.completionRate}%)  [Working: ${week.workingDays}d | Holidays: ${week.holidays}d]`;
    weekHeaderCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
    weekHeaderCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    weekHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    masterSheet.getRow(currentRow).height = 28;
    currentRow++;

    // Table Column Headers
    const headers = ['No.', 'Date', 'Day', 'Time Slot', 'Task / Activity', 'Schedule', 'Status', 'Remarks'];
    const headerRow = masterSheet.getRow(currentRow);
    headerRow.height = 22;

    headers.forEach((h, i) => {
      const colLetter = String.fromCharCode(65 + i);
      const cell = masterSheet.getCell(`${colLetter}${currentRow}`);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: h === 'Schedule' ? { argb: 'FFDC2626' } : { argb: 'FF334155' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } }
      };
    });
    currentRow++;

    let taskSeq = 1;

    // Week Data Rows
    week.daysList.forEach((rep) => {
      if (rep.isHoliday) {
        masterSheet.mergeCells(`A${currentRow}:H${currentRow}`);
        const holidayCell = masterSheet.getCell(`A${currentRow}`);
        holidayCell.value = `🏖️ ${rep.date} (${rep.dayOfWeek}): HOLIDAY — ${rep.holidayReason || 'Off Day (No tasks scheduled)'}`;
        holidayCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB45309' } };
        holidayCell.alignment = { horizontal: 'center', vertical: 'middle' };
        holidayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        masterSheet.getRow(currentRow).height = 22;
        currentRow++;
      } else if (!rep.tasks || rep.tasks.length === 0) {
        masterSheet.mergeCells(`A${currentRow}:H${currentRow}`);
        const emptyCell = masterSheet.getCell(`A${currentRow}`);
        emptyCell.value = `${rep.date} (${rep.dayOfWeek}): No tasks recorded`;
        emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
        emptyCell.font = { name: 'Calibri', size: 9, italic: true };
        currentRow++;
      } else {
        rep.tasks.forEach((t) => {
          const row = masterSheet.getRow(currentRow);
          row.height = 22;

          row.getCell(1).value = taskSeq++;
          row.getCell(2).value = rep.date;
          row.getCell(3).value = rep.dayOfWeek;
          row.getCell(4).value = t.timeSlot;
          row.getCell(5).value = t.taskName;
          row.getCell(6).value = t.scheduleType || 'Schedule';
          row.getCell(7).value = t.isCompleted ? '✓' : '✗';
          row.getCell(8).value = t.notes || '-';

          // Alignments
          row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(5).alignment = { horizontal: 'left', vertical: 'middle' };
          row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(8).alignment = { horizontal: 'left', vertical: 'middle' };

          // Red Schedule cell
          row.getCell(6).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
          row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };

          // Status cell
          if (t.isCompleted) {
            row.getCell(7).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF15803D' } };
            row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          } else {
            row.getCell(7).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
            row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          }

          // Subtle borders
          for (let c = 1; c <= 8; c++) {
            row.getCell(c).border = {
              top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
              right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
            };
          }

          currentRow++;
        });
      }
    });

    // Week Subtotal / Summary bar
    masterSheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const subtotalCell = masterSheet.getCell(`A${currentRow}`);
    subtotalCell.value = `✓ WEEK ${week.weekNumber} TOTAL: ${week.completedTasks}/${week.totalTasks} Tasks Completed (${week.completionRate}%)  |  ${week.pendingTasks} Pending  |  ${week.workingDays} Working Days`;
    subtotalCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF1E293B' } };
    subtotalCell.alignment = { horizontal: 'right', vertical: 'middle' };
    subtotalCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    masterSheet.getRow(currentRow).height = 22;
    currentRow++;

    // Blank row separator between weeks
    currentRow++;
  });

  // Master Signature Block
  currentRow++;
  masterSheet.mergeCells(`A${currentRow}:D${currentRow}`);
  masterSheet.getCell(`A${currentRow}`).value = `Prepared by: _____________________ (${userProfile.employeeName})`;
  masterSheet.getCell(`A${currentRow}`).font = { name: 'Calibri', size: 10, italic: true };

  masterSheet.mergeCells(`E${currentRow}:H${currentRow}`);
  masterSheet.getCell(`E${currentRow}`).value = `Approved by: _____________________ (${userProfile.supervisorName})`;
  masterSheet.getCell(`E${currentRow}`).font = { name: 'Calibri', size: 10, italic: true };
  masterSheet.getCell(`E${currentRow}`).alignment = { horizontal: 'right' };

  // ==========================================
  // SHEET 2..N: Individual Weekly Tabs
  // ==========================================
  weekDataList.forEach((week) => {
    const sheetName = `Week ${week.weekNumber}`;
    const weekSheet = workbook.addWorksheet(sheetName, { views: [{ showGridLines: true }] });

    weekSheet.columns = [
      { key: 'no', width: 6 },
      { key: 'date', width: 13 },
      { key: 'day', width: 12 },
      { key: 'timeSlot', width: 16 },
      { key: 'taskName', width: 34 },
      { key: 'schedule', width: 14 },
      { key: 'status', width: 12 },
      { key: 'remarks', width: 28 }
    ];

    // Banner
    weekSheet.mergeCells('A1:H1');
    const wTitle = weekSheet.getCell('A1');
    wTitle.value = `${companyPrefix}WEEK ${week.weekNumber} REPORT (${week.startDate} TO ${week.endDate}) - ${userProfile.employeeName.toUpperCase()}`;
    wTitle.font = { name: 'Calibri', size: 13, bold: true, color: { argb: 'FF0F172A' } };
    wTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    wTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE047' } };
    weekSheet.getRow(1).height = 32;

    // Headers
    const headers = ['No.', 'Date', 'Day', 'Time Slot', 'Task / Activity', 'Schedule', 'Status', 'Remarks'];
    const hRow = weekSheet.getRow(3);
    hRow.height = 24;
    headers.forEach((h, i) => {
      const colLetter = String.fromCharCode(65 + i);
      const cell = weekSheet.getCell(`${colLetter}3`);
      cell.value = h;
      cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: h === 'Schedule' ? { argb: 'FFDC2626' } : { argb: 'FF1E293B' }
      };
    });

    let wRow = 4;
    let wSeq = 1;

    week.daysList.forEach((rep) => {
      if (rep.isHoliday) {
        weekSheet.mergeCells(`A${wRow}:H${wRow}`);
        const holidayCell = weekSheet.getCell(`A${wRow}`);
        holidayCell.value = `🏖️ ${rep.date} (${rep.dayOfWeek}): HOLIDAY — ${rep.holidayReason || 'Off Day'}`;
        holidayCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB45309' } };
        holidayCell.alignment = { horizontal: 'center', vertical: 'middle' };
        holidayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        weekSheet.getRow(wRow).height = 22;
        wRow++;
      } else {
        rep.tasks.forEach((t) => {
          const row = weekSheet.getRow(wRow);
          row.height = 22;
          row.getCell(1).value = wSeq++;
          row.getCell(2).value = rep.date;
          row.getCell(3).value = rep.dayOfWeek;
          row.getCell(4).value = t.timeSlot;
          row.getCell(5).value = t.taskName;
          row.getCell(6).value = t.scheduleType || 'Schedule';
          row.getCell(7).value = t.isCompleted ? '✓' : '✗';
          row.getCell(8).value = t.notes || '-';

          row.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(3).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(4).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(5).alignment = { horizontal: 'left', vertical: 'middle' };
          row.getCell(6).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
          row.getCell(8).alignment = { horizontal: 'left', vertical: 'middle' };

          row.getCell(6).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFB91C1C' } };
          row.getCell(6).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };

          if (t.isCompleted) {
            row.getCell(7).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF15803D' } };
            row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
          } else {
            row.getCell(7).font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FFDC2626' } };
            row.getCell(7).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
          }

          wRow++;
        });
      }
    });

    // Summary footer
    wRow++;
    weekSheet.mergeCells(`A${wRow}:H${wRow}`);
    const summaryCell = weekSheet.getCell(`A${wRow}`);
    summaryCell.value = `WEEK ${week.weekNumber} SUMMARY: ${week.completedTasks}/${week.totalTasks} Tasks Completed (${week.completionRate}%) | ${week.pendingTasks} Pending`;
    summaryCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF0F172A' } };
    summaryCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE2E8F0' } };
    weekSheet.getRow(wRow).height = 24;
  });

  // Write and trigger download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Monthly_Report_${monthName}_${year}_${userProfile.employeeName.replace(/\s+/g, '_')}.xlsx`;
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
        row.getCell(7).value = task.isCompleted ? '✓' : '✗';
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
