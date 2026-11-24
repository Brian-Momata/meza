const SW_DAYS = ["Jumapili", "Jumatatu", "Jumanne", "Jumatano", "Alhamisi", "Ijumaa", "Jumamosi"];
const EN_DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function iso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parse(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s: string, n: number): string {
  const d = parse(s);
  d.setDate(d.getDate() + n);
  return iso(d);
}

export function today(): string {
  return iso(new Date());
}

/** Monday of the week containing `s`. */
export function weekStart(s: string): string {
  const d = parse(s);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return iso(d);
}

export function weekDates(start: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function isWeekend(s: string): boolean {
  const dow = parse(s).getDay();
  return dow === 0 || dow === 6;
}

export function swDay(s: string) {
  return SW_DAYS[parse(s).getDay()];
}

export function enDay(s: string) {
  return EN_DAYS[parse(s).getDay()];
}

export function shortDay(s: string) {
  return EN_DAYS[parse(s).getDay()].slice(0, 3);
}

export function dayNum(s: string) {
  return parse(s).getDate();
}

export function monthDay(s: string) {
  const d = parse(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

export function rangeLabel(dates: string[]) {
  if (!dates.length) return "";
  const a = parse(dates[0]);
  const b = parse(dates[dates.length - 1]);
  if (dates.length === 1) return `${enDay(dates[0])} ${monthDay(dates[0])}`;
  if (a.getMonth() === b.getMonth()) return `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]}`;
  return `${monthDay(dates[0])} – ${monthDay(dates[dates.length - 1])}`;
}
