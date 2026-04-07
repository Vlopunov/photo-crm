'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Camera, CalendarDays, Users, Award, BarChart3,
  Clock, CheckCircle, XCircle, AlertCircle, ChevronRight,
  Phone, Mail, Star, TrendingUp, Eye
} from 'lucide-react';
import { Booking, Client, Service } from '@/lib/types';
import { getBookings, getClients, getServices, updateBookingStatus, updateClient } from '@/lib/store';

type Tab = 'dashboard' | 'bookings' | 'clients' | 'loyalty';

const STATUS_CONFIG = {
  pending: { label: 'Ожидает', color: 'bg-amber-100 text-amber-800', icon: AlertCircle },
  confirmed: { label: 'Подтверждена', color: 'bg-blue-100 text-blue-800', icon: Clock },
  completed: { label: 'Завершена', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
  cancelled: { label: 'Отменена', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const loadData = useCallback(async () => {
    const [b, c, s] = await Promise.all([getBookings(), getClients(), getServices()]);
    setBookings(b);
    setClients(c);
    setServices(s);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStatusChange = async (bookingId: string, status: Booking['status']) => {
    await updateBookingStatus(bookingId, status);
    await loadData();
  };

  const handleAdjustPoints = async (clientId: string, delta: number) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;
    const newPoints = Math.max(0, client.loyalty_points + delta);
    await updateClient(clientId, { loyalty_points: newPoints });
    await loadData();
  };

  // Stats
  const todayBookings = bookings.filter(b => {
    try { return isToday(parseISO(b.date)); } catch { return false; }
  });
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + (b.service?.price || 0), 0);
  const totalPoints = clients.reduce((sum, c) => sum + c.loyalty_points, 0);

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Обзор', icon: BarChart3 },
    { id: 'bookings' as Tab, label: 'Записи', icon: CalendarDays },
    { id: 'clients' as Tab, label: 'Клиенты', icon: Users },
    { id: 'loyalty' as Tab, label: 'Лояльность', icon: Award },
  ];

  function formatBookingDate(dateStr: string) {
    try {
      const d = parseISO(dateStr);
      if (isToday(d)) return 'Сегодня';
      if (isTomorrow(d)) return 'Завтра';
      return format(d, 'd MMM', { locale: ru });
    } catch { return dateStr; }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-900 flex items-center justify-center">
              <Camera className="w-4 h-4 text-accent-light" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight">LUMOS CRM</h1>
              <p className="text-[10px] text-muted -mt-0.5">панель управления</p>
            </div>
          </div>
          <a
            href="/"
            className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            Страница записи
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-100 p-1 rounded-xl w-fit">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-card shadow-sm text-foreground'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Dashboard */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Записей сегодня"
                value={todayBookings.length}
                icon={<CalendarDays className="w-5 h-5 text-blue-600" />}
                bg="bg-blue-50"
              />
              <StatCard
                title="Ожидают подтверждения"
                value={pendingBookings.length}
                icon={<AlertCircle className="w-5 h-5 text-amber-600" />}
                bg="bg-amber-50"
              />
              <StatCard
                title="Выручка"
                value={`${(totalRevenue / 1000).toFixed(0)}K ₽`}
                icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                bg="bg-emerald-50"
              />
              <StatCard
                title="Всего клиентов"
                value={clients.length}
                icon={<Users className="w-5 h-5 text-violet-600" />}
                bg="bg-violet-50"
              />
            </div>

            {/* Pending bookings */}
            {pendingBookings.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  Новые записи ({pendingBookings.length})
                </h3>
                <div className="space-y-3">
                  {pendingBookings.slice(0, 5).map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100">
                      <div>
                        <p className="font-medium text-sm">{b.client?.name || 'Клиент'}</p>
                        <p className="text-xs text-muted">
                          {formatBookingDate(b.date)} в {b.time_slot} — {b.service?.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleStatusChange(b.id, 'confirmed')}
                          className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                          title="Подтвердить"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleStatusChange(b.id, 'cancelled')}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="Отменить"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today schedule */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                Расписание на сегодня
              </h3>
              {todayBookings.length === 0 ? (
                <p className="text-sm text-muted py-4 text-center">Нет записей на сегодня</p>
              ) : (
                <div className="space-y-2">
                  {todayBookings
                    .sort((a, b) => a.time_slot.localeCompare(b.time_slot))
                    .map(b => {
                      const cfg = STATUS_CONFIG[b.status];
                      return (
                        <div key={b.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-stone-50 transition-colors">
                          <span className="text-sm font-mono font-semibold w-12">{b.time_slot}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{b.client?.name}</p>
                            <p className="text-xs text-muted">{b.service?.name}</p>
                          </div>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {tab === 'bookings' && (
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">Все записи</h3>
            </div>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted py-12 text-center">Записей пока нет</p>
            ) : (
              <div className="divide-y divide-border">
                {bookings.map(b => {
                  const cfg = STATUS_CONFIG[b.status];
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={b.id} className="p-4 hover:bg-stone-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.color}`}>
                            <StatusIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{b.client?.name || '—'}</p>
                            <p className="text-xs text-muted">
                              {formatBookingDate(b.date)} в {b.time_slot} — {b.service?.name}
                            </p>
                            {b.notes && (
                              <p className="text-xs text-muted mt-1 italic truncate">
                                &ldquo;{b.notes}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {b.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(b.id, 'confirmed')}
                                className="text-xs px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 font-medium transition-colors"
                              >
                                Подтвердить
                              </button>
                              <button
                                onClick={() => handleStatusChange(b.id, 'cancelled')}
                                className="text-xs px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors"
                              >
                                Отмена
                              </button>
                            </>
                          )}
                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(b.id, 'completed')}
                              className="text-xs px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 font-medium transition-colors"
                            >
                              Завершить
                            </button>
                          )}
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Clients Tab */}
        {tab === 'clients' && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-semibold">Клиенты ({clients.length})</h3>
              </div>
              {clients.length === 0 ? (
                <p className="text-sm text-muted py-12 text-center">Клиентов пока нет</p>
              ) : (
                <div className="divide-y divide-border">
                  {clients.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClient(c)}
                      className={`w-full text-left p-4 hover:bg-stone-50/50 transition-colors flex items-center justify-between ${
                        selectedClient?.id === c.id ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-sm font-semibold text-muted">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted">{c.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs font-semibold text-accent">{c.loyalty_points} баллов</p>
                          <p className="text-[10px] text-muted">{c.total_visits} визитов</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-300" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Client detail */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm h-fit sticky top-20">
              {selectedClient ? (
                <div>
                  <div className="text-center mb-5">
                    <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-2xl font-bold text-muted mx-auto mb-3">
                      {selectedClient.name.charAt(0)}
                    </div>
                    <h3 className="font-semibold">{selectedClient.name}</h3>
                    <div className="flex items-center justify-center gap-1.5 text-sm text-muted mt-1">
                      <Phone className="w-3.5 h-3.5" />
                      {selectedClient.phone}
                    </div>
                    {selectedClient.email && (
                      <div className="flex items-center justify-center gap-1.5 text-sm text-muted mt-0.5">
                        <Mail className="w-3.5 h-3.5" />
                        {selectedClient.email}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-accent">{selectedClient.loyalty_points}</p>
                      <p className="text-[10px] text-muted">баллов</p>
                    </div>
                    <div className="bg-stone-50 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold">{selectedClient.total_visits}</p>
                      <p className="text-[10px] text-muted">визитов</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted">Управление баллами</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAdjustPoints(selectedClient.id, 50)}
                        className="flex-1 text-xs py-2 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 font-medium transition-colors"
                      >
                        +50 баллов
                      </button>
                      <button
                        onClick={() => handleAdjustPoints(selectedClient.id, -50)}
                        className="flex-1 text-xs py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 font-medium transition-colors"
                      >
                        -50 баллов
                      </button>
                    </div>
                  </div>

                  {/* Client bookings */}
                  <div className="mt-5 pt-5 border-t border-border">
                    <p className="text-xs font-medium text-muted mb-3">История записей</p>
                    {bookings
                      .filter(b => b.client_id === selectedClient.id)
                      .slice(0, 5)
                      .map(b => {
                        const cfg = STATUS_CONFIG[b.status];
                        return (
                          <div key={b.id} className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-xs font-medium">{b.service?.name}</p>
                              <p className="text-[10px] text-muted">{formatBookingDate(b.date)} в {b.time_slot}</p>
                            </div>
                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                              {cfg.label}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-stone-300 mx-auto mb-3" />
                  <p className="text-sm text-muted">Выберите клиента для просмотра деталей</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loyalty Tab */}
        {tab === 'loyalty' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Всего баллов выдано"
                value={totalPoints}
                icon={<Star className="w-5 h-5 text-amber-600" />}
                bg="bg-amber-50"
              />
              <StatCard
                title="Активных клиентов"
                value={clients.filter(c => c.total_visits > 0).length}
                icon={<Users className="w-5 h-5 text-blue-600" />}
                bg="bg-blue-50"
              />
              <StatCard
                title="Ср. баллов на клиента"
                value={clients.length ? Math.round(totalPoints / clients.length) : 0}
                icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                bg="bg-emerald-50"
              />
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
              <div className="p-5 border-b border-border">
                <h3 className="font-semibold">Рейтинг лояльности</h3>
              </div>
              {clients.length === 0 ? (
                <p className="text-sm text-muted py-12 text-center">Клиентов пока нет</p>
              ) : (
                <div className="divide-y divide-border">
                  {[...clients]
                    .sort((a, b) => b.loyalty_points - a.loyalty_points)
                    .map((c, i) => {
                      const tier = c.loyalty_points >= 500 ? 'gold' : c.loyalty_points >= 200 ? 'silver' : 'bronze';
                      const tierConfig = {
                        gold: { label: 'Gold', color: 'bg-amber-100 text-amber-800', ring: 'ring-amber-300' },
                        silver: { label: 'Silver', color: 'bg-stone-200 text-stone-700', ring: 'ring-stone-300' },
                        bronze: { label: 'Bronze', color: 'bg-orange-100 text-orange-800', ring: 'ring-orange-300' },
                      };
                      const tc = tierConfig[tier];
                      return (
                        <div key={c.id} className="p-4 flex items-center gap-4">
                          <span className="text-sm font-bold text-muted w-6 text-right">
                            {i + 1}
                          </span>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ring-2 ${tc.ring} ${tc.color}`}>
                            {c.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{c.name}</p>
                            <p className="text-xs text-muted">{c.total_visits} визитов</p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${tc.color}`}>
                            {tc.label}
                          </span>
                          <div className="text-right">
                            <p className="font-bold text-sm">{c.loyalty_points}</p>
                            <p className="text-[10px] text-muted">баллов</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Loyalty rules */}
            <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
              <h3 className="font-semibold mb-4">Правила программы лояльности</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
                  <p className="text-sm font-semibold text-orange-800 mb-1">Bronze</p>
                  <p className="text-xs text-orange-700">0 — 199 баллов</p>
                  <p className="text-xs text-muted mt-2">Базовые условия</p>
                </div>
                <div className="p-4 rounded-xl bg-stone-100 border border-stone-200">
                  <p className="text-sm font-semibold text-stone-700 mb-1">Silver</p>
                  <p className="text-xs text-stone-600">200 — 499 баллов</p>
                  <p className="text-xs text-muted mt-2">Скидка 5% на все услуги</p>
                </div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-sm font-semibold text-amber-800 mb-1">Gold</p>
                  <p className="text-xs text-amber-700">500+ баллов</p>
                  <p className="text-xs text-muted mt-2">Скидка 10% + приоритет записи</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-stone-50 rounded-xl">
                <p className="text-xs text-muted">
                  <strong>Начисление:</strong> Баллы начисляются автоматически при завершении записи.
                  Каждая услуга имеет свой коэффициент начисления.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, bg }: { title: string; value: string | number; icon: React.ReactNode; bg: string }) {
  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted mt-0.5">{title}</p>
    </div>
  );
}
