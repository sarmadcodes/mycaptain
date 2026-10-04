import dayjs from 'dayjs';

// Dates are stored as 'YYYY-MM-DD', times as 'HH:mm' (24h), both local time.

export function dateOptions(days = 30) {
  return Array.from({ length: days }, (_, i) => {
    const d = dayjs().add(i, 'day');
    const prefix = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.format('dddd');
    return { value: d.format('YYYY-MM-DD'), label: `${prefix}, ${d.format('D MMM')}` };
  });
}

// Every 30 minutes, 6:00 AM to 11:30 PM. Past slots today (plus 1h lead time) are disabled.
export function timeOptions(date: string) {
  const isToday = date === dayjs().format('YYYY-MM-DD');
  const earliest = dayjs().add(60, 'minute');
  const slots = [];
  for (let m = 6 * 60; m < 24 * 60; m += 30) {
    const h = Math.floor(m / 60);
    const value = `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    const at = dayjs(`${date}T${value}`);
    slots.push({ value, label: at.format('h:mm A'), disabled: isToday && at.isBefore(earliest) });
  }
  return slots;
}

export const firstOpenTime = (date: string) => timeOptions(date).find((t) => !t.disabled)?.value ?? '09:00';

export function formatDate(date: string) {
  return dateOptions(60).find((d) => d.value === date)?.label ?? dayjs(date).format('ddd, D MMM');
}

export const formatTime = (time: string) => dayjs(`2000-01-01T${time}`).format('h:mm A');

export const addDays = (date: string, n: number) => dayjs(date).add(n, 'day').format('YYYY-MM-DD');
export const addMonths = (date: string, n: number) => dayjs(date).add(n, 'month').format('D MMM YYYY');
export const today = () => dayjs().format('YYYY-MM-DD');
