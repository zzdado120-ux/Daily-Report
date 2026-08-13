import React, { useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Clock, Save, Calendar, Check } from 'lucide-react';
import { DefaultTimeSlotTemplate, TaskScope } from '../types';
import { INITIAL_DEFAULT_SCHEDULE } from '../utils/storage';

interface TemplateEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSchedule: DefaultTimeSlotTemplate[];
  onSaveSchedule: (updatedSchedule: DefaultTimeSlotTemplate[]) => void;
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

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
  isOpen,
  onClose,
  defaultSchedule,
  onSaveSchedule,
}) => {
  const [items, setItems] = useState<DefaultTimeSlotTemplate[]>(defaultSchedule);
  const [newTimeSlot, setNewTimeSlot] = useState('17:00 - 18:00');
  const [newTaskName, setNewTaskName] = useState('');
  const [newScope, setNewScope] = useState<TaskScope>('all');
  const [newDaysOfWeek, setNewDaysOfWeek] = useState<number[]>([1, 2, 3, 4, 5]);
  const [newSpecificDate, setNewSpecificDate] = useState<string>('');

  if (!isOpen) return null;

  const handleItemScopeChange = (id: string, scope: TaskScope) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, applicableScope: scope } : item))
    );
  };

  const handleItemDayToggle = (id: string, dayValue: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const currentDays = item.daysOfWeek || [1, 2, 3, 4, 5];
        const updated = currentDays.includes(dayValue)
          ? currentDays.filter((d) => d !== dayValue)
          : [...currentDays, dayValue];
        return { ...item, daysOfWeek: updated };
      })
    );
  };

  const handleItemChange = (id: string, field: 'timeSlot' | 'taskName' | 'specificDate', value: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleToggleNewDay = (dayVal: number) => {
    setNewDaysOfWeek((prev) =>
      prev.includes(dayVal) ? prev.filter((d) => d !== dayVal) : [...prev, dayVal]
    );
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newItem: DefaultTimeSlotTemplate = {
      id: Date.now().toString(),
      timeSlot: newTimeSlot,
      taskName: newTaskName.trim(),
      scheduleType: 'Schedule',
      applicableScope: newScope,
      daysOfWeek: newScope === 'specific_days' ? newDaysOfWeek : undefined,
      specificDate: newScope === 'specific_date' ? newSpecificDate : undefined,
    };

    setItems((prev) => [...prev, newItem]);
    setNewTaskName('');
  };

  const handleResetToDefaults = () => {
    if (confirm('Reset default time slots back to standard original schedule?')) {
      setItems(INITIAL_DEFAULT_SCHEDULE);
    }
  };

  const handleSave = () => {
    onSaveSchedule(items);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" />
              <span>Customize Schedule & Day Assignment</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set tasks to apply to all working days, specific days of the week, or a specific date.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Add New Slot Form */}
          <form onSubmit={handleAddItem} className="p-4 bg-indigo-50/80 border border-indigo-200 rounded-2xl flex flex-col gap-3">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Add Custom Schedule Item</span>
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Time Slot</label>
                <input
                  type="text"
                  value={newTimeSlot}
                  onChange={(e) => setNewTimeSlot(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Task / Activity Name</label>
                <input
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="e.g. Weekly Operations Sync / Check Platform"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Scope selection */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Applies To:</span>
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setNewScope('all')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      newScope === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Working Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScope('specific_days')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      newScope === 'specific_days' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Specific Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewScope('specific_date')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                      newScope === 'specific_date' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Specific Date
                  </button>
                </div>
              </div>

              {/* Scope specific inputs */}
              {newScope === 'specific_days' && (
                <div className="flex items-center gap-1">
                  {WEEKDAYS.map((w) => {
                    const isSelected = newDaysOfWeek.includes(w.value);
                    return (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() => handleToggleNewDay(w.value)}
                        className={`w-7 h-7 text-[11px] font-bold rounded-lg border transition-all ${
                          isSelected
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

              {newScope === 'specific_date' && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  <input
                    type="date"
                    value={newSpecificDate}
                    onChange={(e) => setNewSpecificDate(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    required={newScope === 'specific_date'}
                  />
                </div>
              )}

              <button
                type="submit"
                className="self-end sm:self-auto px-4 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>
            </div>
          </form>

          {/* Existing Items List */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold px-2 uppercase tracking-wider">
              <span>Time Slot & Task Configuration</span>
              <span>Day Assignment</span>
            </div>

            {items.map((item, idx) => {
              const scope = item.applicableScope || 'all';
              const days = item.daysOfWeek || [1, 2, 3, 4, 5];

              return (
                <div key={item.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-400 w-6 text-center">#{idx + 1}</span>
                    <input
                      type="text"
                      value={item.timeSlot}
                      onChange={(e) => handleItemChange(item.id, 'timeSlot', e.target.value)}
                      className="w-32 px-2.5 py-1 text-xs font-bold bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      value={item.taskName}
                      onChange={(e) => handleItemChange(item.id, 'taskName', e.target.value)}
                      className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-all"
                      title="Remove time slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Day assignment controls for item */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-200/60 pt-2 px-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500">Days:</span>
                      <select
                        value={scope}
                        onChange={(e) => handleItemScopeChange(item.id, e.target.value as TaskScope)}
                        className="text-xs font-medium bg-white border border-slate-200 rounded-md px-2 py-0.5 focus:outline-none"
                      >
                        <option value="all">All Working Days</option>
                        <option value="specific_days">Specific Days of Week</option>
                        <option value="specific_date">Specific Date Only</option>
                      </select>
                    </div>

                    {scope === 'specific_days' && (
                      <div className="flex items-center gap-1">
                        {WEEKDAYS.map((w) => {
                          const isSelected = days.includes(w.value);
                          return (
                            <button
                              key={w.value}
                              type="button"
                              onClick={() => handleItemDayToggle(item.id, w.value)}
                              className={`w-6 h-6 text-[10px] font-bold rounded-md border transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {w.label[0]}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {scope === 'specific_date' && (
                      <input
                        type="date"
                        value={item.specificDate || ''}
                        onChange={(e) => handleItemChange(item.id, 'specificDate', e.target.value)}
                        className="text-xs px-2 py-0.5 border border-slate-200 rounded-md bg-white focus:outline-none"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={handleResetToDefaults}
            className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Schedule Template</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

