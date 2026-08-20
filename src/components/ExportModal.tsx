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
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  if (!isOpen) return null;

  const handleExcelExportSingle = async () => {
    await exportReportToExcel(report, userProfile);
  };

  const handleExcelExportAll = async () => {
    await exportAllReportsToExcel(Object.values(reportsMap), userProfile);
  };

  const handlePDFExport = async () => {
    setIsExportingPDF(true);
    try {
      await exportReportToPDF(report, userProfile);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleGoogleSheetsSync = async () => {
    setIsSyncingSheets(true);
    setSyncStatus(null);
    const result = await syncReportToGoogleSheets(report, userProfile);
    setIsSyncingSheets(false);
    setSyncStatus(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
              <span>Export & Cloud Sync</span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Generate formatted report files or sync with Google Sheets.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Options */}
        <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4 overflow-y-auto flex-1">
          
          {/* Option 1: Excel (.xlsx) Styled */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                <FileSpreadsheet className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">Excel (.xlsx) Report</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-snug sm:leading-normal">
                  Yellow header banner, red "Schedule" column, formatted status & signature blocks.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
              <button
                onClick={handleExcelExportSingle}
                className="px-3 py-2 sm:py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all text-center"
              >
                Today ({report.date})
              </button>
              <button
                onClick={handleExcelExportAll}
                className="px-3 py-2 sm:py-1 text-slate-700 hover:bg-slate-200 bg-white border border-slate-200 text-[11px] font-semibold rounded-xl sm:rounded-lg transition-all text-center shadow-xs"
              >
                All History
              </button>
            </div>
          </div>

          {/* Option 2: PDF Download */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border border-slate-200 rounded-xl sm:rounded-2xl hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900">PDF Document</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-snug sm:leading-normal">
                  Clean printable PDF with company logo & signature line.
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
              <button
                onClick={handlePDFExport}
                disabled={isExportingPDF}
                className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all shrink-0 flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {isExportingPDF ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Preparing PDF...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 3: Google Sheets Sync */}
          <div className="p-3.5 sm:p-4 bg-amber-50/70 border border-amber-200 rounded-xl sm:rounded-2xl flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold shrink-0 mt-0.5 sm:mt-0">
                  <Cloud className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-amber-950">Live Google Sheets Sync</h3>
                  <p className="text-[11px] sm:text-xs text-amber-800 leading-snug sm:leading-normal">
                    Sync checked rows directly to your manager's live Google Sheet.
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-amber-200/60">
                <button
                  onClick={handleGoogleSheetsSync}
                  disabled={isSyncingSheets}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-60"
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
                <span className="text-[11px] sm:text-xs break-words">{syncStatus.message}</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 sm:py-2 text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 rounded-xl transition-all shadow-sm text-center"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
