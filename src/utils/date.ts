const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function safeDate(iso: string): Date | null {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTime(date: Date): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${minutes} ${suffix}`;
}

/** Example: "Oct 21, 2026 · 2:45 PM" */
export function formatInvoiceDate(iso: string): string {
  const date = safeDate(iso);
  if (!date) return '—';
  return `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} · ${formatTime(date)}`;
}

/** Example: "October 21, 2026 at 2:45 PM" used on the PDF. */
export function formatLongDateTime(iso: string): string {
  const date = safeDate(iso);
  if (!date) return '—';
  return `${MONTHS_LONG[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${formatTime(date)}`;
}

/** Compact timestamp for generated backup filenames. */
export function formatFileTimestamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}${month}${day}-${hours}${minutes}`;
}
