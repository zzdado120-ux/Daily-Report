import React, { useState, useEffect, useMemo } from 'react';
import { AppState, DayReport, DefaultTimeSlotTemplate, UserProfile, AuthUser, TaskScope } from './types';
import {
  loadAppState,
  saveAppState,
  createNewDayReport,
  INITIAL_DEFAULT_SCHEDULE,
  INITIAL_USER_PROFILE
} from './utils/storage';
import {
  formatDateKey,
  formatFullDateHeader,
  getCurrentTimeString
} from './utils/dateUtils';
import {
  subscribeToAuth,
  loginWithGoogle,
  logout
} from './lib/firebase';
import {
  saveUserProfileToFirestore,
  saveTemplatesToFirestore,
  saveDayReportToFirestore,
  subscribeToUserProfile,
  subscribeToTemplates,
  subscribeToReports,
  seedInitialFirestoreData
} from './utils/firestoreService';

import { Header } from './components/Header';
import { DateNavigator } from './components/DateNavigator';
import { Checklist } from './components/Checklist';
import { MondayHolidayCard } from './components/MondayHolidayCard';
import { SummaryTable } from './components/SummaryTable';
import { TemplateEditorModal } from './components/TemplateEditorModal';
import { ExportModal } from './components/ExportModal';
import { SettingsModal } from './components/SettingsModal';

export default function App() {
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateKey(new Date()));
  const [currentView, setCurrentView] = useState<'checklist' | 'summary'>('checklist');

  // Firebase Auth state
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modal open states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Subscribe to Firebase Auth changes
  useEffect(() => {
    const unsubscribeAuth = subscribeToAuth(async (user) => {
      if (user) {
        const authData: AuthUser = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        };
        setAuthUser(authData);

        // Seed initial data if first time user on Cloud
        await seedInitialFirestoreData(user.uid, appState);
      } else {
        setAuthUser(null);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Realtime Firestore listeners when logged in
  useEffect(() => {
    if (!authUser) return;

    setIsSyncing(true);

    // 1. Subscribe to profile
    const unsubProfile = subscribeToUserProfile(authUser.uid, (cloudProfile) => {
      setAppState((prev) => ({ ...prev, userProfile: cloudProfile }));
    });

    // 2. Subscribe to templates
    const unsubTemplates = subscribeToTemplates(authUser.uid, (cloudTemplates) => {
      setAppState((prev) => ({ ...prev, defaultSchedule: cloudTemplates }));
    });

    // 3. Subscribe to reports map
    const unsubReports = subscribeToReports(authUser.uid, (cloudReports) => {
      setAppState((prev) => ({
        ...prev,
        reports: { ...prev.reports, ...cloudReports },
      }));
      setIsSyncing(false);
    });

    return () => {
      unsubProfile();
      unsubTemplates();
      unsubReports();
    };
  }, [authUser?.uid]);

  // Sync state to localStorage on local state changes
  useEffect(() => {
    saveAppState(appState);
  }, [appState]);

  // Retrieve or initialize report for currently selected date
  const currentReport: DayReport = useMemo(() => {
    if (appState.reports[selectedDate]) {
      return appState.reports[selectedDate];
    }
    // Create new report for selectedDate
    return createNewDayReport(selectedDate, appState.defaultSchedule, appState.userProfile);
  }, [selectedDate, appState.reports, appState.defaultSchedule, appState.userProfile]);

  // Ensure currentReport is stored in appState if not already present
  useEffect(() => {
    if (!appState.reports[selectedDate]) {
      const newReport = currentReport;
      setAppState((prev) => ({
        ...prev,
        reports: {
          ...prev.reports,
          [selectedDate]: newReport,
        },
      }));

      if (authUser) {
        saveDayReportToFirestore(authUser.uid, newReport);
      }
    }
  }, [selectedDate, currentReport, appState.reports, authUser]);

  // Date Header info
  const dateHeaderInfo = useMemo(() => {
    return formatFullDateHeader(selectedDate);
  }, [selectedDate]);

  // Task metrics for current date
  const completedTasksCount = useMemo(() => {
    return currentReport.tasks.filter((t) => t.isCompleted).length;
  }, [currentReport]);

  const totalTasksCount = currentReport.tasks.length;

  const completionPercentage = useMemo(() => {
    if (totalTasksCount === 0) return 0;
    return Math.round((completedTasksCount / totalTasksCount) * 100);
  }, [completedTasksCount, totalTasksCount]);

  // --- GOOGLE AUTH HANDLERS ---
  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Login failed:', err);
      alert('Google Login failed: ' + (err.message || 'Please try again.'));
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err: any) {
      console.error('Logout failed:', err);
    }
  };

  // --- REPORT UPDATE HELPERS WITH FIRESTORE SYNC ---
  const updateCurrentReport = (modifier: (rep: DayReport) => DayReport) => {
    setAppState((prev) => {
      const existing = prev.reports[selectedDate] || currentReport;
      const updated = modifier({ ...existing, lastUpdated: new Date().toISOString() });
      
      // Save to Firestore in real time if logged in
      if (authUser) {
        saveDayReportToFirestore(authUser.uid, updated);
      }

      return {
        ...prev,
        reports: {
          ...prev.reports,
          [selectedDate]: updated,
        },
      };
    });
  };

  const handleToggleTask = (taskId: string, completed: boolean, timestamp?: string) => {
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              isCompleted: completed,
              completedAt: completed ? timestamp || getCurrentTimeString() : undefined,
            }
          : t
      ),
    }));
  };

  const handleUpdateNotes = (taskId: string, notes: string) => {
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) => (t.id === taskId ? { ...t, notes } : t)),
    }));
  };

  const handleAddTask = (timeSlot: string, taskName: string, scope: TaskScope = 'specific_date', daysOfWeek?: number[]) => {
    const newTask = {
      id: `${selectedDate}_${Date.now()}`,
      timeSlot,
      taskName,
      scheduleType: 'Schedule',
      isCompleted: false,
      applicableScope: scope,
      daysOfWeek,
      specificDate: scope === 'specific_date' ? selectedDate : undefined,
    };

    // If task is scoped to all working days or specific days of week, also add to template
    if (scope === 'all' || scope === 'specific_days') {
      const newTemplateItem: DefaultTimeSlotTemplate = {
        id: Date.now().toString(),
        timeSlot,
        taskName,
        scheduleType: 'Schedule',
        applicableScope: scope,
        daysOfWeek,
      };

      const updatedTemplates = [...appState.defaultSchedule, newTemplateItem];
      setAppState((prev) => ({
        ...prev,
        defaultSchedule: updatedTemplates,
      }));

      if (authUser) {
        saveTemplatesToFirestore(authUser.uid, updatedTemplates);
      }
    }

    updateCurrentReport((rep) => ({
      ...rep,
      tasks: [...rep.tasks, newTask],
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.filter((t) => t.id !== taskId),
    }));
  };

  const handleMarkAllComplete = () => {
    const time = getCurrentTimeString();
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) => ({
        ...t,
        isCompleted: true,
        completedAt: t.completedAt || time,
      })),
    }));
  };

  const handleResetTasks = () => {
    updateCurrentReport((rep) => ({
      ...rep,
      tasks: rep.tasks.map((t) => ({
        ...t,
        isCompleted: false,
        completedAt: undefined,
      })),
    }));
  };

  const handleOverrideHoliday = () => {
    const templateTasks = appState.defaultSchedule.map((item) => ({
      id: `${selectedDate}_${item.id}`,
      timeSlot: item.timeSlot,
      taskName: item.taskName,
      scheduleType: item.scheduleType || 'Schedule',
      isCompleted: false,
      applicableScope: item.applicableScope || 'all',
      daysOfWeek: item.daysOfWeek,
      specificDate: item.specificDate,
    }));

    updateCurrentReport((rep) => ({
      ...rep,
      isHoliday: false,
      holidayReason: undefined,
      tasks: templateTasks,
    }));
  };

  const handleSaveScheduleTemplate = (updatedSchedule: DefaultTimeSlotTemplate[]) => {
    setAppState((prev) => ({
      ...prev,
      defaultSchedule: updatedSchedule,
    }));

    if (authUser) {
      saveTemplatesToFirestore(authUser.uid, updatedSchedule);
    }
  };

  const handleSaveProfile = (updatedProfile: UserProfile) => {
    setAppState((prev) => ({
      ...prev,
      userProfile: updatedProfile,
    }));

    if (authUser) {
      saveUserProfileToFirestore(authUser.uid, updatedProfile);
    }
  };

  const handleRestoreState = (restoredState: AppState) => {
    setAppState(restoredState);
    if (authUser) {
      saveUserProfileToFirestore(authUser.uid, restoredState.userProfile);
      saveTemplatesToFirestore(authUser.uid, restoredState.defaultSchedule);
      for (const dateKey of Object.keys(restoredState.reports)) {
        saveDayReportToFirestore(authUser.uid, restoredState.reports[dateKey]);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-200 selection:text-slate-900">
      
      {/* Header */}
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        formattedDateText={dateHeaderInfo.formattedText}
        userProfile={appState.userProfile}
        authUser={authUser}
        onGoogleLogin={handleGoogleLogin}
        onLogout={handleLogout}
        isSyncing={isSyncing}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        completionPercentage={completionPercentage}
        isHoliday={currentReport.isHoliday}
      />

      {/* Date Navigator Banner */}
      <DateNavigator
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        formattedDateText={dateHeaderInfo.formattedText}
        dayOfWeek={dateHeaderInfo.dayOfWeek}
        isHoliday={currentReport.isHoliday}
        completedTasksCount={completedTasksCount}
        totalTasksCount={totalTasksCount}
        completionPercentage={completionPercentage}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentView === 'checklist' ? (
          currentReport.isHoliday ? (
            <MondayHolidayCard
              dayOfWeek={dateHeaderInfo.dayOfWeek}
              onOverrideHoliday={handleOverrideHoliday}
            />
          ) : (
            <Checklist
              tasks={currentReport.tasks}
              onToggleTask={handleToggleTask}
              onUpdateNotes={handleUpdateNotes}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
              onMarkAllComplete={handleMarkAllComplete}
              onResetTasks={handleResetTasks}
            />
          )
        ) : (
          <SummaryTable
            reports={appState.reports}
            userProfile={appState.userProfile}
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        report={currentReport}
        reportsMap={appState.reports}
        userProfile={appState.userProfile}
      />

      <TemplateEditorModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        defaultSchedule={appState.defaultSchedule}
        onSaveSchedule={handleSaveScheduleTemplate}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        userProfile={appState.userProfile}
        onSaveProfile={handleSaveProfile}
        appState={appState}
        onRestoreState={handleRestoreState}
      />

    </div>
  );
}

