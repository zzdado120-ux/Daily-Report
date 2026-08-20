import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  CheckCheck,
  RotateCcw,
  Tag,
  Calendar
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ScheduleTask, TaskScope } from '../types';
import { getCurrentTimeString } from '../utils/dateUtils';

interface ChecklistProps {
  tasks: ScheduleTask[];
  onToggleTask: (taskId: string, completed: boolean, timestamp?: string) => void;
  onUpdateNotes: (taskId: string, notes: string) => void;
  onAddTask: (timeSlot: string, taskName: string, scope?: TaskScope, daysOfWeek?: number[]) => void;
  onDeleteTask: (taskId: string) => void;
  onMarkAllComplete: () => void;
  onResetTasks: () => void;
}

const WEEKDAYS = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export const Checklist: React.FC<ChecklistProps> = ({
  tasks,
  onToggleTask,
  onUpdateNotes,
  onAddTask,
  onDeleteTask,
  onMarkAllComplete,
  onResetTasks,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState('17:00 - 18:00');
  const [newTaskName, setNewTaskName] = useState('');
  const [addScope, setAddScope] = useState<TaskScope>('specific_date');
  const [addDaysOfWeek, setAddDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const totalCount = tasks.length;
  const isAllComplete = totalCount > 0 && completedCount === totalCount;

  const handleCheckToggle = (task: ScheduleTask) => {
    const nextState = !task.isCompleted;
    const timestamp = nextState ? getCurrentTimeString() : undefined;
    
    onToggleTask(task.id, nextState, timestamp);

    if (nextState) {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  const handleToggleAddDay = (val: number) => {
    setAddDaysOfWeek((prev) =>
      prev.includes(val) ? prev.filter((d) => d !== val) : [...prev, val]
    );
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    onAddTask(
      newTimeSlot, 
      newTaskName.trim(), 
      addScope, 
      addScope === 'specific_days' ? addDaysOfWeek : undefined
    );
    setNewTaskName('');
    setShowAddForm(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6">
      
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>Daily Schedule Checklist</span>
            {isAllComplete && (
              <span className="flex items-center gap-1 text-xs font-extrabold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-300">
                <Sparkles className="w-3.5 h-3.5" /> 100% Completed
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Click checkboxes to complete time-slot tasks. Real-time updates sync instantly.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Extra Task</span>
          </button>

          {completedCount < totalCount && totalCount > 0 && (
            <button
              onClick={onMarkAllComplete}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>Mark All Done</span>
            </button>
          )}

          {completedCount > 0 && (
            <button
              onClick={onResetTasks}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 rounded-xl text-xs font-semibold transition-all"
              title="Clear all checked statuses for today"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Add New Custom Task Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="mb-6 p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl shadow-sm animate-fadeIn flex flex-col gap-3">
          <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">Add Task To Schedule</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Time Slot</label>
              <input
                type="text"
                value={newTimeSlot}
                onChange={(e) => setNewTimeSlot(e.target.value)}
                placeholder="e.g. 17:00 - 18:00"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Task / Activity Description</label>
              <input
                type="text"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                placeholder="e.g. End of day server log audit"
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-indigo-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Scope:</span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setAddScope('specific_date')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    addScope === 'specific_date' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  This Date Only
                </button>
                <button
                  type="button"
                  onClick={() => setAddScope('all')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    addScope === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All Working Days
                </button>
                <button
                  type="button"
                  onClick={() => setAddScope('specific_days')}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                    addScope === 'specific_days' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Selected Days
                </button>
              </div>
            </div>

            {addScope === 'specific_days' && (
              <div className="flex items-center gap-1">
                {WEEKDAYS.map((w) => {
                  const isSel = addDaysOfWeek.includes(w.value);
                  return (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => handleToggleAddDay(w.value)}
                      className={`w-6 h-6 text-[10px] font-bold rounded-md border transition-all ${
                        isSel
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {w.label[0]}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 text-xs font-bold rounded-xl whitespace-nowrap shadow-sm transition-all flex items-center gap-1.5 self-end sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>
        </form>
      )}

      {/* Tasks List Table / Cards */}
      {tasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No time-slot tasks created for today.</p>
          <p className="text-xs text-slate-500 mt-1">Click "Add Extra Task" above or check your default template settings.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task, index) => (
            <div
              key={task.id}
              className={`group bg-white border rounded-2xl p-4 transition-all duration-200 hover:shadow-md ${
                task.isCompleted
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left: Checkbox + Time Slot + Task Name */}
                <div className="flex items-start gap-3.5 flex-1">
                  
                  {/* Big Clickable Checkbox */}
                  <button
                    type="button"
                    onClick={() => handleCheckToggle(task)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none shrink-0"
                    title={task.isCompleted ? 'Mark Pending' : 'Mark Completed'}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300 hover:text-emerald-500" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {/* Number badge */}
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        #{index + 1}
                      </span>

                      {/* Time Slot Badge */}
                      <span className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{task.timeSlot}</span>
                      </span>

                      {/* RED "SCHEDULE" TAG AS SPECIFIED IN REPORT IMAGE FORMAT */}
                      <span className="flex items-center gap-1 text-[11px] font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-md border border-red-200">
                        <Tag className="w-3 h-3 text-red-600" />
                        <span>{task.scheduleType || 'Schedule'}</span>
                      </span>

                      {/* Status Tag */}
                      {task.isCompleted ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          DONE
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                          PENDING
                        </span>
                      )}
                    </div>

                    {/* Task Title */}
                    <h3
                      className={`text-sm sm:text-base font-bold transition-all ${
                        task.isCompleted
                          ? 'text-slate-500 line-through decoration-slate-400'
                          : 'text-slate-900'
                      }`}
                    >
                      {task.taskName}
                    </h3>
                  </div>
                </div>

                {/* Right: Notes Input & Delete */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={task.notes || ''}
                      onChange={(e) => onUpdateNotes(task.id, e.target.value)}
                      placeholder="Add remarks / notes..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-yellow-400 focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    title="Delete task from today"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
