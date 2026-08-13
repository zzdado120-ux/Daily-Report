import React from 'react';
import { Coffee, CalendarX, PlusCircle, CheckCircle2 } from 'lucide-react';

interface MondayHolidayCardProps {
  dayOfWeek: string;
  onOverrideHoliday: () => void;
}

export const MondayHolidayCard: React.FC<MondayHolidayCardProps> = ({ dayOfWeek, onOverrideHoliday }) => {
  return (
    <div className="bg-amber-50/80 border-2 border-dashed border-amber-300 rounded-2xl p-8 text-center max-w-2xl mx-auto my-8 shadow-sm">
      <div className="w-16 h-16 rounded-2xl bg-amber-200 text-amber-800 flex items-center justify-center mx-auto mb-4 shadow-inner">
        <Coffee className="w-8 h-8" />
      </div>

      <h2 className="text-xl font-black text-amber-950 mb-2">
        {dayOfWeek} is Your Scheduled Holiday!
      </h2>

      <p className="text-sm text-amber-800 max-w-md mx-auto mb-6 leading-relaxed">
        The app automatically recognized <span className="font-bold underline">{dayOfWeek}</span> as an off day based on your schedule rules. No standard time-slot tasks are required today.
      </p>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/80 rounded-xl border border-amber-200 text-xs text-amber-900 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Excluded from daily schedule reports</span>
        </div>

        <button
          onClick={onOverrideHoliday}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Override & Load Tasks for Today</span>
        </button>
      </div>
    </div>
  );
};
