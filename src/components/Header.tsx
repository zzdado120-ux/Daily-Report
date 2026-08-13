import React from 'react';
import { Download, Settings, SlidersHorizontal, Table, CheckSquare, FileSpreadsheet, LogIn, LogOut, CloudCheck, RefreshCw } from 'lucide-react';
import { AuthUser, UserProfile } from '../types';

interface HeaderProps {
  currentView: 'checklist' | 'summary';
  setCurrentView: (view: 'checklist' | 'summary') => void;
  formattedDateText: string;
  userProfile: UserProfile;
  authUser: AuthUser | null;
  onGoogleLogin: () => void;
  onLogout: () => void;
  isSyncing?: boolean;
  onOpenExportModal: () => void;
  onOpenTemplateModal: () => void;
  onOpenSettingsModal: () => void;
  completionPercentage: number;
  isHoliday: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  formattedDateText,
  userProfile,
  authUser,
  onGoogleLogin,
  onLogout,
  isSyncing = false,
  onOpenExportModal,
  onOpenTemplateModal,
  onOpenSettingsModal,
  completionPercentage,
  isHoliday,
}) => {
  return (
    <header className="bg-white text-slate-900 border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* App Branding & User Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-slate-800">
                  {userProfile.employeeName || authUser?.displayName || 'ROTH DARO'}
                  <span className="text-slate-400 font-normal ml-2 text-sm hidden sm:inline">| Daily Report Engine</span>
                </h1>
              </div>
              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Realtime Sync: {authUser ? 'Connected to Cloud' : 'Local Mode'}</span>
                {isSyncing && <RefreshCw className="w-3 h-3 text-indigo-500 animate-spin ml-1" />}
              </p>
            </div>
          </div>

          {/* Center: View Switcher Tabs */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80 self-start md:self-center">
            <button
              onClick={() => setCurrentView('checklist')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'checklist'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Daily Checklist</span>
              {!isHoliday && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  currentView === 'checklist' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {completionPercentage}%
                </span>
              )}
            </button>

            <button
              onClick={() => setCurrentView('summary')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'summary'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Auto Summary Table</span>
            </button>
          </div>

          {/* Right: Google Auth & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Google Authentication Section */}
            {authUser ? (
              <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200/80 p-1 pr-2.5 rounded-xl">
                {authUser.photoURL ? (
                  <img
                    src={authUser.photoURL}
                    alt={authUser.displayName || 'User'}
                    className="w-7 h-7 rounded-lg object-cover border border-indigo-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {authUser.displayName?.[0] || authUser.email?.[0] || 'U'}
                  </div>
                )}
                <div className="hidden lg:block text-left pr-1">
                  <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[120px]">
                    {authUser.displayName || 'User'}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                    {authUser.email}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onGoogleLogin}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-sm transition-all active:scale-95"
                title="Sign in with Google to sync in real time across devices"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google Sign In</span>
              </button>
            )}

            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-sm transition-all active:scale-95"
              title="Download Excel / PDF Report"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export Report</span>
            </button>

            <button
              onClick={onOpenTemplateModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all"
              title="Customize Default Time Slots & Day Assignments"
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span className="hidden sm:inline">Schedule Template</span>
            </button>

            <button
              onClick={onOpenSettingsModal}
              className="p-1.5 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
              title="Profile & App Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};

