'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Service } from '@/lib/types';
import { User, Phone, Mail, MessageSquare, Sparkles, Check } from 'lucide-react';

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
  services,
  selectedService,
  onSelectService,
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

      {/* Service selection */}
      <div>
        <label className="text-sm font-medium text-muted mb-2 block">Услуга</label>
        <div className="grid gap-2">
          {services.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectService(s)}
              className={`
                flex items-center justify-between p-3 rounded-xl border text-left transition-all
                ${selectedService?.id === s.id
                  ? 'border-accent bg-moloko-50 ring-1 ring-accent/20'
                  : 'border-border hover:border-stone-300'
                }
              `}
            >
              <div>
                <p className="font-medium text-sm">{s.name}</p>
                <p className="text-xs text-muted">{s.duration_minutes} мин</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{s.price.toLocaleString('ru')} BYN</span>
                {selectedService?.id === s.id && (
                  <Check className="w-4 h-4 text-accent" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

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
              placeholder="Расскажите о ваших пожеланиях..."
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
