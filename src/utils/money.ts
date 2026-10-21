/** Currency helpers. All money is rounded to centavos at calculation boundaries. */

export function roundMoney(value: number): number {
  const safe = Number.isFinite(value) ? value : 0;
  return Math.round((safe + Number.EPSILON) * 100) / 100;
}

export function toCents(value: number): number {
  return Math.round(roundMoney(value) * 100);
}

export interface FormatPesoOptions {
  /**
   * "auto" shows centavos only when the amount has them.
   * "always" is used by the PDF totals for a formal look.
   */
  cents?: 'auto' | 'always' | 'never';
}

export function formatPeso(value: number, options: FormatPesoOptions = {}): string {
  const rounded = roundMoney(value);
  const centsMode = options.cents ?? 'auto';
  const cents = Math.abs(toCents(rounded));
  const showCents = centsMode === 'always' || (centsMode === 'auto' && cents % 100 !== 0);
  const wholeUnits = centsMode === 'never' ? Math.round(cents / 100) : Math.floor(cents / 100);
  const whole = wholeUnits.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const fraction = String(cents % 100).padStart(2, '0');

  return `${rounded < 0 ? '-' : ''}₱${whole}${showCents ? `.${fraction}` : ''}`;
}

/**
 * Keeps amount text fields friendly while typing:
 * digits only, a single decimal point, at most two decimal places.
 */
export function sanitizeMoneyInput(text: string): string {
  let cleaned = text.replace(/,/g, '').replace(/[^\d.]/g, '');
  const firstDot = cleaned.indexOf('.');

  if (firstDot >= 0) {
    cleaned = `${cleaned.slice(0, firstDot + 1)}${cleaned.slice(firstDot + 1).replace(/\./g, '')}`;
  }

  let [whole = '', fraction] = cleaned.split('.');
  whole = whole.replace(/^0+(?=\d)/, '').slice(0, 6);

  if (fraction !== undefined) {
    return `${whole}.${fraction.slice(0, 2)}`;
  }

  return whole;
}

/** Parses a sanitized input. Empty or partial input is treated as zero. */
export function parseMoneyInput(text: string): number {
  const parsed = Number(text);
  return Number.isFinite(parsed) && parsed > 0 ? roundMoney(parsed) : 0;
}

/** Text used inside a TextInput when a computed amount fills it in. */
export function formatAmountForInput(value: number): string {
  const rounded = roundMoney(value);
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

export function formatQuantity(value: number): string {
  return Number.isInteger(value) ? String(value) : String(roundMoney(value));
}
