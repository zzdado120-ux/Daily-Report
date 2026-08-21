import { jsPDF } from 'jspdf';
import { DayReport, UserProfile } from '../types';
import { formatFullDateHeader } from './dateUtils';

/**
 * Loads an image URL and converts it to base64 Data URL for jsPDF embedding
 */
async function loadImageDataUrl(url: string): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:image/')) {
    return url;
  }
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width || 200;
        canvas.height = img.naturalHeight || img.height || 200;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      } catch (err) {
        console.warn('Canvas toDataURL conversion failed:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Generates a clean PDF document of the Daily Report with Company Logo using jsPDF
 */
export async function exportReportToPDF(report: DayReport, userProfile: UserProfile): Promise<void> {
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

  // Try to load company logo
  let logoDataUrl: string | null = null;
  if (userProfile.companyLogoUrl) {
    try {
      logoDataUrl = await loadImageDataUrl(userProfile.companyLogoUrl);
    } catch (err) {
      console.warn('Could not load logo for PDF:', err);
    }
  }

  // 1. TOP HEADER BANNER (Yellow background)
  doc.setFillColor(yellowColor[0], yellowColor[1], yellowColor[2]);
  doc.rect(10, 10, 190, 18, 'F');

  // If logo exists, render on the left of the banner
  if (logoDataUrl) {
    try {
      // White badge card for logo
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(12, 11.5, 15, 15, 1.5, 1.5, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(12, 11.5, 15, 15, 1.5, 1.5, 'S');
      doc.addImage(logoDataUrl, 'PNG', 12.5, 12, 14, 14, undefined, 'FAST');
    } catch (err) {
      console.warn('Failed to embed logo into PDF canvas:', err);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42); // slate-900
  const companyPrefix = userProfile.companyName ? `${userProfile.companyName.toUpperCase()} - ` : '';
  const headerTitle = `${companyPrefix}DAILY REPORT / ${formattedText.toUpperCase()} / ${userProfile.employeeName.toUpperCase()}`;
  
  // Position title with offset if logo is present
  const titleX = logoDataUrl ? 112 : 105;
  doc.text(headerTitle, titleX, 21, { align: 'center' });

  // 2. METADATA
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Department: ${userProfile.department}`, 10, 34);
  doc.text(`Supervisor: ${userProfile.supervisorName}`, 200, 34, { align: 'right' });

  // 3. TABLE HEADERS (Removed Checked At column)
  let currentY = 40;
  const colX = [10, 22, 57, 122, 145, 168];
  const colWidths = [12, 35, 65, 23, 23, 32];
  const headers = ['No.', 'Time Slot', 'Task Name / Activity', 'Schedule', 'Status', 'Notes'];

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
      const align = i === 2 || i === 5 ? 'left' : 'center';
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

      // Status - Vector Icon Badge (Guaranteed visible rendering in all PDF readers)
      const iconCenterX = colX[4] + colWidths[4] / 2;
      const iconCenterY = currentY + rowHeight / 2;

      if (task.isCompleted) {
        // Green badge background
        doc.setFillColor(220, 252, 231); // emerald-100
        doc.circle(iconCenterX, iconCenterY, 2.5, 'F');
        doc.setDrawColor(187, 247, 208); // emerald-200
        doc.setLineWidth(0.2);
        doc.circle(iconCenterX, iconCenterY, 2.5, 'S');

        // Crisp Checkmark vector lines
        doc.setDrawColor(21, 128, 61); // emerald-700
        doc.setLineWidth(0.5);
        doc.line(iconCenterX - 1.2, iconCenterY - 0.1, iconCenterX - 0.3, iconCenterY + 0.9);
        doc.line(iconCenterX - 0.3, iconCenterY + 0.9, iconCenterX + 1.2, iconCenterY - 0.9);
      } else {
        // Red badge background
        doc.setFillColor(254, 226, 226); // rose-100
        doc.circle(iconCenterX, iconCenterY, 2.5, 'F');
        doc.setDrawColor(254, 205, 211); // rose-200
        doc.setLineWidth(0.2);
        doc.circle(iconCenterX, iconCenterY, 2.5, 'S');

        // Crisp Cross vector lines
        doc.setDrawColor(220, 38, 38); // rose-600
        doc.setLineWidth(0.5);
        doc.line(iconCenterX - 0.9, iconCenterY - 0.9, iconCenterX + 0.9, iconCenterY + 0.9);
        doc.line(iconCenterX + 0.9, iconCenterY - 0.9, iconCenterX - 0.9, iconCenterY + 0.9);
      }

      // Notes (No Checked At column)
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const notesTruncated = doc.splitTextToSize(task.notes || '-', colWidths[5] - 3)[0] || '-';
      doc.text(notesTruncated, colX[5] + 2, currentY + 5.5);

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

