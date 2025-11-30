import React from 'react';
import { getDaysInMonth, formatDateKey, getMonthName, isSameDay } from '../utils/dateUtils';
import { DiaryEntry } from '../types';

interface CalendarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  entries: Record<string, DiaryEntry>;
  selectedDate: Date;
}

const Calendar: React.FC<CalendarProps> = ({ currentDate, onDateSelect, entries, selectedDate }) => {
  const [viewDate, setViewDate] = React.useState(new Date(currentDate));
  
  const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setViewDate(newDate);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-stone-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-stone-700">
          {getMonthName(viewDate.getMonth())} {viewDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
          <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-stone-100 rounded text-stone-500">
            &lt;
          </button>
          <button onClick={() => changeMonth(1)} className="p-1 hover:bg-stone-100 rounded text-stone-500">
            &gt;
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {weekDays.map(d => (
          <span key={d} className="text-xs font-medium text-stone-400">{d}</span>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          
          const dateKey = formatDateKey(d);
          const hasEntry = !!entries[dateKey];
          const isSelected = isSameDay(d, selectedDate);
          const isToday = isSameDay(d, new Date());
          
          return (
            <button
              key={dateKey}
              onClick={() => onDateSelect(d)}
              className={`
                h-9 w-9 rounded-full flex items-center justify-center text-sm transition-all
                ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-105' : 'hover:bg-stone-100 text-stone-700'}
                ${isToday && !isSelected ? 'border border-indigo-600 font-semibold' : ''}
                ${hasEntry && !isSelected ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}
              `}
            >
              {d.getDate()}
              {hasEntry && !isSelected && (
                <span className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full"></span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
