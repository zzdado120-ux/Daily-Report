import { jsPDF } from 'jspdf';
import { DayReport, UserProfile } from '../types';
import { formatFullDateHeader } from './dateUtils';

/**
 * Generates a clean PDF document of the Daily Report using jsPDF
 */
export function exportReportToPDF(report: DayReport, userProfile: UserProfile): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const { formattedText } = formatFullDateHeader(report.date);

  // Colors
  const yellowColor = [253, 224, 71]; // #FDE047
  const darkNavy = [30, 41, 59]; // #1E293B
  const redColor = [220, 38, 38]; // #DC2626
  const lightRed = [254, 226, 226]; // #FEE2E2
  const lightGray = [248, 250, 252];
  const greenColor = [21, 128, 61];

  // 1. TOP HEADER BANNER (Yellow background)
  doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2]);
  doc.rect(10, 10, 190, 16, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  const headerTitle = `DAILY REPORT / ${formattedText.toUpperCase()} / ${userProfile.employeeName.toUpperCase()}`;
  doc.text(headerTitle, 105, 20, { align: 'center' });

  // 2. METADATA
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Department: ${userProfile.department}`, 10, 32);
  doc.text(`Supervisor: ${userProfile.supervisorName}`, 200, 32, { align: 'right' });

  // 3. TABLE HEADERS
  let currentY = 38;
  const colX = [10, 22, 55, 110, 132, 155, 180];
  const colWidths = [12, 33, 55, 22, 23, 25, 20];
  const headers = ['No.', 'Time Slot', 'Task Name', 'Schedule', 'Status', 'Checked At', 'Notes'];

  // Draw Header Background
  doc.setFillColor(darkNavy[0], darkNavy[1], darkNavy[2]);
  doc.rect(10, currentY, 190, 8, 'F');

  // Draw Header Labels
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);

  headers.forEach((h, i) => {
    if (h === 'Schedule') {
      // Highlight schedule header with Red
      doc.setFillColor(redColor[0], redColor[1], redColor[2]);
      doc.rect(colX[i], currentY, colWidths[i], 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text(h, colX[i] + colWidths[i] / 2, currentY + 5.5, { align: 'center' });
    } else {
      const align = i === 2 || i === 6 ? 'left' : 'center';
      const posX = align === 'left' ? colX[i] + 2 : colX[i] + colWidths[i] / 2;
      doc.text(h, posX, currentY + 5.5, { align: align as any });
    }
  });

  currentY += 8;

  // 4. TABLE CONTENT
  if (report.isHoliday) {
    // Holiday Block
    doc.setFillColor(254, 243, 199); // Amber tint
    doc.rect(10, currentY, 190, 14, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.rect(10, currentY, 190, 14, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(180, 83, 9);
    doc.text(`HOLIDAY — ${report.dayOfWeek.toUpperCase()} OFF DAY (NO SCHEDULED TASKS)`, 105, currentY + 8.5, { align: 'center' });
    currentY += 14;
  } else if (!report.tasks || report.tasks.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('No scheduled tasks recorded for this date.', 105, currentY + 8, { align: 'center' });
    currentY += 12;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);

    report.tasks.forEach((task, idx) => {
      const rowHeight = 8;

      // Row Zebra striping
      if (idx % 2 === 1) {
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.rect(10, currentY, 190, rowHeight, 'F');
      }

      // Schedule cell background
      doc.setFillColor(lightRed[0], lightRed[1], lightRed[2]);
      doc.rect(colX[3], currentY, colWidths[3], rowHeight, 'F');

      // Grid line
      doc.setDrawColor(226, 232, 240);
      doc.line(10, currentY + rowHeight, 200, currentY + rowHeight);

      // Data Values
      doc.setTextColor(15, 23, 42);
      doc.text(String(idx + 1), colX[0] + colWidths[0] / 2, currentY + 5.5, { align: 'center' });
      doc.text(task.timeSlot, colX[1] + colWidths[1] / 2, currentY + 5.5, { align: 'center' });

      // Task Name (Truncate if too long)
      const taskTruncated = doc.splitTextToSize(task.taskName, colWidths[2] - 3)[0] || '';
      doc.text(taskTruncated, colX[2] + 2, currentY + 5.5);

      // Schedule text in RED
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(redColor[0], redColor[1], redColor[2]);
      doc.text('Schedule', colX[3] + colWidths[3] / 2, currentY + 5.5, { align: 'center' });

      // Status
      doc.setFont('helvetica', 'bold');
      if (task.isCompleted) {
        doc.setTextColor(greenColor[0], greenColor[1], greenColor[2]);
        doc.text('DONE', colX[4] + colWidths[4] / 2, currentY + 5.5, { align: 'center' });
      } else {
        doc.setTextColor(234, 88, 12);
        doc.text('PENDING', colX[4] + colWidths[4] / 2, currentY + 5.5, { align: 'center' });
      }

      // Time Checked
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(task.completedAt || '-', colX[5] + colWidths[5] / 2, currentY + 5.5, { align: 'center' });

      // Notes
      const notesTruncated = doc.splitTextToSize(task.notes || '-', colWidths[6] - 3)[0] || '-';
      doc.text(notesTruncated, colX[6] + 2, currentY + 5.5);

      currentY += rowHeight;
    });
  }

  // 5. SUMMARY METRICS
  currentY += 8;
  if (!report.isHoliday && report.tasks.length > 0) {
    const completedCount = report.tasks.filter((t) => t.isCompleted).length;
    const totalCount = report.tasks.length;
    const pct = Math.round((completedCount / totalCount) * 100);

    doc.setFillColor(241, 245, 249);
    doc.rect(10, currentY, 190, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`SUMMARY STATS: ${completedCount} / ${totalCount} Tasks Completed (${pct}% Completion Rate)`, 15, currentY + 6.5);
    currentY += 16;
  } else {
    currentY += 10;
  }

  // 6. SIGNATURE BLOCK
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Prepared by: ________________________ (${userProfile.employeeName})`, 10, currentY);
  doc.text(`Approved by: ________________________ (${userProfile.supervisorName})`, 200, currentY, { align: 'right' });

  // Save PDF
  doc.save(`Daily_Report_${report.date}_${userProfile.employeeName.replace(/\s+/g, '_')}.pdf`);
}
