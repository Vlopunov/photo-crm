'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { Camera, PartyPopper, CheckCircle, ArrowLeft, MapPin, Phone, Clock, Sparkles, ExternalLink, Send } from 'lucide-react';
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

type Category = 'all' | 'halls' | 'photo' | 'event';

const CATEGORIES: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Все', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'halls', label: 'Аренда залов', icon: <Camera className="w-4 h-4" /> },
  { id: 'photo', label: 'Фотосъёмка', icon: <Camera className="w-4 h-4" /> },
  { id: 'event', label: 'Мероприятия', icon: <PartyPopper className="w-4 h-4" /> },
];

function getServiceCategory(name: string): Category {
  if (name.includes('Зал') && name.includes('аренда')) return 'halls';
  if (name.includes('праздник') || name.includes('день рождения') || name.includes('встреч') || name.includes('Аренда пространства')) return 'event';
  return 'photo';
}

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
  const [step, setStep] = useState<'category' | 'calendar' | 'form'>('category');
  const [activeCategory, setActiveCategory] = useState<Category>('all');

  useEffect(() => {
    (async () => {
      const [svc, sched] = await Promise.all([getServices(), getSchedule()]);
      setServices(svc);
      setSchedule(sched);
    })();
  }, []);

  const availableDays = schedule.filter(s => s.is_available).map(s => s.day_of_week);

  const filteredServices = activeCategory === 'all'
    ? services
    : services.filter(s => getServiceCategory(s.name) === activeCategory);

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('calendar');
    window.scrollTo(0, 0);
  };

  const handleDateSelect = useCallback(async (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);

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

    const bookedTimes = slots.filter(s =>
      isSlotBooked(s, booked, selectedService?.duration_minutes || 60)
    );
    setBookedSlotTimes(bookedTimes);
  }, [schedule, selectedService]);

  useEffect(() => {
    if (selectedDate && timeSlots.length > 0) {
      const bookedTimes = timeSlots.filter(s =>
        isSlotBooked(s, bookingsForDate, selectedService?.duration_minutes || 60)
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

  const resetAll = () => {
    setBookingSuccess(false);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedService(null);
    setStep('category');
    setActiveCategory('all');
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
            {selectedService?.name} — {selectedService?.price} BYN
          </p>
          <p className="text-xs text-muted mb-6">
            Мы свяжемся с вами для подтверждения по телефону
          </p>
          <button
            onClick={resetAll}
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
              <span className="text-white font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>M</span>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight">MOLOKO</h1>
              <p className="text-[10px] text-muted -mt-0.5 tracking-widest uppercase">studio & event</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+375291686838" className="hidden sm:flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors">
              <Phone className="w-3.5 h-3.5" />
              +375 29 168-68-38
            </a>
            <a
              href="/admin"
              className="text-xs text-muted hover:text-foreground transition-colors"
            >
              Вход
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">Онлайн-запись</h2>
          <p className="text-muted max-w-lg mx-auto">
            Интерьерная фотостудия и пространство для мероприятий в центре Минска.
            240 м², 3 зала, живые кролики.
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-3 mb-8 text-sm">
          {[
            { s: 'category', n: '1', l: 'Услуга' },
            { s: 'calendar', n: '2', l: 'Дата и время' },
            { s: 'form', n: '3', l: 'Контакты' },
          ].map((item, i) => {
            const isActive = step === item.s;
            const isPast = (step === 'calendar' && item.s === 'category') || (step === 'form' && item.s !== 'form');
            return (
              <div key={item.s} className="flex items-center gap-2">
                {i > 0 && <div className="w-6 h-px bg-border" />}
                <div className={`flex items-center gap-1.5 ${isActive ? 'text-accent font-semibold' : isPast ? 'text-accent/60' : 'text-muted'}`}>
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive ? 'bg-accent text-white' : isPast ? 'bg-moloko-100 text-moloko-800' : 'bg-stone-200'
                  }`}>{isPast ? '✓' : item.n}</span>
                  <span className="hidden sm:inline">{item.l}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Step 1: Category + Service selection */}
        {step === 'category' && (
          <div>
            {/* Category filter */}
            <div className="flex gap-2 justify-center mb-8 flex-wrap">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    activeCategory === cat.id
                      ? 'bg-accent text-white border-accent'
                      : 'bg-card text-muted border-border hover:border-accent/30'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Services grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {filteredServices.map(service => {
                const cat = getServiceCategory(service.name);
                const catLabel = cat === 'halls' ? 'Аренда зала' : cat === 'event' ? 'Moloko Event' : 'Фотосъёмка';
                const isHall = cat === 'halls';
                const isEvent = cat === 'event';
                return (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="bg-card rounded-2xl border border-border p-5 shadow-sm text-left hover:border-accent/40 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        isHall ? 'bg-moloko-50 text-moloko-800' : isEvent ? 'bg-violet-50 text-violet-700' : 'bg-stone-100 text-stone-600'
                      }`}>
                        {catLabel}
                      </span>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isHall ? 'bg-moloko-50' : isEvent ? 'bg-violet-50' : 'bg-stone-100'
                      }`}>
                        {isEvent ? <PartyPopper className="w-4 h-4 text-violet-600" /> : <Camera className="w-4 h-4 text-accent" />}
                      </div>
                    </div>
                    <h3 className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors">{service.name}</h3>
                    <p className="text-xs text-muted mb-3">{service.duration_minutes} мин</p>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-lg font-bold">{service.price}</span>
                        <span className="text-xs text-muted ml-1">BYN{isHall ? '/час' : ''}</span>
                      </div>
                      <span className="text-xs text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        Выбрать →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Studio info */}
            <div className="mt-12 grid sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm text-center">
                <MapPin className="w-5 h-5 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium">ул. Толбухина, 4</p>
                <p className="text-xs text-muted">3 этаж, 3 мин от м. Парк Челюскинцев</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm text-center">
                <Clock className="w-5 h-5 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium">Пн — Сб: 9:00 — 20:00</p>
                <p className="text-xs text-muted">Воскресенье — выходной</p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm text-center">
                <Phone className="w-5 h-5 text-accent mx-auto mb-2" />
                <p className="text-sm font-medium">+375 29 168-68-38</p>
                <p className="text-xs text-muted">Viber, Telegram, WhatsApp</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Calendar + Time */}
        {step === 'calendar' && (
          <div>
            <button
              onClick={() => { setStep('category'); setSelectedDate(null); setSelectedSlot(null); }}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-4 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {selectedService?.name}
            </button>
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
          </div>
        )}

        {/* Step 3: Form */}
        {step === 'form' && (
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
              services={[]}
              selectedService={selectedService}
              onSelectService={() => {}}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-auto py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center">
                <span className="text-white font-bold text-xs">M</span>
              </div>
              <div>
                <p className="font-semibold text-sm">MOLOKO Studio</p>
                <p className="text-[10px] text-muted">Минск, ул. Толбухина, 4</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/molokoevent_minsk/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground transition-colors flex items-center gap-1 text-xs">
                <ExternalLink className="w-3.5 h-3.5" />
                Instagram
              </a>
              <a href="https://t.me/" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-foreground transition-colors">
                <Send className="w-4 h-4" />
              </a>
              <span className="text-xs text-muted">© {new Date().getFullYear()}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
