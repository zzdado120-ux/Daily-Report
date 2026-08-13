import { AppState, DayReport, DefaultTimeSlotTemplate, UserProfile } from '../types';
import { formatDateKey, formatFullDateHeader, getCurrentTimeString, isMondayOrOffDay } from './dateUtils';

const STORAGE_KEY = 'daily_report_schedule_app_state_v1';

export const INITIAL_DEFAULT_SCHEDULE: DefaultTimeSlotTemplate[] = [
  { id: '1', timeSlot: '08:00 - 09:00', taskName: 'Check Platform', scheduleType: 'Schedule' },
  { id: '2', timeSlot: '09:00 - 10:00', taskName: 'Check Platform', scheduleType: 'Schedule' },
  { id: '3', timeSlot: '10:00 - 11:00', taskName: 'Post Pg', scheduleType: 'Schedule' },
  { id: '4', timeSlot: '11:00 - 12:00', taskName: 'Respond to User Queries', scheduleType: 'Schedule' },
  { id: '5', timeSlot: '12:00 - 13:00', taskName: 'Lunch Break & System Rest', scheduleType: 'Schedule' },
  { id: '6', timeSlot: '13:00 - 14:00', taskName: 'System Operations & Monitoring', scheduleType: 'Schedule' },
  { id: '7', timeSlot: '14:00 - 15:00', taskName: 'Post Pg / Content Update', scheduleType: 'Schedule' },
  { id: '8', timeSlot: '15:00 - 16:00', taskName: 'Follow-up Tasks & Inquiries', scheduleType: 'Schedule' },
  { id: '9', timeSlot: '16:00 - 17:00', taskName: 'Daily Summary & Report Review', scheduleType: 'Schedule' },
];

export const INITIAL_USER_PROFILE: UserProfile = {
  employeeName: 'ROTH DARO',
  department: 'Operations & Platform Management',
  supervisorName: 'Operations Lead',
  offDays: [1], // Monday is Holiday
  autoSyncGoogleSheets: false,
};

/**
 * Creates a brand new DayReport for dateStr (YYYY-MM-DD)
 */
export function createNewDayReport(dateStr: string, template: DefaultTimeSlotTemplate[], userProfile: UserProfile): DayReport {
  const { dayOfWeek } = formatFullDateHeader(dateStr);
  const isHoliday = isMondayOrOffDay(dateStr, userProfile.offDays);

  const [y, m, d] = dateStr.split('-').map(Number);
  const dayIndex = new Date(y, m - 1, d).getDay(); // 0=Sun, 1=Mon, 2=Tue...

  // Filter templates matching this day
  const applicableTemplates = template.filter((item) => {
    const scope = item.applicableScope || 'all';
    if (scope === 'specific_date') {
      return item.specificDate === dateStr;
    }
    if (scope === 'specific_days') {
      return Array.isArray(item.daysOfWeek) && item.daysOfWeek.includes(dayIndex);
    }
    return true; // 'all'
  });

  return {
    date: dateStr,
    dayOfWeek,
    isHoliday,
    holidayReason: isHoliday ? `${dayOfWeek} Holiday (Weekly Off)` : undefined,
    lastUpdated: new Date().toISOString(),
    tasks: isHoliday
      ? []
      : applicableTemplates.map((item) => ({
          id: `${dateStr}_${item.id}_${Math.random().toString(36).substr(2, 4)}`,
          timeSlot: item.timeSlot,
          taskName: item.taskName,
          scheduleType: item.scheduleType || 'Schedule',
          isCompleted: false,
          completedAt: undefined,
          notes: '',
          applicableScope: item.applicableScope || 'all',
          daysOfWeek: item.daysOfWeek,
          specificDate: item.specificDate,
        })),
  };
}

/**
 * Pre-generate some realistic sample report entries for past few days
 */
function getInitialSampleReports(template: DefaultTimeSlotTemplate[], userProfile: UserProfile): Record<string, DayReport> {
  const reports: Record<string, DayReport> = {};
  const today = new Date();

  // Create entries for past 5 days
  for (let i = 5; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateKey = formatDateKey(d);
    const report = createNewDayReport(dateKey, template, userProfile);

    // If it's not a holiday and in the past, mark some tasks as completed
    if (!report.isHoliday && i > 0) {
      report.tasks = report.tasks.map((task, idx) => {
        // Complete most tasks for historical realism
        if (idx < report.tasks.length - 1) {
          return {
            ...task,
            isCompleted: true,
            completedAt: `${task.timeSlot.split(' - ')[0]}:12:05 AM`,
            notes: idx === 0 ? 'Platform status normal' : idx === 2 ? 'Post published on main page' : 'Completed on schedule',
          };
        }
        return task;
      });
    }

    reports[dateKey] = report;
  }

  return reports;
}

/**
 * Load application state from localStorage
 */
export function loadAppState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.userProfile && parsed.defaultSchedule && parsed.reports) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load state from localStorage:', err);
  }

  // Fallback initial state
  const defaultSchedule = INITIAL_DEFAULT_SCHEDULE;
  const userProfile = INITIAL_USER_PROFILE;
  const reports = getInitialSampleReports(defaultSchedule, userProfile);

  const state: AppState = {
    reports,
    defaultSchedule,
    userProfile,
  };

  saveAppState(state);
  return state;
}

/**
 * Save state to localStorage
 */
export function saveAppState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Error saving app state to localStorage:', err);
  }
}
