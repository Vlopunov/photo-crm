'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Service } from '@/lib/types';
import { User, Phone, Mail, MessageSquare, Sparkles } from 'lucide-react';

interface BookingFormProps {
  selectedDate: Date;
  selectedSlot: string;
  services: Service[];
  selectedService: Service | null;
  onSelectService: (service: Service) => void;
  onSubmit: (data: { name: string; phone: string; email: string; notes: string }) => void;
  isSubmitting: boolean;
}

export default function BookingForm({
  selectedDate,
  selectedSlot,
  selectedService,
  onSubmit,
  isSubmitting,
}: BookingFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !selectedService) return;
    onSubmit({ name, phone, email, notes });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-card rounded-2xl border border-border p-6 shadow-sm space-y-5">
      {/* Booking summary */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <div className="w-10 h-10 rounded-xl bg-moloko-100 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="font-semibold">
            {format(selectedDate, 'd MMMM, EEEE', { locale: ru })}
          </p>
          <p className="text-sm text-muted">Время: {selectedSlot}</p>
        </div>
      </div>

      {selectedService && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-moloko-50 border border-moloko-100">
          <div>
            <p className="font-medium text-sm">{selectedService.name}</p>
            <p className="text-xs text-muted">{selectedService.duration_minutes} мин</p>
          </div>
          <span className="text-sm font-bold">{selectedService.price} BYN</span>
        </div>
      )}

      {/* Client info */}
      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium text-muted mb-1.5 block">Ваше имя *</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Анна Иванова"
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-border rounded-xl text-sm transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted mb-1.5 block">Телефон *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              placeholder="+375 (29) 123-45-67"
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-border rounded-xl text-sm transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted mb-1.5 block">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="anna@email.com"
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-border rounded-xl text-sm transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted mb-1.5 block">Пожелания</label>
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Количество гостей, пожелания по декору..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-border rounded-xl text-sm transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!name || !phone || !selectedService || isSubmitting}
        className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-stone-900/10"
      >
        {isSubmitting ? 'Бронируем...' : 'Забронировать'}
      </button>

      {selectedService && (
        <p className="text-xs text-center text-muted">
          + {selectedService.points_earned} бонусных баллов за эту запись
        </p>
      )}
    </form>
  );
}
