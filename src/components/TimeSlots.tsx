'use client';

import { Clock } from 'lucide-react';

interface TimeSlotsProps {
  slots: string[];
  bookedSlots: string[];
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
}

export default function TimeSlots({ slots, bookedSlots, selectedSlot, onSelectSlot }: TimeSlotsProps) {
  if (slots.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-sm text-center">
        <Clock className="w-10 h-10 text-stone-300 mx-auto mb-3" />
        <p className="text-muted text-sm">Выберите дату, чтобы увидеть доступные слоты</p>
      </div>
    );
  }

  const morningSlots = slots.filter(s => parseInt(s) < 12);
  const daySlots = slots.filter(s => parseInt(s) >= 12 && parseInt(s) < 17);
  const eveningSlots = slots.filter(s => parseInt(s) >= 17);

  const renderGroup = (title: string, groupSlots: string[]) => {
    if (groupSlots.length === 0) return null;
    return (
      <div className="mb-4 last:mb-0">
        <h4 className="text-xs font-medium text-muted uppercase tracking-wider mb-2">{title}</h4>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {groupSlots.map(slot => {
            const isBooked = bookedSlots.includes(slot);
            const isSelected = selectedSlot === slot;
            return (
              <button
                key={slot}
                disabled={isBooked}
                onClick={() => !isBooked && onSelectSlot(slot)}
                className={`
                  py-2.5 px-3 rounded-xl text-sm font-medium transition-all border
                  ${isBooked
                    ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed line-through'
                    : isSelected
                      ? 'bg-accent text-white border-accent shadow-md shadow-stone-900/10'
                      : 'bg-card text-foreground border-border hover:border-accent/50 hover:bg-moloko-50 cursor-pointer'
                  }
                `}
              >
                {slot}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <Clock className="w-4 h-4 text-accent" />
        Доступное время
      </h3>
      {renderGroup('Утро', morningSlots)}
      {renderGroup('День', daySlots)}
      {renderGroup('Вечер', eveningSlots)}
    </div>
  );
}
