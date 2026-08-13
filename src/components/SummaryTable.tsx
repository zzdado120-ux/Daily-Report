import React, { useState, useMemo } from 'react';
import {
  Table,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  Clock,
  Coffee,
  Download,
  FileSpreadsheet,
  BarChart3,
  Tag
} from 'lucide-react';
import { DayReport, UserProfile } from '../types';
import { exportAllReportsToExcel } from '../utils/excelExport';

interface SummaryTableProps {
  reports: Record<string, DayReport>;
  userProfile: UserProfile;
  onOpenExportModal: () => void;
}

export const SummaryTable: React.FC<SummaryTableProps> = ({
  reports,
  userProfile,
  onOpenExportModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'holiday'>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Convert reports dictionary into a flattened array of log items
  const flattenedLogs = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      dayOfWeek: string;
      isHoliday: boolean;
      holidayReason?: string;
      timeSlot: string;
      taskName: string;
      scheduleType: string;
      isCompleted: boolean;
      completedAt?: string;
      notes?: string;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];
    const sortedDates = Object.keys(reports).sort((a, b) => b.localeCompare(a));

    sortedDates.forEach((dateKey) => {
      const rep = reports[dateKey];

      // Date Range Filter Logic
      if (dateRangeFilter === 'today' && dateKey !== todayStr) return;
      if (dateRangeFilter === 'week') {
        const d = new Date(dateKey);
        const now = new Date();
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 3600 * 24));
        if (diffDays > 7 || diffDays < 0) return;
      }
      if (dateRangeFilter === 'month') {
        const d = new Date(dateKey);
        const now = new Date();
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) return;
      }

      if (rep.isHoliday) {
        if (statusFilter === 'completed' || statusFilter === 'pending') return;
        list.push({
          id: `${dateKey}_holiday`,
          date: dateKey,
          dayOfWeek: rep.dayOfWeek,
          isHoliday: true,
          holidayReason: rep.holidayReason || 'Weekly Off Day',
          timeSlot: '-',
          taskName: `Holiday (${rep.dayOfWeek})`,
          scheduleType: 'Holiday',
          isCompleted: false,
          completedAt: '-',
          notes: rep.holidayReason || 'Off Day'
        });
      } else {
        if (statusFilter === 'holiday') return;

        rep.tasks.forEach((t) => {
          if (statusFilter === 'completed' && !t.isCompleted) return;
          if (statusFilter === 'pending' && t.isCompleted) return;

          // Keyword Search Filter
          if (searchTerm.trim()) {
            const kw = searchTerm.toLowerCase();
            const matchesTask = t.taskName.toLowerCase().includes(kw);
            const matchesNotes = (t.notes || '').toLowerCase().includes(kw);
            const matchesTime = t.timeSlot.toLowerCase().includes(kw);
            const matchesDate = dateKey.includes(kw) || rep.dayOfWeek.toLowerCase().includes(kw);
            if (!matchesTask && !matchesNotes && !matchesTime && !matchesDate) return;
          }

          list.push({
            id: t.id,
            date: dateKey,
            dayOfWeek: rep.dayOfWeek,
            isHoliday: false,
            timeSlot: t.timeSlot,
            taskName: t.taskName,
            scheduleType: t.scheduleType || 'Schedule',
            isCompleted: t.isCompleted,
            completedAt: t.completedAt,
            notes: t.notes
          });
        });
      }
    });

    return list;
  }, [reports, statusFilter, dateRangeFilter, searchTerm]);

  // Overall Statistics Metrics
  const stats = useMemo(() => {
    let totalTasks = 0;
    let completedTasks = 0;
    let holidayDays = 0;
    const activeDays = new Set<string>();

    (Object.values(reports) as DayReport[]).forEach((rep) => {
      activeDays.add(rep.date);
      if (rep.isHoliday) {
        holidayDays++;
      } else {
        rep.tasks.forEach((t) => {
          totalTasks++;
          if (t.isCompleted) completedTasks++;
        });
      }
    });

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      completionRate,
      holidayDays,
      totalDaysTracked: activeDays.size
    };
  }, [reports]);

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Tasks</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{stats.totalTasks}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">{stats.totalDaysTracked} Days Recorded</p>
          </div>
          <div className="w-11 h-11 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Completed</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{stats.completedTasks}</p>
            <p className="text-[11px] text-emerald-600/80 mt-0.5">{stats.completionRate}% Completion Rate</p>
          </div>
          <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{stats.pendingTasks}</p>
            <p className="text-[11px] text-amber-600/80 mt-0.5">Awaiting check-off</p>
          </div>
          <div className="w-11 h-11 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Holidays</p>
            <p className="text-2xl font-black text-amber-900 mt-1">{stats.holidayDays}</p>
            <p className="text-[11px] text-amber-700 mt-0.5">Scheduled Off Days</p>
          </div>
          <div className="w-11 h-11 bg-amber-100 text-amber-800 rounded-xl flex items-center justify-center">
            <Coffee className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search date, task name, remarks..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all"
          />
        </div>

        {/* Filter Dropdowns & Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'completed' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Done
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === 'pending' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending
            </button>
          </div>

          {/* Date Scope Filter */}
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value as any)}
            className="bg-slate-100 border border-slate-200 text-slate-800 text-xs font-semibold px-3 py-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-400"
          >
            <option value="all">All Dates</option>
            <option value="today">Today Only</option>
            <option value="week">Past 7 Days</option>
            <option value="month">This Month</option>
          </select>

          {/* Export Button */}
          <button
            onClick={() => exportAllReportsToExcel(Object.values(reports), userProfile)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-yellow-400" />
            <span>Export Master Excel</span>
          </button>
        </div>

      </div>

      {/* Master Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 border-b border-slate-800">Date</th>
                <th className="py-3 px-4 border-b border-slate-800">Day</th>
                <th className="py-3 px-4 border-b border-slate-800">Time Slot</th>
                <th className="py-3 px-4 border-b border-slate-800">Task / Activity</th>
                <th className="py-3 px-[11px] border-b border-slate-800 bg-red-700 text-center">Schedule</th>
                <th className="py-3 px-4 border-b border-slate-800 text-center">Status</th>
                <th className="py-3 px-4 border-b border-slate-800">Time Checked</th>
                <th className="py-3 px-4 border-b border-slate-800">Remarks / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {flattenedLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No log records match your current filter query.
                  </td>
                </tr>
              ) : (
                flattenedLogs.map((log) => (
                  <tr
                    key={log.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      log.isHoliday ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-slate-900 font-bold whitespace-nowrap">
                      {log.date}
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                      {log.dayOfWeek}
                    </td>

                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap font-medium">
                      {log.timeSlot}
                    </td>

                    <td className="py-3 px-4 text-slate-900 font-semibold max-w-xs truncate">
                      {log.taskName}
                    </td>

                    {/* Schedule Column (Red style) */}
                    <td className="py-3 px-3 text-center whitespace-nowrap bg-red-50">
                      {log.isHoliday ? (
                        <span className="text-amber-700 font-bold text-[10px]">HOLIDAY</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-0.5 rounded font-bold text-[10px] border border-red-200">
                          <Tag className="w-3 h-3" />
                          <span>{log.scheduleType}</span>
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {log.isHoliday ? (
                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          HOLIDAY
                        </span>
                      ) : log.isCompleted ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                          DONE
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          PENDING
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-mono text-[11px]">
                      {log.completedAt || '-'}
                    </td>

                    <td className="py-3 px-4 text-slate-500 max-w-sm truncate italic">
                      {log.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
