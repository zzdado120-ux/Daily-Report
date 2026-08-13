export type TaskScope = 'all' | 'specific_days' | 'specific_date';

export interface ScheduleTask {
  id: string;
  timeSlot: string; // e.g. "08:00 - 09:00"
  taskName: string; // e.g. "Check Platform"
  scheduleType?: string; // e.g. "Schedule"
  isCompleted: boolean;
  completedAt?: string; // ISO string or formatted "08:14:22 AM"
  notes?: string;
  applicableScope?: TaskScope;
  daysOfWeek?: number[]; // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
  specificDate?: string; // "YYYY-MM-DD"
}

export interface DayReport {
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  isHoliday: boolean;
  holidayReason?: string;
  tasks: ScheduleTask[];
  notes?: string;
  lastUpdated: string;
}

export interface DefaultTimeSlotTemplate {
  id: string;
  timeSlot: string;
  taskName: string;
  scheduleType: string; // Default: "Schedule"
  applicableScope?: TaskScope; // 'all' (default), 'specific_days', or 'specific_date'
  daysOfWeek?: number[]; // [1, 2, 3, 4, 5] etc.
  specificDate?: string; // "YYYY-MM-DD"
}

export interface UserProfile {
  employeeName: string;
  department: string;
  supervisorName: string;
  offDays: number[]; // 1 = Monday, 0 = Sunday, etc. Default [1] (Monday)
  googleSheetWebAppUrl?: string;
  autoSyncGoogleSheets?: boolean;
}

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AppState {
  reports: Record<string, DayReport>; // Keyed by YYYY-MM-DD
  defaultSchedule: DefaultTimeSlotTemplate[];
  userProfile: UserProfile;
}

