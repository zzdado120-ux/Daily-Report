/**
 * Date utility functions for Daily Report Schedule Tracker
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

/**
 * Returns YYYY-MM-DD for a given Date object or today
 */
export function formatDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats YYYY-MM-DD to "17 July 2026 / Friday"
 */
export function formatFullDateHeader(dateStr: string): {
  formattedText: string;
  dayNumber: number;
  monthName: string;
  year: number;
  dayOfWeek: string;
} {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const dayNumber = parseInt(dayStr, 10);
  
  // Construct date safely in local time
  const dateObj = new Date(year, monthIndex, dayNumber);
  const dayOfWeekIndex = dateObj.getDay();
  const dayOfWeek = DAY_NAMES[dayOfWeekIndex];
  const monthName = MONTH_NAMES[monthIndex];

  const formattedText = `${dayNumber} ${monthName} ${year} / ${dayOfWeek}`;

  return {
    formattedText,
    dayNumber,
    monthName,
    year,
    dayOfWeek
  };
}

/**
 * Check if a date key YYYY-MM-DD is Monday (day index 1) or in offDays array
 */
export function isMondayOrOffDay(dateStr: string, offDays: number[] = [1]): boolean {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  const dayIndex = dateObj.getDay(); // 0 = Sunday, 1 = Monday
  return offDays.includes(dayIndex);
}

/**
 * Get current time string formatted as HH:MM:SS AM/PM or HH:MM
 */
export function getCurrentTimeString(): string {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
}

/**
 * Helper to add or subtract days from YYYY-MM-DD
 */
export function addDaysToDateKey(dateStr: string, days: number): string {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));
  dateObj.setDate(dateObj.getDate() + days);
  return formatDateKey(dateObj);
}

export interface MonthWeekGroup {
  weekNumber: number;
  weekLabel: string;
  shortLabel: string;
  startDate: string;
  endDate: string;
  reports: any[]; // DayReport[]
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  completionRate: number;
  workingDays: number;
  holidays: number;
}

/**
 * Groups days of a target month (YYYY-MM) into calendar weeks (Monday to Sunday)
 */
export function getMonthWeekBuckets(year: number, monthIndex: number): Array<{
  weekNumber: number;
  startDay: number;
  endDay: number;
  startDate: string;
  endDate: string;
  label: string;
}> {
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const weeks: Array<{
    weekNumber: number;
    startDay: number;
    endDay: number;
    startDate: string;
    endDate: string;
    label: string;
  }> = [];

  let currentStartDay = 1;
  let weekNum = 1;

  while (currentStartDay <= daysInMonth) {
    const curDate = new Date(year, monthIndex, currentStartDay);
    const dayOfWeek = curDate.getDay(); // 0 = Sunday, 1 = Monday ... 6 = Saturday
    // Days remaining until Sunday (Sunday is end of week, where Sunday dayOfWeek is 0)
    const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    const endDay = Math.min(currentStartDay + daysUntilSunday, daysInMonth);

    const startStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(currentStartDay).padStart(2, '0')}`;
    const endStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
    const monthName = MONTH_NAMES[monthIndex].substring(0, 3);

    const label = `Week ${weekNum} (${String(currentStartDay).padStart(2, '0')} ${monthName} - ${String(endDay).padStart(2, '0')} ${monthName} ${year})`;

    weeks.push({
      weekNumber: weekNum,
      startDay: currentStartDay,
      endDay,
      startDate: startStr,
      endDate: endStr,
      label
    });

    currentStartDay = endDay + 1;
    weekNum++;
  }

  return weeks;
}
