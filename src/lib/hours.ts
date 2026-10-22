import { store, type ServiceWindow } from "../data/store.ts";

/** Data e hora "de parede" em São Paulo, independente do fuso do aparelho. */
export type LocalNow = { date: string; weekday: number; minutes: number };

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: store.timeZone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function localNow(at: Date): LocalNow {
  const parts = Object.fromEntries(partsFormatter.formatToParts(at).map((p) => [p.type, p.value]));
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  return { date, weekday: weekdayOf(date), minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Aritmética de calendário em UTC puro: datas "YYYY-MM-DD" sem fuso. */
function toUTC(date: string) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function addDays(date: string, days: number): string {
  return new Date(toUTC(date) + days * 86_400_000).toISOString().slice(0, 10);
}

export function weekdayOf(date: string): number {
  return new Date(toUTC(date)).getUTCDay();
}

function dayIndex(date: string) {
  return Math.round(toUTC(date) / 86_400_000);
}

/** "HH:MM" para minutos de serviço (1470 → "00:30"). */
export function formatClock(minutes: number): string {
  const m = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

export type Service = { date: string; weekday: number; window: ServiceWindow };

export function serviceOn(date: string): Service | null {
  const weekday = weekdayOf(date);
  const window = store.hours[weekday];
  return window ? { date, weekday, window } : null;
}

export type StoreStatus =
  | { state: "open"; service: Service; minute: number; acceptsNow: boolean; closesAt: number }
  | { state: "closed"; next: Service | null };

/** Minuto atual medido a partir da meia-noite do dia em que o serviço começou. */
function minuteIn(service: Service, now: LocalNow) {
  return (dayIndex(now.date) - dayIndex(service.date)) * 1440 + now.minutes;
}

export function storeStatus(at: Date): StoreStatus {
  const now = localNow(at);
  // O serviço de ontem pode estar aberto depois da meia-noite.
  for (const date of [addDays(now.date, -1), now.date]) {
    const service = serviceOn(date);
    if (!service) continue;
    const minute = minuteIn(service, now);
    if (minute >= service.window.open && minute < service.window.close) {
      return {
        state: "open",
        service,
        minute,
        acceptsNow: minute < service.window.close - store.lastCallMinutes,
        closesAt: service.window.close,
      };
    }
  }
  return { state: "closed", next: nextService(now) };
}

function nextService(now: LocalNow): Service | null {
  for (let i = 0; i <= 7; i++) {
    const service = serviceOn(addDays(now.date, i));
    if (!service) continue;
    if (i > 0 || now.minutes < service.window.open) return service;
  }
  return null;
}

export type Mode = "entrega" | "retirada";

export type Slot = {
  /** "2026-10-27@1215": data do serviço + minuto do serviço. */
  id: string;
  serviceDate: string;
  weekday: number;
  minute: number;
  label: string;
  /** Data real do relógio (depois da meia-noite já é o dia seguinte). */
  calendarDate: string;
};

export type ScheduleDay = { serviceDate: string; weekday: number; slots: Slot[] };

/** Horários agendáveis: passos de 15 min dentro do expediente, respeitando a antecedência de cada modo. */
export function scheduleDays(at: Date, mode: Mode): ScheduleDay[] {
  const now = localNow(at);
  const lead = mode === "entrega" ? store.schedule.deliveryLead : store.schedule.pickupLead;
  const step = store.schedule.stepMinutes;
  const earliest = dayIndex(now.date) * 1440 + now.minutes + lead;
  const days: ScheduleDay[] = [];
  for (let i = -1; i <= store.schedule.daysAhead; i++) {
    const service = serviceOn(addDays(now.date, i));
    if (!service) continue;
    const base = dayIndex(service.date) * 1440;
    const slots: Slot[] = [];
    const first = Math.ceil((service.window.open + lead) / step) * step;
    for (let minute = first; minute <= service.window.close; minute += step) {
      if (base + minute < earliest) continue;
      slots.push({
        id: `${service.date}@${minute}`,
        serviceDate: service.date,
        weekday: service.weekday,
        minute,
        label: formatClock(minute),
        calendarDate: minute >= 1440 ? addDays(service.date, 1) : service.date,
      });
    }
    if (slots.length) days.push({ serviceDate: service.date, weekday: service.weekday, slots });
  }
  return days;
}

export function findSlot(at: Date, mode: Mode, id: string | null): Slot | null {
  if (!id) return null;
  for (const day of scheduleDays(at, mode)) {
    const slot = day.slots.find((s) => s.id === id);
    if (slot) return slot;
  }
  return null;
}

const weekdayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
const weekdayShort = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

export function weekdayName(weekday: number) {
  return weekdayNames[weekday];
}

export function shortDate(date: string) {
  const [, m, d] = date.split("-");
  return `${d}/${m}`;
}

/** "hoje", "amanhã" ou "ter 27/10". */
export function relativeDay(date: string, today: string): string {
  const diff = dayIndex(date) - dayIndex(today);
  if (diff === 0) return "hoje";
  if (diff === 1) return "amanhã";
  if (diff === -1) return "ontem";
  return `${weekdayShort[weekdayOf(date)]} ${shortDate(date)}`;
}

/** Frase curta do estado da loja, para o selo do topo e a comanda. */
export function statusLine(status: StoreStatus, at: Date): string {
  const today = localNow(at).date;
  if (status.state === "open") {
    return status.acceptsNow
      ? `Aberto até ${formatClock(status.closesAt)}`
      : `Cozinha fechando às ${formatClock(status.closesAt)}. Só pedidos agendados.`;
  }
  if (!status.next) return "Fechado";
  const when = relativeDay(status.next.date, today);
  const day = when === "hoje" || when === "amanhã" ? when : weekdayName(status.next.weekday);
  return `Fechado. Abre ${day} às ${formatClock(status.next.window.open)}`;
}

/** Tabela de horários para exibição: agrupa dias com o mesmo expediente. */
export function hoursTable(): { days: string; hours: string; weekdays: number[] }[] {
  const order = [2, 3, 4, 5, 6, 0, 1];
  const rows: { days: string; hours: string; weekdays: number[] }[] = [];
  for (const wd of order) {
    const w = store.hours[wd];
    const hours = w ? `${formatClock(w.open)} às ${formatClock(w.close)}` : "Fechado";
    const last = rows.at(-1);
    if (last && last.hours === hours) last.weekdays.push(wd);
    else rows.push({ days: "", hours, weekdays: [wd] });
  }
  for (const row of rows) {
    const first = weekdayShort[row.weekdays[0]];
    const lastDay = weekdayShort[row.weekdays.at(-1)!];
    row.days = row.weekdays.length > 1 ? `${first} a ${lastDay}` : first;
  }
  return rows;
}
