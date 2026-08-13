import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Cloud, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { DayReport, UserProfile } from '../types';
import { exportReportToExcel, exportAllReportsToExcel } from '../utils/excelExport';
import { exportReportToPDF } from '../utils/pdfExport';
import { syncReportToGoogleSheets } from '../utils/googleSheetsSync';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: DayReport;
  reportsMap: Record<string, DayReport>;
  userProfile: UserProfile;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  report,
  reportsMap,
  userProfile,
}) => {
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  if (!isOpen) return null;

  const handleExcelExportSingle = async () => {
    await exportReportToExcel(report, userProfile);
  };

  const handleExcelExportAll = async () => {
    await exportAllReportsToExcel(Object.values(reportsMap), userProfile);
  };

  const handlePDFExport = () => {
    exportReportToPDF(report, userProfile);
  };

  const handleGoogleSheetsSync = async () => {
    setIsSyncingSheets(true);
    setSyncStatus(null);
    const result = await syncReportToGoogleSheets(report, userProfile);
    setIsSyncingSheets(false);
    setSyncStatus(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span>Export & Cloud Sync</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate formatted report files or sync directly with Google Sheets.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Options */}
        <div className="p-6 space-y-4">
          
          {/* Option 1: Excel (.xlsx) Styled */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-300 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Excel (.xlsx) Report</h3>
                <p className="text-xs text-slate-500">
                  Yellow header banner, red "Schedule" column, formatted status & signature blocks.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 shrink-0">
              <button
                onClick={handleExcelExportSingle}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Today ({report.date})
              </button>
              <button
                onClick={handleExcelExportAll}
                className="px-3 py-1 text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 text-[11px] font-semibold rounded-lg transition-all"
              >
                All History
              </button>
            </div>
          </div>

          {/* Option 2: PDF Download */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl hover:border-slate-300 transition-all flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">PDF Document</h3>
                <p className="text-xs text-slate-500">
                  Clean printable PDF layout for manager review & physical sign-off.
                </p>
              </div>
            </div>

            <button
              onClick={handlePDFExport}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0"
            >
              Download PDF
            </button>
          </div>

          {/* Option 3: Google Sheets Sync */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0">
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-950">Live Google Sheets Sync</h3>
                  <p className="text-xs text-amber-800">
                    Sync checked rows directly to your manager's live Google Sheet.
                  </p>
                </div>
              </div>

              <button
                onClick={handleGoogleSheetsSync}
                disabled={isSyncingSheets}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-60"
              >
                {isSyncingSheets ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Syncing...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-4 h-4" />
                    <span>Sync Now</span>
                  </>
                )}
              </button>
            </div>

            {/* Sync Feedback */}
            {syncStatus && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  syncStatus.success
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {syncStatus.success ? (
                  <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0" />
                )}
                <span>{syncStatus.message}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
