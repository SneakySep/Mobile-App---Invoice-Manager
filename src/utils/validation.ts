import {
  MAX_CUSTOMER_NAME_LENGTH,
  MAX_MONEY_INPUT,
} from '../constants/pricing';
import type { InvoiceDraft } from '../types/invoice';
import { calculateInvoiceTotals } from './calculations';
import { formatPeso, roundMoney, toCents } from './money';

export interface DraftValidationErrors {
  customerName?: string;
  services?: string;
  transportFee?: string;
  amountPaid?: string;
}

export function getDraftErrors(draft: InvoiceDraft): DraftValidationErrors {
  const errors: DraftValidationErrors = {};
  const customerName = draft.customerName.trim();

  if (!customerName) {
    errors.customerName = 'Enter the customer’s name.';
  } else if (customerName.length > MAX_CUSTOMER_NAME_LENGTH) {
    errors.customerName = `Keep the name under ${MAX_CUSTOMER_NAME_LENGTH + 1} characters.`;
  }

  if (!Number.isFinite(draft.transportFee) || draft.transportFee < 0) {
    errors.transportFee = 'Enter a valid transportation fee.';
  } else if (draft.transportFee > MAX_MONEY_INPUT) {
    errors.transportFee = 'The transportation fee is too large.';
  }

  const totals = calculateInvoiceTotals(draft);

  if (totals.grandTotal <= 0) {
    errors.services = 'Add at least one service or a transportation fee.';
  }

  if (!Number.isFinite(draft.amountPaid) || draft.amountPaid < 0) {
    errors.amountPaid = 'Enter a valid amount paid.';
  } else if (draft.amountPaid > MAX_MONEY_INPUT) {
    errors.amountPaid = 'The amount paid is too large.';
  } else if (toCents(draft.amountPaid) > toCents(totals.grandTotal)) {
    errors.amountPaid = `Amount paid cannot exceed ${formatPeso(totals.grandTotal)}.`;
  }

  return errors;
}

export function hasDraftErrors(errors: DraftValidationErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function getFirstErrorMessage(errors: DraftValidationErrors): string | null {
  return (
    errors.customerName ??
    errors.services ??
    errors.amountPaid ??
    errors.transportFee ??
    null
  );
}

/** Validates the negotiated per-invoice unit price. */
export function getUnitPriceError(unitPrice: number): string | null {
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return 'Enter a valid unit price.';
  }
  if (roundMoney(unitPrice) > MAX_MONEY_INPUT) {
    return 'That unit price is too large.';
  }
  return null;
}

/**
 * Guard for editing the services on a saved invoice. The payment is never
 * reduced automatically; the user has to fix it first.
 */
export function getServiceEditError(amountPaid: number, grandTotal: number): string | null {
  if (grandTotal <= 0) {
    return 'Add at least one service or keep a transportation fee.';
  }
  if (toCents(amountPaid) > toCents(grandTotal)) {
    return `The amount already paid (${formatPeso(
      amountPaid,
    )}) is more than the new total (${formatPeso(
      grandTotal,
    )}). Reduce the payment first.`;
  }
  return null;
}

/** Used by the quick payment editor on saved invoices. */
export function getPaymentError(amountPaid: number, grandTotal: number): string | null {
  if (!Number.isFinite(amountPaid) || amountPaid < 0) {
    return 'Enter a valid amount.';
  }
  if (amountPaid > MAX_MONEY_INPUT) {
    return 'That amount is too large.';
  }
  if (toCents(roundMoney(amountPaid)) > toCents(grandTotal)) {
    return `Amount cannot exceed ${formatPeso(grandTotal)}.`;
  }
  return null;
}
