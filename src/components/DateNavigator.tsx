import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RefreshCw, Sun, Coffee } from 'lucide-react';
import { addDaysToDateKey, formatDateKey } from '../utils/dateUtils';

interface DateNavigatorProps {
  selectedDate: string; // YYYY-MM-DD
  setSelectedDate: (date: string) => void;
  formattedDateText: string;
  dayOfWeek: string;
  isHoliday: boolean;
  completedTasksCount: number;
  totalTasksCount: number;
  completionPercentage: number;
}

export const DateNavigator: React.FC<DateNavigatorProps> = ({
  selectedDate,
  setSelectedDate,
  formattedDateText,
  dayOfWeek,
  isHoliday,
  completedTasksCount,
  totalTasksCount,
  completionPercentage,
}) => {
  const todayKey = formatDateKey(new Date());
  const isToday = selectedDate === todayKey;

  const handlePrevDay = () => {
    setSelectedDate(addDaysToDateKey(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDaysToDateKey(selectedDate, 1));
  };

  const handleTodayClick = () => {
    setSelectedDate(todayKey);
  };

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm py-4 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Date Selector Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={handlePrevDay}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Date Picker Input */}
            <div className="relative flex items-center px-2">
              <CalendarIcon className="w-4 h-4 text-slate-500 mr-2 pointer-events-none" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-white transition-all"
              title="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={handleTodayClick}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Jump to Today</span>
            </button>
          )}

          {/* Monday Holiday Tag */}
          {isHoliday ? (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold">
              <Coffee className="w-3.5 h-3.5 text-amber-700" />
              <span>{dayOfWeek} Holiday</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <Sun className="w-3.5 h-3.5 text-emerald-600" />
              <span>Working Day</span>
            </span>
          )}
        </div>

        {/* Date Display Banner & Progress */}
        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-500 font-bold">Selected Date</div>
            <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
              {formattedDateText}
            </div>
          </div>

          {/* Quick Progress Indicator */}
          {!isHoliday && totalTasksCount > 0 && (
            <div className="min-w-[140px] text-right">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-xs font-medium text-slate-500">Progress</span>
                <span className="text-xs font-bold text-slate-900">
                  {completedTasksCount}/{totalTasksCount} ({completionPercentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                <div
                  className={`h-full transition-all duration-500 ${
                    completionPercentage === 100
                      ? 'bg-emerald-500'
                      : completionPercentage > 50
                      ? 'bg-amber-500'
                      : 'bg-yellow-400'
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
