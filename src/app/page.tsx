'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Camera, Award, CheckCircle, ArrowLeft } from 'lucide-react';
import Calendar from '@/components/Calendar';
import TimeSlots from '@/components/TimeSlots';
import BookingForm from '@/components/BookingForm';
import { Service, ScheduleSetting, Booking } from '@/lib/types';
import {
  getServices,
  getSchedule,
  getBookingsForDate,
  generateTimeSlots,
  isSlotBooked,
  findClientByPhone,
  createClient,
  createBooking,
} from '@/lib/store';

export default function BookingPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSetting[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [bookedSlotTimes, setBookedSlotTimes] = useState<string[]>([]);
  const [bookingsForDate, setBookingsForDate] = useState<Booking[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [step, setStep] = useState<'calendar' | 'form'>('calendar');

  useEffect(() => {
    (async () => {
      const [svc, sched] = await Promise.all([getServices(), getSchedule()]);
      setServices(svc);
      setSchedule(sched);
    })();
  }, []);

  const availableDays = schedule.filter(s => s.is_available).map(s => s.day_of_week);

  const handleDateSelect = useCallback(async (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep('calendar');

    const dayOfWeek = date.getDay();
    const daySetting = schedule.find(s => s.day_of_week === dayOfWeek);
    if (!daySetting || !daySetting.is_available) {
      setTimeSlots([]);
      return;
    }

    const slots = generateTimeSlots(daySetting.start_time, daySetting.end_time);
    const dateStr = format(date, 'yyyy-MM-dd');
    const booked = await getBookingsForDate(dateStr);
    setBookingsForDate(booked);
    setTimeSlots(slots);

    // Compute booked slot times considering service duration
    const bookedTimes = slots.filter(s =>
      isSlotBooked(s, booked, selectedService?.duration_minutes || 30)
    );
    setBookedSlotTimes(bookedTimes);
  }, [schedule, selectedService]);

  // Recompute booked slots when service changes
  useEffect(() => {
    if (selectedDate && timeSlots.length > 0) {
      const bookedTimes = timeSlots.filter(s =>
        isSlotBooked(s, bookingsForDate, selectedService?.duration_minutes || 30)
      );
      setBookedSlotTimes(bookedTimes);
    }
  }, [selectedService, selectedDate, timeSlots, bookingsForDate]);

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
  };

  const handleProceedToForm = () => {
    if (selectedDate && selectedSlot) {
      setStep('form');
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async (data: { name: string; phone: string; email: string; notes: string }) => {
    if (!selectedDate || !selectedSlot || !selectedService) return;

    setIsSubmitting(true);
    try {
      let client = await findClientByPhone(data.phone);
      if (!client) {
        client = await createClient({
          name: data.name,
          phone: data.phone,
          email: data.email || undefined,
        });
      }

      await createBooking({
        client_id: client.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time_slot: selectedSlot,
        duration_minutes: selectedService.duration_minutes,
        service_id: selectedService.id,
        status: 'pending',
        notes: data.notes || undefined,
        points_used: 0,
      });

      setBookingSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookingSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-sm text-center max-w-md w-full">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Запись создана!</h2>
          <p className="text-muted text-sm mb-1">
            {selectedDate && format(selectedDate, 'd MMMM', { locale: undefined })} в {selectedSlot}
          </p>
          <p className="text-muted text-sm mb-6">
            {selectedService?.name} — {selectedService?.price.toLocaleString('ru')} BYN
          </p>
          <p className="text-xs text-muted mb-6">
            Мы свяжемся с вами для подтверждения записи
          </p>
          <button
            onClick={() => {
              setBookingSuccess(false);
              setSelectedDate(null);
              setSelectedSlot(null);
              setSelectedService(null);
              setStep('calendar');
            }}
            className="px-6 py-2.5 bg-accent text-white font-medium rounded-xl hover:bg-accent-dark transition-colors"
          >
            Записаться ещё
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center">
              <Camera className="w-5 h-5 text-accent-light" />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">MOLOKO</h1>
              <p className="text-xs text-muted -mt-0.5">фотостудия & ивенты</p>
            </div>
          </div>
          <a
            href="/admin"
            className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1.5"
          >
            <Award className="w-3.5 h-3.5" />
            Для администратора
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Запись в студию MOLOKO</h2>
          <p className="text-muted">Фотосессии и мероприятия в уютном пространстве Минска</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className={`flex items-center gap-2 text-sm ${step === 'calendar' ? 'text-accent font-semibold' : 'text-muted'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'calendar' ? 'bg-accent text-white' : 'bg-stone-200'}`}>1</span>
            Дата и время
          </div>
          <div className="w-8 h-px bg-border" />
          <div className={`flex items-center gap-2 text-sm ${step === 'form' ? 'text-accent font-semibold' : 'text-muted'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'form' ? 'bg-accent text-white' : 'bg-stone-200'}`}>2</span>
            Ваши данные
          </div>
        </div>

        {step === 'calendar' ? (
          <div className="grid lg:grid-cols-2 gap-6">
            <Calendar
              selectedDate={selectedDate}
              onSelectDate={handleDateSelect}
              availableDays={availableDays}
            />
            <div className="space-y-6">
              <TimeSlots
                slots={timeSlots}
                bookedSlots={bookedSlotTimes}
                selectedSlot={selectedSlot}
                onSelectSlot={handleSlotSelect}
              />
              {selectedSlot && (
                <button
                  onClick={handleProceedToForm}
                  className="w-full py-3 bg-accent text-white font-semibold rounded-xl hover:bg-accent-dark transition-colors shadow-md shadow-stone-900/10"
                >
                  Продолжить
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setStep('calendar')}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Назад к выбору времени
            </button>
            <BookingForm
              selectedDate={selectedDate!}
              selectedSlot={selectedSlot!}
              services={services}
              selectedService={selectedService}
              onSelectService={setSelectedService}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-xs text-muted">
          MOLOKO Studio — Минск, {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}
