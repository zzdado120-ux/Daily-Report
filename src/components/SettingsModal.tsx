import React, { useState } from 'react';
import { X, User, Settings as SettingsIcon, Copy, Check, Save, Code, Download, Upload, AlertTriangle } from 'lucide-react';
import { UserProfile, AppState } from '../types';
import { APPS_SCRIPT_SNIPPET } from '../utils/googleSheetsSync';
import { DAY_NAMES } from '../utils/dateUtils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onSaveProfile: (updatedProfile: UserProfile) => void;
  appState: AppState;
  onRestoreState: (state: AppState) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  appState,
  onRestoreState,
}) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);

  if (!isOpen) return null;

  const handleDayToggle = (dayIndex: number) => {
    setProfile((prev) => {
      const exists = prev.offDays.includes(dayIndex);
      const updated = exists
        ? prev.offDays.filter((d) => d !== dayIndex)
        : [...prev.offDays, dayIndex];
      return { ...prev, offDays: updated };
    });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleSave = () => {
    onSaveProfile(profile);
    onClose();
  };

  const handleExportBackup = () => {
    const jsonStr = JSON.stringify(appState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Daily_Report_Tracker_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && parsed.reports && parsed.userProfile) {
          onRestoreState(parsed);
          alert('Data backup successfully restored!');
          onClose();
        } else {
          alert('Invalid backup file format.');
        }
      } catch (err) {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-yellow-400" />
              <span>Profile & App Settings</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure employee credentials, holiday schedule rules, and Google Sheets integration.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* User Profile Info */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <User className="w-4 h-4 text-yellow-500" />
              <span>Employee & Report Header Information</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employee Name</label>
                <input
                  type="text"
                  value={profile.employeeName}
                  onChange={(e) => setProfile({ ...profile, employeeName: e.target.value })}
                  placeholder="e.g. ROTH DARO"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Department / Role</label>
                <input
                  type="text"
                  value={profile.department}
                  onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                  placeholder="e.g. Operations & Platform"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Supervisor / Manager Name</label>
                <input
                  type="text"
                  value={profile.supervisorName}
                  onChange={(e) => setProfile({ ...profile, supervisorName: e.target.value })}
                  placeholder="e.g. Operations Lead"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Off Days Configuration */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Weekly Off Days (Holiday Rule)
            </h3>
            <p className="text-xs text-slate-500">
              Selected days will automatically skip task list generation and display "Holiday" instead.
            </p>

            <div className="flex flex-wrap gap-2">
              {DAY_NAMES.map((dayName, idx) => {
                const isChecked = profile.offDays.includes(idx);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => handleDayToggle(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      isChecked
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? '✓ ' : ''}{dayName} {idx === 1 ? '(Monday Default)' : ''}
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Google Sheets Web App Endpoint setup */}
          <div className="space-y-3 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Google Sheets Sync Endpoint
              </h3>
              <button
                type="button"
                onClick={() => setShowScriptCode(!showScriptCode)}
                className="text-xs text-amber-800 underline font-semibold flex items-center gap-1"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showScriptCode ? 'Hide Apps Script' : 'Get Apps Script Code'}</span>
              </button>
            </div>

            <p className="text-xs text-amber-800">
              Enter your Google Apps Script Web App URL below to sync your checked daily tasks live to Google Sheets.
            </p>

            <input
              type="text"
              value={profile.googleSheetWebAppUrl || ''}
              onChange={(e) => setProfile({ ...profile, googleSheetWebAppUrl: e.target.value })}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />

            {showScriptCode && (
              <div className="mt-2 p-3 bg-slate-900 rounded-xl text-white text-[11px] font-mono space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-bold">Google Apps Script Snippet</span>
                  <button
                    onClick={handleCopyScript}
                    className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px] font-semibold"
                  >
                    {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedScript ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>
                <pre className="max-h-40 overflow-y-auto p-2 bg-slate-950 rounded text-slate-300 whitespace-pre-wrap">
                  {APPS_SCRIPT_SNIPPET}
                </pre>
              </div>
            )}
          </div>

          <hr className="border-slate-100" />

          {/* Backup & Data Restore */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Data Management & Backup
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Export JSON Backup</span>
              </button>

              <label className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer transition-all">
                <Upload className="w-4 h-4 text-slate-600" />
                <span>Restore JSON Backup</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>

      </div>
    </div>
  );
};
