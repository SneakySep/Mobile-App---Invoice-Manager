import { DOWNPAYMENT_RATE } from '../constants/pricing';
import type {
  DepositStatus,
  InvoiceService,
  InvoiceTotals,
  PaymentStatus,
} from '../types/invoice';
import { roundMoney, toCents } from './money';

export function calculateLineTotal(unitPrice: number, quantity: number): number {
  const safeUnitPrice = Number.isFinite(unitPrice) ? Math.max(0, unitPrice) : 0;
  const safeQuantity = Number.isFinite(quantity) ? Math.max(0, quantity) : 0;
  return roundMoney(safeUnitPrice * safeQuantity);
}

export function getPaymentStatus(grandTotal: number, amountPaid: number): PaymentStatus {
  const totalCents = Math.max(0, toCents(grandTotal));
  const paidCents = Math.max(0, toCents(amountPaid));

  if (totalCents === 0) {
    return paidCents > 0 ? 'paid' : 'unpaid';
  }
  if (paidCents >= totalCents) {
    return 'paid';
  }
  return paidCents > 0 ? 'partial' : 'unpaid';
}

export function calculateDownpayment(grandTotal: number): number {
  return roundMoney(Math.max(0, grandTotal) * DOWNPAYMENT_RATE);
}

/**
 * Separates booking readiness from the broader paid/partial/unpaid invoice
 * status. A small partial payment should not look like a booking-confirming
 * deposit to a cleaner in the field.
 */
export function getDepositStatus(
  grandTotal: number,
  downpaymentRequired: number,
  amountPaid: number,
): DepositStatus {
  const totalCents = Math.max(0, toCents(grandTotal));
  const requiredCents = Math.min(totalCents, Math.max(0, toCents(downpaymentRequired)));
  const paidCents = Math.max(0, toCents(amountPaid));

  if (totalCents > 0 && paidCents >= totalCents) {
    return 'paid-in-full';
  }
  if (requiredCents === 0 || paidCents >= requiredCents) {
    return 'deposit-received';
  }
  return paidCents > 0 ? 'deposit-short' : 'deposit-due';
}

/** Amount still needed before the job's required booking deposit is covered. */
export function getDepositShortfall(downpaymentRequired: number, amountPaid: number): number {
  return roundMoney(Math.max(0, downpaymentRequired - Math.max(0, amountPaid)));
}

export interface InvoiceCalculationInput {
  services: Array<Pick<InvoiceService, 'totalPrice'>>;
  transportFee: number;
  amountPaid: number;
}

/**
 * The single source of truth for invoice totals:
 * services + transportation, 20% deposit, balance and payment status.
 */
export function calculateInvoiceTotals({
  services,
  transportFee,
  amountPaid,
}: InvoiceCalculationInput): InvoiceTotals {
  const subtotal = roundMoney(
    services.reduce(
      (sum, service) =>
        sum + (Number.isFinite(service.totalPrice) ? Math.max(0, service.totalPrice) : 0),
      0,
    ),
  );
  const safeTransport = Number.isFinite(transportFee) ? roundMoney(Math.max(0, transportFee)) : 0;
  const grandTotal = roundMoney(subtotal + safeTransport);
  const downpaymentRequired = calculateDownpayment(grandTotal);
  const safePaid = Number.isFinite(amountPaid) ? roundMoney(Math.max(0, amountPaid)) : 0;

  // Clamp only for display/preview. Validation still stops overpayments being saved.
  const appliedPaid = Math.min(safePaid, grandTotal);
  const balance = roundMoney(Math.max(0, grandTotal - appliedPaid));

  return {
    subtotal,
    grandTotal,
    downpaymentRequired,
    amountPaid: appliedPaid,
    balance,
    paymentStatus: getPaymentStatus(grandTotal, appliedPaid),
  };
}
