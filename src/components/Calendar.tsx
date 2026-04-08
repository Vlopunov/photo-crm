'use client';

import { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, isToday, isBefore } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  availableDays: number[]; // day_of_week numbers that are available
}

export default function Calendar({ selectedDate, onSelectDate, availableDays }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted" />
        </button>
        <h3 className="text-lg font-semibold capitalize">
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </h3>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-stone-100 rounded-xl transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-muted" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(d => (
          <div key={d} className="text-center text-xs font-medium text-muted py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const inMonth = isSameMonth(d, currentMonth);
          const isPast = isBefore(d, today);
          const dayOfWeek = d.getDay();
          const isAvailable = availableDays.includes(dayOfWeek) && !isPast && inMonth;
          const isSelected = selectedDate && isSameDay(d, selectedDate);
          const isTodayDate = isToday(d);

          return (
            <button
              key={i}
              disabled={!isAvailable}
              onClick={() => isAvailable && onSelectDate(d)}
              className={`
                relative aspect-square flex items-center justify-center text-sm rounded-xl transition-all
                ${!inMonth ? 'text-stone-300' : ''}
                ${isAvailable ? 'hover:bg-moloko-50 cursor-pointer font-medium' : 'text-stone-300 cursor-default'}
                ${isSelected ? 'bg-accent text-white hover:bg-accent font-semibold !text-white' : ''}
                ${isTodayDate && !isSelected ? 'ring-2 ring-accent/30' : ''}
              `}
            >
              {format(d, 'd')}
              {isTodayDate && (
                <span className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-accent'}`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
